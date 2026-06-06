import { FormEvent, useEffect, useMemo, useState } from 'react'
import { loadDatabase, saveDatabase } from './lib/storage'
import type { AppState, Playlist, Track, User } from './types'

const initialState: AppState = { users: [], playlists: [], tracks: [] }

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function App() {
  const [appState, setAppState] = useState<AppState>(initialState)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [formPlaylistName, setFormPlaylistName] = useState('')
  const [formPlaylistDescription, setFormPlaylistDescription] = useState('')
  const [formInviteCode, setFormInviteCode] = useState('')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('')
  const [formInviteUsername, setFormInviteUsername] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  useEffect(() => {
    loadDatabase().then((data) => {
      setAppState(data)
    })
    const storedUser = localStorage.getItem('flowify-current-user')
    if (storedUser) {
      setCurrentUser(storedUser)
    }
  }, [])

  useEffect(() => {
    saveDatabase(appState)
  }, [appState])

  const accessiblePlaylists = useMemo(
    () =>
      appState.playlists.filter(
        (playlist) =>
          playlist.owner === currentUser || playlist.members.includes(currentUser ?? '')
      ),
    [appState.playlists, currentUser]
  )

  const selectedPlaylist = useMemo(
    () =>
      accessiblePlaylists.find((playlist) => playlist.id === selectedPlaylistId) ||
      accessiblePlaylists[0] ||
      null,
    [accessiblePlaylists, selectedPlaylistId]
  )

  useEffect(() => {
    if (!selectedPlaylistId && accessiblePlaylists.length > 0) {
      setSelectedPlaylistId(accessiblePlaylists[0].id)
    }
  }, [accessiblePlaylists, selectedPlaylistId])

  const playlistTracks = useMemo(
    () =>
      appState.tracks.filter((track) => track.playlistId === selectedPlaylist?.id),
    [appState.tracks, selectedPlaylist]
  )

  function showMessage(message: string) {
    setStatusMessage(message)
    window.setTimeout(() => setStatusMessage(''), 4000)
  }

  function registerUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = username.trim()
    if (!trimmed || password.length < 4) {
      showMessage('Nom d’utilisateur et mot de passe valides requis.')
      return
    }

    if (appState.users.some((user) => user.username === trimmed)) {
      showMessage('Ce nom existe déjà. Choisis un autre nom.')
      return
    }

    const nextState: AppState = {
      ...appState,
      users: [...appState.users, { username: trimmed, password }]
    }
    setAppState(nextState)
    setCurrentUser(trimmed)
    localStorage.setItem('flowify-current-user', trimmed)
    setUsername('')
    setPassword('')
    showMessage('Compte créé ! Tu es connecté.')
  }

  function loginUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = username.trim()
    const found = appState.users.find((user) => user.username === trimmed && user.password === password)

    if (!found) {
      showMessage('Identifiants incorrects. Vérifie ton nom et ton mot de passe.')
      return
    }

    setCurrentUser(trimmed)
    localStorage.setItem('flowify-current-user', trimmed)
    setUsername('')
    setPassword('')
    showMessage('Connecté avec succès.')
  }

  function logout() {
    setCurrentUser(null)
    localStorage.removeItem('flowify-current-user')
    showMessage('Déconnecté.')
  }

  function createPlaylist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentUser) return
    const name = formPlaylistName.trim()
    if (!name) {
      showMessage('Donne un nom à ta playlist.')
      return
    }

    const newPlaylist: Playlist = {
      id: generateId(),
      name,
      description: formPlaylistDescription.trim(),
      owner: currentUser,
      members: [],
      inviteCode: generateInviteCode(),
      createdAt: Date.now()
    }
    setAppState({ ...appState, playlists: [newPlaylist, ...appState.playlists] })
    setFormPlaylistName('')
    setFormPlaylistDescription('')
    setSelectedPlaylistId(newPlaylist.id)
    showMessage('Playlist créée. Tu peux maintenant inviter des amis.')
  }

  function joinPlaylistByCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentUser) return
    const code = formInviteCode.trim().toUpperCase()
    const playlist = appState.playlists.find((item) => item.inviteCode === code)
    if (!playlist) {
      showMessage('Code invalide. Vérifie le code d’invitation.')
      return
    }
    if (playlist.owner === currentUser || playlist.members.includes(currentUser)) {
      showMessage('Tu fais déjà partie de cette playlist.')
      return
    }
    const updated = appState.playlists.map((item) =>
      item.id === playlist.id
        ? { ...item, members: [...item.members, currentUser] }
        : item
    )
    setAppState({ ...appState, playlists: updated })
    setFormInviteCode('')
    setSelectedPlaylistId(playlist.id)
    showMessage('Invitation acceptée. Tu as rejoint la playlist.')
  }

  function inviteUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPlaylist || !currentUser) return
    const target = formInviteUsername.trim()
    if (!target) {
      showMessage('Entre le nom de l’utilisateur à inviter.')
      return
    }
    if (target === selectedPlaylist.owner) {
      showMessage('Tu invites déjà le propriétaire.')
      return
    }
    if (!appState.users.some((user) => user.username === target)) {
      showMessage('Cet utilisateur n’existe pas.')
      return
    }
    if (selectedPlaylist.members.includes(target)) {
      showMessage('Cet utilisateur est déjà invité.')
      return
    }

    const updated = appState.playlists.map((item) =>
      item.id === selectedPlaylist.id
        ? { ...item, members: [...item.members, target] }
        : item
    )
    setAppState({ ...appState, playlists: updated })
    setFormInviteUsername('')
    showMessage(`Invitation envoyée à ${target}.`) 
  }

  function uploadTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPlaylist || !currentUser || !pendingFile) return
    const nextTrack: Track = {
      id: generateId(),
      title: pendingFile.name,
      filename: pendingFile.name,
      owner: currentUser,
      playlistId: selectedPlaylist.id,
      blob: pendingFile,
      createdAt: Date.now()
    }
    setAppState({ ...appState, tracks: [...appState.tracks, nextTrack] })
    setPendingFile(null)
    showMessage('Musique uploadée dans le cloud privé de ta playlist.')
  }

  const isOwner = selectedPlaylist?.owner === currentUser
  const canAccessSelected = !!selectedPlaylist

  return (
    <div className="app-shell">
      <header>
        <div className="heading-group">
          <h1>Flowify AI</h1>
          <p>Plateforme PWA pour playlists, comptes, invitations et upload audio.</p>
        </div>
        {currentUser ? (
          <div>
            <p>Connecté en tant que <strong>{currentUser}</strong></p>
            <button onClick={logout}>Déconnexion</button>
          </div>
        ) : null}
      </header>

      {!currentUser ? (
        <div className="grid grid-2">
          <section className="card">
            <h2>{authMode === 'login' ? 'Connexion' : 'Inscription'}</h2>
            <form onSubmit={authMode === 'login' ? loginUser : registerUser}>
              <label>
                Nom d’utilisateur
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Ton pseudo"
                />
              </label>
              <label>
                Mot de passe
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mot de passe"
                />
              </label>
              <button type="submit">{authMode === 'login' ? 'Se connecter' : 'Créer un compte'}</button>
            </form>
            <p className="info-line">
              {authMode === 'login'
                ? 'Pas encore de compte ?'
                : 'Tu as déjà un compte ?'}
              <button className="secondary" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                {authMode === 'login' ? 'Inscription' : 'Connexion'}
              </button>
            </p>
          </section>

          <section className="card">
            <h2>Comment ça marche</h2>
            <p>Crée un compte, crée et partage des playlists, invite des amis, puis upload tes fichiers audio.</p>
            <ul>
              <li>Compte local sécurisé</li>
              <li>Playlists partagées avec un code d’invitation</li>
              <li>Upload audio direct dans le stockage interne</li>
              <li>PWA installable et disponible hors connexion</li>
            </ul>
          </section>
        </div>
      ) : (
        <div className="grid grid-2">
          <section className="card">
            <h2>Créer une playlist</h2>
            <form onSubmit={createPlaylist}>
              <label>
                Nom de la playlist
                <input
                  value={formPlaylistName}
                  onChange={(event) => setFormPlaylistName(event.target.value)}
                  placeholder="Mon mix du jour"
                />
              </label>
              <label>
                Description
                <textarea
                  rows={3}
                  value={formPlaylistDescription}
                  onChange={(event) => setFormPlaylistDescription(event.target.value)}
                  placeholder="Description rapide"
                />
              </label>
              <button type="submit">Créer la playlist</button>
            </form>
          </section>

          <section className="card">
            <h2>Rejoindre une playlist</h2>
            <form onSubmit={joinPlaylistByCode}>
              <label>
                Code d’invitation
                <input
                  value={formInviteCode}
                  onChange={(event) => setFormInviteCode(event.target.value)}
                  placeholder="XXXXXX"
                />
              </label>
              <button type="submit">Rejoindre</button>
            </form>
            <p className="info-line">Le code est fourni par le créateur de la playlist.</p>
          </section>
        </div>
      )}

      {currentUser ? (
        <div className="grid grid-2" style={{ marginTop: '24px' }}>
          <section className="card">
            <h2>Mes playlists</h2>
            {accessiblePlaylists.length === 0 ? (
              <p>Aucune playlist pour le moment. Crée-en une ou rejoins-en avec un code.</p>
            ) : (
              <ul className="playlist-list">
                {accessiblePlaylists.map((playlist) => (
                  <li
                    key={playlist.id}
                    className="playlist-item"
                    onClick={() => setSelectedPlaylistId(playlist.id)}
                    style={{ cursor: 'pointer', opacity: selectedPlaylist?.id === playlist.id ? 1 : 0.8 }}
                  >
                    <h3>{playlist.name}</h3>
                    <p className="info-line">{playlist.description || 'Aucune description'}</p>
                    <p className="info-line">Propriétaire : {playlist.owner}</p>
                    <p className="info-line">Code : {playlist.inviteCode}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            {selectedPlaylist ? (
              <>
                <h2>Playlist sélectionnée</h2>
                <p><strong>{selectedPlaylist.name}</strong></p>
                <p>{selectedPlaylist.description}</p>
                <p className="info-line">Visibilité : {selectedPlaylist.owner === currentUser ? 'Créateur' : 'Invité'}</p>
                <p className="info-line">Membres : {selectedPlaylist.members.length + 1}</p>
                <div style={{ marginTop: '18px' }}>
                  <h3>Inviter un ami</h3>
                  <form onSubmit={inviteUser}>
                    <label>
                      Nom d’utilisateur invité
                      <input
                        value={formInviteUsername}
                        onChange={(event) => setFormInviteUsername(event.target.value)}
                        placeholder="pseudo de l’ami"
                      />
                    </label>
                    <button type="submit">Inviter</button>
                  </form>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <p className="info-line">Utilise le code d’invitation pour partager la playlist avec d’autres comptes.</p>
                </div>
              </>
            ) : (
              <p>Choisis une playlist dans la liste pour voir les détails.</p>
            )}
          </section>
        </div>
      ) : null}

      {currentUser && selectedPlaylist ? (
        <section className="card" style={{ marginTop: '24px' }}>
          <h2>Upload audio dans le cloud</h2>
          <p>Ton upload sera stocké ici et visible par les invités de la playlist.</p>
          <form onSubmit={uploadTrack}>
            <label>
              Fichier audio
              <input
                type="file"
                accept="audio/*"
                onChange={(event) => setPendingFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button type="submit" disabled={!pendingFile}>Uploader dans la playlist</button>
          </form>
          {playlistTracks.length === 0 ? (
            <p className="info-line">Aucune musique uploadée dans cette playlist.</p>
          ) : (
            <div className="audio-card">
              {playlistTracks.map((track) => (
                <div key={track.id} className="card">
                  <h3>{track.title}</h3>
                  <p className="info-line">Envoyé par {track.owner}</p>
                  <audio controls src={URL.createObjectURL(track.blob)} />
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {statusMessage ? <div className="alert">{statusMessage}</div> : null}

      <footer>
        <p>Flowify AI — PWA de musique locale avec partage de playlists et stockage audio.</p>
      </footer>
    </div>
  )
}

export default App
