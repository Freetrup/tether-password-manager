import { useAppSelector } from './store'
import { selectActiveVault } from './store/selectors'
import ThemeSwitcher from './components/ThemeSwitcher'
import Welcome from './views/Welcome'
import Vault from './views/Vault'
import Loader from './components/Loader'

export default function App() {
  const { status, error, vaultHidden } = useAppSelector((s) => s.autopass)
  const activeVault = useAppSelector(selectActiveVault)
  const showVault = activeVault !== null && !vaultHidden

  return (
    <main className='relative grid min-h-screen place-items-center bg-surface text-ink'>
      <div className='absolute top-4 right-4'>
        <ThemeSwitcher />
      </div>
      {status === 'loading' && <Loader />}
      {status === 'error' && <p className='text-red-500'>{error}</p>}
      {status === 'ready' && !showVault && <Welcome />}
      {status === 'ready' && activeVault && showVault && (
        <Vault key={activeVault.id} vault={activeVault} />
      )}
    </main>
  )
}
