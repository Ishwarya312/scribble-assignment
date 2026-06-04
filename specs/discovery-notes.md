# Discovery Notes — Scribble Multiplayer Drawing Game

## Architecture Overview

The repository is a brownfield enhancement scaffold for a multiplayer drawing-and-guessing game ("Scribble"). It consists of two Node.js/TypeScript packages:

**Backend** (`backend/`) — Express REST API with in-memory storage:
- `src/server.ts`: Entry point; configures port/host, boots Express app
- `src/app.ts`: Express app factory; mounts CORS, JSON parsing, health endpoint (`GET /health`), API router, 404 handler, error handler
- `src/api/router.ts`: API router mounts the rooms sub-router at `/rooms`; exports centralized `errorHandler` and `notFoundHandler`
- `src/api/rooms.ts`: Three endpoints — `POST /` (create room), `POST /:code/join` (join room), `GET /:code` (fetch room snapshot). Uses Zod schemas for validation; passes `participantId` as query param for viewer-contextualized snapshots
- `src/api/schemas.ts`: Zod schemas (`createRoomSchema`, `joinRoomSchema`, `roomCodeParamsSchema`, `roomViewerQuerySchema`) and `HttpError` class
- `src/services/roomStore.ts`: Core in-memory store (a `Map<string, Room>`). Functions: `createRoom`, `joinRoom`, `getRoom`, `saveRoom`, `toRoomSnapshot`. Code generation uses a 4-char alphanumeric alphabet (ambiguous chars like `O`, `0`, `I`, `1` excluded). No cleanup mechanism.
- `src/models/game.ts`: TypeScript types — `Room` (code, status, participants, timestamps), `RoomSnapshot` (adds `availableWords`, `roles`), `Participant`, `RoomSessionResponse`. `RoomStatus` is currently `"lobby"` only — no `"playing"`, `"finished"` status values.
- `src/seed/starterData.ts`: 5 seed words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and 2 roles (`drawer`, `guesser`)

**Frontend** (`frontend/`) — Vite + React 18 + React Router 6:
- `src/main.tsx`: React root mount
- `src/App.tsx`: Wraps `<AppRoutes>` in `<RoomStoreProvider>`
- `src/routes/index.tsx`: BrowserRouter with 5 routes — `/` (StartPage), `/create-room`, `/join-room`, `/lobby`, `/game`, plus catch-all redirect to `/`
- `src/state/roomStore.ts`: Custom vanilla-TS store class `RoomStore` with `useSyncExternalStore` React binding. Holds `room`, `participantId`, `error`, `isLoading`. Methods: `createRoom`, `joinRoom`, `fetchRoom` (manual refresh only — no polling). Provider pattern via React Context.
- `src/services/api.ts`: Fetch-based API client; default base URL has typo `/bug` instead of proper path; exposes `createRoom`, `joinRoom`, `fetchRoom`
- `src/pages/`: 5 page components — StartPage (marketing + two CTA buttons), CreateRoomPage (name input + submit), JoinRoomPage (name + code inputs + submit), LobbyPage (participant list + manual refresh + "Start Game" button), GamePage (3-column layout: scoreboard/activity sidebar, canvas placeholder, guess form + player info sidebar)
- `src/components/`: 7 presentational components — AppShell, Card, GuessForm (stub — no API call), PageHeader, ResultPanel (stub), RoomCodeBadge, Scoreboard (stub)
- `src/styles/app.css`: Comprehensive CSS with CSS custom properties, responsive breakpoints, game-page 3-column layout

**CI/DevOps** (`.github/`):
- CI workflow for build/test/lint
- PR template + PR lint workflow
- Artifact upload workflow
- Pre-evaluation check script, PR description verification script

**Spec Kit** (`.specify/`):
- Extensions configured: `agent-context`, `git`
- Hooks defined for `before_specify`, `before_clarify`, `before_plan`, `before_tasks`, `before_implement`, `after_specify`, `after_plan`, etc.
- Constitution exists but is a template (placeholder content only)
- `init-options.json` and `integration.json` present

---

## Incomplete Behaviors

### 1. Host tracking and host-only permissions
**Current state**: `createRoom` returns `participantId` for the creator, but the `Room` model has no `hostId` or `hostParticipantId` field. There is no mechanism to identify who created the room. The LobbyPage shows a "Start Game" button to **all** participants, not just the host. The backend has no `startGame` endpoint.
**Evidence**: `backend/src/models/game.ts:10-16` — `Room` interface has no host field; `LobbyPage.tsx:72` — "Start Game" button is not gated by host identity.

