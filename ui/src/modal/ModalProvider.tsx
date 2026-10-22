import { useReducer, useRef, type ReactNode } from 'react'
import { ModalsContext, type ModalsApi } from './context'
import { modalsReducer } from './reducer'
import ModalView, { type DestroyModal } from '../components/ModalView'

export default function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, dispatch] = useReducer(modalsReducer, [])
  const exitAnimations = useRef(new Map<string, () => Promise<void>>())
  const closing = useRef(new Set<string>())

  const destroyModal: DestroyModal = (id, exit) => {
    exitAnimations.current.set(id, exit)
    return () => {
      exitAnimations.current.delete(id)
    }
  }

  const api: ModalsApi = {
    add: (modal) => dispatch({ type: 'add', modal }),
    close: (id) => {
      if (closing.current.has(id)) return
      closing.current.add(id)
      const remove = () => {
        closing.current.delete(id)
        dispatch({ type: 'close', id })
      }
      const exit = exitAnimations.current.get(id)
      if (exit) exit().then(remove, remove)
      else remove()
    }
  }

  return (
    <ModalsContext value={api}>
      {children}
      {modals.map((modal) => (
        <ModalView key={modal.id} modal={modal} onClose={api.close} destroyModal={destroyModal} />
      ))}
    </ModalsContext>
  )
}
