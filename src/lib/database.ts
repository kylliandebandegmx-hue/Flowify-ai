import { supabase } from './supabase'
import type { Playlist, Track } from '../types'

export async function getPlaylists(userId: string) {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .or(`owner.eq.${userId},members.cs.["${userId}"]`)

  if (error) throw error
  return (data || []) as Playlist[]
}

export async function createPlaylist(
  userId: string,
  name: string,
  description: string
) {
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase()

  const { data, error } = await supabase
    .from('playlists')
    .insert([
      {
        name,
        description,
        owner: userId,
        members: [],
        invite_code: inviteCode,
        created_at: new Date().toISOString()
      }
    ])
    .select()

  if (error) throw error
  return data?.[0]
}

export async function joinPlaylist(userId: string, inviteCode: string) {
  const { data: playlist, error: fetchError } = await supabase
    .from('playlists')
    .select('*')
    .eq('invite_code', inviteCode)
    .single()

  if (fetchError) throw new Error('Code d\'invitation invalide.')

  const members = playlist.members || []
  if (members.includes(userId)) {
    throw new Error('Tu es déjà membre de cette playlist.')
  }

  const { error: updateError } = await supabase
    .from('playlists')
    .update({ members: [...members, userId] })
    .eq('id', playlist.id)

  if (updateError) throw updateError
  return playlist
}

export async function inviteByUsername(playlistId: string, username: string, userId: string) {
  // Get the profile with username
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  if (profileError) throw new Error('Utilisateur non trouvé.')

  // Get the playlist
  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', playlistId)
    .single()

  if (playlistError) throw playlistError

  // Check if owner
  if (playlist.owner !== userId) {
    throw new Error('Seul le propriétaire peut inviter.')
  }

  // Add member
  const members = playlist.members || []
  if (members.includes(profile.id)) {
    throw new Error('Cet utilisateur est déjà membre.')
  }

  const { error: updateError } = await supabase
    .from('playlists')
    .update({ members: [...members, profile.id] })
    .eq('id', playlistId)

  if (updateError) throw updateError
}

export async function getTracks(playlistId: string) {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('playlist_id', playlistId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as Track[]
}

export async function uploadTrack(
  userId: string,
  playlistId: string,
  title: string,
  file: File
) {
  // Upload file to storage
  const filename = `${playlistId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('tracks')
    .upload(filename, file)

  if (uploadError) throw uploadError

  // Create track record
  const { data, error } = await supabase
    .from('tracks')
    .insert([
      {
        title,
        filename,
        owner: userId,
        playlist_id: playlistId,
        created_at: new Date().toISOString()
      }
    ])
    .select()

  if (error) throw error
  return data?.[0]
}

export async function getTrackUrl(filename: string) {
  const { data } = supabase.storage.from('tracks').getPublicUrl(filename)
  return data.publicUrl
}

export async function deleteTrack(trackId: string) {
  const { error } = await supabase.from('tracks').delete().eq('id', trackId)
  if (error) throw error
}
