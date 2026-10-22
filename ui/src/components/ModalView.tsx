import { useEffect, useId, useRef } from 'react'
import type { Modal } from '../modal/Modal'
import Button from './Button'

const PULSE_KEYFRAMES: Keyframe[] = [{ scale: '1' }, { scale: '1.03' }, { scale: '1' }]

const PULSE_OPTIONS: KeyframeAnimationOptions = {
  duration: 300,
  easing: 'ease-in-out'
}

const EXIT_OPTIONS: KeyframeAnimationOptions = {
  duration: 300,
  easing: 'ease-in',
  fill: 'forwards'
}

export type DestroyModal = (id: string, exit: () => Promise<void>) => () => void

interface ModalViewProps {
  modal: Modal
  onClose: (id: string) => void
  destroyModal: DestroyModal
}

export default function ModalView({ modal, onClose, destroyModal }: ModalViewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(
    () =>
      destroyModal(modal.id, async () => {
        const dialog = dialogRef.current
        if (!dialog) return
        const panel = dialog.animate(
          [
            { opacity: 1, translate: '0 0' },
            { opacity: 0, translate: '0 -3rem' }
          ],
          EXIT_OPTIONS
        )
        const backdrop = dialog.animate([{ opacity: 1 }, { opacity: 0 }], {
          ...EXIT_OPTIONS,
          pseudoElement: '::backdrop'
        })
        await Promise.all([panel.finished, backdrop.finished])
      }),
    [modal.id, destroyModal]
  )

  const handleBackdropClick = () => {
    switch (modal.backdropClick) {
      case 'close':
        onClose(modal.id)
        return
      case 'pulse':
        dialogRef.current?.animate(PULSE_KEYFRAMES, PULSE_OPTIONS)
        return
      case 'none':
        return
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose(modal.id)
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) handleBackdropClick()
      }}
      className='mx-auto mt-7 w-[calc(100%-2rem)] max-w-lg rounded-lg bg-raised text-ink shadow-xl transition-[opacity,translate] duration-300 ease-out backdrop:bg-black/50 backdrop:transition-opacity backdrop:duration-300 starting:-translate-y-12 starting:opacity-0 starting:backdrop:opacity-0'
    >
      <header className='flex items-center justify-between border-b border-line px-4 py-3'>
        <h2 id={titleId} className='text-lg font-medium'>
          {modal.title}
        </h2>
        <button
          type='button'
          aria-label='Close'
          onClick={() => onClose(modal.id)}
          className='grid size-8 place-items-center rounded-full text-muted transition-colors hover:text-ink'
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
      </header>
      <main className='p-4'>{modal.content}</main>
      {modal.buttons.length > 0 && (
        <footer className='flex justify-end gap-2 border-t border-line px-4 py-3'>
          {modal.buttons.map((button) => (
            <Button key={button.label} type={button.type} onClick={button.action}>
              {button.label}
            </Button>
          ))}
        </footer>
      )}
    </dialog>
  )
}
