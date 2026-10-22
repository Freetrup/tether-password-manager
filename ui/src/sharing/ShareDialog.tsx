import { useEffect, useEffectEvent, useState } from 'react'
import Button from '../components/Button'
import CopyButton from '../components/CopyButton'
import { createShareInvite, revokeShareInvite } from '../autopass/messages'
import { useAppDispatch, useAppSelector } from '../store'
import { shareReset } from '../store/autopassSlice'
import Spinner from './Spinner'
import SuccessCheck from './SuccessCheck'

const ACCESS_OPTIONS = [
  { readOnly: false, label: 'Full access', hint: 'Can add, edit and delete passwords' },
  { readOnly: true, label: 'Read only', hint: 'Can only view passwords' }
]

export default function ShareDialog({ vaultId, onDone }: { vaultId: string; onDone: () => void }) {
  const dispatch = useAppDispatch()
  const share = useAppSelector((s) => s.autopass.share)
  const [readOnly, setReadOnly] = useState(false)
  const revokePending = useEffectEvent(() => {
    if (share.status === 'creating' || share.status === 'waiting') revokeShareInvite(vaultId)
  })

  useEffect(() => {
    dispatch(shareReset(vaultId))
    return () => revokePending()
  }, [dispatch, vaultId])

  if (share.status === 'joined') {
    return (
      <div className='flex flex-col items-center gap-4 py-2 text-center'>
        <SuccessCheck />
        <p className='transition-opacity delay-200 duration-500 starting:opacity-0'>
          <b>{share.joinedName}</b> connected ·{' '}
          <span className='text-muted'>{share.readOnly ? 'Read only' : 'Full access'}</span>
        </p>
        <div className='flex gap-3'>
          <Button onClick={onDone}>Done</Button>
          <Button type='secondary' onClick={() => dispatch(shareReset(vaultId))}>
            Invite another
          </Button>
        </div>
      </div>
    )
  }

  if (share.status === 'waiting' && share.invite) {
    return (
      <div className='flex flex-col gap-4'>
        <div className='flex items-center gap-2 rounded-md border border-line px-3 py-2'>
          <code className='min-w-0 flex-1 truncate font-mono text-sm' title={share.invite}>
            {share.invite}
          </code>
          <CopyButton value={share.invite} label='Copy invite' />
        </div>
        <p className='flex items-center gap-2 text-sm'>
          <span className='relative flex size-2.5'>
            <span className='absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75' />
            <span className='relative inline-flex size-2.5 rounded-full bg-accent' />
          </span>
          Waiting for connection…
        </p>
        <p className='text-sm text-muted'>Keep the app open. The code can be used only once.</p>
        <div>
          <Button type='secondary' onClick={() => revokeShareInvite(vaultId)}>
            Revoke
          </Button>
        </div>
      </div>
    )
  }

  const creating = share.status === 'creating'

  return (
    <div className='flex flex-col gap-4'>
      <fieldset className='flex flex-col gap-2' disabled={creating}>
        <legend className='mb-2 text-sm text-muted'>Access</legend>
        <div className='flex gap-6'>
          {ACCESS_OPTIONS.map((option) => (
            <label key={option.label} className='flex cursor-pointer items-center gap-2'>
              <input
                type='radio'
                name='share-access'
                className='size-4 cursor-pointer accent-(--accent)'
                checked={readOnly === option.readOnly}
                onChange={() => setReadOnly(option.readOnly)}
              />
              {option.label}
            </label>
          ))}
        </div>
        <p className='text-sm text-muted'>
          {ACCESS_OPTIONS.find((option) => option.readOnly === readOnly)?.hint}
        </p>
      </fieldset>
      {share.status === 'error' && <p className='text-sm text-red-500'>{share.error}</p>}
      <div className='flex justify-end'>
        <Button disabled={creating} onClick={() => createShareInvite(dispatch, vaultId, readOnly)}>
          {creating && <Spinner />}
          Create invite
        </Button>
      </div>
    </div>
  )
}
