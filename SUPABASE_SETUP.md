# Configuration Supabase

Flowify AI utilise **Supabase** pour la base de données et l'authentification.

## Étapes de configuration

### 1. Créer un compte Supabase
- Va sur https://supabase.com
- Clique sur "Start your project"
- Crée un compte gratuit

### 2. Créer un nouveau projet
- Nom: `flowify-ai`
- Region: Choisis la plus proche
- Password: Crée un mot de passe fort

### 3. Exécuter les migrations SQL
Une fois le projet créé:
- Va dans "SQL Editor"
- Crée une nouvelle query
- Copie-colle le SQL ci-dessous:

```sql
-- Enable auth
CREATE SCHEMA IF NOT EXISTS auth;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  invite_code TEXT UNIQUE NOT NULL,
  members UUID[] DEFAULT ARRAY[]::uuid[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create storage bucket for tracks
INSERT INTO storage.buckets (id, name, public)
VALUES ('tracks', 'tracks', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Playlists RLS
CREATE POLICY "Users can see their playlists"
  ON playlists FOR SELECT
  USING (
    auth.uid() = owner OR
    auth.uid() = ANY(members)
  );

CREATE POLICY "Users can create playlists"
  ON playlists FOR INSERT
  WITH CHECK (auth.uid() = owner);

CREATE POLICY "Owner can update playlist"
  ON playlists FOR UPDATE
  USING (auth.uid() = owner);

-- Tracks RLS
CREATE POLICY "Users can see tracks in shared playlists"
  ON tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = tracks.playlist_id
      AND (
        playlists.owner = auth.uid() OR
        auth.uid() = ANY(playlists.members)
      )
    )
  );

CREATE POLICY "Users can upload tracks"
  ON tracks FOR INSERT
  WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can delete their tracks"
  ON tracks FOR DELETE
  USING (auth.uid() = owner);
```

### 4. Récupérer les clés d'API
- Va dans "Project Settings" → "API"
- Copie `Project URL` et `anon key`
- Colle-les dans `.env.local`:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Activer l'authentification par email
- Va dans "Authentication" → "Providers"
- Assure-toi que "Email" est activé (par défaut)

### 6. Redémarrer le serveur
```bash
npm run dev
```

Voilà ! L'app est maintenant connectée à Supabase.
