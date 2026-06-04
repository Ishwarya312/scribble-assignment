# Feature Specification: Results and Restart Flow

**Feature Branch**: `004-results-restart-flow`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Create a specification for 'Results and Restart Flow'."

## User Scenarios & Testing

### User Story 1 — Host Ends the Round, All Participants See Results (Priority: P1)

After playing, the host decides the round is complete and triggers the end of the round. All participants see a results view showing the correct word, final scores for everyone, and the complete guess history from the round. This information is the same for all participants — the secret word is no longer hidden from guessers.

**Why this priority**: The results view is the conclusion of every game session. Without it, participants never learn the correct word and never see a final summary. This is the core product of the entire gameplay loop.

**Independent Test**: Start a game as host, have a guesser submit at least one wrong guess, then have the host end the round. Confirm all tabs show: the correct word, both participants' scores, and the guess history including the wrong guess. The guess history includes the correct guess if one was made.

**Acceptance Scenarios**:

1. **Given** a game is in progress and the viewer is the host, **When** they trigger the end of the round, **Then** the room status changes to "finished", and all participants see the correct word, final scores, and full guess history.
2. **Given** a game is in the "finished" state, **When** any participant views the room, **Then** they see the correct word (not hidden), all final scores, and the full guess history.
3. **Given** a game is in progress and the viewer is not the host, **When** they view the game page, **Then** they do NOT see an "End Round" control (this is host-only).

---

### User Story 2 — Host Restarts the Game, All Players Return to Lobby (Priority: P1)

After viewing results, the host wants to play again. They click "Play Again" or "Restart". The room transitions back to "lobby" status. All players remain in the room — nobody is kicked out. Scores are reset to 0, guess history is cleared, drawing state is cleared, and the secret word and drawer assignment are removed. All participants see the lobby page.

**Why this priority**: Restart is the mechanism for replayability. Without it, each room would be single-use. Combined with player preservation, restart makes the room reusable without requiring everyone to re-join with codes.

**Independent Test**: After viewing results as host, click "Restart". Confirm all tabs show the lobby page with the same participants present. Confirm scores are 0, guess history is empty, drawing is blank, and there is no active secret word or drawer assignment.

**Acceptance Scenarios**:

1. **Given** a room is in the "finished" state and the viewer is the host, **When** they click "Restart", **Then** the room status changes back to "lobby", all participants remain, and all round state (scores, guess history, drawing, secret word, drawer assignment) is cleared.
2. **Given** a room has been restarted, **When** any participant views the room, **Then** they see the lobby page with the same participants, scores all at 0, and no guess history or drawing.

---

### User Story 3 — Non-Host Participants See the State Transition via Polling (Priority: P2)

When the host ends the round or restarts the game, non-host participants see the change within ~4 seconds through automatic polling. They do not need to manually refresh. When the round ends, their game page transitions to the results view. When the game restarts, their page transitions to the lobby.

**Why this priority**: Automatic state transition via polling ensures all players stay in sync without manual effort. It is P2 because the core end/restart functions work from the host's perspective, but the multiplayer experience requires sync.

**Independent Test**: Open two browser tabs (host + guesser). Host ends the round. Within ~4 seconds, the guesser tab shows the results view. Host restarts. Within ~4 seconds, the guesser tab shows the lobby.

**Acceptance Scenarios**:

1. **Given** a game is in progress in a non-host tab, **When** the host ends the round, **Then** the non-host tab transitions to the results view within ~4 seconds.
2. **Given** a result view is displayed in a non-host tab, **When** the host restarts, **Then** the non-host tab transitions to the lobby view within ~4 seconds.

---

### Edge Cases

