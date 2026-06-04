# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Create a specification for 'Gameplay Interaction'."

## User Scenarios & Testing

### User Story 1 — Drawer Draws on the Canvas and Clears When Needed (Priority: P1)

The drawer sees a blank canvas when the game page loads. They can draw freely using their mouse or touch input. The drawing appears on their screen in real-time as they draw. If they make a mistake or want to start over, they can clear the entire canvas. The cleared state is immediately reflected on their screen.

**Why this priority**: Drawing is the core gameplay mechanic. Without drawing, there is no game. The drawer must be able to draw and clear for the game to function at all.

**Independent Test**: Start a game as the drawer. Confirm the canvas is blank. Draw a few strokes. Confirm each stroke appears immediately. Clear the canvas. Confirm all strokes disappear and the canvas is blank again.

**Acceptance Scenarios**:

1. **Given** the game has started and the viewer is the drawer, **When** they see the game page, **Then** they see a blank interactive canvas.
2. **Given** the drawer is drawing on the canvas, **When** they make a stroke, **Then** the stroke appears on their screen in real-time as they draw.
3. **Given** the drawer has drawn on the canvas, **When** they click "Clear", **Then** all strokes are removed and the canvas is blank.

---

### User Story 2 — Guesser Submits a Guess and Receives Feedback (Priority: P1)

A guesser sees a guess input form on the game page. They type a word and submit it. The system trims whitespace, validates the guess is non-empty, and compares it against the secret word (case-insensitive). If correct, they receive confirmation and 100 points are added to their score. If incorrect, they see the guess was wrong and can try again.

**Why this priority**: Guessing is the second core gameplay mechanic. All non-drawer participants must be able to submit guesses and understand whether they are right or wrong.

**Independent Test**: Start a game as a guesser with a known secret word. Submit the exact correct word and confirm "correct" feedback and 100 points. Submit an incorrect word and confirm "incorrect" feedback. Submit an empty or whitespace-only guess and confirm rejection.

**Acceptance Scenarios**:

1. **Given** the game has started and the viewer is a guesser, **When** they submit a guess that matches the secret word (case-insensitive, trimmed), **Then** they receive feedback that the guess is correct and their score increases by 100 points.
2. **Given** the game has started and the viewer is a guesser, **When** they submit a guess that does not match the secret word, **Then** they receive feedback that the guess is incorrect and their score stays the same.
3. **Given** the game has started and the viewer is a guesser, **When** they submit an empty or whitespace-only guess, **Then** the submission is rejected with an error message and no points are awarded.
4. **Given** the game has started and the viewer is a guesser who has already guessed correctly, **When** they submit another guess, **Then** the submission is rejected with a message that they have already answered correctly.

---

### User Story 3 — Drawing and Guess History Visible to All Through Polling (Priority: P2)

All participants see the current state of the drawing and the history of all guesses submitted so far. The drawing and guess history update automatically every ~2 seconds through polling, so the drawer sees what guessers are submitting and guessers see the drawing progress.

**Why this priority**: Without synchronized visibility, participants would be drawing and guessing in isolation. Polling provides the shared game experience. It is P2 because the core drawing and guessing mechanics work first, but multiplayer coordination requires visibility.

**Independent Test**: Start a game with two browser tabs (drawer + guesser). Draw in the drawer tab. Wait ~4 seconds. Confirm the guesser tab shows the same drawing. Submit a wrong guess in the guesser tab. Wait ~4 seconds. Confirm the drawer tab shows the guess in the guess history.

**Acceptance Scenarios**:

1. **Given** a game is in progress, **When** the drawer draws a stroke, **Then** all participants see that stroke within ~4 seconds (two poll cycles) without manual refresh.
2. **Given** a game is in progress, **When** the drawer clears the canvas, **Then** all participants see the cleared canvas within ~4 seconds.
3. **Given** a game is in progress, **When** a guesser submits a guess, **Then** all participants see the guess (and its result) in the guess history within ~4 seconds.
4. **Given** a game is in progress, **When** a participant navigates away from the game page, **Then** polling stops and no errors occur.

---

### User Story 4 — Scores Are Visible to All Participants (Priority: P3)

All participants can see the current scores for every player. Scores update in real time (via polling) when a correct guess is submitted. All participants start at 0.

**Why this priority**: Scores provide the competitive element of the game. They are P3 because the game functions without scoring (drawing and guessing still work), but scoring completes the gameplay experience.

**Independent Test**: Start a game with two guessers. Guesser A guesses correctly → their score shows 100, guesser B still shows 0. Guesser B then guesses correctly → both show 100. Confirm guesser A sees guesser B's score update.

**Acceptance Scenarios**:

1. **Given** a game has started, **When** any participant views the game page, **Then** they see all participants' scores, each starting at 0.
2. **Given** a guesser submits a correct guess, **When** any participant views the game page after the next poll cycle, **Then** the guesser's score shows 100 (or updated total if they had prior points from previous correct guesses in the same round).
3. **Given** a guesser submits an incorrect guess, **When** any participant views the scores, **Then** the guesser's score is unchanged.

