import localforage from 'localforage'
import type { AppState } from '../types'

const store = localforage.createInstance({
  name: 'flowify-ai',
  storeName: 'app-state'
})

export async function loadDatabase(): Promise<AppState> {
  const stored = await store.getItem<AppState>('data')
  return stored ?? { users: [], playlists: [], tracks: [] }
}

export async function saveDatabase(state: AppState): Promise<void> {
  await store.setItem('data', state)
}
