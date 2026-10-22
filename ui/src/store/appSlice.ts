import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type WorkerStatus = 'starting' | 'running' | 'exited'

interface AppState {
  version: string
  workerStatus: WorkerStatus
}

const initialState: AppState = {
  version: '',
  workerStatus: 'starting'
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    versionLoaded(state, action: PayloadAction<string>) {
      state.version = action.payload
    },
    workerStatusChanged(state, action: PayloadAction<WorkerStatus>) {
      state.workerStatus = action.payload
    }
  }
})

export const { versionLoaded, workerStatusChanged } = appSlice.actions
export default appSlice.reducer
