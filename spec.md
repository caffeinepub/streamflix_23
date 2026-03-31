# StreamFlix

## Current State
Streaming site with TMDB data. Detail pages for movies and TV shows show metadata, cast, trailers (YouTube). Watchlist stored on-chain. No actual streaming/playback.

## Requested Changes (Diff)

### Add
- `WatchMoviePage` at `/watch/movie/:id` — full-screen VidKing iframe player
- `WatchTVPage` at `/watch/tv/:id/:season/:episode` — full-screen VidKing iframe player with season/episode selector
- VidKing embed URLs:
  - Movie: `https://www.vidking.net/embed/movie/{tmdb_id}`
  - TV: `https://www.vidking.net/embed/tv/{tmdb_id}/{season}/{episode}`
- Routes registered in App.tsx for both watch pages

### Modify
- `MovieDetailPage`: Change "Play Trailer" button to "Play" (primary action) that navigates to `/watch/movie/:id`. Keep trailer button as secondary.
- `TVDetailPage`: Change "Play Trailer" button to "Play" (primary action) that navigates to `/watch/tv/:id/1/1`. Keep trailer button as secondary.
- `HeroBanner`: "Play" button should navigate to watch page.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `src/frontend/src/pages/WatchMoviePage.tsx` with VidKing iframe embed
2. Create `src/frontend/src/pages/WatchTVPage.tsx` with VidKing iframe + season/episode picker
3. Update `App.tsx` to add routes `/watch/movie/$id` and `/watch/tv/$id/$season/$episode`
4. Update `MovieDetailPage.tsx` and `TVDetailPage.tsx` Play buttons to navigate to watch pages
5. Update `HeroBanner.tsx` Play button similarly
