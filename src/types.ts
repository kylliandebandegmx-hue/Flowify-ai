export type User = {
  username: string
  password: string
}

export type Playlist = {
  id: string
  name: string
  description: string
  owner: string
  members: string[]
  inviteCode: string
  createdAt: number
}

export type Track = {
  id: string
  title: string
  filename: string
  owner: string
  playlistId: string
  blob: Blob
  createdAt: number
}

export type AppState = {
  users: User[]
  playlists: Playlist[]
  tracks: Track[]
}
