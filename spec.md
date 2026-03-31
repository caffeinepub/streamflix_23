# StreamFlix

## Current State
- Streaming is exclusively via VidKing API (`https://www.vidking.net/embed/movie/{id}` and `https://www.vidking.net/embed/tv/{id}/{season}/{episode}`)
- WatchMoviePage and WatchTVPage render a fullscreen iframe with VidKing URL
- ProfilePage has user info, My List, and Continue Watching sections
- No user preference for streaming provider exists

## Requested Changes (Diff)

### Add
- `useStreamingProvider` hook: reads/writes streaming provider preference (`'vidking' | 'videasy'`) to localStorage; syncs to Firestore for logged-in users under `users/{uid}/preferences/streaming`
- Streaming provider selector in ProfilePage (below profile header, above My List): two styled toggle buttons "VidKing" and "Videasy" with a brief description; selecting one saves preference and updates the app immediately
- Videasy embed URLs:
  - Movie: `https://player.videasy.net/movie/{id}`
  - TV: `https://player.videasy.net/tv/{id}/{season}/{episode}`
- WatchMoviePage: switch iframe src based on current provider preference
- WatchTVPage (Videasy mode): custom Netflix-style overlays built in our app:
  - **Top overlay**: Back button + show title + S##E## label + Episode Selector toggle button (same as current)
  - **Next Episode button**: floating button bottom-right, shows when not on last episode of season; clicking navigates to next episode
  - **Autoplay next episode**: 10-second countdown overlay at bottom when near episode end (simulate with a visible "Next Episode in Xs" bar that auto-navigates); togglable via a setting in the overlay
  - **Episode selector overlay**: same as current VidKing mode (season + episode dropdowns)
- WatchTVPage (VidKing mode): no changes to existing behavior

### Modify
- WatchMoviePage: conditionally use Videasy or VidKing src based on provider preference
- WatchTVPage: conditionally render Videasy-enhanced overlay controls or VidKing controls
- ProfilePage: add streaming provider toggle section

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/hooks/useStreamingProvider.ts` — localStorage + Firestore sync for `'vidking' | 'videasy'` preference
2. Update `ProfilePage.tsx` — add streaming provider toggle UI section with two buttons
3. Update `WatchMoviePage.tsx` — use `useStreamingProvider` to switch iframe src
4. Update `WatchTVPage.tsx` — use `useStreamingProvider`; when Videasy: add Next Episode button, autoplay countdown overlay, keep episode selector; when VidKing: unchanged
