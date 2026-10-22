import Button from '../components/Button'
import { createVault } from '../autopass/messages'
import { useAppDispatch, useAppSelector } from '../store'
import { vaultEntered } from '../store/autopassSlice'
import { Modal } from '../modal/Modal'
import { useModals } from '../modal/context'
import JoinDialog from '../sharing/JoinDialog'
import VaultCreation from '../vaults/VaultCreation'
import VaultsTable from '../vaults/VaultsTable'

export default function Welcome() {
  const dispatch = useAppDispatch()
  const modals = useModals()
  const vaultCount = useAppSelector((s) => s.autopass.order.length)
  const hasActiveVault = useAppSelector((s) => s.autopass.activeId !== null)

  const openCreate = () => {
    const modal = new Modal({
      title: 'Create a vault',
      content: (
        <VaultCreation
          defaultName={vaultCount === 0 ? 'Personal' : `Vault ${vaultCount + 1}`}
          onSubmit={(name) => {
            modals.close(modal.id)
            createVault(dispatch, name)
          }}
        />
      )
    })
    modals.add(modal)
  }

  const openJoin = () => {
    const modal = new Modal({
      title: 'Join a vault',
      content: <JoinDialog onDone={() => modals.close(modal.id)} />
    })
    modals.add(modal)
  }

  return (
    <div className='flex w-full max-w-5xl flex-col items-center px-4 text-center'>
      <h1 className='text-4xl font-semibold tracking-wide transition-[opacity,translate] duration-1000 ease-out starting:-translate-y-24 starting:opacity-0'>
        WELCOME TO IGOR'S PASSWORD SAVING SYSTEM
      </h1>
      <div className='mt-6 flex justify-center gap-3 transition-[opacity,translate] delay-400 duration-1000 ease-out starting:translate-y-24 starting:opacity-0'>
        <Button onClick={openCreate}>Create</Button>
        <Button onClick={openJoin}>Join</Button>
        {hasActiveVault && (
          <Button type='secondary' onClick={() => dispatch(vaultEntered())}>
            View current
          </Button>
        )}
      </div>
      <div className='mt-10 w-full text-left transition-[opacity,translate] delay-700 duration-1000 ease-out starting:translate-y-24 starting:opacity-0'>
        <VaultsTable />
      </div>
    </div>
  )
}
