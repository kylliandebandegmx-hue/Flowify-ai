# Flowify AI

Application PWA de musique construite avec Vite + React + TypeScript.

## Fonctionnalités

- Création de compte local
- Connexion et déconnexion
- Création et gestion de playlists
- Invitations par code ou nom d’utilisateur
- Upload audio dans le stockage interne du PWA
- Lecture audio dans les playlists partagées
- Application installable et disponible hors connexion (PWA)

## Installation

```bash
npm install
npm run dev
```

Ouvre `http://127.0.0.1:5173` dans ton navigateur.

## Build

```bash
npm run build
```

## Déploiement GitHub Pages

Le dépôt est configuré pour déployer automatiquement sur GitHub Pages via GitHub Actions.
Le site sera disponible ici :

https://kylliandebandegmx-hue.github.io/Flowify-ai/

## Notes sur le stockage

- Les fichiers audio sont actuellement conservés dans le navigateur via IndexedDB / LocalForage.
- Cela fonctionne sans service payant, mais les données restent liées au navigateur et à l’appareil utilisés.
- Pour un vrai cloud multi-appareil, il faudrait ajouter un backend ou un service de stockage externe (Firebase, Supabase, AWS, etc.).
- Les playlists, invitations et fichiers audio sont accessibles dans l’application tant que l’utilisateur utilise le même navigateur.
