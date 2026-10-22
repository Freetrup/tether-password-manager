import { useId, type ComponentPropsWithRef } from 'react'
import { FIELD_CLASSES, LABEL_CLASSES } from './fieldClasses'

interface TextareaProps extends Omit<ComponentPropsWithRef<'textarea'>, 'placeholder'> {
  label: string
}

export default function Textarea({ label, id, className, rows = 3, ...rest }: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  return (
    <div className={['relative', className].filter(Boolean).join(' ')}>
      <textarea
        id={textareaId}
        rows={rows}
        placeholder=' '
        className={`${FIELD_CLASSES} resize-y`}
        {...rest}
      />
      <label htmlFor={textareaId} className={LABEL_CLASSES}>
        {label}
      </label>
    </div>
  )
}
