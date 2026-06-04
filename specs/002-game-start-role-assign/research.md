# Research: Game Initialization and Role Assignment

## Findings

### Backend Status (Already Implemented in Lobby Feature)

| Decision | Rationale |
|----------|-----------|
| Backend is complete — no changes needed | `startGame`, `toRoomSnapshot` contextualization, `POST /:code/start`, and `GET /:code?participantId=` all implemented during Phase 6 (lobby) |
| Drawer assignment: first participant (host) | Deterministic rule per FR-001 — implemented as `room.participants[0].id` |
| Word selection: char code sum of room code modulo word list length | Deterministic formula per FR-002 — implemented in `startGame` |
| Snapshot contextualization: role derived per viewer, secretWord visible only to drawer | FR-007 through FR-010 — implemented in `toRoomSnapshot` |

### Frontend Status

| File | Current State | Required Work |
|------|---------------|---------------|
| `GamePage.tsx` | Placeholder — no role awareness, no polling, static layout | Full rework: loading state, role-aware rendering, polling |
| `roomStore.ts` | Already has `fetchRoom` with participantId, `setRoomSnapshot` populates all snapshot fields | No changes needed |
| `api.ts` | Already has `fetchRoom(code, participantId)` returning contextualized snapshots | No changes needed |
| `GuessForm.tsx` | Stub — no API call, visible to all | Hide for drawer (spec 003 will wire the API) |
| `Scoreboard.tsx` | Stub — static display | No changes needed (spec 003 wires scores) |
| `ResultPanel.tsx` | Stub — static display | No changes needed (spec 003 wires guess history) |

### Polling Pattern

LobbyPage uses the following pattern (to replicate for GamePage):
- `useEffect` with `room` dependency
- `setInterval(fetchRoom, 2000)` after initial poll
- Error resilience: non-blocking error state, polling continues on next interval
- Cleanup: `clearInterval` on unmount via effect return

### Loading State

- Before first poll completes: show "Loading game..." generic indicator
- After first poll returns room with status "playing": reveal role-specific content
- No intermediate state for "lobby" status — GamePage only renders when status is "playing"

### Risk Assessment

| Risk | Mitigation |
|------|------------|
| User navigates to /game before game starts (status is "lobby") | Poll until status changes to "playing", or redirect back to lobby. Already handled by LobbyPage redirect on status change. |
| Network error during first poll | Show "Loading game..." with error indicator, retry on next interval |
| Store state lost on refresh | On page load with no room state, redirect to "/". Store is memory-only. |

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Backend push notification for game start | Violates "No WebSockets" constraint |
| Dedicated game state endpoint | Existing `GET /rooms/:code?participantId=` already returns contextualized snapshots |
| Separate store for game state | Unnecessary — existing `RoomSnapshot` contains all game fields |
