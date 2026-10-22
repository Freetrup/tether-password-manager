// https://github.com/holepunchto/hello-pear-worker v1.2.0

const PearRuntime = require('pear-runtime') // pear-runtime on desktop; pear-mobile on mobile
const Hyperswarm = require('hyperswarm')
const Corestore = require('corestore')
const Autopass = require('autopass')
const goodbye = require('graceful-goodbye')
const FramedStream = require('framed-stream')
const path = require('bare-path')
const fs = require('bare-fs/promises')
const dir = require('bare-storage')
const { isBareKit } = require('which-runtime')

// mobile doesn't have the executable path (argv[0])
// and the worker entry path (argv[1]) in the workers argv‘s
// ... to reuse the same worker in all platforms this logic is needed
const argv = (index) => Bare.argv[index + (isBareKit ? 0 : 2)]

const updaterConfig = {
  updates: argv(0) !== 'false',
  version: argv(1),
  upgrade: argv(2),
  name: argv(3),
  dir: argv(4) || dir.persistent(), // argv[4] is undefined in mobile
  app: argv(5) // argv[5] is undefined in mobile
}

const pipe = new FramedStream(Bare.IPC)

const APP_STORAGE = path.join(updaterConfig.dir, 'app-storage')
const REGISTRY_FILE = path.join(APP_STORAGE, 'vaults.json')
const LEGACY_DIR = path.join(APP_STORAGE, 'autopass')
const VAULT_MARKER = 'tetherpass:vault'
const RESERVED_PREFIX = 'tetherpass:'
const JOIN_TIMEOUT = 60000

const vaults = new Map()
let registry = { activeId: null, vaults: [] }
let activeJoin = null
const vaultsReady = loadVaults()
vaultsReady.catch((err) => pipe.write('autopass:error ' + err.message))

const store = new Corestore(path.join(updaterConfig.dir, 'pear-runtime', 'corestore'))
const swarm = new Hyperswarm()
const pear = new PearRuntime({ ...updaterConfig, swarm, store })

pear.updater.on('error', (err) => pipe.write('updater-error ' + err.message))

if (updaterConfig.updates !== false) {
  swarm.on('connection', (connection) => store.replicate(connection))
  swarm.join(pear.updater.drive.core.discoveryKey, {
    client: true,
    server: false
  })
}

// An append on the app's drive doesn't check for an update straight away: the
// updater defers it by a random delay of up to an hour (see PearRuntimeUpdater)
// so that a released fleet doesn't hit the seeder all at once. Forward the
// delay so the app can say it is waiting rather than look inert — without it,
// a staged update is indistinguishable from a broken updater for up to an hour.
pear.updater.on('update-scheduled', (delay) => pipe.write('update-scheduled ' + delay))
pear.updater.on('updating', () => pipe.write('updating'))
pear.updater.on('updated', () => pipe.write('updated'))
pear.on('minver-required', () => pipe.write('minver-required')) // for mobile store update notification

goodbye(async () => {
  if (activeJoin) await closeJoin(activeJoin)
  for (const vault of vaults.values()) await closeVault(vault)
  await swarm.destroy()
  await pear.close()
  await store.close()
})

const COMMANDS = {
  'autopass:get': () => sendState(),
  'autopass:create': (payload) => createVault(payload),
  'autopass:open': (payload) => openVaultById(payload),
  'autopass:delete': (payload) => deleteVault(payload),
  'autopass:add': (payload) => savePassword(payload, false),
  'autopass:update': (payload) => savePassword(payload, true),
  'autopass:remove': (payload) => removePassword(payload),
  'autopass:share-create': (payload) => createShareInvite(payload),
  'autopass:share-revoke': (payload) => revokeShareInvite(payload),
  'autopass:join': (payload) => joinVault(payload),
  'autopass:join-cancel': () => {
    if (activeJoin) activeJoin.cancelled = true
  }
}

