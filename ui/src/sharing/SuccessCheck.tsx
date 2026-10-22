export default function SuccessCheck() {
  return (
    <span className='grid size-12 shrink-0 place-items-center rounded-full bg-accent text-white transition-[opacity,scale] duration-500 ease-out starting:scale-50 starting:opacity-0'>
      <svg
        width={24}
        height={24}
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth={3}
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden
      >
        <path d='M20 6L9 17l-5-5' />
      </svg>
    </span>
  )
}
