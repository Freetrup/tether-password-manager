import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

const BLUR_IN: Keyframe[] = [{ filter: 'blur(0)' }, { filter: 'blur(6px)' }]
const BLUR_OUT: Keyframe[] = [{ filter: 'blur(6px)' }, { filter: 'blur(0)' }]

const BLUR_OPTIONS: KeyframeAnimationOptions = {
  duration: 200,
  easing: 'ease-in-out'
}

export default function Password({ value }: { value: string }) {
  const [visible, setVisible] = useState(false)
  const elementRef = useRef<HTMLButtonElement>(null)
  const animating = useRef(false)

  const reveal = async () => {
    const element = elementRef.current
    if (!element) return
    animating.current = true
    const blurIn = element.animate(BLUR_IN, { ...BLUR_OPTIONS, fill: 'forwards' })
    await blurIn.finished
    flushSync(() => setVisible(true))
    blurIn.cancel()
    await element.animate(BLUR_OUT, BLUR_OPTIONS).finished
    animating.current = false
  }

  const handleClick = () => {
    if (animating.current) return
    if (visible) setVisible(false)
    else reveal().catch(() => (animating.current = false))
  }

  return (
    <button
      ref={elementRef}
      type='button'
      aria-label={visible ? 'Hide password' : 'Show password'}
      onClick={handleClick}
      className='block max-w-48 min-w-0 cursor-pointer overflow-hidden text-left text-ellipsis whitespace-nowrap font-mono transition-[scale] duration-200 ease-in-out hover:scale-110 hover:animate-pulse'
    >
      {visible ? value : <span className='tracking-widest'>••••••••</span>}
    </button>
  )
}
