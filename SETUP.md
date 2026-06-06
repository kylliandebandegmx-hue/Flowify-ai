# 🎵 Flowify - Refonte Supabase 

## Changements principaux

### ✨ Nouvelles fonctionnalités

1. **Backend Supabase**
   - Base de données PostgreSQL gratuite et illimitée
   - Authentification sécurisée par email
   - Synchronisation en temps réel entre appareils ✅
   - RLS (Row Level Security) pour la sécurité des données

2. **UI Deezer-style**
   - Sidebar gauche avec navigation
   - Dark mode avec accents verts (#1DB954)
   - Responsive design
   - Meilleure organisation des playlists

3. **Système d'invitation amélioré**
   - Invitation par code unique (ex: ABC123)
   - Invitation par nom d'utilisateur
   - Accès cross-device (même compte sur plusieurs appareils)

4. **Upload audio dans le cloud**
   - Stockage Supabase (5GB gratuit)
   - Accessible depuis n'importe quel appareil

## 🚀 Installation et configuration

### Étape 1: Créer un compte Supabase

1. Va sur https://supabase.com
2. Clique sur "Start your project"
3. Crée un compte (ou connecte-toi avec GitHub)

### Étape 2: Créer un projet

- **Nom**: `flowify-ai`
- **Region**: Choisis la plus proche (ex: Europe)
- **Password**: Crée un mot de passe fort
- Clique sur "Create new project"

⏳ Attends quelques minutes que le projet soit créé...

### Étape 3: Exécuter les migrations SQL

Une fois le projet créé:

1. Va dans l'onglet **SQL Editor** (à gauche)
2. Clique sur "New Query"
3. Copie tout le code SQL ci-dessous et colle-le:

\`\`\`sql
-- Créer la table profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Créer la table playlists
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  invite_code TEXT UNIQUE NOT NULL,
  members UUID[] DEFAULT ARRAY[]::uuid[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Créer la table tracks
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Tous peuvent voir les profils"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Les users créent leur profil"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies pour playlists
CREATE POLICY "Voir ses playlists"
  ON playlists FOR SELECT
  USING (auth.uid() = owner OR auth.uid() = ANY(members));

CREATE POLICY "Créer une playlist"
  ON playlists FOR INSERT WITH CHECK (auth.uid() = owner);

CREATE POLICY "Mettre à jour sa playlist"
  ON playlists FOR UPDATE USING (auth.uid() = owner);

-- Policies pour tracks
CREATE POLICY "Voir les tracks"
  ON tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = tracks.playlist_id
      AND (playlists.owner = auth.uid() OR auth.uid() = ANY(playlists.members))
    )
  );

CREATE POLICY "Uploader une piste"
  ON tracks FOR INSERT WITH CHECK (auth.uid() = owner);

CREATE POLICY "Supprimer sa piste"
  ON tracks FOR DELETE USING (auth.uid() = owner);

-- Créer bucket pour les fichiers audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('tracks', 'tracks', true)
ON CONFLICT (id) DO NOTHING;

-- RLS pour le storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous peuvent voir les tracks"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tracks');

CREATE POLICY "Uploader dans tracks"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tracks');

CREATE POLICY "Supprimer sa track"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]);
\`\`\`

4. Clique sur "Run" (ou Ctrl+Enter)
5. Attends que ça se complète ✅

### Étape 4: Récupérer les clés API

1. Va dans **Settings** (roue en bas à gauche) → **API**
2. Dans l'onglet "Project API keys", copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon key** (la clé publique)

### Étape 5: Configurer les variables d'environnement

1. Ouvre le fichier `.env.local` à la racine du projet
2. Remplis les valeurs:

\`\`\`
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
\`\`\`

3. Sauvegarde le fichier

### Étape 6: Redémarrer l'app

\`\`\`bash
npm run dev
\`\`\`

Puis ouvre http://localhost:5173 et crée un compte ! 🎉

## 🔑 Points clés

- **Authentification**: Email + mot de passe
- **Données persistantes**: Base de données Supabase (gratuite)
- **Synchronisation**: Fonctionne entre navigateurs et appareils
- **Invitations**: Par code unique ou nom d'utilisateur
- **Audio**: Stocké dans Supabase Storage (5GB gratuit)

## 📝 Points d'amélioration futurs

- [ ] Service worker pour mode offline
- [ ] Lecture audio avec visualizer
- [ ] Partage de playlists publiques
- [ ] Système de favoris
- [ ] Dark/Light mode toggle
- [ ] Upload depuis cloud (Google Drive, Dropbox)

## ⚠️ Troubleshooting

**Erreur: "Supabase URL is required"**
- Vérifie que `.env.local` contient `VITE_SUPABASE_URL`
- Redémarr l'app avec `npm run dev`

**Erreur: "Email already registered"**
- Utilise un autre email
- (Ou supprime l'utilisateur dans Supabase Dashboard → Authentication)

**Pistes n'apparaissent pas**
- Vérifie que le bucket `tracks` existe dans Storage
- Vérifie les RLS policies

## 📖 Ressources

- [Docs Supabase](https://supabase.com/docs)
- [Authentification Supabase](https://supabase.com/docs/guides/auth)
- [Database Supabase](https://supabase.com/docs/guides/database)
