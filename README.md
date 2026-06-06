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

## Notes

- Les fichiers audio sont conservés dans le stockage du navigateur via IndexedDB.
- Les playlists et invitations sont stockées localement dans la PWA.
- L’application est prête à être utilisée en tant que PWA.
