# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required per Constitution Principle III (Test-Before-Implement). Test tasks must be written and observed to FAIL before implementation begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup — No changes needed

Project infrastructure is already in place from previous features.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend types, services, schemas, and routes plus frontend API methods that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests for Foundational Phase

- [ ] T001 [P] Write backend tests for submitGuess (correct, incorrect, empty, already-correct, drawer-blocked) in `backend/tests/roomStore.test.ts`
- [ ] T002 [P] Write backend tests for addStroke and clearDrawing in `backend/tests/roomStore.test.ts`
- [ ] T003 [P] Write schema validation tests for guessSchema, drawSchema, clearSchema in `backend/tests/schemas.test.ts`
- [ ] T004 [P] Write API integration tests for guess, draw, and clear endpoints in `backend/tests/api.test.ts`

### Implementation for Foundational Phase

- [x] T005 [P] Add `Point`, `Stroke`, `Guess` types to `backend/src/models/game.ts`
- [x] T006 Update `Room` and `RoomSnapshot` in `backend/src/models/game.ts` with `drawing`, `guessHistory`, `scores` fields per data-model.md
- [x] T007 [P] Add `guessSchema`, `drawSchema`, `clearSchema` to `backend/src/api/schemas.ts` per contract specs
- [x] T008 Implement `submitGuess` in `backend/src/services/roomStore.ts` (validate, compare case-insensitively, score, reject already-correct, reject drawer)
- [x] T009 Implement `addStroke` in `backend/src/services/roomStore.ts` (append stroke to room drawing, validate drawer role)
- [x] T010 Implement `clearDrawing` in `backend/src/services/roomStore.ts` (reset drawing to empty array, validate drawer role)
- [x] T011 Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `drawing`, `guessHistory`, `scores`
- [x] T012 [P] Add `POST /:code/guess`, `POST /:code/draw`, `POST /:code/clear` routes to `backend/src/api/rooms.ts`
- [x] T013 [P] Add `submitGuess`, `addStroke`, `clearCanvas` methods to `frontend/src/services/api.ts`
- [x] T014 Add `submitGuess` action to `frontend/src/state/roomStore.ts`

**Checkpoint**: Foundation ready — backend fully supports drawing, guessing, and clearing. Frontend has API methods and store action. User story implementation can begin.

---

## Phase 3: User Story 1 — Drawer Draws on Canvas and Clears (Priority: P1) 🎯 MVP

**Goal**: The drawer sees a blank interactive canvas, can draw strokes in real-time, and can clear the canvas.

**Independent Test**: Start a game as drawer. Confirm canvas is blank. Draw 3 strokes — each appears immediately. Clear canvas — all strokes disappear.

### Tests for User Story 1

- [ ] T015 [P] [US1] Write frontend test for DrawingCanvas rendering and interaction in `frontend/tests/components/DrawingCanvas.test.tsx`
- [ ] T016 [US1] Write frontend test for clear button behavior in `frontend/tests/components/DrawingCanvas.test.tsx`

### Implementation for User Story 1

- [x] T017 [P] [US1] Create `DrawingCanvas` component in `frontend/src/components/DrawingCanvas.tsx` with mouse/touch event handling and Canvas API rendering
- [x] T018 [US1] Add clear button to DrawingCanvas that calls `api.clearCanvas` and resets local canvas
- [x] T019 [US1] Integrate DrawingCanvas into `frontend/src/pages/GamePage.tsx` — show interactive canvas for drawer, read-only canvas for guessers

**Checkpoint**: Drawer can draw and clear. Guesser sees a canvas but cannot draw.

---

## Phase 4: User Story 2 — Guesser Submits a Guess and Receives Feedback (Priority: P1)

**Goal**: Guessers can submit guesses, receive correct/incorrect feedback, and are blocked after a correct guess.

**Independent Test**: Start a game as guesser with known secret word. Submit correct word → "correct" + 100 points. Submit incorrect word → "incorrect" + 0 points. Submit empty → error. Submit again after correct → blocked.

### Tests for User Story 2

- [ ] T020 [P] [US2] Write frontend test for GuessForm guess submission and feedback in `frontend/tests/components/GuessForm.test.tsx`

### Implementation for User Story 2

