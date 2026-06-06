import { FormEvent, useEffect, useMemo, useState } from 'react'
import { loadDatabase, saveDatabase } from './lib/storage'
import type { AppState, Playlist, Track } from './types'

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

    setAppState({
      ...appState,
      users: [...appState.users, { username: trimmed, password }]
    })
    setCurrentUser(trimmed)
    localStorage.setItem('flowify-current-user', trimmed)
    setUsername('')
    setPassword('')
    showMessage('Compte créé ! Tu es connecté.')
  }

  function loginUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = username.trim()
    const found = appState.users.find(
      (user) => user.username === trimmed && user.password === password
    )

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

    setAppState({
      ...appState,
      playlists: appState.playlists.map((item) =>
        item.id === playlist.id ? { ...item, members: [...item.members, currentUser] } : item
      )
    })
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

    setAppState({
      ...appState,
      playlists: appState.playlists.map((item) =>
        item.id === selectedPlaylist.id ? { ...item, members: [...item.members, target] } : item
      )
    })
    setFormInviteUsername('')
    showMessage('Invitation envoyée à ' + target + '.')
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

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Flowify AI</h1>
          <p>Ton espace musical PWA avec playlists, invitations et audio partagé.</p>
        </div>
        {currentUser ? (
          <div className="header-user">
            <span>Bonjour, <strong>{currentUser}</strong></span>
            <button className="secondary" onClick={logout}>Déconnexion</button>
          </div>
        ) : null}
      </header>

      {!currentUser ? (
        <main className="auth-view">
          <section className="card auth-card">
            <h2>{authMode === 'login' ? 'Connexion à Flowify' : 'Création de compte'}</h2>
            <p>Connecte-toi pour créer des playlists et inviter tes amis.</p>
            <form onSubmit={authMode === 'login' ? loginUser : registerUser} className="auth-form">
              <label>
                Nom d’utilisateur
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Ton pseudo"
                  autoComplete="username"
                />
              </label>
              <label>
                Mot de passe
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mot de passe"
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                />
              </label>
              <button type="submit">{authMode === 'login' ? 'Se connecter' : 'Créer un compte'}</button>
            </form>
            <div className="auth-switch">
              <span>{authMode === 'login' ? 'Pas encore de compte ?' : 'Déjà inscrit ?'}</span>
              <button className="text-button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                {authMode === 'login' ? 'Créer un compte' : 'Se connecter'}
              </button>
            </div>
          </section>

          <section className="card hero-card">
            <h2>Une appli musicale propre et rapide</h2>
            <p>Flowify te permet de garder tes playlists, inviter des amis et uploader tes morceaux sans backend payant.</p>
            <ul>
              <li>Connexion et inscription instantanées</li>
              <li>Playlists privées et partagées</li>
              <li>Upload audio dans le navigateur</li>
              <li>PWA installable, rapide et hors ligne</li>
            </ul>
          </section>
        </main>
      ) : (
        <main>
          <section className="card welcome-card">
            <h2>Bienvenue sur ton espace Flowify</h2>
            <p>Crée une playlist, invite des amis et upload instantanément tes sons.</p>
          </section>

          <section className="grid dashboard-grid">
            <article className="card">
              <h3>Créer une playlist</h3>
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
            </article>

            <article className="card">
              <h3>Rejoindre une playlist</h3>
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
              <p className="info-line">Utilise le code fourni par le créateur de la playlist.</p>
            </article>
          </section>

          <section className="grid dashboard-grid" style={{ marginTop: '24px' }}>
            <article className="card">
              <h3>Mes playlists</h3>
              {accessiblePlaylists.length === 0 ? (
                <p>Aucune playlist pour le moment. Crée-en une ou rejoins-en.</p>
              ) : (
                <ul className="playlist-list">
                  {accessiblePlaylists.map((playlist) => (
                    <li
                      key={playlist.id}
                      className={`playlist-item ${selectedPlaylist?.id === playlist.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPlaylistId(playlist.id)}
                    >
                      <h4>{playlist.name}</h4>
                      <p className="info-line">{playlist.description || 'Aucune description'}</p>
                      <p className="info-line">Code : {playlist.inviteCode}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="card">
              {selectedPlaylist ? (
                <>
                  <h3>Playlist sélectionnée</h3>
                  <p><strong>{selectedPlaylist.name}</strong></p>
                  <p>{selectedPlaylist.description}</p>
                  <p className="info-line">Propriétaire : {selectedPlaylist.owner}</p>
                  <p className="info-line">Membres : {selectedPlaylist.members.length + 1}</p>
                  <form onSubmit={inviteUser} style={{ marginTop: '18px' }}>
                    <label>
                      Inviter un utilisateur
                      <input
                        value={formInviteUsername}
                        onChange={(event) => setFormInviteUsername(event.target.value)}
                        placeholder="Pseudo invité"
                      />
                    </label>
                    <button type="submit">Inviter</button>
                  </form>
                </>
              ) : (
                <p>Sélectionne une playlist pour voir les détails.</p>
              )}
            </article>
          </section>

          {selectedPlaylist ? (
            <section className="card" style={{ marginTop: '24px' }}>
              <h3>Upload audio</h3>
              <p>La musique uploadée est visible par les membres invités de la playlist.</p>
              <form onSubmit={uploadTrack}>
                <label>
                  Fichier audio
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(event) => setPendingFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                <button type="submit" disabled={!pendingFile}>Uploader</button>
              </form>

              {playlistTracks.length === 0 ? (
                <p className="info-line">Aucune musique uploadée dans cette playlist.</p>
              ) : (
                <div className="audio-card">
                  {playlistTracks.map((track) => (
                    <div key={track.id} className="card audio-track-card">
                      <h4>{track.title}</h4>
                      <p className="info-line">Envoyé par {track.owner}</p>
                      <audio controls src={URL.createObjectURL(track.blob)} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </main>
      )}

      {statusMessage ? <div className="alert">{statusMessage}</div> : null}

      <footer>
        <p>Flowify AI — PWA de musique locale avec partage de playlists et stockage audio.</p>
      </footer>
    </div>
  )
}

export default App