- **Non-host attempts to end round**: If a non-host participant calls the end-round endpoint directly, the request is rejected. Only the host can end the round.
- **Non-host attempts to restart**: Only the host can restart. Non-host restart requests are rejected.
- **End round when already finished**: If the round is already in the "finished" state, calling end-round again is rejected (idempotency guard).
- **Restart when in lobby**: If the room is already in "lobby" state, calling restart is rejected — restart is only valid from "finished".
- **Restart when in "playing" state**: Restart is not allowed while the game is in progress. The round must be ended first.
- **Participant joins during results**: A participant who joins (or re-joins via fetch) during the results view sees the same result data as everyone else (correct word, scores, history).
- **Participant joins after restart**: A participant who joins after restart sees the lobby with the existing participants and scores at 0.
- **All guessers guessed correctly**: If all guessers have already guessed correctly, the host can still end the round normally (no auto-end). The results view shows all guessers with 100 points.
- **No one guessed correctly**: The results view shows the correct word and all guessers with 0 points. The guess history shows all incorrect attempts.
- **Host polls during results**: The host's page also polls and transitions seamlessly — no special host behavior needed beyond the ability to trigger end/restart.
- **End-round or restart API call fails**: Show an inline non-blocking error message near the action button. The button remains clickable so the host can retry immediately. No auto-retry or cooldown.
- **Rapid end-then-restart**: The host can end the round and immediately restart. Both operations complete sequentially.
- **Network failure during result fetch**: If a poll fails during the results view, the page shows a non-blocking error and continues polling. The results data remains displayed from the last successful fetch.

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a mechanism for the host to end the round at any time during the "playing" state.
- **FR-002**: Ending the round MUST transition the room status from "playing" to "finished".
- **FR-003**: When the room status is "finished", all participants MUST see the correct word, regardless of their role.
- **FR-004**: When the room status is "finished", all participants MUST see the final scores for every participant.
- **FR-005**: When the room status is "finished", all participants MUST see the full guess history with who guessed what and whether each guess was correct.
- **FR-006**: System MUST reject an end-round request if the requester is not the host.
- **FR-007**: System MUST reject an end-round request if the room status is not "playing".
- **FR-008**: System MUST provide a mechanism for the host to restart the game from the "finished" state.
- **FR-009**: Restarting MUST transition the room status from "finished" back to "lobby".
- **FR-010**: Restarting MUST clear all round state: scores reset to 0, guess history cleared, drawing state cleared, secret word removed, drawer assignment removed.
- **FR-011**: Restarting MUST preserve the participant list — no participants are removed or need to re-join.
- **FR-012**: System MUST reject a restart request if the requester is not the host.
- **FR-013**: System MUST reject a restart request if the room status is not "finished".
- **FR-014**: All participants' game or result pages MUST poll the room snapshot every ~2 seconds and react to state transitions (playing → finished → lobby).
- **FR-015**: Polling MUST stop when the user navigates away from the page.

### Key Entities

- **Result**: A read-only projection of the completed round. Contains the correct word (visible to all), final scores (participant → score map), guess history (ordered list of guesses), and the final drawing. Exposed through the room snapshot when status is "finished".
- **Room**: Gains a "finished" status value. Round-sensitive fields (secretWord, drawerParticipantId, drawing, guessHistory, scores) are cleared on restart.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A host can end a round, and all participants see the correct word, final scores, and full guess history within ~4 seconds — verified across two browser tabs.
- **SC-002**: A host can restart a game, and all participants return to the lobby with the same players, all scores at 0, and no round artifacts — verified across two browser tabs within ~4 seconds.
- **SC-003**: Non-host end-round or restart requests are rejected 100% of the time.
- **SC-004**: End-round is rejected 100% of the time when the room is not in "playing" state.
- **SC-005**: Restart is rejected 100% of the time when the room is not in "finished" state.
- **SC-006**: All round state (scores, guesses, drawing, secret word, drawer) is cleared on restart, verified by fetching the room snapshot after restart and confirming all fields are absent or reset.
- **SC-007**: All participants remain in the room after restart, verified by checking the participant list before and after restart.

## Discovery Notes & Relevant Files

### Backend

