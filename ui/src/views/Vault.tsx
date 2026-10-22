import { useState } from 'react'
import Button from '../components/Button'
import Table from '../components/Table'
import Input from '../components/Input'
import Pagination from '../components/Pagination'
import { searchPasswords } from '../passwords/search'
import { passwordTableModel, type NewPassword, type PasswordEntry } from '../passwords/model'
import type { TableModel } from '../components/Table'
import { addPassword, removePassword, updatePassword } from '../autopass/messages'
import { useAppDispatch } from '../store'
import { vaultExited, type VaultSnapshot } from '../store/autopassSlice'
import { Modal } from '../modal/Modal'
import { useModals } from '../modal/context'
import PasswordCreation from '../passwords/PasswordCreation'
import Suggestions from '../passwords/Suggestions'
import ShareDialog from '../sharing/ShareDialog'
import ChangeSuggestion from '../passwords/ChangeSuggestion'

const PAGE_SIZE = 5

export default function Vault({ vault }: { vault: VaultSnapshot }) {
  const { passwords, writable } = vault
  const dispatch = useAppDispatch()
  const modals = useModals()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const openPasswordCreation = () => {
    // const clipboard = await navigator.clipboard.readText().catch(() => '')
    const modal = new Modal({
      title: 'Add password',
      content: (
        <PasswordCreation
          // initialValue={{ password: clipboard.trim() }}
          onSubmit={(password) => {
            addPassword(vault.id, password)
            modals.close(modal.id)
          }}
        />
      )
    })
    modals.add(modal)
  }

  const openPasswordEditing = (entry: PasswordEntry) => {
    const initialValue: NewPassword = {
      title: entry.title,
      password: entry.password,
      url: entry.url,
      note: entry.note,
      customFields: entry.customFields
    }
    const modal = new Modal({
      title: 'Edit password',
      content: (
        <PasswordCreation
          initialValue={initialValue}
          submitLabel='Update'
          onSubmit={(password) => {
            updatePassword(vault.id, entry.id, password)
            modals.close(modal.id)
          }}
        />
      )
    })
    modals.add(modal)
  }

  const confirmPasswordRemoval = (entry: PasswordEntry) => {
    const modal = new Modal({
      title: 'Delete password',
      backdropClick: 'pulse',
      content: (
        <p className='text-muted'>
          Delete {entry.title ? <b className='text-ink'>{entry.title}</b> : 'this password'}? This
          can't be undone.
        </p>
      ),
      buttons: [
        { label: 'Cancel', type: 'secondary', action: () => modals.close(modal.id) },
        {
          label: 'Delete',
          type: 'primary',
          action: () => {
            removePassword(vault.id, entry.id)
            modals.close(modal.id)
          }
        }
      ]
    })
    modals.add(modal)
  }

  const openShare = () => {
    const modal = new Modal({
      title: 'Add device',
      content: <ShareDialog vaultId={vault.id} onDone={() => modals.close(modal.id)} />
    })
    modals.add(modal)
  }

  const openChangeSuggestion = () => {
    const modal = new Modal({
      title: 'Suggest to change password',
      content: (
        <ChangeSuggestion
          passwords={rows}
          onClose={() => modals.close(modal.id)}
          onChange={(entry) => {
            modals.close(modal.id)
            openPasswordEditing(entry)
          }}
        />
      )
    })
    modals.add(modal)
  }

  const actionsColumn: TableModel<PasswordEntry> = [
    {
      id: 'actions',
      header: '',
      render: (row) => (
        <div className='flex justify-end gap-2'>
          <Button size='sm' type='secondary' onClick={() => openPasswordEditing(row)}>
            Edit
          </Button>
          <Button size='sm' type='danger' onClick={() => confirmPasswordRemoval(row)}>
            Delete
          </Button>
        </div>
      )
    }
  ]

  const tableModel: TableModel<PasswordEntry> = writable
    ? [...passwordTableModel, ...actionsColumn]
    : passwordTableModel

  const rows: PasswordEntry[] = passwords.map((entry) => ({
    ...entry,
    createdAt: new Date(entry.createdAt),
    passwordChangedAt: new Date(entry.passwordChangedAt)
  }))

  const filteredRows = searchPasswords(rows, query)
  const paginated = filteredRows.length > PAGE_SIZE
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = paginated
    ? filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : filteredRows

  const buttons = writable ? (
    <>
      <Button onClick={openPasswordCreation}>Add password</Button>
      {rows.length > 0 && (
        <Button type='secondary' onClick={openChangeSuggestion}>
          Suggest to change password
        </Button>
      )}
      <Button type='secondary' onClick={() => dispatch(vaultExited())}>
        Exit
      </Button>
      <Button type='secondary' onClick={openShare}>
        Share
      </Button>
    </>
  ) : (
    <>
      <span className='self-center rounded-full border border-line px-3 py-1 text-xs font-medium tracking-wide text-muted uppercase'>
        Read only
      </span>
      <Button type='secondary' onClick={() => dispatch(vaultExited())}>
        Exit
      </Button>
    </>
  )

  return (
    <div className='flex w-full justify-center transition-[opacity,translate] duration-700 ease-out starting:translate-y-4 starting:opacity-0'>
      {rows.length === 0 ? (
        <div className='flex flex-col items-center gap-6 px-4 text-center'>
          <p className='text-sm tracking-wide text-muted uppercase'>{vault.name}</p>
          <h1 className='text-4xl font-semibold tracking-wide transition-[opacity,translate] duration-1000 ease-out starting:-translate-y-24 starting:opacity-0'>
            There are no passwords
          </h1>
          <div className='flex flex-wrap justify-center gap-3 transition-[opacity,translate] delay-400 duration-1000 ease-out starting:translate-y-24 starting:opacity-0'>
            {buttons}
          </div>
        </div>
      ) : (
        <div className='flex w-full max-w-5xl flex-col gap-6 px-4'>
          <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
            <h2 className='text-2xl font-semibold'>{vault.name}</h2>
            <span className='text-sm text-muted'>
              {vault.members} {vault.members === 1 ? 'member' : 'members'}
              {vault.joined ? ' · Joined' : ''}
            </span>
          </div>
          <Suggestions passwords={passwords} />
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <Input
              label='Search by title, note or URL'
              type='search'
              className='min-w-64 flex-1 [--field-bg:var(--surface)] sm:max-w-sm'
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
            <div className='flex flex-wrap gap-3'>{buttons}</div>
          </div>
          {filteredRows.length === 0 ? (
            <p className='py-6 text-center text-muted'>Nothing found</p>
          ) : (
            <Table model={tableModel} data={pageRows} rowKey={(row) => row.id} />
          )}
          {paginated && <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />}
        </div>
      )}
    </div>
  )
}