- [x] T021 [P] [US2] Wire GuessForm submit handler to `roomStore.submitGuess` and display correct/incorrect feedback in `frontend/src/components/GuessForm.tsx`
- [x] T022 [US2] Disable GuessForm after correct guess and show "You guessed correctly!" message
- [x] T023 [US2] Show inline validation error for empty/whitespace guesses before submitting to API

**Checkpoint**: Guessers can guess, see feedback, and are blocked after correct answer.

---

## Phase 5: User Story 3 — Drawing and Guess History Visible to All Through Polling (Priority: P2)

**Goal**: All participants see the current drawing state and guess history, updating automatically via ~2s polling.

**Independent Test**: Draw in drawer tab → guesser tab shows same drawing within ~4s. Submit wrong guess in guesser tab → guess appears in history on drawer tab within ~4s.

### Tests for User Story 3

- [ ] T024 [P] [US3] Write frontend test for ResultPanel rendering with guessHistory data in `frontend/tests/components/ResultPanel.test.tsx`

### Implementation for User Story 3

- [x] T025 [P] [US3] Wire DrawingCanvas to display snapshot `drawing` data for guessers (read-only mode) in `frontend/src/components/DrawingCanvas.tsx`
- [x] T026 [US3] Wire ResultPanel to display snapshot `guessHistory` in `frontend/src/components/ResultPanel.tsx` (participant name, guessed word, correct/incorrect indicator)
- [x] T027 [US3] Ensure polling in `frontend/src/pages/GamePage.tsx` picks up `drawing`, `guessHistory`, `scores` from snapshot and passes to child components

**Checkpoint**: Drawing and guess history sync to all participants within ~4s.

---

## Phase 6: User Story 4 — Scores Visible to All Participants (Priority: P3)

**Goal**: All participants can see everyone's current scores, updating via polling when correct guesses are submitted.

**Independent Test**: Start game with 2 guessers. Guesser A guesses correctly → A shows 100, B shows 0. Guesser B guesses correctly → both show 100.

### Tests for User Story 4

- [ ] T028 [P] [US4] Write frontend test for Scoreboard rendering with scores data in `frontend/tests/components/Scoreboard.test.tsx`

### Implementation for User Story 4

- [x] T029 [US4] Wire Scoreboard to display snapshot `scores` in `frontend/src/components/Scoreboard.tsx` — list each participant with their score, sorted by score descending
- [x] T030 [US4] Show "0" for participants not yet in scores map

**Checkpoint**: All participants see live scores.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify everything works together end-to-end.

- [x] T031 Run `cd backend && npm test && npx tsc --noEmit` — all tests pass, no type errors
- [x] T032 Run `cd frontend && npm test && npx tsc --noEmit` — all tests pass, no type errors
- [ ] T033 Manual validation via quickstart.md scenarios in two-browser setup

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Nothing needed
- **Foundational (Phase 2)**: BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — no dependencies on other stories
- **US2 (Phase 4)**: Depends on Phase 2 — no dependencies on other stories
- **US3 (Phase 5)**: Depends on Phase 2 — integrates data from US1 (drawing) and US2 (guesses) but should be independently testable with mock data
- **US4 (Phase 6)**: Depends on Phase 2 — integrates score data from US2 but independently testable with mock data
- **Polish (Phase 7)**: Depends on all user stories complete

### Within Each Phase

- Tests MUST be written and FAIL before implementation
- Implementation follows after tests pass

### Parallel Opportunities

- All Foundational [P] tasks can run in parallel
- US1 and US2 can be worked on in parallel (independent stories)
- US3 and US4 depend on US1/US2 data flowing through snapshot but are independently testable with mock data

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 2: Foundational (blocks everything)
2. Complete Phase 3: User Story 1 (Drawing Canvas)
3. **STOP and VALIDATE**: Drawing works end-to-end
4. Proceed to US2 → US3 → US4

### Incremental Delivery

1. Foundational: Backend + API methods → ready for any story
2. US1: Drawing canvas → drawer can draw and clear (MVP!)
3. US2: Guess submission → guessers can play
4. US3: State sync → multiplayer visibility
5. US4: Scores → competitive element

### Parallel Team Strategy

- Developer A: Phase 2 Foundational[P] tasks → US1
- Developer B: Phase 2 Foundational[P] tasks → US2
