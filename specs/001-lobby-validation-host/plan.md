# Implementation Plan: Lobby, Validation & Host Management

**Branch**: `001-lobby-validation-host` | **Date**: 2026-06-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-lobby-validation-host/spec.md`

## Summary

Add host tracking to rooms, validate player names (trim, reject empty/whitespace-only), validate room codes with specific error messages, add automatic lobby polling (~2s), and add a host-only start-game endpoint with a 2-player minimum. The lobby page shows the room code badge immediately and populates the rest on first fetch.

## Technical Context

**Language/Version**: TypeScript 5.6 (backend + frontend)

**Primary Dependencies**: Express 4, Zod 3 (backend); React 18, React Router 6, Vite 5 (frontend); vitest (testing both)

**Storage**: In-memory (Node `Map<string, Room>`)

**Testing**: vitest with jsdom (frontend) — run via `npm test` in each package

**Target Platform**: Modern web browsers (ES2022+)

**Project Type**: Web application (Express REST API + React SPA)

**Performance Goals**: API responses <200ms p95; poll interval of ~2s; participant list visible within ~4s of a join

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
| Deterministic Logic | ✅ PASS | Host assignment is deterministic (first participant = host) |
| Incremental Delivery | ✅ PASS | One logical slice per commit; build always passes |

**No violations — no Complexity Tracking needed.**

## Project Structure

### Documentation (this feature)

```text
specs/001-lobby-validation-host/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── create-room.md
│   ├── join-room.md
│   ├── fetch-room.md
│   └── start-game.md
└── tasks.md             # (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── models/game.ts          # Room, Participant, RoomSnapshot types
    ├── services/roomStore.ts   # CRUD + startGame
    ├── api/
    │   ├── router.ts           # Route mounting + error handlers
    │   ├── rooms.ts            # Route handlers
    │   └── schemas.ts          # Zod validation schemas
    └── seed/starterData.ts     # Seed words and roles

frontend/
└── src/
    ├── pages/
    │   ├── LobbyPage.tsx       # Host controls, polling, participant list
    │   ├── CreateRoomPage.tsx  # Name input + validation
    │   └── JoinRoomPage.tsx    # Name + code input + validation
    ├── state/roomStore.ts      # Store with host + polling state
    └── services/api.ts         # API client
```

**Structure Decision**: Web application (Option 2) — backend Express API + frontend React SPA.

## Complexity Tracking

> Not needed — no Constitution violations.

