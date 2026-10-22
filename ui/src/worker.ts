// Starts the Bare worker and wires its lifecycle into the store.
// Same plumbing as the template's renderer/app.js, minus the DOM code.
import { bridge, MAIN_WORKER } from './bridge'
import type { AppDispatch } from './store'
import { workerStatusChanged } from './store/appSlice'
import { handleAutopassMessage } from './autopass/messages'

const decoder = new TextDecoder('utf-8')

export function connectWorker(dispatch: AppDispatch) {
  const offStdout = bridge.onWorkerStdout(MAIN_WORKER, (data) => {
    console.log('[worker stdout]', decoder.decode(data))
  })

  const offStderr = bridge.onWorkerStderr(MAIN_WORKER, (data) => {
    console.error('[worker stderr]', decoder.decode(data))
  })

  const offIpc = bridge.onWorkerIPC(MAIN_WORKER, (data) => {
    const message = decoder.decode(data)
    console.log('[worker ipc]', message)
    dispatch(workerStatusChanged('running'))
    handleAutopassMessage(message, dispatch)
  })

  const offExit = bridge.onWorkerExit(MAIN_WORKER, (code) => {
    console.log('[worker exit]', code)
    dispatch(workerStatusChanged('exited'))
    offStdout()
    offStderr()
    offIpc()
    offExit()
  })

  bridge.startWorker(MAIN_WORKER).then(() => bridge.writeWorkerIPC(MAIN_WORKER, 'autopass:get'))
}