### 2. No game lifecycle beyond lobby
**Current state**: `RoomStatus` is typed as only `"lobby"` (`backend/src/models/game.ts:2`). There are no `"playing"`, `"finished"`, or `"round_end"` statuses. The backend has no endpoints for starting a game, submitting guesses, ending a round, or computing scores. The frontend `GamePage.tsx` displays all UI sections (canvas, guess form, scoreboard, result panel) as static placeholders with no integration to backend APIs.
**Evidence**: `backend/src/models/game.ts:2` — `type RoomStatus = "lobby"`; `backend/src/api/rooms.ts` — only 3 endpoints (create, join, fetch); `frontend/src/pages/GamePage.tsx:43-47` — canvas shows "Waiting for drawer..." hardcoded; `GuessForm.tsx:10-12` — submit handler is a no-op.

### 3. No lobby polling — manual refresh only
**Current state**: The LobbyPage has a "Refresh Room" button that manually calls `roomStore.fetchRoom()`. There is no automatic polling interval (the README states ~2s polling is expected). The `useEffect` in `LobbyPage.tsx:14-18` only redirects when `room` is null — it does not set up any `setInterval` for polling.
**Evidence**: `LobbyPage.tsx:20-27` — `handleRefresh` is called only on button click; `roomStore.ts:92-100` — `fetchRoom` is a one-shot manual fetch; README.md line 172 — "the lobby refreshes via polling (~2s)".

### 4. No player name validation
**Current state**: `playerName` is accepted as an optional string in both `createRoomSchema` and `joinRoomSchema` (`backend/src/api/schemas.ts:3-9`). Empty strings, whitespace-only names, or missing names are accepted. The `displayName` function defaults to `"Player"` when name is falsy (`roomStore.ts:32-34`). The schema does not trim or validate minimum length.
**Evidence**: `schemas.ts:3-5` — `z.string().optional()` with no `.min()`, `.trim()`, or `.nonempty()`; README.md line 176 — "player names are trimmed (empty/whitespace-only rejected with a message)".

---

## Assumptions

### Assumption 1: Single-round-per-room game model
The starter data and README describe a game model where one round is played, then results are shown, then the host can restart to the lobby. The current `Room` model has no concept of rounds, drawer rotation, or round numbering. The `GamePage` displays "Round 1" as hardcoded text (`GamePage.tsx:30`). The assumption is that the game proceeds as: lobby → single round (one drawer, multiple guessers) → result → back to lobby. Multiple rounds with drawer rotation are explicitly out of scope (README line 217), but the model for even a single round's state (secret word, guesses, scores, drawer) is entirely absent.

### Assumption 2: Drawer is deterministically selected from participant list
The README (line 176) says "the host (or first player) becomes the clearly-identified drawer" and words are "deterministically selected from the starter list". The current code has no drawer assignment logic, no word selection logic, and no mechanism to expose the secret word only to the drawer. The assumption is that the backend will assign the drawer based on a deterministic rule (e.g., first participant in the list) and select a word deterministically (e.g., based on round index modulo word list length).

---

## Relevant Files

### Backend
| File | Purpose |
|---|---|
| `backend/src/services/roomStore.ts` | Core room CRUD; needs host tracking, drawer assignment, word selection, guess recording, scoring |
| `backend/src/models/game.ts` | All type definitions; needs `hostId`, `status: "playing"\|"finished"`, `round`, `secretWord`, `drawerId`, `guesses`, `scores` |
| `backend/src/api/rooms.ts` | Route handlers; needs `POST /:code/start`, `POST /:code/guess`, `POST /:code/clear`, `GET /:code/result` |
| `backend/src/api/schemas.ts` | Zod validation schemas; needs stricter playerName validation, guess schema, start-game schema |
| `backend/src/api/router.ts` | Centralized error/not-found handlers; adequate as-is |
| `backend/src/seed/starterData.ts` | Seed words and roles; adequate as-is |
| `backend/src/app.ts` | Express app factory; adequate as-is |

### Frontend
| File | Purpose |
|---|---|
| `frontend/src/services/api.ts` | API client; fix base URL typo `/bug`; add `startGame`, `submitGuess`, `clearCanvas`, `fetchResult` methods |
| `frontend/src/state/roomStore.ts` | State management; needs automated lobby polling, game state fields (secretWord visibility, guesses, scores) |
| `frontend/src/pages/LobbyPage.tsx` | Lobby UI; needs polling interval, host-only start button, player count check (min 2) |
| `frontend/src/pages/GamePage.tsx` | Game UI; needs drawer identification, secret word display (drawer only), live scoreboard, guess history, result state |
| `frontend/src/components/GuessForm.tsx` | Guess input; needs to call API, display guess history |
| `frontend/src/components/Scoreboard.tsx` | Score display; needs real participant scores |
| `frontend/src/components/ResultPanel.tsx` | Activity log; needs synced guess history |
| `frontend/src/styles/app.css` | Styling; adequate as-is |

