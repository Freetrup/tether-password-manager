import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { readThemePreference, type ThemePreference } from '../theme/theme'

interface ThemeState {
  preference: ThemePreference
}

const initialState: ThemeState = {
  preference: readThemePreference()
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    themePreferenceChanged(state, action: PayloadAction<ThemePreference>) {
      state.preference = action.payload
    }
  }
})

export const { themePreferenceChanged } = themeSlice.actions
export default themeSlice.reducer
