import type { Modal } from './Modal'

export type ModalsAction = { type: 'add'; modal: Modal } | { type: 'close'; id: string }

export function modalsReducer(state: Modal[], action: ModalsAction): Modal[] {
  switch (action.type) {
    case 'add':
      return state.some((modal) => modal.id === action.modal.id) ? state : [...state, action.modal]
    case 'close':
      return state.filter((modal) => modal.id !== action.id)
  }
}
