# PinoyFlix

A free streaming platform built with React Native (Expo) and Firebase. Browse and watch movies, anime, and series without an account — sign up if you want to save things or comment.

**Live site:** https://pinoyflix.vercel.app/

## What it does

- Browse movies, anime, and series with search and genre filters
- Watch trailers/clips through an embedded player
- Sign up to save a watchlist, track watch history, and comment on titles
- Comments are public to read, but only logged-in users can post
- Full profile management — edit name/email/photo, change password, delete account

## Stack

- **React Native + Expo Router** — app framework and navigation
- **Firebase** — Auth, Firestore, Storage
- **TMDB API** — movies and series data
- **Jikan API** — anime data
- **Vercel** — deployment

## Firebase data

```
users/{uid}                        → profile info, bookmarks
comments/{contentId}/messages      → comments per title
watchHistory/{uid}_{contentId}     → watch progress
```

CRUD is implemented across registration, comments, bookmarks, profile edits, and account deletion.

## Running locally

```bash
git clone https://github.com/adriancomia/pinoyFlix.git
cd pinoyflix
npm install
```

Add a `.env` file:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_TMDB_API_KEY=
```

```bash
npx expo start --web
---

Built solo for ADV102 final project. Video content is embedded from YouTube — no copyrighted material is hosted directly.