pipe.on('data', async (data) => {
  const message = data.toString()
  const space = message.indexOf(' ')
  const command = space === -1 ? message : message.slice(0, space)
  const payload = space === -1 ? '' : message.slice(space + 1)

  if (COMMANDS[command]) {
    try {
      await COMMANDS[command](payload)
    } catch (err) {
      pipe.write('autopass:error ' + err.message)
    }
    return
  }

  if (message !== 'pear:applyUpdate') {
    pipe.write('unknown-message ' + message)
    return
  }

  try {
    await pear.ready()
    await pear.updater.applyUpdate()
    pipe.write('pear:updateApplied')
  } catch (err) {
    pipe.write('pear:updateFailed ' + err.message)
  }
})

pipe.write('Hello from worker')

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

async function readJson(file) {
  try {
    return JSON.parse((await fs.readFile(file)).toString())
  } catch {
    return null
  }
}

async function saveRegistry() {
  await fs.mkdir(APP_STORAGE, { recursive: true })
  const tmp = REGISTRY_FILE + '.tmp'
  await fs.writeFile(tmp, JSON.stringify(registry, null, 2))
  await fs.rename(tmp, REGISTRY_FILE)
}

async function migrateLegacyVault() {
  try {
    await fs.access(LEGACY_DIR)
  } catch {
    return null
  }
  const legacyStore = new Corestore(LEGACY_DIR)
  const config = legacyStore.get({ name: 'tetherpass-config', valueEncoding: 'json' })
  await config.ready()
  const last = config.length > 0 ? await config.get(config.length - 1) : null
  await config.close()
  const namespace = last && last.activeVault ? last.activeVault : null
  const pass = new Autopass(namespace ? legacyStore.namespace(namespace) : legacyStore)
  await pass.ready()
  const marker = (await pass.get(VAULT_MARKER)) || (await pass.get(pass.writerKey.toString('hex')))
  const exists = marker !== null || namespace !== null
  await pass.close()
  await legacyStore.close()
  if (!exists) return null
  return {
    id: 'personal',
    name: 'Personal',
    dir: 'autopass',
    namespace,
    joined: namespace !== null,
    createdAt: Date.now()
  }
}

async function loadVaults() {
  const saved = await readJson(REGISTRY_FILE)
  if (saved && Array.isArray(saved.vaults)) {
    registry = saved
  } else {
    const legacy = await migrateLegacyVault()
    registry = { activeId: legacy ? legacy.id : null, vaults: legacy ? [legacy] : [] }
    await saveRegistry()
  }
  for (const meta of registry.vaults) {
    try {
      await openVault(meta)
    } catch (err) {
      pipe.write('autopass:error ' + meta.name + ': ' + err.message)
    }
  }
}

function vaultDir(meta) {
  return path.join(APP_STORAGE, meta.dir)
}

async function openVault(meta, existing) {
  const store = existing ? existing.store : new Corestore(vaultDir(meta))
  const pass = existing
    ? existing.pass
    : new Autopass(meta.namespace ? store.namespace(meta.namespace) : store)
  const vault = { meta, store, pass, pendingShare: null, onUpdate: null }
  vault.onUpdate = () => {
    checkShareJoined(vault).catch(() => {})
    sendState()
  }
  pass.on('update', vault.onUpdate)
  vaults.set(meta.id, vault)
  await pass.ready()
  return vault
}

async function closeVault(vault) {
  vault.pass.off('update', vault.onUpdate)
  await vault.pass.close().catch(() => {})
  await vault.store.close().catch(() => {})
}

function getVault(id) {
  const vault = vaults.get(id)
  if (!vault) throw new Error('Vault not found')
  return vault
}

async function readPasswords(pass) {
  const records = await pass.list().toArray()
  const passwords = []
  for (const record of records) {
    if (record.key.startsWith(RESERVED_PREFIX)) continue
    try {
      const value = JSON.parse(record.value)
      if (typeof value.password !== 'string') continue
      passwords.push({
        title: '',
        customFields: [],
        passwordChangedAt: value.createdAt,
        ...value,
        id: record.key
      })
    } catch {}
  }
  return passwords
}