---

### Edge Cases

- **Canvas drawing responsiveness**: The drawer sees their strokes in real-time on their own screen. Guesser polling delay (~2-4s) means guessers see strokes with a slight lag.
- **Clear during active drawing**: If the drawer clears the canvas while mid-stroke, the in-progress stroke is discarded and the canvas is blank.
- **Guesser who already guessed correctly**: Further guesses from a participant who has already submitted the correct word are rejected. The correct guess is still visible in the history.
- **Drawer cannot guess**: The drawer does not see the guess input form. If they call the guess endpoint directly, the request is rejected because the drawer role cannot submit guesses.
- **Case-insensitive matching**: The words "ROCKET", "Rocket", "rocket", "rOcKeT" all match the secret word "rocket".
- **Whitespace in guesses**: Leading/trailing whitespace is trimmed before comparison. A guess of "  rocket  " matches.
- **Multiple guessers guessing the correct word simultaneously**: Each guess is processed independently. Both guessers receive correct feedback and 100 points each if their guesses match.
- **Very long guesses**: Reasonable length limits apply to prevent abuse. Excessively long guesses are rejected with an error.
- **Drawing while another guesser submits a guess**: These operations are independent. Drawing is not interrupted by guess submission.
- **Network error during drawing sync**: If a drawing stroke fails to sync, the drawer's local canvas still shows the stroke. The stroke will be re-attempted on the next poll cycle or the drawer can redraw.
- **Polling failure on game page**: If poll requests fail, the game page shows a non-blocking error indicator and continues polling. Drawing and guess submission still work (they have their own API calls independent of polling).
- **Round does not auto-end on correct guess**: Even when all guessers have submitted the correct word, the round stays in `"playing"` state. Ending the round is exclusively the host's manual action via the End Round button (feature 004). This is by design so the round can run for a fixed social duration.

## Requirements

### Functional Requirements

- **FR-001**: The drawer MUST be able to draw strokes on an interactive canvas, with each stroke appearing on their screen in real-time as it is drawn.
- **FR-002**: The drawer MUST be able to clear the entire canvas with a single action, removing all strokes.
- **FR-003**: All participants MUST be able to see the current drawing state, with updates appearing within ~4 seconds.
- **FR-004**: Guessers MUST be able to submit a guess via a text input. The guess MUST be trimmed of leading/trailing whitespace before processing.
- **FR-005**: Empty or whitespace-only guesses MUST be rejected with an error message and MUST NOT be recorded or scored.
- **FR-006**: Guess comparison against the secret word MUST be case-insensitive after trimming.
- **FR-007**: A correct guess MUST award 100 points to the guessing participant.
- **FR-008**: An incorrect guess MUST award 0 points to the guessing participant.
- **FR-009**: A guesser who has already submitted a correct guess MUST have any subsequent guesses rejected with an appropriate message.
- **FR-010**: The drawer MUST NOT be able to submit guesses. If the drawer attempts to call the guess endpoint, the request MUST be rejected.
- **FR-111**: All participants MUST start with a score of 0 when the game begins.
- **FR-012**: All participants MUST be able to see everyone's current scores.
- **FR-013**: All participants MUST be able to see the full guess history, including who submitted each guess, the word guessed, and whether it was correct.
- **FR-014**: The game page MUST poll the room snapshot every ~2 seconds to receive updated drawing state, guess history, and scores.
- **FR-015**: Polling MUST stop when the user navigates away from the game page.
- **FR-016**: All participants MUST see the canvas return to a blank state when the drawer clears it.

### Key Entities

- **Drawing**: A collection of strokes representing the current canvas state. Stored on the Room and included in the room snapshot. Cleared by the drawer's clear action.
- **Stroke**: A single continuous drawing action. Composed of a sequence of points with rendering properties (e.g., color, width). Belongs to a Drawing.
- **Point**: A coordinate on the canvas (x, y). Belongs to a Stroke.
- **Guess**: A participant's attempt at identifying the secret word. Contains the participant ID, the guessed word, a timestamp, and whether it was correct. Stored in a history list on the Room.
- **Score**: The number of points a participant has earned. Starts at 0, increments by 100 for each correct guess.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A drawer can draw 5 distinct strokes and see each one appear on their screen in under 1 second per stroke.
- **SC-002**: A guesser's correct guess is reflected in their score (+100) and visible to all participants within ~4 seconds (two poll cycles).
- **SC-003**: All participants can see the current drawing, guess history, and all scores without any manual refresh, verified within 6 seconds of any state change.
- **SC-004**: Empty/whitespace guesses are rejected 100% of the time with a clear error message.
- **SC-005**: Case-insensitive guess matching works correctly for all casing variants of the secret word (uppercase, lowercase, mixed case).
- **SC-006**: The drawer cannot submit guesses via any mechanism (UI hidden + API rejection), verified 100% of the time.
- **SC-007**: A participant who already guessed correctly cannot submit further guesses, verified 100% of the time.
- **SC-008**: The game page handles polling failures gracefully — it shows a non-blocking indicator, continues polling, and does not crash.

