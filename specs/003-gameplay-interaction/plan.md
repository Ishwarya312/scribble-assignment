# Implementation Plan: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

## Summary

Build drawing, guessing, scoring, and state-sync mechanics for the "playing" phase. Add `POST /:code/draw`, `POST /:code/guess`, and `POST /:code/clear` backend endpoints with corresponding `Stroke`, `Guess`, and `scores` data model changes. Replace the canvas placeholder with an interactive `<canvas>` component wired to the draw endpoint. Wire `GuessForm` to the guess endpoint with correct/incorrect feedback. Wire `Scoreboard` and `ResultPanel` to live snapshot data. All state sync uses the existing polling pattern (~2s, no WebSockets).

## Technical Context

**Language/Version**: TypeScript 5.6 (backend + frontend)

**Primary Dependencies**: Express 4, Zod 3 (backend); React 18, React Router 6, Vite 5 (frontend); vitest (testing both)

**Storage**: In-memory (Node `Map<string, Room>`) — drawing, guessHistory, scores added to Room

**Testing**: vitest with jsdom (frontend) — run via `npm test` in each package

**Target Platform**: Modern web browsers (ES2022+)

**Project Type**: Web application (Express REST API + React SPA)

**Performance Goals**: Stroke draw <200ms p99; guess submission <200ms p99; canvas rendering at 60fps on the drawer's device; game state visible to all participants within ~4s of any state change

**Constraints**: No WebSockets (HTTP polling only); no databases (in-memory only); no authentication; no new state management libraries (React Context + useSyncExternalStore only); no third-party canvas libraries (vanilla Canvas API)

**Scale/Scope**: 2–10 concurrent participants per room; single round per game; no drawer rotation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Rationale |
|------|--------|-----------|
| No WebSockets | ✅ PASS | All sync uses HTTP polling — no real-time protocol |
| No Databases | ✅ PASS | Room data held in-memory in a Map |
| No Authentication | ✅ PASS | No user accounts, sessions, or tokens |
| No New State Libs | ✅ PASS | Uses existing React Context + useSyncExternalStore pattern |
| No New Dependencies | ✅ PASS | Vanilla Canvas API — no drawing library added |
| Brownfield Respect | ✅ PASS | Extends existing files; no rewrites or restructures |
| Spec-First | ✅ PASS | Spec exists, research/data-model/contracts generated |
| Deterministic Logic | ✅ PASS | Scoring fixed at 100pts; guess comparison case-insensitive; drawing order preserved |
| Incremental Delivery | ✅ PASS | One logical slice per commit; build always passes |

**No violations — no Complexity Tracking needed.**

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── submit-guess.md
│   ├── add-stroke.md
│   └── clear-canvas.md
└── tasks.md             # (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── models/game.ts          # ADD: Stroke, Point, Guess types + drawing/guessHistory/scores on Room + RoomSnapshot
    ├── services/roomStore.ts   # ADD: submitGuess, addStroke, clearDrawing, update toRoomSnapshot
    ├── api/
    │   ├── rooms.ts            # ADD: POST /:code/guess, /:code/draw, /:code/clear routes
    │   └── schemas.ts          # ADD: guessSchema, drawSchema, clearSchema
    └── seed/starterData.ts     # No changes needed

frontend/
└── src/
    ├── components/
    │   ├── DrawingCanvas.tsx   # NEW: interactive <canvas> component for the drawer
    │   ├── GuessForm.tsx       # WIRE: to backend guess endpoint with feedback
    │   ├── Scoreboard.tsx      # WIRE: to live snapshot scores data
    │   └── ResultPanel.tsx     # WIRE: to live snapshot guessHistory data
    ├── pages/
    │   └── GamePage.tsx        # UPDATE: role-aware canvas, wire children components
    ├── services/api.ts         # ADD: submitGuess, addStroke, clearCanvas methods
    └── state/roomStore.ts      # ADD: submitGuess action; drawing/guessHistory/scores flow through snapshot
```

**Structure Decision**: Web application (Option 2) — backend Express API + frontend React SPA. Adds three new backend routes, one new frontend component, and wires three existing stubs.

## Complexity Tracking

> Not needed — no Constitution violations.
