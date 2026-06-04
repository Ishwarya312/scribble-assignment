# Tasks: Results and Restart Flow

**Input**: Design documents from `specs/004-results-restart-flow/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Type changes that ALL user stories depend on

**⚠️ No user story work can begin until this phase is complete**

- [ ] T001 Add `"finished"` to `RoomStatus` union type in `backend/src/models/game.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 2: User Story 1 — Host Ends the Round, All Participants See Results (Priority: P1) 🎯 MVP

**Goal**: Host can end a round, transitioning room status to "finished". All participants see the correct word, final scores, full guess history, and drawing in an in-page results section.

**Independent Test**: Start a game as host, have a guesser submit at least one wrong guess, then click "End Round". Confirm both tabs show: the correct word, both participants' scores, the guess history including the wrong guess, and the final drawing. Non-host tab has no "End Round" button.

### Backend — End Round Service & Route

- [ ] T002 [P] [US1] Add `endRoundSchema` and `restartSchema` (participantId only) in `backend/src/api/schemas.ts`
- [ ] T003 [US1] Implement `endRound` function in `backend/src/services/roomStore.ts` — validate host + playing status, set status to "finished"
- [ ] T004 [US1] Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to expose `secretWord` to all participants when status is "finished"
- [ ] T005 [US1] Add `POST /:code/end-round` route in `backend/src/api/rooms.ts`

### Frontend — End Round API & Store

- [ ] T006 [P] [US1] Add `endRound(code, participantId)` method to `frontend/src/services/api.ts`
- [ ] T007 [US1] Add `endRound` action to `frontend/src/state/roomStore.ts` — call API, update snapshot status to "finished"

### Frontend — Results View & GamePage

- [ ] T008 [P] [US1] Add "End Round" button to `frontend/src/pages/GamePage.tsx` — host-only, visible when status is "playing"
- [ ] T009 [US1] Add results section to `frontend/src/pages/GamePage.tsx` — rendered when `status === "finished"`, shows correct word, final scores, full guess history, and the drawing. All the data already exists in the snapshot.

**Checkpoint**: US1 complete — host can end a round and see results. Non-host sees results via polling. Both tabs show the correct word.

---

## Phase 3: User Story 2 — Host Restarts the Game, All Players Return to Lobby (Priority: P1)

**Goal**: Host can restart from the results view, returning the room to "lobby" status with all round state cleared and all participants preserved.

**Independent Test**: After viewing results as host, click "Restart". Confirm both tabs show the lobby page with the same participants, all scores at 0, no guess history, no drawing, no secret word or drawer assignment.

### Backend — Restart Service & Route

- [ ] T010 [US2] Implement `restartGame` function in `backend/src/services/roomStore.ts` — validate host + finished status, clear all round state (scores, guessHistory, drawing, secretWord, drawerParticipantId), set status to "lobby"
- [ ] T011 [US2] Add `POST /:code/restart` route in `backend/src/api/rooms.ts`

### Frontend — Restart API & Store

- [ ] T012 [P] [US2] Add `restartGame(code, participantId)` method to `frontend/src/services/api.ts`
- [ ] T013 [US2] Add `restartGame` action to `frontend/src/state/roomStore.ts` — call API, update snapshot status to "lobby", clear local round state to match server

### Frontend — Restart Button

- [ ] T014 [US2] Add "Restart" button to results section in `frontend/src/pages/GamePage.tsx` — host-only, visible when status is "finished". Non-host sees "Waiting for host..." message.

**Checkpoint**: US2 complete — host can restart and all participants return to lobby with preserved players and cleared state.

---

## Phase 3: User Story 3 — Non-Host Participants See State Transitions via Polling (Priority: P2)

**Goal**: Non-host participants automatically see status-driven UI changes (playing → finished → lobby) through existing 2s polling without manual refresh.

**Independent Test**: Open two browser tabs. Host ends round. Within ~4 seconds, guesser tab shows results view. Host restarts. Within ~4 seconds, guesser tab shows lobby.

### Implementation for User Story 3

> The polling loop already exists in `GamePage.tsx`. The status-driven rendering is partially built in US1 and US2. This phase ensures the full cycle works.

- [ ] T015 [US3] Ensure GamePage + roomStore handle the full status cycle via polling — lobby → playing → finished → lobby. Verify that:
  - When poll returns `status === "lobby"`: GamePage redirects to lobby or renders lobby content (existing behavior via react-router)
  - When poll returns `status === "finished"`: GamePage renders the results section (from T009)
  - Error during poll (T015a) shows non-blocking inline error, keeps last good data

**Checkpoint**: US3 complete — full status cycle works seamlessly across all participants.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling, error states, and final validation

- [ ] T016 [P] Add idempotency guards in roomStore.ts — endRound returns error if not "playing"; restartGame returns error if not "finished"
- [ ] T017 [P] Add inline error handling in GamePage.tsx for end-round and restart API failures — show non-blocking inline error message, keep button clickable for retry
- [ ] T018 Run full validation using `specs/004-results-restart-flow/quickstart.md` — verify all scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — single task, blocks all stories
- **US1 (Phase 2)**: Depends on Phase 1 completion
- **US2 (Phase 2)**: Depends on Phase 1 completion; independent of US1
- **US3 (Phase 2)**: Depends on US1 and US2 completion (testing the full cycle)
- **Polish (Final Phase)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on other stories
- **US2 (P1)**: Can start after Foundational — independent of US1 (different backend service functions, different frontend buttons)
- **US3 (P2)**: Depends on US1 + US2 completed (tests the full cycle)

### Within Each User Story

- Models/types before services
- Services before routes/endpoints
- Backend before frontend (API must exist before frontend can call it)
- Core implementation before edge cases

### Parallel Opportunities

- T002 and T003 are independent (schemas vs service logic)
- T006 and T007 are independent (API method vs store action)
- T008 and T009 can be done together (both in GamePage)
- T012 and T013 are independent (API method vs store action)
- T016 and T017 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Backend: schemas + service logic (independent files)
Task: "Add endRoundSchema to schemas.ts"
Task: "Implement endRound in roomStore.ts"

# Frontend: API method + store action (independent files)
Task: "Add endRound to api.ts"
Task: "Add endRound action to roomStore.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational
2. Complete Phase 2: User Story 1 (end round + results view)
3. **STOP and VALIDATE**: Test US1 independently — host ends round, all see results
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → RoomStatus supports "finished"
2. Add US1 → End round + results view → Test independently (MVP!)
3. Add US2 → Restart → Test independently
4. Add US3 → Full cycle sync → Test independently
5. Polish → Edge cases, error handling, validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