async function describeVault(vault) {
  const writers = await vault.pass.listWriters().toArray()
  return {
    id: vault.meta.id,
    name: vault.meta.name,
    createdAt: vault.meta.createdAt,
    joined: Boolean(vault.meta.joined),
    writable: vault.pass.writable,
    members: writers.length + 1,
    passwords: await readPasswords(vault.pass)
  }
}

async function sendState() {
  try {
    await vaultsReady
    const list = []
    for (const meta of registry.vaults) {
      const vault = vaults.get(meta.id)
      if (vault) list.push(await describeVault(vault))
    }
    pipe.write('autopass:state ' + JSON.stringify({ activeId: registry.activeId, vaults: list }))
  } catch (err) {
    pipe.write('autopass:error ' + err.message)
  }
}

async function registerVault(meta, existing) {
  await openVault(meta, existing)
  registry.vaults.push(meta)
  registry.activeId = meta.id
  await saveRegistry()
}

async function createVault(payload) {
  await vaultsReady
  const { name } = JSON.parse(payload || '{}')
  const id = createId()
  const meta = {
    id,
    name: (typeof name === 'string' && name.trim()) || 'Vault ' + (registry.vaults.length + 1),
    dir: path.join('vaults', id),
    namespace: null,
    joined: false,
    createdAt: Date.now()
  }
  await fs.mkdir(vaultDir(meta), { recursive: true })
  await registerVault(meta)
  const vault = getVault(id)
  await vault.pass.add(
    VAULT_MARKER,
    JSON.stringify({ createdAt: meta.createdAt, createdBy: vault.pass.writerKey.toString('hex') })
  )
  await vault.pass.base.update()
  await sendState()
}

async function openVaultById(id) {
  await vaultsReady
  getVault(id)
  registry.activeId = id
  await saveRegistry()
  await sendState()
}

async function deleteVault(id) {
  await vaultsReady
  const vault = getVault(id)
  vaults.delete(id)
  await closeVault(vault)
  await fs.rm(vaultDir(vault.meta), { recursive: true, force: true })
  registry.vaults = registry.vaults.filter((meta) => meta.id !== id)
  if (registry.activeId === id) registry.activeId = null
  await saveRegistry()
  await sendState()
}

function assertPasswordId(id) {
  if (typeof id !== 'string' || id.length === 0 || id.startsWith(RESERVED_PREFIX)) {
    throw new Error('Invalid password id')
  }
}

function writableVault(id) {
  const vault = getVault(id)
  if (!vault.pass.writable) throw new Error('This vault is read only')
  return vault
}

async function savePassword(payload, isUpdate) {
  await vaultsReady
  const { vaultId, id, title, password, url, note, customFields } = JSON.parse(payload)
  const { pass } = writableVault(vaultId)
  assertPasswordId(id)
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password is required')
  }
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Title is required')
  }
  const now = Date.now()
  let createdAt = now
  let passwordChangedAt = now
  if (isUpdate) {
    const existing = await pass.get(id)
    if (!existing) throw new Error('Password not found')
    const previous = JSON.parse(existing.value)
    createdAt = previous.createdAt ?? now
    if (previous.password === password) {
      passwordChangedAt = previous.passwordChangedAt ?? createdAt
    }
  }
  await pass.add(
    id,
    JSON.stringify({
      title: title.trim(),
      password,
      url: url || '',
      note: note || '',
      customFields: Array.isArray(customFields)
        ? customFields.map(({ name, value }) => ({ name: String(name), value: String(value) }))
        : [],
      createdAt,
      passwordChangedAt
    })
  )
  await pass.base.update()
  await sendState()
}

async function removePassword(payload) {
  await vaultsReady
  const { vaultId, id } = JSON.parse(payload)
  const { pass } = writableVault(vaultId)
  assertPasswordId(id)
  await pass.remove(id)
  await pass.base.update()
  await sendState()
}

