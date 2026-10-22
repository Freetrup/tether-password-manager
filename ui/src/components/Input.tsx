import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'
import { FIELD_CLASSES, LABEL_CLASSES } from './fieldClasses'

interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'placeholder'> {
  label: string
  trailing?: ReactNode
}

export default function Input({ label, trailing, id, className, ...rest }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={['relative', className].filter(Boolean).join(' ')}>
      <input
        id={inputId}
        placeholder=' '
        className={trailing ? `${FIELD_CLASSES} pr-11` : FIELD_CLASSES}
        {...rest}
      />
      <label htmlFor={inputId} className={LABEL_CLASSES}>
        {label}
      </label>
      {trailing && <div className='absolute inset-y-0 right-1.5 flex items-center'>{trailing}</div>}
    </div>
  )
}
