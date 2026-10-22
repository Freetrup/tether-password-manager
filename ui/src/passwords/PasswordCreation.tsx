import { useState, type SubmitEvent } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import VisibilityToggle from '../components/VisibilityToggle'
import Textarea from '../components/Textarea'
import type { CustomField, NewPassword } from './model'

interface CustomFieldDraft extends CustomField {
  id: string
}

interface PasswordDraft extends Omit<NewPassword, 'customFields'> {
  customFields: CustomFieldDraft[]
}

const EMPTY_PASSWORD: NewPassword = {
  title: '',
  password: '',
  url: '',
  note: '',
  customFields: []
}

function toDraft(value: NewPassword): PasswordDraft {
  return {
    ...value,
    customFields: value.customFields.map((field) => ({ ...field, id: crypto.randomUUID() }))
  }
}

interface PasswordCreationProps {
  initialValue?: Partial<NewPassword>
  submitLabel?: string
  onSubmit: (password: NewPassword) => void
}

export default function PasswordCreation({
  initialValue,
  submitLabel = 'Save',
  onSubmit
}: PasswordCreationProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [form, setForm] = useState<PasswordDraft>(() =>
    toDraft({ ...EMPTY_PASSWORD, ...initialValue, customFields: initialValue?.customFields ?? [] })
  )

  const update = (field: keyof Omit<PasswordDraft, 'customFields'>) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }))

  const addCustomField = () =>
    setForm((current) => ({
      ...current,
      customFields: [...current.customFields, { id: crypto.randomUUID(), name: '', value: '' }]
    }))

  const updateCustomField = (id: string, field: keyof CustomField, value: string) =>
    setForm((current) => ({
      ...current,
      customFields: current.customFields.map((customField) =>
        customField.id === id ? { ...customField, [field]: value } : customField
      )
    }))

  const removeCustomField = (id: string) =>
    setForm((current) => ({
      ...current,
      customFields: current.customFields.filter((customField) => customField.id !== id)
    }))

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      title: form.title.trim(),
      password: form.password,
      url: form.url,
      note: form.note,
      customFields: form.customFields
        .map(({ name, value }) => ({ name: name.trim(), value }))
        .filter(({ name, value }) => name !== '' || value !== '')
    })
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6 pt-2'>
      <Input
        label='Title'
        required
        value={form.title}
        onChange={(event) => update('title')(event.target.value)}
      />
      <Input
        label='Password'
        type={passwordVisible ? 'text' : 'password'}
        autoComplete='off'
        spellCheck={false}
        trailing={
          <VisibilityToggle
            visible={passwordVisible}
            onToggle={() => setPasswordVisible((visible) => !visible)}
          />
        }
        required
        value={form.password}
        onChange={(event) => update('password')(event.target.value)}
      />
      <Input
        label='URL'
        type='url'
        value={form.url}
        onChange={(event) => update('url')(event.target.value)}
      />
      <Textarea
        label='Note'
        value={form.note}
        onChange={(event) => update('note')(event.target.value)}
      />
      {form.customFields.map((customField) => (
        <div
          key={customField.id}
          className='flex items-start gap-2 rounded-md border border-line px-3 pt-5 pb-3 transition-[opacity,translate] duration-300 ease-out starting:-translate-y-2 starting:opacity-0'
        >
          <Input
            label='Field name'
            className='flex-1'
            value={customField.name}
            onChange={(event) => updateCustomField(customField.id, 'name', event.target.value)}
          />
          <Input
            label='Field value'
            className='flex-1'
            value={customField.value}
            onChange={(event) => updateCustomField(customField.id, 'value', event.target.value)}
          />
          <button
            type='button'
            aria-label='Remove field'
            onClick={() => removeCustomField(customField.id)}
            className='mt-1.5 grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-ink'
          >
            <svg
              width={18}
              height={18}
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              strokeLinecap='round'
              aria-hidden
            >
              <path d='M6 6l12 12M18 6L6 18' />
            </svg>
          </button>
        </div>
      ))}
      <Button type='secondary' onClick={addCustomField} className='w-full'>
        Add custom field
      </Button>
      <Button htmlType='submit' className='w-full'>
        {submitLabel}
      </Button>
    </form>
  )
}
