import { useCopy } from './useCopy'

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
}

interface CopyButtonProps {
  value: string
  label?: string
}

export default function CopyButton({ value, label = 'Copy' }: CopyButtonProps) {
  const { copied, copy } = useCopy()

  return (
    <button
      type='button'
      title={copied ? 'Copied' : label}
      aria-label={copied ? 'Copied' : label}
      onClick={() => copy(value)}
      className={`grid size-7 place-items-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${copied ? 'text-accent' : 'text-muted hover:text-ink'}`}
    >
      {copied ? (
        <svg {...iconProps}>
          <path d='M20 6L9 17l-5-5' />
        </svg>
      ) : (
        <svg {...iconProps}>
          <rect x='9' y='9' width='13' height='13' rx='2' />
          <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
        </svg>
      )}
    </button>
  )
}
