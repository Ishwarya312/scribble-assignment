# Reflection: Scribble Multiplayer Drawing Game

## What the Starter App Had

The starter scaffold was a bare-bones room management system with no game mechanics:

### Backend

| Capability | Initial State |
|---|---|
| Room status | `"lobby"` only — no playing, no finished |
| Endpoints | `POST /` (create), `POST /:code/join` (join), `GET /:code` (fetch) |
| Host tracking | None — no `hostParticipantId` field on Room |
| Game lifecycle | None — no start, guess, draw, score, end-round, restart |
| Player names | Optional, untrimmed — whitespace-only names accepted |
| Room codes | Case-sensitive on create, uppercased on join |
| Snapshot viewer context | `toRoomSnapshot` accepted `viewerParticipantId` but did nothing with it |
| Tests | 2 tests in roomStore (code format, null for unknown room) |

### Frontend

| Capability | Initial State |
|---|---|
| API client | 3 methods (createRoom, joinRoom, fetchRoom); base URL had typo `/bug` |
| State management | Manual fetch only — no polling, no game state fields |
| Lobby | Manual "Refresh Room" button — no automatic polling |
| Start game | "Start Game" button visible to all participants, not gated by host |
| Canvas | Static placeholder `<div>` — no drawing functionality |
| Guess form | Stub — submit handler was a no-op |
| Scoreboard | Stub — no data |
| Result panel | Stub — no data |
| Room code badge | Did not exist |
| Leave flow | Did not exist |
| Tests | 2 tests in api (mocked fetch) |

### Models

```typescript
// Initial Room — no game state at all
interface Room {
  code: string;
  status: "lobby";
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

// Initial RoomSnapshot — no roles, no scores, no drawing
interface RoomSnapshot {
  code: string;
  status: "lobby";
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
```

---

## What We Added (Across 4 Features)

### Feature 1: Lobby, Validation & Host Management (001)
- **Host tracking**: Added `hostParticipantId` to Room and RoomSnapshot; host designated on room creation; host transfers on leave
- **Player name validation**: Zod schemas reject empty/whitespace-only names; names trimmed server-side
- **Lobby polling**: Automatic 2s polling via `setInterval` in LobbyPage; GamePage also polls
- **Host-only start**: "Start Game" button gated by `participantId === room.hostParticipantId`
- **Minimum players**: Start disabled until ≥2 participants present (backend validation + frontend gate)
- **Room code badge**: Created `RoomCodeBadge` component
- **Leave flow**: `POST /:code/leave` endpoint + `leaveRoom` API method + frontend exit button
- **Invalid room handling**: 404 for missing rooms, validation errors with specific messages
- **API base URL fix**: Corrected `/bug` typo to empty path

### Feature 2: Game Initialization & Role Assignment (002)
- **Room status**: Added `"playing"` to `RoomStatus`
- **Start game**: `POST /:code/start` endpoint + `startGame` service function
- **Drawer assignment**: First participant in list is drawer (deterministic per constitution)
- **Secret word selection**: Deterministic via `codeSum % words.length` (no randomness)
- **Role-aware snapshot**: `toRoomSnapshot` now computes `role` and `secretWord` visibility per viewer
- **Game page routing**: Host clicks Start → both tabs navigate to `/game`
- **Game page rendering**: Shows drawer name, role indicator, "Your Word" card (drawer only)
- **Loading state**: "Loading game..." shown until first poll completes
- **Error states**: Bad room → redirect to `/`; missing participantId → error card; removed participant → "Return to Home"

### Feature 3: Gameplay Interaction (003)
- **Drawing canvas**: Full interactive Canvas API component (`DrawingCanvas.tsx`) with mouse + touch events
- **Stroke sync**: `POST /:code/draw` endpoint; `addStroke` service function; strokes pushed on mouseup/touchend
- **Clear canvas**: `POST /:code/clear` endpoint; `clearDrawing` service function
- **Read-only canvas**: Guessers see the drawing but cannot interact (no draw/clear controls)
- **Guess submission**: `POST /:code/guess` endpoint; `submitGuess` service function
- **Guess feedback**: Correct/incorrect indicator shown immediately after submission
- **Guess validation**: Empty guesses rejected; already-correct guesser blocked (idempotency)
- **Score tracking**: 100 points per correct guess; scores persisted in room state
- **Guess history**: `ResultPanel` shows live guess history with participant name, word, correct/incorrect
- **Scoreboard**: `Scoreboard` displays all participants' scores sorted descending; 0 for unscored
- **Point/Stroke/Guess types**: Added to both backend and frontend type definitions

### Feature 4: Results & Restart Flow (004)
- **Finished status**: Added `"finished"` to `RoomStatus`
- **End round**: `POST /:code/end-round` endpoint + `endRound` service function
- **Results view**: In-page results section when `status === "finished"` shows:
  - Correct word (now visible to all participants)
  - Final scores sorted descending
  - Full guess history
  - Final drawing (still visible via read-only canvas)
- **Restart**: `POST /:code/restart` endpoint + `restartGame` service function
- **State reset**: Restart clears scores, guessHistory, drawing, secretWord, drawerParticipantId; preserves participants
- **Lobby redirect**: GamePage detects `status === "lobby"` via polling and auto-navigates to `/lobby`
- **Host-only controls**: "End Round" button (during play), "Restart" button (in results)
- **Non-host experience**: Non-hosts see "Waiting for host..." during results; no action buttons
- **Inline error handling**: API failures show non-blocking inline messages; buttons remain clickable

### API Endpoints Added

| Route | Method | Feature | Description |
|-------|--------|---------|-------------|
| `/rooms/:code/start` | POST | 002 | Host starts the game |
| `/rooms/:code/leave` | POST | 001 | Participant leaves room |
| `/rooms/:code/guess` | POST | 003 | Guesser submits a word |
| `/rooms/:code/draw` | POST | 003 | Drawer pushes a stroke |
| `/rooms/:code/clear` | POST | 003 | Drawer clears the canvas |
| `/rooms/:code/end-round` | POST | 004 | Host ends the round |
| `/rooms/:code/restart` | POST | 004 | Host restarts from results |

### Models (final)

```typescript
// Final Room — full game state
interface Room {
  code: string;
  status: "lobby" | "playing" | "finished";
  participants: Participant[];
  hostParticipantId: string;
  drawerParticipantId?: string;
  secretWord?: string;
  drawing: Stroke[];
  guessHistory: Guess[];
  scores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

// Final RoomSnapshot — role-aware per viewer
interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing" | "finished";
  participants: Participant[];
  hostParticipantId: string;
  drawerParticipantId?: string;
  role?: "drawer" | "guesser";
  secretWord?: string;
  drawing: Stroke[];
  guessHistory: Guess[];
  scores: Record<string, number>;
  availableWords: string[];
  roles: ParticipantRole[];
}
```

### Design Artifacts Created

Each feature produced: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`, `tasks.md`, and `checklists/` — 8 docs per feature × 4 features = 32 design artifacts total.

---

## Summary

The starter was a room-only scaffold (create, join, fetch). Over 4 features we built a complete multiplayer drawing game: host management with validation, game start with deterministic role/word assignment, interactive canvas with guess/score mechanics, and a full results/restart lifecycle — all within the constraints of in-memory storage, HTTP polling, no authentication, and no new dependencies.
