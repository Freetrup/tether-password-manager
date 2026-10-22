import type { TableModel } from '../components/Table'
import Password from '../components/Password'
import CopyButton from '../components/CopyButton'
import CopyLink from '../components/CopyLink'
import CustomFieldsButton from './CustomFieldsButton'

export interface CustomField {
  name: string
  value: string
}

export interface PasswordEntry {
  id: string
  title: string
  password: string
  url: string
  note: string
  customFields: CustomField[]
  createdAt: Date
  passwordChangedAt: Date
}

export type StoredPassword = Omit<PasswordEntry, 'createdAt' | 'passwordChangedAt'> & {
  createdAt: number
  passwordChangedAt: number
}

export type NewPassword = Omit<PasswordEntry, 'id' | 'createdAt' | 'passwordChangedAt'>

export const passwordTableModel: TableModel<PasswordEntry> = [
  { key: 'title', header: 'Title' },
  {
    key: 'password',
    header: 'Password',
    render: (row) => (
      <div className='flex items-center gap-2'>
        <Password value={row.password} />
        <CopyButton value={row.password} label='Copy password' />
      </div>
    )
  },
  { key: 'url', header: 'URL', render: (row) => (row.url ? <CopyLink value={row.url} /> : null) },
  { key: 'note', header: 'Note', render: (row) => <span className='text-muted'>{row.note}</span> },
  {
    key: 'customFields',
    header: 'Custom fields',
    render: (row) => <CustomFieldsButton title={row.title} fields={row.customFields} />
  },
  { key: 'createdAt', header: 'Created' }
]
