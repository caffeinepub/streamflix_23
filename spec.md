# StreamFlix

## Current State
Homepage has ContentRow components for standard categories (Trending Today, Popular Movies, Top Rated TV, Now Playing, Airing Today, Upcoming Movies), a ContinueWatchingRow, and GenreRow components for 12 genres × 2 (movies + TV = 24 rows). No row headers have a "View All" button. Navigation routes exist for /movies, /tv, /profile (with continue watching), but no dedicated category pages.

## Requested Changes (Diff)

### Add
- "View All →" link/button on the right side of every row header on the homepage:
  - **Standard rows**: navigate to a new dedicated category page
  - **Genre rows**: navigate to /movies or /tv with the genre pre-selected
  - **Continue Watching row**: navigate to /profile (or /continue-watching)
- 6 new dedicated category pages (full paginated browse, same grid style as MoviesPage):
  - `/category/trending` — Trending Today (all media)
  - `/category/popular-movies` — Popular Movies
  - `/category/top-rated-tv` — Top Rated TV Shows
  - `/category/now-playing` — Now Playing Movies
  - `/category/airing-today` — Airing Today TV Shows
  - `/category/upcoming` — Upcoming Movies
- Genre preselection on /movies and /tv via URL search params (e.g. `?genre=28`)

### Modify
- `ContentRow` component: accept optional `onViewAll` callback prop; render "View All →" button in the header row when prop is provided
- `ContinueWatchingRow` component: add "View All →" link to header pointing to /continue-watching (or /profile)
- `GenreRow` component: pass `onViewAll` down to ContentRow using the genre ID and media type
- `HomePage`: wire `onViewAll` for every row
- `MoviesPage` and `TVPage`: read `?genre=<id>` from URL search params on mount and pre-select that genre
- `App.tsx`: add routes for the 6 new category pages

### Remove
- Nothing removed

## Implementation Plan
1. Update `ContentRow` to accept and render an `onViewAll?: () => void` prop in the header
2. Update `ContinueWatchingRow` to show "View All →" linking to `/continue-watching`
3. Update `GenreRow` to accept `onViewAll` and pass through to `ContentRow`
4. Create `CategoryPage.tsx` — a generic paginated page that accepts a `category` param and fetches the right TMDB endpoint
5. Add 6 routes in `App.tsx` all pointing to `CategoryPage` with a category param
6. Update `MoviesPage` and `TVPage` to read `?genre` from search params on mount and pre-select it
7. Update `HomePage` to pass `onViewAll` handlers to all rows using `useNavigate`
