import { useState, type SubmitEvent } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'

interface VaultCreationProps {
  defaultName: string
  onSubmit: (name: string) => void
}

export default function VaultCreation({ defaultName, onSubmit }: VaultCreationProps) {
  const [name, setName] = useState(defaultName)

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(name.trim() || defaultName)
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-6 pt-2'>
      <Input
        label='Vault name'
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Button htmlType='submit' className='w-full'>
        Create
      </Button>
    </form>
  )
}
