# StreamFlix

## Current State
Item cards across all sections (home rows, Movies, TV Shows, Search, My List) have hover overlays with Play, Add to List, and More Info buttons. The hover transition is abrupt — no animation on the card itself.

## Requested Changes (Diff)

### Add
- CSS perspective container on card wrappers so 3D transforms render correctly
- Smooth 3D lift animation on hover: scale up (~1.15–1.2x) + rotateX (~-12 to -15deg) to tilt card toward viewer
- Transition on transform and box-shadow (duration ~0.35s, ease-out)
- Dramatic drop shadow that grows as card lifts
- Overlay buttons (Play, Add to List, More Info) fade in with opacity transition, slightly delayed after the card starts lifting

### Modify
- All item card components to use perspective wrapper and transition classes
- Overlay visibility change from instant show/hide to smooth opacity fade-in (0 → 1) timed with the card lift

### Remove
- Abrupt/instant hover state changes on cards

## Implementation Plan
1. Add `perspective` to the card container so rotateX renders in 3D space
2. On hover: apply `transform: scale(1.18) rotateX(-14deg)` with `transition: transform 0.35s ease-out, box-shadow 0.35s ease-out`
3. Overlay div transitions from `opacity: 0` to `opacity: 1` with a slight delay (e.g. `transition: opacity 0.25s ease 0.1s`) so buttons fade in just after the lift starts
4. Add a growing box-shadow for depth reinforcement
5. Apply consistently to all card components site-wide
