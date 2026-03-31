# StreamFlix

## Current State
HeroBanner displays a backdrop image with gradient overlay, title, description, rating, and Play/More Info buttons. It auto-rotates through up to 5 trending items every 8 seconds. No video playback in the banner.

## Requested Changes (Diff)

### Add
- Fetch TMDB video data for each hero banner item using `/movie/{id}/videos` or `/tv/{id}/videos` to get the YouTube trailer key
- YouTube iframe embed that autoplays muted in the background (no controls, no branding) when a trailer is available
- Mute/unmute toggle button (bottom-right of banner) so users can optionally enable audio
- Auto-hide YouTube controls: `controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1`

### Modify
- HeroBanner: when trailer is available, replace the static backdrop `<img>` with a YouTube iframe as background; retain all gradients, overlay text, and buttons on top
- When auto-rotation advances to a new item, swap the iframe src to the new trailer (or fall back to image if no trailer)
- Keep fallback behavior: if no trailer key is found for a title, show the backdrop image as before

### Remove
- Nothing removed

## Implementation Plan
1. In `HeroBanner.tsx`, add a `useEffect` that fetches `/movie/{id}/videos` or `/tv/{id}/videos` from TMDB for the current item whenever `current` changes
2. Parse the response to find the first YouTube video with `type === 'Trailer'` or `type === 'Teaser'`; store the `key` in state (`trailerKey`)
3. If `trailerKey` is set, render a YouTube iframe as absolute-positioned background: `https://www.youtube.com/embed/{key}?autoplay=1&mute=1&controls=0&loop=1&playlist={key}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1`
4. Add a mute/unmute button overlay (bottom-left, near the dots) that toggles `mute=1` vs `mute=0` by changing the iframe src or using YouTube Player API
5. If no `trailerKey`, fall back to rendering the backdrop `<img>` as before
6. Keep all existing overlay content (title, meta, overview, buttons, dots) unchanged