async function createShareInvite(payload) {
  const { vaultId, readOnly } = JSON.parse(payload)
  try {
    await vaultsReady
    const vault = writableVault(vaultId)
    const writers = await vault.pass.listWriters().toArray()
    const known = new Set(writers.map((writer) => writer.key.toString('hex')))
    const invite = await vault.pass.createInvite({ readOnly: Boolean(readOnly) })
    vault.pendingShare = { known }
    pipe.write(
      'autopass:share-invite ' + JSON.stringify({ vaultId, invite, readOnly: Boolean(readOnly) })
    )
  } catch (err) {
    pipe.write('autopass:share-error ' + JSON.stringify({ vaultId, error: err.message }))
  }
}

async function checkShareJoined(vault) {
  const share = vault.pendingShare
  if (!share) return
  const writers = await vault.pass.listWriters().toArray()
  const added = writers.find((writer) => !share.known.has(writer.key.toString('hex')))
  if (!added || vault.pendingShare !== share) return
  vault.pendingShare = null
  pipe.write(
    'autopass:share-joined ' +
      JSON.stringify({
        vaultId: vault.meta.id,
        name: added.name || 'New device',
        readOnly: Boolean(added.readOnly)
      })
  )
}

async function revokeShareInvite(vaultId) {
  await vaultsReady
  const vault = vaults.get(vaultId)
  if (vault) {
    vault.pendingShare = null
    await vault.pass.deleteInvite().catch(() => {})
  }
  pipe.write('autopass:share-revoked ' + JSON.stringify({ vaultId }))
}

function waitForPairing(join) {
  return new Promise((resolve) => {
    let granting = false
    const finish = (result) => {
      clearTimeout(timer)
      clearInterval(poll)
      resolve(result)
    }
    const timer = setTimeout(() => finish({ error: 'timeout' }), JOIN_TIMEOUT)
    const poll = setInterval(() => {
      if (join.cancelled) return finish({ error: 'cancelled' })
      const paired = join.pair.pass
      if (paired && !granting) {
        granting = true
        pipe.write('autopass:join-status granting')
      }
      if (paired && paired.base.writable) finish({ pass: paired })
    }, 250)
    join.pair.ready().catch(() => finish({ error: 'invalid' }))
    join.pair.finished().then(
      (paired) => finish({ pass: paired }),
      () => finish({ error: 'closed' })
    )
  })
}

async function closeJoin(join) {
  if (join.pair.pass) await join.pair.pass.close().catch(() => {})
  await join.pair.close().catch(() => {})
  await join.store.close().catch(() => {})
}

const JOIN_ERRORS = {
  invalid: 'The invite code is invalid.',
  timeout:
    'Could not connect. The code is invalid, already used, or no member is online right now.',
  closed: 'Pairing was closed before it finished.'
}

async function joinVault(payload) {
  if (activeJoin) return
  const { invite, name, vaultName } = JSON.parse(payload)
  if (typeof invite !== 'string' || invite.length === 0) {
    pipe.write('autopass:join-error ' + JOIN_ERRORS.invalid)
    return
  }
  await vaultsReady

  const id = createId()
  const meta = {
    id,
    name: (typeof vaultName === 'string' && vaultName.trim()) || 'Shared vault',
    dir: path.join('vaults', id),
    namespace: null,
    joined: true,
    createdAt: Date.now()
  }
  await fs.mkdir(vaultDir(meta), { recursive: true })
  const joinStore = new Corestore(vaultDir(meta))
  const pair = Autopass.pair(joinStore.session(), invite, { name: name || null })
  const join = { pair, store: joinStore, cancelled: false }
  activeJoin = join
  pipe.write('autopass:join-status searching')

  const result = await waitForPairing(join)
  activeJoin = null

  if (result.error) {
    await closeJoin(join)
    await fs.rm(vaultDir(meta), { recursive: true, force: true }).catch(() => {})
    if (result.error === 'cancelled') pipe.write('autopass:join-cancelled')
    else pipe.write('autopass:join-error ' + JOIN_ERRORS[result.error])
    return
  }

  try {
    await result.pass.ready()
    await registerVault(meta, { store: joinStore, pass: result.pass })
  } catch (err) {
    pipe.write('autopass:join-error ' + err.message)
    return
  }
  pipe.write('autopass:join-done')
  await sendState()
}
