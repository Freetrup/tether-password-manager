import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { bridge } from './bridge'
import { store } from './store'
import { versionLoaded } from './store/appSlice'
import { connectWorker } from './worker'
import { connectTheme } from './theme/theme'
import App from './App'
import ModalProvider from './modal/ModalProvider'
import './styles.css'

store.dispatch(versionLoaded(bridge.pkg().version))
connectWorker(store.dispatch)
connectTheme(() => store.getState().theme.preference, store.subscribe)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ModalProvider>
        <App />
      </ModalProvider>
    </Provider>
  </StrictMode>
)
