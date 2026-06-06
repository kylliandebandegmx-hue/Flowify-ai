import { useEffect, useState, FormEvent, useMemo } from 'react'
import { supabase } from './lib/supabase'
import { getCurrentUser, signUp, signIn, signOut, getUserProfile } from './lib/auth'
import {
  getPlaylists,
  createPlaylist,
  joinPlaylist,
  inviteByUsername,
  getTracks,
  uploadTrack,
  getTrackUrl
} from './lib/database'
import type { Playlist, Track, User } from './types'

interface AuthUser {
  id: string
  email: string
}

interface Profile {
  id: string
  email: string
  username: string
  created_at: string
}

function App() {
  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  // Dashboard state
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)

  // Form states
  const [playlistName, setPlaylistName] = useState('')
  const [playlistDescription, setPlaylistDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteUsername, setInviteUsername] = useState('')
  const [trackTitle, setTrackTitle] = useState('')
  const [trackFile, setTrackFile] = useState<File | null>(null)

  // Initialize auth
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email || ''
        })
        // Get profile
        const profileData = await getUserProfile(currentUser.id)
        setProfile(profileData)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || ''
          })
          const profileData = await getUserProfile(session.user.id)
          setProfile(profileData)
        } else {
          setUser(null)
          setProfile(null)
          setPlaylists([])
          setTracks([])
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Load playlists when user changes
  useEffect(() => {
    if (user) {
      loadPlaylists()
    }
  }, [user])

  // Load tracks when selected playlist changes
  useEffect(() => {
    if (selectedPlaylistId && user) {
      loadTracks()
    }
  }, [selectedPlaylistId, user])

  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const loadPlaylists = async () => {
    if (!user) return
    try {
      const data = await getPlaylists(user.id)
      setPlaylists(data)
      if (data.length > 0 && !selectedPlaylistId) {
        setSelectedPlaylistId(data[0].id)
      }
    } catch (err) {
      showMessage('Erreur lors du chargement des playlists')
    }
  }

  const loadTracks = async () => {
    if (!selectedPlaylistId) return
    try {
      const data = await getTracks(selectedPlaylistId)
      setTracks(data)
    } catch (err) {
      showMessage('Erreur lors du chargement des pistes')
    }
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !username || !password) {
      showMessage('Remplis tous les champs')
      return
    }
    if (password.length < 6) {
      showMessage('Le mot de passe doit faire au moins 6 caractères')
      return
    }

    try {
      setLoading(true)
      await signUp(email, password, username)
      setEmail('')
      setUsername('')
      setPassword('')
      setAuthMode('login')
      showMessage('Compte créé ! Vérifie ton email et connecte-toi.')
    } catch (err) {
      showMessage(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      showMessage('Entre ton email et ton mot de passe')
      return
    }

    try {
      setLoading(true)
      await signIn(email, password)
      setEmail('')
      setPassword('')
      showMessage('Connecté avec succès !')
    } catch (err) {
      showMessage(`Erreur: ${err instanceof Error ? err.message : 'Identifiants incorrects'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      showMessage('Déconnecté')
    } catch (err) {
      showMessage('Erreur lors de la déconnexion')
    }
  }

  const handleCreatePlaylist = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !playlistName.trim()) {
      showMessage('Donne un nom à la playlist')
      return
    }

    try {
      setLoading(true)
      const newPlaylist = await createPlaylist(
        user.id,
        playlistName,
        playlistDescription
      )
      setPlaylistName('')
      setPlaylistDescription('')
      await loadPlaylists()
      setSelectedPlaylistId(newPlaylist.id)
      showMessage('Playlist créée !')
    } catch (err) {
      showMessage(`Erreur: ${err instanceof Error ? err.message : 'Erreur'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinPlaylist = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !inviteCode.trim()) {
      showMessage('Entre un code d\'invitation')
      return
    }

    try {
      setLoading(true)
      await joinPlaylist(user.id, inviteCode.toUpperCase())
      setInviteCode('')
      await loadPlaylists()
      showMessage('Playlist ajoutée !')
    } catch (err) {
      showMessage(`Erreur: ${err instanceof Error ? err.message : 'Code invalide'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUsername = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !selectedPlaylistId || !inviteUsername.trim()) {
      showMessage('Remplis tous les champs')
      return
    }

    try {
      setLoading(true)
      await inviteByUsername(selectedPlaylistId, inviteUsername, user.id)
      setInviteUsername('')
      await loadPlaylists()
      showMessage('Utilisateur invité !')
    } catch (err) {
      showMessage(`Erreur: ${err instanceof Error ? err.message : 'Erreur'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadTrack = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !selectedPlaylistId || !trackTitle.trim() || !trackFile) {
      showMessage('Remplis tous les champs et sélectionne un fichier')
      return
    }

    try {
      setLoading(true)
      await uploadTrack(user.id, selectedPlaylistId, trackTitle, trackFile)
      setTrackTitle('')
      setTrackFile(null)
      await loadTracks()
      showMessage('Piste uploaddée !')
    } catch (err) {
      showMessage(`Erreur: ${err instanceof Error ? err.message : 'Erreur'}`)
    } finally {
      setLoading(false)
    }
  }

  const selectedPlaylist = useMemo(
    () => playlists.find(p => p.id === selectedPlaylistId),
    [playlists, selectedPlaylistId]
  )

  // Auth screen
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>Flowify</h1>
          <p className="subtitle">Musique collaborative en PWA</p>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              Connexion
            </button>
            <button
              className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => setAuthMode('register')}
            >
              Inscription
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{width: '100%'}}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="reg-username">Nom d'utilisateur</label>
                <input
                  id="reg-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ton_pseudo"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="reg-password">Mot de passe</label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{width: '100%'}}>
                {loading ? 'Inscription...' : 'S\'inscrire'}
              </button>
            </form>
          )}
        </div>

        {message && <div className="message">{message}</div>}
      </div>
    )
  }

  // Dashboard
  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">♪</div>
          <span>Flowify</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Menu</div>
            <button className="nav-item active">
              📚 Mes Playlists
            </button>
            <button className="nav-item">
              ⚙️ Paramètres
            </button>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Playlists</div>
            <div className="playlist-list">
              {playlists.map(playlist => (
                <button
                  key={playlist.id}
                  className={`playlist-item ${selectedPlaylistId === playlist.id ? 'active' : ''}`}
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                >
                  <span className="playlist-icon"></span>
                  <span>{playlist.name}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div style={{padding: '10px', borderTop: '1px solid var(--border)', marginTop: 'auto'}}>
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{width: '100%', fontSize: '0.85rem'}}
          >
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <header className="header">
          <div>
            <h2 style={{margin: 0}}>
              {selectedPlaylist?.name || 'Flowify'}
            </h2>
            {profile && <p style={{margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
              Connecté en tant que {profile.username}
            </p>}
          </div>
          <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
            {selectedPlaylist?.owner === user.id ? '👤 Propriétaire' : '👥 Membre'}
          </div>
        </header>

        <div className="content-area">
          {/* Playlist actions */}
          {selectedPlaylist && (
            <>
              <div className="form-container">
                <h3 style={{marginBottom: '15px'}}>📋 Infos Playlist</h3>
                <p><strong>{selectedPlaylist.name}</strong></p>
                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
                  {selectedPlaylist.description}
                </p>
                <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '10px'}}>
                  Code: <code style={{background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px'}}>
                    {selectedPlaylist.invite_code}
                  </code>
                </p>
              </div>

              {selectedPlaylist.owner === user.id && (
                <>
                  {/* Invite by username */}
                  <div className="form-container">
                    <h3 style={{marginBottom: '15px'}}>👥 Inviter par nom</h3>
                    <form onSubmit={handleInviteUsername}>
                      <div className="form-group">
                        <label htmlFor="invite-username">Nom d'utilisateur</label>
                        <input
                          id="invite-username"
                          type="text"
                          value={inviteUsername}
                          onChange={(e) => setInviteUsername(e.target.value)}
                          placeholder="nom_utilisateur"
                          disabled={loading}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Invitation...' : 'Inviter'}
                      </button>
                    </form>
                  </div>

                  {/* Upload track */}
                  <div className="form-container">
                    <h3 style={{marginBottom: '15px'}}>⬆️ Upload Piste</h3>
                    <form onSubmit={handleUploadTrack}>
                      <div className="form-group">
                        <label htmlFor="track-title">Titre</label>
                        <input
                          id="track-title"
                          type="text"
                          value={trackTitle}
                          onChange={(e) => setTrackTitle(e.target.value)}
                          placeholder="Titre de la piste"
                          disabled={loading}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="track-file">Fichier audio</label>
                        <input
                          id="track-file"
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setTrackFile(e.target.files?.[0] || null)}
                          disabled={loading}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Upload...' : 'Uploader'}
                      </button>
                    </form>
                  </div>
                </>
              )}

              {/* Tracks */}
              <div className="form-container">
                <h3 style={{marginBottom: '15px'}}>🎵 Pistes ({tracks.length})</h3>
                {tracks.length === 0 ? (
                  <p style={{color: 'var(--text-secondary)'}}>Aucune piste pour l'instant</p>
                ) : (
                  <div className="track-list">
                    {tracks.map(track => (
                      <div key={track.id} className="track-item">
                        <div className="track-info">
                          <p className="track-title">{track.title}</p>
                          <p className="track-artist">Ajoutée par {track.owner}</p>
                        </div>
                        <audio controls style={{maxWidth: '250px', height: '32px'}}>
                          <source src={track.filename} type="audio/mpeg" />
                          Ton navigateur ne supporte pas l'audio HTML5
                        </audio>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Create/Join playlist */}
          {playlists.length === 0 && (
            <div className="form-container">
              <h3 style={{marginBottom: '15px'}}>🎧 Bienvenue dans Flowify !</h3>
              <p style={{color: 'var(--text-secondary)', marginBottom: '20px'}}>
                Crée ta première playlist ou rejoins-en une existante.
              </p>
            </div>
          )}

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            {/* Create playlist */}
            <div className="form-container">
              <h3 style={{marginBottom: '15px'}}>➕ Créer Playlist</h3>
              <form onSubmit={handleCreatePlaylist}>
                <div className="form-group">
                  <label htmlFor="playlist-name">Nom</label>
                  <input
                    id="playlist-name"
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    placeholder="Ma super playlist"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="playlist-desc">Description</label>
                  <textarea
                    id="playlist-desc"
                    value={playlistDescription}
                    onChange={(e) => setPlaylistDescription(e.target.value)}
                    placeholder="Description optionnelle"
                    disabled={loading}
                    rows={3}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Création...' : 'Créer'}
                </button>
              </form>
            </div>

            {/* Join playlist */}
            <div className="form-container">
              <h3 style={{marginBottom: '15px'}}>🔗 Rejoindre</h3>
              <form onSubmit={handleJoinPlaylist}>
                <div className="form-group">
                  <label htmlFor="invite-code">Code d'invitation</label>
                  <input
                    id="invite-code"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Ex: ABC123"
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Rejointe...' : 'Rejoindre'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {message && <div className="message">{message}</div>}
    </div>
  )
}

export default App
