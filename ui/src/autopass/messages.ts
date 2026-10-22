import { bridge, MAIN_WORKER } from '../bridge'
import type { AppDispatch } from '../store'
import type { NewPassword } from '../passwords/model'
import {
  autopassFailed,
  autopassLoaded,
  autopassRequested,
  joinFailed,
  joinReset,
  joinStatusChanged,
  shareFailed,
  shareInviteReceived,
  shareJoined,
  shareRequested,
  shareRevoked,
  vaultEntered,
  type AutopassSnapshot
} from '../store/autopassSlice'

function send(command: string, payload?: unknown) {
  const body =
    payload === undefined
      ? ''
      : ' ' + (typeof payload === 'string' ? payload : JSON.stringify(payload))
  bridge.writeWorkerIPC(MAIN_WORKER, command + body)
}

const COMMANDS = [
  'autopass:state',
  'autopass:error',
  'autopass:share-invite',
  'autopass:share-joined',
  'autopass:share-error',
  'autopass:share-revoked',
  'autopass:join-status',
  'autopass:join-done',
  'autopass:join-error',
  'autopass:join-cancelled'
] as const

type Command = (typeof COMMANDS)[number]

type CommandHandler = (payload: string, dispatch: AppDispatch) => void

const HANDLERS: Record<Command, CommandHandler> = {
  'autopass:state': (payload, dispatch) => {
    const snapshot = JSON.parse(payload) as AutopassSnapshot
    console.log('[autopass]', snapshot)
    dispatch(autopassLoaded(snapshot))
  },
  'autopass:error': (payload, dispatch) => dispatch(autopassFailed(payload)),
  'autopass:share-invite': (payload, dispatch) =>
    dispatch(shareInviteReceived(JSON.parse(payload))),
  'autopass:share-joined': (payload, dispatch) => dispatch(shareJoined(JSON.parse(payload))),
  'autopass:share-error': (payload, dispatch) => dispatch(shareFailed(JSON.parse(payload))),
  'autopass:share-revoked': (payload, dispatch) => dispatch(shareRevoked(JSON.parse(payload))),
  'autopass:join-status': (payload, dispatch) => {
    if (payload === 'searching' || payload === 'granting') dispatch(joinStatusChanged(payload))
  },
  'autopass:join-done': (_, dispatch) => dispatch(joinStatusChanged('done')),
  'autopass:join-error': (payload, dispatch) => dispatch(joinFailed(payload)),
  'autopass:join-cancelled': (_, dispatch) => dispatch(joinReset())
}

function isCommand(value: string): value is Command {
  return (COMMANDS as readonly string[]).includes(value)
}

export function handleAutopassMessage(message: string, dispatch: AppDispatch) {
  const space = message.indexOf(' ')
  const command = space === -1 ? message : message.slice(0, space)
  if (!isCommand(command)) return
  HANDLERS[command](space === -1 ? '' : message.slice(space + 1), dispatch)
}

export function createVault(dispatch: AppDispatch, name: string) {
  dispatch(autopassRequested())
  send('autopass:create', { name })
}

export function openVault(dispatch: AppDispatch, vaultId: string) {
  dispatch(vaultEntered())
  send('autopass:open', vaultId)
}

export function deleteVault(vaultId: string) {
  send('autopass:delete', vaultId)
}

export function addPassword(vaultId: string, password: NewPassword) {
  send('autopass:add', { vaultId, id: crypto.randomUUID(), ...password })
}

export function updatePassword(vaultId: string, id: string, password: NewPassword) {
  send('autopass:update', { vaultId, id, ...password })
}

export function removePassword(vaultId: string, id: string) {
  send('autopass:remove', { vaultId, id })
}

export function createShareInvite(dispatch: AppDispatch, vaultId: string, readOnly: boolean) {
  dispatch(shareRequested({ vaultId, readOnly }))
  send('autopass:share-create', { vaultId, readOnly })
}

export function revokeShareInvite(vaultId: string) {
  send('autopass:share-revoke', vaultId)
}

export function joinVault(dispatch: AppDispatch, invite: string, name: string, vaultName: string) {
  dispatch(joinStatusChanged('searching'))
  send('autopass:join', { invite, name, vaultName })
}

export function cancelJoin() {
  send('autopass:join-cancel')
}
