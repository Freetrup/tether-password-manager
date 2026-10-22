import type { RootState } from '.'

export const selectActiveVault = (state: RootState) => {
  const { activeId, byId } = state.autopass
  return activeId ? (byId[activeId] ?? null) : null
}
