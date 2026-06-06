export type User = {
  id: string
  email: string
  username: string
}

export type Playlist = {
  id: string
  name: string
  description: string
  owner: string
  members: string[]
  invite_code: string
  created_at: string
}

export type Track = {
  id: string
  title: string
  filename: string
  owner: string
  playlist_id: string
  created_at: string
}

export type AppState = {
  users: User[]
  playlists: Playlist[]
  tracks: Track[]
}
