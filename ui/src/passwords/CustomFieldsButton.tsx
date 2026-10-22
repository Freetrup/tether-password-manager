import Button from '../components/Button'
import { Modal } from '../modal/Modal'
import { useModals } from '../modal/context'
import type { CustomField } from './model'

interface CustomFieldsButtonProps {
  title: string
  fields: CustomField[]
}

export default function CustomFieldsButton({ title, fields }: CustomFieldsButtonProps) {
  const modals = useModals()

  if (fields.length === 0) return <span className='text-muted'>—</span>

  const openFields = () => {
    const modal = new Modal({
      title: title ? `${title} — custom fields` : 'Custom fields',
      content: (
        <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2'>
          {fields.map((field, index) => (
            <div key={index} className='contents'>
              <dt className='font-medium text-muted'>{field.name || '(no name)'}:</dt>
              <dd className='break-all'>{field.value}</dd>
            </div>
          ))}
        </dl>
      ),
      buttons: [{ label: 'Close', type: 'secondary', action: () => modals.close(modal.id) }]
    })
    modals.add(modal)
  }

  return (
    <Button size='sm' type='secondary' onClick={openFields}>
      Show ({fields.length})
    </Button>
  )
}
