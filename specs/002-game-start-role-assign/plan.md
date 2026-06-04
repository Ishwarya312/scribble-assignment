# Implementation Plan: Game Initialization and Role Assignment

**Branch**: `002-game-start-role-assign` | **Date**: 2026-06-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-game-start-role-assign/spec.md`

## Summary

Build the GamePage frontend with role-aware rendering, polling, and graceful invalid-state handling. The backend (startGame endpoint, drawer assignment, word selection, viewer-contextualized snapshots) was already implemented during the lobby feature (FR-001 through FR-010). New work is purely frontend: implement GamePage with "Loading game..." initial state, secret word display for the drawer, role indicator for all participants, drawer identity for guessers, automatic ~2s polling with error resilience, and distinct error states for invalid room code (redirect "/"), missing participantId (error card with rejoin), and participant-removed (leave message + "Return to Home" button).

## Technical Context

**Language/Version**: TypeScript 5.6 (backend + frontend)

**Primary Dependencies**: Express 4, Zod 3 (backend); React 18, React Router 6, Vite 5 (frontend); vitest (testing both)

**Storage**: In-memory (Node `Map<string, Room>`) — no changes needed

**Testing**: vitest with jsdom (frontend) — run via `npm test` in each package

**Target Platform**: Modern web browsers (ES2022+)

**Project Type**: Web application (Express REST API + React SPA)

**Performance Goals**: API responses <200ms p95; poll interval of ~2s; game state visible to all participants within ~4s of game start

**Constraints**: No WebSockets (HTTP polling only); no databases (in-memory only); no authentication; no new state management libraries (React Context + useSyncExternalStore only)

**Scale/Scope**: 2–10 concurrent participants per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Rationale |
|------|--------|-----------|
| No WebSockets | ✅ PASS | All sync uses HTTP polling — no real-time protocol |
| No Databases | ✅ PASS | Room data held in-memory in a Map |
| No Authentication | ✅ PASS | No user accounts, sessions, or tokens |
| No New State Libs | ✅ PASS | Uses existing React Context + useSyncExternalStore pattern |
| Brownfield Respect | ✅ PASS | Extends existing files; no rewrites or restructures |
| Spec-First | ✅ PASS | Spec exists, clarified, and plan references it |
| Deterministic Logic | ✅ PASS | Drawer assigned deterministically (first participant = host); word selected by char code sum modulo word list |
| Incremental Delivery | ✅ PASS | One logical slice per commit; build always passes |

**No violations — no Complexity Tracking needed.**

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-role-assign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── fetch-room.md    # Viewer-contextualized GET /rooms/:code
└── tasks.md             # (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── models/game.ts          # Room, Participant, RoomSnapshot types — already updated
    ├── services/roomStore.ts   # startGame, toRoomSnapshot — already implemented
    ├── api/
    │   ├── router.ts           # Error handlers — no changes needed
    │   ├── rooms.ts            # Start and fetch routes — already implemented
    │   └── schemas.ts          # Zod schemas — no changes needed
    └── seed/starterData.ts     # Seed words and roles — no changes needed

frontend/
└── src/
    ├── pages/
    │   ├── GamePage.tsx        # **COMPLETED**: role-aware rendering + polling + loading state
    │   │                      # **REMAINING**: FR-013 error states (missing participantId card, participant-removed message)
    │   ├── LobbyPage.tsx       # No changes needed
    │   ├── CreateRoomPage.tsx  # No changes needed
    │   └── JoinRoomPage.tsx    # No changes needed
    ├── state/roomStore.ts      # No changes needed — snapshot fields already flow through
    └── services/api.ts         # No changes needed — fetchRoom with participantId already works
```

**Structure Decision**: Web application (Option 2) — backend Express API + frontend React SPA. Backend is already complete; this feature is entirely frontend.

## Complexity Tracking

> Not needed — no Constitution violations.