| File | Current State | Required Changes |
|---|---|---|
| `backend/src/models/game.ts` | RoomStatus includes "lobby" and "playing". No "finished" status. Room has scores, guessHistory, drawing, secretWord, drawerParticipantId from prior specs. | Add `"finished"` to `RoomStatus`. Result data is already present on the Room (scores, guessHistory, secretWord) — no new fields needed, just a status transition and clearing logic. |
| `backend/src/services/roomStore.ts` | Has `startGame`, `submitGuess`, `addStroke`, `clearDrawing` from prior specs. | Add `endRound` function: validate host + playing status, set status to "finished". Add `restartGame` function: validate host + finished status, reset all round state (scores, guessHistory, drawing, secretWord, drawerParticipantId), set status to "lobby". Update `toRoomSnapshot` to expose correct word to all when status is "finished". |
| `backend/src/api/rooms.ts` | Routes: create, join, fetch, start, guess, draw, clear from prior specs. | Add `POST /:code/end-round` route. Add `POST /:code/restart` route. |
| `backend/src/api/schemas.ts` | Schemas from prior specs. | Add end-round schema (participantId). Add restart schema (participantId). |

### Frontend

| File | Current State | Required Changes |
|---|---|---|
| `frontend/src/pages/GamePage.tsx` | Game view with canvas, guess form, scoreboard, guess history from prior specs. | Add "End Round" button visible only to host when status is "playing". React to status transition to "finished" by rendering the results section in-page. Show inline error near button on API failure. |
| `frontend/src/pages/GamePage.tsx` (results section) | No result view exists. | Add an in-page results section rendered when `snapshot.status === "finished"`. Display correct word, final scores, and full guess history. Show "Restart" button visible only to host. Show "Waiting for host..." message to non-hosts. |
| `frontend/src/pages/LobbyPage.tsx` | Lobby from prior specs. | No changes needed — lobby already handles polling and start-game flow. Participants already in the list will see the lobby as normal after restart. |
| `frontend/src/state/roomStore.ts` | State includes game fields from prior specs. | Add handling for "finished" status. Add `endRound` action. Add `restartGame` action. Add result data fields (correctWord visible to all when finished). Route to appropriate page based on status. |
| `frontend/src/services/api.ts` | Methods from prior specs. | Add `endRound(code, participantId)`. Add `restartGame(code, participantId)`. |

### Missing Tests

| Area | What's Missing |
|---|---|
| `roomStore.test.ts` | End round transition; restart clears all state; participants preserved after restart; idempotency checks (double end, double restart, wrong status); host-only authorization |
| `api.test.ts` | End-round and restart endpoint acceptance/rejection scenarios; response shape verification |
| Frontend store | EndRound and RestartGame actions; status-based routing (playing→finished→lobby) |
| Result view | Correct word visible to all; scores and guess history displayed; host sees Restart button; non-host sees "Waiting for host" |
| Integration | Two-browser end-to-end flow: host ends round → all see results → host restarts → all return to lobby with preserved players and cleared state |

## Clarifications

### Session 2026-06-04

- Q: Should the results view be a separate route or an in-page conditional within GamePage? → A: In-page conditional. GamePage renders a results section when `snapshot.status === "finished"`, avoiding a new route and keeping polling in place without duplication.
- Q: Should the drawing canvas persist and be visible in the results view? → A: Yes, the drawing stays visible alongside scores and guess history.
- Q: How should the UI handle errors when end-round or restart API calls fail (network error, server error)? → A: Show an inline non-blocking error message near the action button; keep the button clickable for immediate retry.

## Assumptions

- **Round end trigger**: The host manually ends the round by clicking an "End Round" button while the game is in progress. There is no automatic end condition (all-guessed, timer, etc.).
- **Result view**: The result information is rendered in-page within GamePage when `snapshot.status === "finished"`. No separate route is used.
- **Non-host experience during results**: Non-host participants see a results view with all the data but no action controls (no "End Round", no "Restart"). They see a message like "Waiting for host..." for the restart action.
- **Restart returns to lobby**: After restart, participants see the same lobby page they saw before the game started. All lobby features (polling, participant list, host controls) work as before.
- **Player identity preserved**: Participant IDs and names are unchanged through restart. The host remains the host. No re-joining is needed.
- **No drawer rotation on restart**: On restart, the host becomes the drawer again on next game start (per spec 002 — first participant in the list).