### Spec Kit
| File | Purpose |
|---|---|
| `.specify/memory/constitution.md` | Project constitution; currently a template — needs to be filled with actual principles |
| `AGENTS.md` | Agent instructions for AI tooling |

---

## Missing Tests

| Area | Current Coverage | What's Missing |
|---|---|---|
| Room creation | `roomStore.test.ts` — 1 test (code format) | Room code uniqueness, multiple rooms isolation, empty name defaulting |
| Room join | `roomStore.test.ts` — 1 test (null for unknown) | Duplicate player names, full-room edge case, join after room full |
| API schemas | `schemas.test.ts` — 2 tests | Missing/invalid code params, empty/whitespace names, special chars in names |
| API service | `api.test.ts` — 2 tests | Mocked fetch calls only; no error-response handling, network failure |
| Frontend pages | None | LobbyPage redirect, CreateRoomPage error display, JoinRoomPage validation, GamePage guard |
| Game logic | None | Drawer assignment, word selection, guess comparison (case-insensitive), scoring (100 points), round restart state reset |
| Store | None | RoomStore state transitions, polling lifecycle, error state recovery |
| Multi-room isolation | None | Two rooms with same-structured data must not interfere |

---

## Edge Cases

1. **Empty/whitespace player names**: Currently default to "Player"; should be rejected with a message (per README line 176)
2. **Room code collisions**: `generateUniqueCode` loops until unique; 4-char alphabet with 29 chars = ~707k combinations; low collision risk but could loop indefinitely in pathological case
3. **Single-player room start**: No minimum-player check exists; per scenario 1, host should only start with ≥2 players
4. **Non-existent room join**: Returns 404 with "Unable to join room" — generic message, could be more descriptive
5. **Room code case normalization**: Join route calls `.toUpperCase()` on params (rooms.ts:32) but get route also does (rooms.ts:51); consistent but the frontend also uppercases in JoinRoomPage.tsx:18 — double normalization is harmless
6. **Guess case sensitivity**: Per scenario 3, guesses must be trimmed and compared case-insensitively; not implemented yet
7. **Empty guess submission**: Must be rejected with a message per scenario 3
8. **Re-joining a room already in**: No mechanism to prevent a participant from being added twice (the same browser/tab can call join repeatedly)
9. **Viewer participant ID mismatch**: `GET /:code` accepts any `participantId` query param without verifying it belongs to the room
10. **Drawer guessing their own word**: Not addressed; should the drawer see the guess form at all?
11. **Concurrent access to room store**: All operations are synchronous on a single `Map` — safe under Node's single-threaded model, but no locking for async if introduced
12. **Canvas drawing/clearing**: No canvas implementation exists; the placeholder div will need to be replaced with an interactive drawing element with clear functionality

---

## Risks

1. **No database — data loss on restart**: All room state is in-memory. Server restart destroys all active games. This is by design (per forbidden list) but means room state is ephemeral and participants must handle connection loss gracefully.

2. **HTTP polling latency**: The README specifies ~2s polling for lobby and guess history sync. Without WebSockets (forbidden), there will be inherent latency between a guess submission and its visibility to other players. The ~2s interval means worst-case ~4s delay (poll interval + server processing). This could cause UX issues where correct guesses are not visible to the drawer in time to react.

3. **No drawer-to-guesser state differentiation**: The `toRoomSnapshot` function accepts a `viewerParticipantId` parameter but does nothing with it (`roomStore.ts:99-108`). The snapshot returns the same data to all viewers. Implementing drawer-only word visibility (per scenario 2) will require actual snapshot differentiation, which is a risk if the snapshot schema is expanded without considering viewer context.

4. **Canvas implementation complexity**: The current canvas is a styled `div` placeholder. Implementing an actual drawing canvas (mouse/touch events, brush controls, clear, syncing the drawing state) is the most technically complex frontend task. The drawing data format (pixel array, SVG commands, or stroke data) and how it is transmitted/made visible are unspecified.

5. **Constitution is a template**: The `.specify/memory/constitution.md` contains only placeholder content. All engineering principles, AI usage rules, and review discipline expectations need to be defined before meaningful spec/plan/task work begins.

6. **API base URL typo**: `frontend/src/services/api.ts:22` has `VITE_API_URL ?? "http://localhost:3001/bug"` — the path `/bug` would cause all API requests to fail silently against a correctly-configured backend unless `VITE_API_URL` is overridden.

7. **No cleanup of inactive rooms**: Rooms are stored in a `Map` indefinitely. There is no TTL or mechanism to remove rooms where all participants have left. Over time, this leaks memory.
