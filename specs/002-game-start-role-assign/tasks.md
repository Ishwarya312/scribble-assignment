# Tasks: Game Initialization and Role Assignment

**Input**: Design documents from `specs/002-game-start-role-assign/`

**Prerequisites**: plan.md, research.md, data-model.md, contracts/

**Tests**: Not requested in feature specification — test tasks omitted.

**Organization**: Tasks are grouped by user story. Completed tasks are marked with `[x]`.

---

## Phase 1: Setup — No changes needed

Backend (FR-001 through FR-010) fully implemented during lobby feature. No setup or foundational steps required.

---

## Phase 2: Foundational — No changes needed

All backend logic (`startGame`, `toRoomSnapshot`, routes) already complete. The store (`roomStore.ts`) and API service (`api.ts`) already propagate all needed snapshot fields (`drawerParticipantId`, `role`, `secretWord`).

---

## Phase 3: User Story 1 — Host Starts the Game (Priority: P1) ✅ COMPLETE

**Goal**: Host clicks "Start Game", drawer assigned, word selected, both tabs redirect to game page.

**Independent Test**: Open two tabs in same room. Host starts game. Both redirect to `/game`. Host sees secret word. Guesser does not.

- [x] T001 [US1] Add "Loading game..." initial state to `frontend/src/pages/GamePage.tsx`
- [x] T002 [US1] Add game-page polling to `frontend/src/pages/GamePage.tsx`

---

## Phase 4: User Story 2 — Role Visibility (Priority: P2) ✅ COMPLETE

**Goal**: All participants see their role ("drawer"/"guesser") and drawer identity. Drawer sees secret word; guessers do not.

**Independent Test**: Game with 3 participants. Drawer's page shows role "drawer" + secret word. Guessers' pages show role "guesser" + drawer name, no secret word.

- [x] T003 [US2] Add role-aware rendering to `frontend/src/pages/GamePage.tsx`
- [x] T004 [US2] Hide GuessForm for drawer in `frontend/src/pages/GamePage.tsx`

---

## Phase 5: User Story 3 — Game Page Polling (Priority: P2) ✅ COMPLETE

**Goal**: Game page polls `GET /rooms/:code?participantId=` every ~2s, stops on unmount, handles errors gracefully.

**Independent Test**: Open two tabs, start game from Tab A. Tab B's poll catches status change within ~4s. Navigate away — polling stops.

- [x] T005 [US3] Verify polling lifecycle and run tests

---

## Phase 6: Edge Case Error Handling — FR-013 (Remaining Work)

**Goal**: Handle three invalid-state scenarios on the game page with distinct user-visible treatment.

**Independent Test**:
1. Navigate to `/game/INVALID` → redirected to `/`
2. Navigate to `/game/VALID` with no `participantId` in store → error card with "Rejoin" link
3. Use a `participantId` not in the room's participant list → "You have left the game" + "Return to Home" button

- [ ] T006 [FR-013] Add error states for missing participantId and removed participant in `frontend/src/pages/GamePage.tsx`

### T006 — Detailed Requirements

**File**: `frontend/src/pages/GamePage.tsx`

**Checks**:
- [ ] Bad room code (`room` is null): Already handled via `if (!room) navigate("/")` — verify guard is in place
- [ ] Missing `participantId` (`participantId` is null in store): Show an error card with "You need to rejoin the game" message and a link/button to the join page
- [ ] Participant not in room list (`participantId` exists but not found in `room.participants`): Show "You have left the game" message with a "Return to Home" button
- [ ] All error states are visually distinct from normal game UI (use `panel` layout, centered content, appropriate colors)
- [ ] Error states do not trigger polling (polling effect should short-circuit when showing an error state)

---

## Dependencies & Execution Order

```
Phase 1 (Setup) — nothing needed
  └─ Phase 2 (Foundational) — nothing needed
       ├─ US1 (P1): ✅ Complete — T001, T002
       ├─ US2 (P2): ✅ Complete — T003, T004
       └─ US3 (P2): ✅ Complete — T005
       └─ FR-013: Remaining — T006
```

All user stories are independently complete. Only T006 (FR-013 error states) remains.

---

## Implementation Strategy

1. Complete T006 in `frontend/src/pages/GamePage.tsx` — add missing participantId error card and removed-participant "You have left the game" state
2. Run `cd frontend && npm test && npx tsc --noEmit` to verify no regressions
3. Run `cd backend && npm test && npx tsc --noEmit` to verify backend unaffected
4. Manual validation via quickstart.md scenarios
