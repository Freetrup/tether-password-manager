import type { ComponentPropsWithRef } from 'react'
// from TW elements but with types)
export type ButtonType =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'link'

export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonRounded = 'none' | 'md' | 'full'

export interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'type'> {
  type?: ButtonType
  htmlType?: 'button' | 'submit' | 'reset'
  size?: ButtonSize
  rounded?: ButtonRounded
}

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 font-medium uppercase tracking-wide transition-[background-color,color,box-shadow,filter] duration-150 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-60'

const SOLID = 'text-white shadow-md hover:shadow-lg hover:brightness-110 active:brightness-95'

const TYPE_CLASSES: Record<ButtonType, string> = {
  primary: `bg-accent ${SOLID}`,
  secondary: 'border border-line text-ink hover:bg-black/5 dark:hover:bg-white/10',
  success: `bg-emerald-600 ${SOLID}`,
  danger: `bg-red-600 ${SOLID}`,
  warning: `bg-amber-500 ${SOLID}`,
  info: `bg-sky-500 ${SOLID}`,
  link: 'text-accent hover:bg-black/5 dark:hover:bg-white/10'
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-6 py-2.5 text-xs',
  lg: 'px-7 py-3 text-sm'
}

const ROUNDED_CLASSES: Record<ButtonRounded, string> = {
  none: 'rounded-none',
  md: 'rounded-md',
  full: 'rounded-full'
}

export default function Button({
  type = 'primary',
  htmlType = 'button',
  size = 'md',
  rounded = 'md',
  className,
  ...rest
}: ButtonProps) {
  const classes = [
    BASE_CLASSES,
    TYPE_CLASSES[type],
    SIZE_CLASSES[size],
    ROUNDED_CLASSES[rounded],
    className
  ]
    .filter(Boolean)
    .join(' ')

  return <button type={htmlType} className={classes} {...rest} />
}
