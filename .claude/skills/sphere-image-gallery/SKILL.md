---
name: sphere-image-gallery
description: Build a draggable, auto-rotating 3D sphere of images in pure CSS/React (no WebGL/three.js) with hover-scale and click-to-detail. Use whenever asked for a "spatial", "3D", or "sphere" view of a collection of images (photos, posters, avatars, thumbnails) that should feel more engaging than a flat grid.
---

# Sphere image gallery (CSS 3D, no WebGL)

A reusable pattern for arranging N images on the surface of a virtual sphere,
draggable to rotate (with inertia), auto-rotating when idle, with a hover-scale
effect and a click callback — implemented with plain CSS 3D transforms and
`requestAnimationFrame`, no three.js/WebGL required. First built for a movie
poster "spatial view" in a catalog app; the component itself is fully generic.

Ready-to-copy files:
- `template/SphereImageGrid.tsx` — the sphere itself. Read it before
  adapting; it is the actual, battle-tested implementation, not pseudocode.
- `template/QuickView.tsx` — the generic click-to-detail modal companion
  described in "Integration recipe" below.

## When to use this

The user asks for something like: "put the images in a sphere/spatial view I
can rotate", "a 3D gallery for posters/photos/avatars", "make the grid more
engaging with a rotating sphere", or references a similar component from an
external source (21st.dev-style demos of `SphereImageGrid`/"img-sphere" often
show up as a *usage* snippet with no implementation — you are expected to
build the actual component; do not assume it exists in `node_modules`).

## The core technique

1. **Distribute points on a sphere** — use a Fibonacci sphere (golden-angle
   spiral), not a lat/long grid: it spaces points evenly and avoids the
   crowding at the poles a regular grid produces.
2. **Rotate manually in JS, not via CSS `transform: rotateX/rotateY` on a
   parent** — because each image also needs independent depth-based scale/
   opacity/z-index, you rotate each point's `(x,y,z)` yourself (rotate around
   X, then around Y) every frame, then position each image with
   `translate3d(x, y, z)` on an absolutely-positioned element inside a
   `perspective`-parented container.
3. **Painter's algorithm** — sort images back-to-front by rotated `z` before
   rendering, and derive `zIndex`, `scale`, and `opacity` from depth so the
   sphere actually reads as a sphere (far side smaller/dimmer, near side
   bigger/brighter) instead of a flat cloud of icons.
4. **Interaction**: pointer drag accumulates rotation velocity; on release,
   velocity decays each frame (`momentumDecay`, e.g. 0.94) for inertia; when
   not dragging and no momentum left, auto-rotate by a small constant angle
   per frame if enabled.

## The one gotcha that will bite you: `setPointerCapture`

Do **not** call `element.setPointerCapture(pointerId)` on the sphere's
outer container in `onPointerDown`, even though every drag-to-rotate tutorial
does it "for robustness". It silently breaks the browser's native `click`
delivery to the poster/image element under the cursor for a realistic
mousedown→mouseup sequence (verified: a raw `element.click()` still fires,
but a real click or a Playwright `.click()` does not reach the child's
`onClick`). This is a genuine interaction bug, not a testing artifact — real
users would be affected too.

**Fix**: skip pointer capture entirely (dragging still works fine tracking
`pointermove`/`pointerup` on the same container without it). Instead,
distinguish a tap from a drag by accumulated pointer distance since
`pointerdown`: if it exceeds a small threshold (~6px) before `pointerup`, set
a `suppressClick` flag so the subsequent `click` on the image is ignored;
otherwise let it fire normally and call the selection callback. See
`handlePointerDown`/`handlePointerMove` and the `onClick` guard in the
template for the exact implementation.

## Integration recipe (view-mode + detail card)

This was wired in as a third view mode ("Spaziale") alongside existing
grid/list toggles on a search-results page:

- Reuse the *same* filtered/paginated data already shown in grid/list — don't
  invent a separate dataset. If the normal page size is small, consider a
  larger page size just for the sphere view (it needs more points to look
  full than a grid does), fetched with the same query.
- Filter out items without an image URL before building the sphere's data —
  don't render a broken/placeholder image as a sphere point.
- On click, don't try to cram full detail into the sphere item's lightweight
  data — call back with just the id, then fetch full details lazily in a
  separate "quick view" modal/card component (poster, title, key facts,
  description, a "full detail" link/route, an external link if applicable).
  Keep the quick-view dismissible (backdrop click + close button).
  `template/QuickView.tsx` is a generic, ready-to-adapt shell for exactly
  this: pass it `fetchDetails` (your API call) and `renderContent` (your
  fields) and it handles the loading/error states and dismiss behavior.
- Respect a reduced-motion / animations-enabled app setting if one exists:
  wire it straight to the `autoRotate` prop.

## Testing with Playwright

The sphere re-renders every animation frame (even when "static", the RAF
loop still runs), so Playwright's default actionability wait ("element is
stable") can time out against a continuously moving/reordering target.
Two ways to test reliably:
- Disable auto-rotate for the test (toggle whatever app setting maps to
  `autoRotate=false`) before interacting — the sphere then only moves on an
  explicit drag, making clicks and screenshots deterministic.
- Or just use `.click({ force: true })` / `page.evaluate(el => el.click())`
  when you only need to confirm the click handler itself is wired correctly.

Always verify with a *realistic* click at least once (not just a forced/JS
click) — that's precisely the class of bug the `setPointerCapture` gotcha
above causes, and a forced click will hide it.

## Config knobs (all optional, with sane defaults in the template)

`containerSize`, `sphereRadius`, `dragSensitivity`, `momentumDecay`,
`maxRotationSpeed`, `baseImageScale` (image size relative to sphere radius),
`hoverScale`, `perspective`, `autoRotate`, `autoRotateSpeed`. Tune
`sphereRadius`/`baseImageScale` together first — they determine how much
images overlap; increasing `sphereRadius` without shrinking `baseImageScale`
spaces images out more.
