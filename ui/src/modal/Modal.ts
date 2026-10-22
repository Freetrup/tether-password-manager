import type { ReactNode } from 'react'

export type ModalButtonType = 'primary' | 'secondary'

export type BackdropClick = 'close' | 'none' | 'pulse'

export interface ModalButton {
  label: string
  action: () => void
  type: ModalButtonType
}

export interface ModalOptions {
  id?: string
  title: string
  content: ReactNode
  buttons?: ModalButton[]
  backdropClick?: BackdropClick
}

export class Modal {
  readonly id: string
  readonly title: string
  readonly content: ReactNode
  readonly buttons: ModalButton[]
  readonly backdropClick: BackdropClick

  constructor({
    id = crypto.randomUUID(),
    title,
    content,
    buttons = [],
    backdropClick = 'close'
  }: ModalOptions) {
    this.id = id
    this.title = title
    this.content = content
    this.buttons = buttons
    this.backdropClick = backdropClick
  }
}
