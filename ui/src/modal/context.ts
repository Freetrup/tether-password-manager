import { createContext, useContext } from 'react'
import type { Modal } from './Modal'

export interface ModalsApi {
  add(modal: Modal): void
  close(id: string): void
}

export const ModalsContext = createContext<ModalsApi | null>(null)

export function useModals(): ModalsApi {
  const api = useContext(ModalsContext)
  if (!api) throw new Error('useModals must be used within ModalProvider')
  return api
}
