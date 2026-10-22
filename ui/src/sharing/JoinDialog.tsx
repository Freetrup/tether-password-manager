import { useEffect, useEffectEvent, useState, type SubmitEvent } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import { cancelJoin, joinVault } from '../autopass/messages'
import { useAppDispatch, useAppSelector } from '../store'
import { joinReset } from '../store/autopassSlice'
import Spinner from './Spinner'

const Z32_ALPHABET = 'ybndrfg8ejkmcpqxot1uwisza345h769'

function validateInvite(invite: string): string | null {
  if (invite.length === 0) return 'Enter an invite code.'
  if (![...invite].every((char) => Z32_ALPHABET.includes(char)))
    return "This doesn't look like an invite code."
  return null
}

function Step({ state, label }: { state: 'pending' | 'active' | 'done'; label: string }) {
  return (
    <li className={`flex items-center gap-3 ${state === 'pending' ? 'text-muted' : ''}`}>
      <span className='grid size-4 place-items-center'>
        {state === 'active' && <Spinner />}
        {state === 'done' && <span className='text-accent'>✓</span>}
        {state === 'pending' && <span className='size-2 rounded-full bg-line' />}
      </span>
      {label}
    </li>
  )
}

export default function JoinDialog({ onDone }: { onDone: () => void }) {
  const dispatch = useAppDispatch()
  const join = useAppSelector((s) => s.autopass.join)
  const [invite, setInvite] = useState('')
  const [name, setName] = useState('My device')
  const [vaultName, setVaultName] = useState('Shared vault')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const cancelPending = useEffectEvent(() => {
    if (join.status === 'searching' || join.status === 'granting') cancelJoin()
  })

  useEffect(() => {
    dispatch(joinReset())
    return () => cancelPending()
  }, [dispatch])

  useEffect(() => {
    if (join.status === 'done') onDone()
  }, [join.status, onDone])

  const connect = () => {
    const code = invite.trim()
    const error = validateInvite(code)
    setInviteError(error)
    if (error) return
    joinVault(dispatch, code, name.trim(), vaultName.trim())
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    connect()
  }

  const paste = async () => {
    const text = await navigator.clipboard.readText().catch(() => '')
    setInvite(text.trim())
    setInviteError(null)
  }

  if (join.status === 'searching' || join.status === 'granting' || join.status === 'done') {
    return (
      <div className='flex flex-col gap-4'>
        <ul className='flex flex-col gap-3'>
          <Step
            state={join.status === 'searching' ? 'active' : 'done'}
            label='Looking for members…'
          />
          <Step
            state={
              join.status === 'granting' ? 'active' : join.status === 'done' ? 'done' : 'pending'
            }
            label='Getting access…'
          />
        </ul>
        <div>
          <Button type='secondary' onClick={cancelJoin}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  if (join.status === 'error') {
    return (
      <div className='flex flex-col gap-4'>
        <div className='flex items-start gap-3'>
          <span className='grid size-6 shrink-0 place-items-center rounded-full bg-red-500 text-sm text-white'>
            ✕
          </span>
          <div>
            <p className='font-medium'>Could not connect</p>
            <p className='text-sm text-muted'>{join.error}</p>
          </div>
        </div>
        <div className='flex gap-3'>
          <Button onClick={connect}>Try again</Button>
          <Button
            type='secondary'
            onClick={() => {
              setInvite('')
              dispatch(joinReset())
            }}
          >
            Use another code
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className='flex flex-col gap-6 pt-2'>
      <div>
        <div className='flex items-start gap-2'>
          <Input
            label='Invite code'
            className='flex-1'
            spellCheck={false}
            autoComplete='off'
            aria-invalid={inviteError !== null}
            value={invite}
            onChange={(event) => {
              setInvite(event.target.value)
              setInviteError(null)
            }}
          />
          <Button type='secondary' onClick={paste} className='mt-0.5'>
            Paste
          </Button>
        </div>
        {inviteError && <p className='mt-1 text-sm text-red-500'>{inviteError}</p>}
      </div>
      <Input
        label='Vault name'
        value={vaultName}
        onChange={(event) => setVaultName(event.target.value)}
      />
      <Input label='Device name' value={name} onChange={(event) => setName(event.target.value)} />
      <Button htmlType='submit' className='w-full'>
        Connect
      </Button>
    </form>
  )
}
