import type { Key, ReactNode } from 'react'

export interface FieldColumn<T> {
  key: keyof T & string
  header: string
  render?: (row: T) => ReactNode
}

export interface CustomColumn<T> {
  id: string
  header: string
  render: (row: T) => ReactNode
}

export type TableColumn<T> = FieldColumn<T> | CustomColumn<T>

export type TableModel<T> = TableColumn<T>[]

interface TableProps<T> {
  model: TableModel<T>
  data: T[]
  rowKey?: (row: T, index: number) => Key
}

function columnId<T>(column: TableColumn<T>) {
  return 'key' in column ? column.key : column.id
}

function renderCell<T>(column: TableColumn<T>, row: T): ReactNode {
  if (column.render) return column.render(row)
  return 'key' in column ? renderValue(row[column.key]) : null
}

function renderValue(value: unknown): ReactNode {
  if (value instanceof Date) return value.toLocaleString()
  if (value === null || value === undefined) return ''
  return String(value)
}

export default function Table<T>({ model, data, rowKey = (_, index) => index }: TableProps<T>) {
  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full text-left text-sm'>
        <thead className='border-b border-line text-xs font-medium tracking-wide text-muted uppercase'>
          <tr>
            {model.map((column) => (
              <th key={columnId(column)} scope='col' className='px-6 py-4 whitespace-nowrap'>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={rowKey(row, index)}
              className='border-b border-line transition-colors last:border-0 hover:bg-black/5 dark:hover:bg-white/5'
            >
              {model.map((column) => (
                <td key={columnId(column)} className='px-6 py-4 whitespace-nowrap'>
                  {renderCell(column, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
