# Research: Results and Restart Flow

## Unknowns Resolved

| Unknown | Decision | Rationale |
|---------|----------|-----------|
| Results view placement | In-page conditional in GamePage | Keeps existing polling loop intact; no new route needed (per clarification) |
| Drawing persistence in results | Drawing stays visible | Provides visual context for guess history (per clarification) |
| Error handling for end/restart | Inline non-blocking error near button | Matches existing polling error pattern; no auto-retry (per clarification) |

## Technology Confirmation

All technology choices follow the existing codebase:

- **Backend**: Node.js + Express + TypeScript + Zod — no new dependencies
- **Frontend**: React 18 + Vite + TypeScript — no new dependencies (no Zustand/Redux)
- **Storage**: In-memory `Map<string, Room>` — no database
- **Sync**: HTTP polling at 2s intervals — no WebSockets
- **Testing**: vitest (both packages) — existing pattern

## State Management Pattern

The `RoomStore` class (Context + `useSyncExternalStore`) already handles:
- `createRoom`, `joinRoom`, `fetchRoom`, `startGame`, `submitGuess`

New actions needed:
- `endRound` — call POST `/rooms/:code/end-round`, update snapshot status to "finished"
- `restartGame` — call POST `/rooms/:code/restart`, update snapshot status to "lobby", clear local state

## Key Observations

- Room already has `scores`, `guessHistory`, `secretWord`, `drawing`, `drawerParticipantId` fields — no new model types needed.
- `RoomStatus` needs `"finished"` added to the union.
- `toRoomSnapshot` currently hides `secretWord` from non-drawers when `status === "playing"`. When `status === "finished"`, all participants should see it.
- Frontend `GamePage` already polls every 2s — just needs status-based conditional rendering for the results section.
- `LobbyPage` needs no changes — it already handles "lobby" status and participant list.
