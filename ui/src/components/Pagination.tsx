interface PaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
  label?: string
}

type PageItem = number | 'gap-start' | 'gap-end'

const ITEM_CLASSES =
  'relative block rounded bg-transparent px-3 py-1.5 text-sm transition duration-300 hover:bg-black/5 focus:bg-black/5 focus:text-accent focus:outline-none active:bg-black/5 active:text-accent disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/10 dark:focus:bg-white/10 dark:active:bg-white/10'

function pageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)
  const items: PageItem[] = [1]

  if (start > 2) {
    items.push('gap-start')
  }
  for (let current = start; current <= end; current++) {
    items.push(current)
  }

  if (end < pageCount - 1) {
    items.push('gap-end')
  }

  items.push(pageCount)

  return items
}

export default function Pagination({
  page,
  pageCount,
  onChange,
  label = 'Page navigation'
}: PaginationProps) {
  return (
    <nav aria-label={label}>
      <ul className='flex list-none flex-wrap justify-center gap-1'>
        <li>
          <button
            type='button'
            className={`${ITEM_CLASSES} text-ink`}
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
          >
            Previous
          </button>
        </li>
        {pageItems(page, pageCount).map((item) =>
          typeof item === 'number' ? (
            <li key={item} aria-current={item === page ? 'page' : undefined}>
              <button
                type='button'
                className={`${ITEM_CLASSES} ${item === page ? 'bg-black/5 font-medium text-accent dark:bg-white/10' : 'text-ink'}`}
                onClick={() => onChange(item)}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} className='px-2 py-1.5 text-sm text-muted'>
              …
            </li>
          )
        )}
        <li>
          <button
            type='button'
            className={`${ITEM_CLASSES} text-ink`}
            disabled={page >= pageCount}
            onClick={() => onChange(page + 1)}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  )
}
