import Button from '../components/Button'
import Table, { type TableModel } from '../components/Table'
import { deleteVault, openVault } from '../autopass/messages'
import { Modal } from '../modal/Modal'
import { useModals } from '../modal/context'
import ShareDialog from '../sharing/ShareDialog'
import { useAppDispatch, useAppSelector } from '../store'

interface VaultRow {
  id: string
  name: string
  access: string
  members: number
  passwords: number
  createdAt: Date
  writable: boolean
  active: boolean
}

export default function VaultsTable() {
  const dispatch = useAppDispatch()
  const modals = useModals()
  const { byId, order, activeId } = useAppSelector((s) => s.autopass)

  const rows: VaultRow[] = order.map((id) => {
    const vault = byId[id]
    return {
      id,
      name: vault.name,
      access: vault.writable ? 'Full access' : 'Read only',
      members: vault.members,
      passwords: vault.passwords.length,
      createdAt: new Date(vault.createdAt),
      writable: vault.writable,
      active: id === activeId
    }
  })

  const openShare = (row: VaultRow) => {
    const modal = new Modal({
      title: `Share ${row.name}`,
      content: <ShareDialog vaultId={row.id} onDone={() => modals.close(modal.id)} />
    })
    modals.add(modal)
  }

  const confirmDeletion = (row: VaultRow) => {
    const modal = new Modal({
      title: 'Delete vault',
      backdropClick: 'pulse',
      content: (
        <p className='text-muted'>
          Delete <b className='text-ink'>{row.name}</b> from this device? Other members keep the
          data they already have. This can't be undone.
        </p>
      ),
      buttons: [
        { label: 'Cancel', type: 'secondary', action: () => modals.close(modal.id) },
        {
          label: 'Delete',
          type: 'primary',
          action: () => {
            deleteVault(row.id)
            modals.close(modal.id)
          }
        }
      ]
    })
    modals.add(modal)
  }

  const model: TableModel<VaultRow> = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span className='flex items-center gap-2'>
          {row.name}
          {row.active && (
            <span className='rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent'>
              Active
            </span>
          )}
        </span>
      )
    },
    {
      key: 'access',
      header: 'Access',
      render: (row) => <span className={row.writable ? '' : 'text-muted'}>{row.access}</span>
    },
    { key: 'members', header: 'Members' },
    { key: 'passwords', header: 'Passwords' },
    { key: 'createdAt', header: 'Created' },
    {
      id: 'actions',
      header: '',
      render: (row) => (
        <div className='flex justify-end gap-2'>
          <Button size='sm' onClick={() => openVault(dispatch, row.id)}>
            Open
          </Button>
          {row.writable && (
            <Button size='sm' type='secondary' onClick={() => openShare(row)}>
              Share
            </Button>
          )}
          <Button size='sm' type='danger' onClick={() => confirmDeletion(row)}>
            Delete
          </Button>
        </div>
      )
    }
  ]

  if (rows.length === 0) return null

  return <Table model={model} data={rows} rowKey={(row) => row.id} />
}
