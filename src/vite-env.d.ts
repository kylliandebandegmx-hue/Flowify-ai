/// <reference types="vite/client" />

declare module 'virtual:pwa-register' {
  export function registerSW(options?: { onRegistered?: (r: any) => void }): () => void
}
