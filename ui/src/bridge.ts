type Unsubscribe = () => void
type BytesListener = (data: Uint8Array) => void

export interface Bridge {
  pkg(): { name: string; productName: string; version: string; [key: string]: unknown }
  applyUpdate(): Promise<void>
  appAfterUpdate(): Promise<void>
  startWorker(specifier: string): Promise<void>
  onWorkerStdout(specifier: string, listener: BytesListener): Unsubscribe
  onWorkerStderr(specifier: string, listener: BytesListener): Unsubscribe
  onWorkerIPC(specifier: string, listener: BytesListener): Unsubscribe
  onWorkerExit(specifier: string, listener: (code: number) => void): Unsubscribe
  writeWorkerIPC(specifier: string, data: string | Uint8Array): Promise<void>
}

export const MAIN_WORKER = '/workers/main.js'

export const bridge = window.bridge

declare global {
  interface Window {
    bridge: Bridge
  }
}
