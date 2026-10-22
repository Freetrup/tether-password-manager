import { useCopy } from './useCopy'

export default function CopyLink({ value }: { value: string }) {
  const { copied, copy } = useCopy()

  return (
    <a
      href={value}
      title={copied ? 'Copied' : 'Click to copy'}
      onClick={(event) => {
        event.preventDefault()
        copy(value)
      }}
      className='text-accent underline-offset-2 transition-colors hover:underline'
    >
      {copied ? 'Copied!' : value}
    </a>
  )
}
