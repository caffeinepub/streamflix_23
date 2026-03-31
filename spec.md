# StreamFlix

## Current State
MovieDetailPage and TVDetailPage show TMDB vote_average with a green star badge. MediaCard hover overlay shows vote_average with a green star. Movie and TVShow types don't include `imdb_id`. There's no IMDB API integration.

## Requested Changes (Diff)

### Add
- `imdb_id` field to Movie type (returned by TMDB movie details)
- Utility function `fetchIMDBRating(imdbId: string)` calling `https://api.imdbapi.dev/titles/{imdbId}` returning `{ aggregateRating: { ratingValue, voteCount } }`
- Function `fetchTVExternalIds(tvId: number)` to get IMDB ID for TV shows from TMDB `/tv/{id}/external_ids`
- IMDB rating badge (yellow star, "IMDb" label) on MovieDetailPage and TVDetailPage — shown next to existing TMDB rating
- IMDB rating on MediaCard hover overlay — shown next to the green TMDB rating

### Modify
- `types.ts`: add `imdb_id?: string` to Movie interface
- `tmdb.ts`: add `fetchTVExternalIds` function
- `MovieDetailPage.tsx`: fetch IMDB rating after movie details load (using `movie.imdb_id`); display yellow IMDb star badge in the meta row
- `TVDetailPage.tsx`: fetch TV external IDs to get IMDB ID, then fetch IMDB rating; display yellow IMDb badge
- `MediaCard.tsx`: accept optional `imdbRating` prop and display it in the hover overlay

### Remove
- Nothing removed

## Implementation Plan
1. Add `imdb_id?: string` to Movie interface in types.ts
2. Add `fetchTVExternalIds(tvId)` to tmdb.ts returning `{ imdb_id: string | null }`
3. Create `src/frontend/src/lib/imdb.ts` with `fetchIMDBRating(imdbId)` that calls `https://api.imdbapi.dev/titles/{imdbId}` and returns rating value and vote count (handle errors gracefully, return null on failure)
4. Update MovieDetailPage to fetch IMDB rating using `movie.imdb_id`, store in state, display yellow IMDb badge in meta row
5. Update TVDetailPage to call `fetchTVExternalIds`, then fetch IMDB rating, display yellow IMDb badge
6. MediaCard hover overlay: the card doesn't have IMDB data at list level (too expensive to fetch per card), so skip IMDB rating on card hover — only show it on detail pages
