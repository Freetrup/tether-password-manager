import { useEffect, useEffectEvent, useRef, useState } from 'react'

export interface RouletteItem {
  id: string
  label: string
  hint?: string
}

interface VerticalRouletteProps {
  items: RouletteItem[]
  winnerIndex: number
  onFinish: () => void
  delay?: number
}

const TILE_SIZE = 48
const TILE_GAP = 4
const TILE_STEP = TILE_SIZE + TILE_GAP
const VISIBLE_TILES = 5
const WINDOW_HEIGHT = VISIBLE_TILES * TILE_STEP - TILE_GAP
const MIN_TILES = 60
const SPIN_DURATION = 5000
const SNAP_DURATION = 300
const SPIN_DELAY = 2000

function offsetFor(block: number, fraction = 0.5) {
  return -(block * TILE_STEP + TILE_SIZE * fraction) + WINDOW_HEIGHT / 2
}

function blockAt(offset: number) {
  return Math.round((WINDOW_HEIGHT / 2 - offset - TILE_SIZE / 2) / TILE_STEP)
}

function translate(offset: number) {
  return { transform: `translateY(${offset}px)` }
}


// Don't mind this code, I worked in iGaming and I can do it faster than you think)
export default function VerticalRoulette({
  items,
  winnerIndex,
  onFinish,
  delay = SPIN_DELAY
}: VerticalRouletteProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const finish = useEffectEvent(onFinish)

  const itemCount = items.length
  const repetitions = Math.max(6, Math.ceil(MIN_TILES / itemCount))
  const startOffset = offsetFor(items.length)
  const [currentBlock, setCurrentBlock] = useState(items.length)

  const tiles = Array.from({ length: repetitions }, (_, cycle) =>
    items.map((item, index) => ({ ...item, key: `${cycle}-${index}` }))
  ).flat()

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    let animation: Animation | null = null
    let frame = 0
    let cancelled = false

    const track = () => {
      const offset = new DOMMatrixReadOnly(getComputedStyle(list).transform).m42
      setCurrentBlock(blockAt(offset))
      frame = requestAnimationFrame(track)
    }

    const targetBlock = (repetitions - 2) * itemCount + winnerIndex
    const fraction = Math.min(0.9, Math.max(0.1, Math.random()))
    const ease = Math.random() * 0.15 + 0.1
    const landing = offsetFor(targetBlock, fraction)
    const center = offsetFor(targetBlock)

    const timer = setTimeout(() => {
      frame = requestAnimationFrame(track)
      animation = list.animate([translate(startOffset), translate(landing)], {
        duration: SPIN_DURATION,
        easing: `cubic-bezier(${ease}, ${1 - ease}, ${ease}, 1)`,
        fill: 'forwards'
      })
      animation.onfinish = () => {
        animation = list.animate([translate(landing), translate(center)], {
          duration: SNAP_DURATION,
          easing: 'ease-in-out',
          fill: 'forwards'
        })
        animation.onfinish = () => {
          cancelAnimationFrame(frame)
          setCurrentBlock(targetBlock)
          if (!cancelled) finish()
        }
      }
    }, delay)

    return () => {
      cancelled = true
      clearTimeout(timer)
      cancelAnimationFrame(frame)
      animation?.cancel()
    }
  }, [itemCount, winnerIndex, repetitions, startOffset, delay])

  return (
    <div className='relative mx-auto w-full max-w-sm' style={{ height: WINDOW_HEIGHT }}>
      <div className='absolute inset-0 animate-roulette-list overflow-hidden rounded-md'>
        <div
          ref={listRef}
          className='flex flex-col'
          style={{ gap: TILE_GAP, transform: `translateY(${startOffset}px)` }}
        >
          {tiles.map((tile, block) => (
            <div
              key={tile.key}
              className={`flex shrink-0 items-center justify-between gap-3 rounded-md bg-black/5 px-4 transition-all duration-200 dark:bg-white/5 ${block === currentBlock ? 'scale-100' : 'scale-85'}`}
              style={{ height: TILE_SIZE }}
            >
              <span className='truncate font-medium'>{tile.label}</span>
              {tile.hint && <span className='shrink-0 text-sm text-muted'>{tile.hint}</span>}
            </div>
          ))}
        </div>
        <div className='pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-raised to-transparent' />
        <div className='pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-raised to-transparent' />
      </div>
      <div
        className='pointer-events-none absolute inset-x-0 animate-roulette-frame rounded-md border-2 border-accent'
        style={{ top: (WINDOW_HEIGHT - TILE_SIZE) / 2, height: TILE_SIZE }}
      />
      <span
        className='pointer-events-none absolute top-1/2 -left-3 size-0 -translate-y-1/2 border-y-8 border-l-10 border-y-transparent border-l-accent animate-roulette-pointer-left'
        aria-hidden
      />
      <span
        className='pointer-events-none absolute top-1/2 -right-3 size-0 -translate-y-1/2 border-y-8 border-r-10 border-y-transparent border-r-accent animate-roulette-pointer-right'
        aria-hidden
      />
    </div>
  )
}