## Discovery Notes & Relevant Files

📄 Full cross-feature discovery notes (gaps, risks, edge cases, assumptions, architecture): [`../discovery-notes.md`](../discovery-notes.md)

### Backend

| File | Current State | Required Changes |
|---|---|---|
| `backend/src/models/game.ts` | Room has `drawerParticipantId`, `secretWord` from spec 002. No drawing, guess, or score data. | Add `Drawing` type (strokes, points). Add `Guess` type (participantId, word, correct, timestamp). Add `scores: Map<string, number>` to Room. Add `drawing`, `guessHistory`, `scores` fields to Room and RoomSnapshot. |
| `backend/src/services/roomStore.ts` | `toRoomSnapshot` contextualizes word visibility. No guess or drawing logic. | Add `submitGuess` function (validate, compare, score). Add `addStroke` function (append to room drawing). Add `clearDrawing` function (reset strokes). Update `toRoomSnapshot` to include drawing, guess history, scores. |
| `backend/src/api/rooms.ts` | Three routes (create, join, fetch). Start route from spec 002. | Add `POST /:code/guess` route for guess submission. Add `POST /:code/draw` route for stroke submission. Add `POST /:code/clear` route for canvas clear. |
| `backend/src/api/schemas.ts` | Schemas for create/join/start. | Add guess schema (word, participantId, trim, non-empty, max length). Add draw schema (strokes data). Add clear schema (participantId). |

### Frontend

| File | Current State | Required Changes |
|---|---|---|
| `frontend/src/pages/GamePage.tsx` | Static placeholders. No canvas or guess integration. | Replace canvas placeholder with interactive drawing component. Wire guess form to backend. Display guess history. Display scores for all participants. Poll for room snapshot. |
| `frontend/src/state/roomStore.ts` | Game state from spec 002. No drawing or guess state. | Add `drawing`, `guessHistory`, `scores` to state. Add `submitGuess` action. Add polling for game state. |
| `frontend/src/services/api.ts` | Methods for create, join, fetch, start. | Add `submitGuess(code, participantId, word)`. Add `addStroke(code, participantId, stroke)`. Add `clearCanvas(code, participantId)`. |
| `frontend/src/components/GuessForm.tsx` | Stub — no API call. | Wire to backend guess endpoint. Disable after correct guess. Hide if viewer is drawer. Show inline error for empty/whitespace guesses. |
| `frontend/src/components/Scoreboard.tsx` | Stub — static display. | Display live scores from room snapshot for all participants. |
| `frontend/src/components/ResultPanel.tsx` | Stub — static display. | Display live guess history from room snapshot (participant name, word guessed, correct/incorrect indicator). |

### Missing Tests

| Area | What's Missing |
|---|---|
| `roomStore.test.ts` | Guess submission (correct, incorrect, empty, already-correct guesser, drawer cannot guess). Stroke addition and clear. Score calculation and persistence. Multi-room guess isolation. |
| `schemas.test.ts` | Guess schema validation (empty, whitespace-only, too long). Draw schema validation. |
| `api.test.ts` | Guess endpoint acceptance/rejection scenarios. Draw endpoint. Clear endpoint. |
| Frontend store | Drawing state in store. Guess submission action. Score state updates. Polling lifecycle on game page. |
| GamePage | Canvas rendering and interaction. Guess form wiring. Scoreboard live updates. Guess history display. |
| Integration | Two-browser gameplay: drawer draws → guesser sees drawing → guesser guesses → drawer sees guess history → score updates for all. |

## Assumptions

- **Drawing data format**: The drawing is stored as an ordered list of strokes. Each stroke is an ordered list of points (x, y coordinates) plus rendering metadata (color, line width). The full drawing state is returned in every snapshot — no diffing or incremental updates.
- **Drawing visibility**: The drawing is visible to all participants (drawer and guessers) through the room snapshot. The phrase "visible to the drawer" is a minimum requirement; in practice, guessers must also see it for the game to function.
- **Guess history visibility**: All guesses (correct and incorrect) are visible to all participants, including the drawer. Each guess entry shows who submitted it, the word guessed, and whether it was correct.
- **Score visibility**: Scores are visible to all participants, not just the individual scorer.
- **Already-correct guesser**: A participant who has submitted the correct word is considered "done" and cannot submit further guesses. They can still view the drawing, guess history, and scores.
- **Drawer guess rejection**: The drawer role is prevented from submitting guesses both by UI (no guess form) and by backend validation.
- **Polling behavior**: Game page polling follows the same pattern as lobby polling (~2s interval, stops on unmount, error resilience with non-blocking indicator).
- **Round lifecycle is separate**: Round-ending (transition from `"playing"` to `"finished"`) is **not** part of this feature. It is handled by feature 004 via a **manual host action** (End Round button). There is no automatic end condition triggered by correct guesses. The "playing" state persists until the host explicitly ends the round.
- **Single round**: All gameplay occurs within a single round. There is no round advancement, drawer rotation, or game-end mechanism in this feature. Those are separate features.
