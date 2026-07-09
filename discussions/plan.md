# Drawpad — Plan

## Concept

React Native app for sketching, note-taking, and drawing. The app hosts a
local URL that any device on the same wifi can open in a browser to view the
sketches live as they're drawn. Sketches can be saved.

## Stack

- **Expo + dev client** (not Expo Go — the embedded local server needs a
  native TCP module unavailable in Expo Go). Dev client keeps Expo's DX
  (fast iterate, config plugins, OTA) while still allowing native modules.
- **react-native-skia** for the drawing canvas — GPU-accelerated, exposes
  raw stroke point data cleanly, has an Expo config plugin.
- **react-native-tcp-socket + `ws`** for the embedded local HTTP+WebSocket
  server on the phone. tcp-socket provides a `net`-like layer; `ws` runs on
  top of it and handles the WebSocket handshake, so there's no need to
  hand-roll HTTP/WS protocol parsing. Avoids the heavier footprint of
  embedding a full Node runtime (e.g. nodejs-mobile-react-native).

## Architecture

- Phone draws via Skia; stroke points are captured and streamed as **vector
  events** over WebSocket (not raster snapshots) — smoother, lower
  bandwidth, true real-time, fits the "seamless" requirement.
- Phone serves a single static HTML/JS viewer page over HTTP (same bundle
  returned regardless of path — no routing needed since it's one page).
- Browser viewer renders incoming stroke events live on an HTML canvas.
- **View-only for v1** — the browser viewer does not draw back onto the
  canvas. Bidirectional editing would need stroke ownership/conflict
  handling; that's a v2 concern, not MVP.
- Local URL is shown on-screen as IP:port plus a QR code, so other devices
  don't need to type the IP manually.
- A lightweight token is appended to the URL (e.g. `?t=xxxx`) so random
  devices on the same wifi can't guess the URL and join uninvited. Cheap to
  add, worth the deterrent.
- The server only runs while the session is active; it stops when the app
  is backgrounded.

## Persistence

- Save the sketch as a PNG to the device gallery (Skia snapshot →
  expo-media-library).
- Also persist the stroke data as JSON locally (AsyncStorage/SQLite) so
  sketches can be reopened and continued later, not just viewed as a flat
  image.

## Notes / text

- Text is just another tool on the same Skia canvas (alongside pen/brush),
  not a separate feature or screen. In scope for v1.

## Decisions log (from grilling session)

1. Expo + dev client over bare RN — native module requirement makes bare
   RN's extra maintenance cost pointless; dev client gets the same native
   access.
2. Vector stroke streaming over raster snapshots — matches "seamless" more
   directly, cheaper on local wifi bandwidth.
3. react-native-skia over react-native-svg — perf headroom for longer/complex
   sketches, point data is naturally accessible for streaming.
4. react-native-tcp-socket + ws over nodejs-mobile or hand-rolled HTTP/WS —
   fastest to build without embedding a full Node runtime or writing WS
   handshake logic by hand.
5. View-only viewer for v1 — bidirectional drawing deferred to avoid
   conflict-resolution scope creep before an MVP exists.
