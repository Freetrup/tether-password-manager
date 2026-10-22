import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { StoredPassword } from '../passwords/model'

export type AutopassStatus = 'loading' | 'ready' | 'error'

export type ShareStatus = 'idle' | 'creating' | 'waiting' | 'joined' | 'error'

export type JoinStatus = 'idle' | 'searching' | 'granting' | 'done' | 'error'

export interface VaultSnapshot {
  id: string
  name: string
  createdAt: number
  joined: boolean
  writable: boolean
  members: number
  passwords: StoredPassword[]
}

export interface AutopassSnapshot {
  activeId: string | null
  vaults: VaultSnapshot[]
}

interface ShareState {
  vaultId: string | null
  status: ShareStatus
  invite: string | null
  readOnly: boolean
  joinedName: string | null
  error: string | null
}

interface JoinState {
  status: JoinStatus
  error: string | null
}

interface AutopassState {
  status: AutopassStatus
  error: string | null
  activeId: string | null
  byId: Record<string, VaultSnapshot>
  order: string[]
  vaultHidden: boolean
  share: ShareState
  join: JoinState
}

const initialShare: ShareState = {
  vaultId: null,
  status: 'idle',
  invite: null,
  readOnly: false,
  joinedName: null,
  error: null
}

const initialJoin: JoinState = {
  status: 'idle',
  error: null
}

const initialState: AutopassState = {
  status: 'loading',
  error: null,
  activeId: null,
  byId: {},
  order: [],
  vaultHidden: false,
  share: initialShare,
  join: initialJoin
}

const autopassSlice = createSlice({
  name: 'autopass',
  initialState,
  reducers: {
    autopassRequested(state) {
      state.status = 'loading'
      state.error = null
      state.vaultHidden = false
    },
    autopassLoaded(state, action: PayloadAction<AutopassSnapshot>) {
      state.status = 'ready'
      state.error = null
      state.activeId = action.payload.activeId
      state.byId = Object.fromEntries(action.payload.vaults.map((vault) => [vault.id, vault]))
      state.order = action.payload.vaults.map((vault) => vault.id)
    },
    autopassFailed(state, action: PayloadAction<string>) {
      state.status = 'error'
      state.error = action.payload
    },
    vaultExited(state) {
      state.vaultHidden = true
    },
    vaultEntered(state) {
      state.vaultHidden = false
    },
    shareReset(state, action: PayloadAction<string | null>) {
      state.share = { ...initialShare, vaultId: action.payload }
    },
    shareRequested(state, action: PayloadAction<{ vaultId: string; readOnly: boolean }>) {
      state.share = { ...initialShare, status: 'creating', ...action.payload }
    },
    shareInviteReceived(
      state,
      action: PayloadAction<{ vaultId: string; invite: string; readOnly: boolean }>
    ) {
      if (state.share.vaultId !== action.payload.vaultId) return
      state.share.status = 'waiting'
      state.share.invite = action.payload.invite
      state.share.readOnly = action.payload.readOnly
    },
    shareJoined(
      state,
      action: PayloadAction<{ vaultId: string; name: string; readOnly: boolean }>
    ) {
      if (state.share.vaultId !== action.payload.vaultId) return
      state.share.status = 'joined'
      state.share.joinedName = action.payload.name
      state.share.readOnly = action.payload.readOnly
    },
    shareFailed(state, action: PayloadAction<{ vaultId: string; error: string }>) {
      if (state.share.vaultId !== action.payload.vaultId) return
      state.share.status = 'error'
      state.share.error = action.payload.error
    },
    shareRevoked(state, action: PayloadAction<{ vaultId: string }>) {
      if (state.share.vaultId !== action.payload.vaultId) return
      state.share = { ...initialShare, vaultId: action.payload.vaultId }
    },
    joinReset(state) {
      state.join = initialJoin
    },
    joinStatusChanged(state, action: PayloadAction<'searching' | 'granting' | 'done'>) {
      state.join.status = action.payload
      state.join.error = null
      if (action.payload === 'done') state.vaultHidden = false
    },
    joinFailed(state, action: PayloadAction<string>) {
      state.join.status = 'error'
      state.join.error = action.payload
    }
  }
})

export const {
  autopassRequested,
  autopassLoaded,
  autopassFailed,
  vaultExited,
  vaultEntered,
  shareReset,
  shareRequested,
  shareInviteReceived,
  shareJoined,
  shareFailed,
  shareRevoked,
  joinReset,
  joinStatusChanged,
  joinFailed
} = autopassSlice.actions
export default autopassSlice.reducer
