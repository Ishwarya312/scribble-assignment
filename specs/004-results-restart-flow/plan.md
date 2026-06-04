# Implementation Plan: Results and Restart Flow

**Branch**: `004-results-restart-flow` | **Date**: 2026-06-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-results-restart-flow/spec.md`

## Summary

Add a "finished" room status so the host can end a round, showing all participants the correct word, final scores, guess history, and drawing. Then allow the host to restart the game, clearing round state and returning everyone to the lobby with participants preserved. Non-host participants see both transitions via existing 2s polling. Results view is rendered in-page within GamePage (no new route).

## Technical Context

**Language/Version**: TypeScript 5.6

**Primary Dependencies**: Express (backend), React 18 + Vite (frontend), Zod (validation)

**Storage**: In-memory `Map<string, Room>` — no database

**Testing**: vitest in both packages

**Target Platform**: Node.js (backend), modern browsers via Vite (frontend)

**Project Type**: Web application (Express API + React SPA)

**Performance Goals**: Existing 2s polling, no new latency-sensitive paths

**Constraints**: No WebSockets, no database, no authentication, no new state libs

**Scale/Scope**: Single-round game; one room with 2-8 participants

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-First Development | ✅ | Spec created in prior session, clarified in previous step |
| II. Deterministic Game Logic | ✅ | No new game mechanics; end/restart are straightforward state transitions |
| III. Test-Before-Implement | ✅ | Tests will be written before implementation per workflow |
| IV. Brownfield Respect | ✅ | Extending existing types/routes/store; no rewrites or new deps |
| V. Incremental Delivery | ✅ | Can commit in slices: types → services → routes → store → UI |
| Technical Constraints | ✅ | No WebSockets, DB, auth, or new state libs used |

No violations. All principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/004-results-restart-flow/
├── plan.md              # This file
├── research.md          # Phase 0 — unknowns resolved
├── data-model.md        # Phase 1 — state transitions & contracts
├── quickstart.md        # Phase 1 — validation scenarios
├── contracts/           # Phase 1 — API contracts
│   ├── end-round.md
│   └── restart.md
└── tasks.md             # Phase 2 — created by /speckit.tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          # ADD "finished" to RoomStatus
│   ├── services/
│   │   └── roomStore.ts     # ADD endRound, restartGame, update toRoomSnapshot
│   ├── api/
│   │   ├── rooms.ts         # ADD POST /:code/end-round, POST /:code/restart
│   │   └── schemas.ts       # ADD endRoundSchema, restartSchema
│   └── seed/
│       └── starterData.ts   # (no changes needed)

frontend/
├── src/
│   ├── services/
│   │   └── api.ts           # ADD endRound, restartGame methods
│   ├── state/
│   │   └── roomStore.ts     # ADD endRound, restartGame actions + status handling
│   └── pages/
│       └── GamePage.tsx      # ADD End Round button, results section, Restart button
```

**Structure Decision**: Web application (Option 2) — using existing backend/ + frontend/ layout. No structural changes.

## Complexity Tracking

> No constitution violations to justify. Table omitted.
