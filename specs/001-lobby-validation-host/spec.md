# Feature Specification: Lobby, Validation & Host Management

**Feature Branch**: `001-lobby-validation-host`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: Create a specification for "Lobby, Validation & Host Management". Existing create-room and join-room flows already work. Rooms are stored in-memory. The creator of a room must become the host. Player names must be trimmed and whitespace-only names rejected. Room codes must be validated and invalid room codes must show clear feedback. Lobby must automatically poll every 2 seconds. Only the host can start the game. Start game is disabled until at least 2 players are present.

## Clarifications

### Session 2026-06-04

- Q: Should validation error messages be generic or specific per failure type? → A: Specific messages per failure type (e.g., "Room not found" for invalid code, "Name is required" for empty name).
- Q: What happens to a host-less room when the host disconnects? → A: When the host explicitly leaves via the leave endpoint (`POST /:code/leave`), host transfers to the next earliest-joined participant. No WebSocket disconnect detection — if the host closes the tab without calling leave, they remain in the participant list and the room keeps them as host.
- Q: What should the lobby page show during initial data load? → A: Show the room code badge immediately, then populate participant list and controls when the snapshot arrives.

## User Scenarios & Testing

### User Story 1 — Host Creates a Room and Manages the Lobby (Priority: P1)

A player creates a new room and is automatically designated as the host. They see the lobby with their room code, the participant list, and automatic polling for new joiners. The "Start Game" button is visible to them but is disabled until at least one other player joins.

**Why this priority**: Room creation is the entry point for the entire game flow. Without host tracking, no downstream features (drawer assignment, game start) can function. This is the foundational building block.

**Independent Test**: One browser tab creates a room and lands on the lobby. Confirm the participantId returned from creation corresponds to the host. Confirm the "Start Game" button exists on the lobby page. Run `GET /rooms/:code` and verify the response includes a `hostParticipantId` field matching the creator. Confirm the `playerName` is trimmed.

**Acceptance Scenarios**:

1. **Given** a player provides a valid non-empty name, **When** they submit the create-room form, **Then** they are redirected to the lobby page, their name appears in the participant list, and they are identified as the host.
2. **Given** a player provides a name with leading/trailing whitespace (e.g. "  Alice  "), **When** they submit the create-room form, **Then** the name is stored as trimmed ("Alice").
3. **Given** a player provides an empty name or whitespace-only name (e.g. "" or "   "), **When** they submit the create-room form, **Then** an inline error message is displayed and the room is not created.
4. **Given** a host is in the lobby with one participant, **When** they view the lobby, **Then** the "Start Game" button is visible but disabled (or shows a message indicating more players needed).
5. **Given** a non-host participant views the lobby, **When** they look at the controls, **Then** no "Start Game" button is visible.

### User Story 2 — Player Joins a Room with Code Validation (Priority: P1)

A player enters a room code and player name to join an existing game. Invalid or non-existent codes show clear inline error messages. Successful joining redirects to the lobby where they appear in the participant list.

**Why this priority**: Joining is the second entry path into the game. Users must receive immediate, clear feedback when they enter incorrect codes so they can correct and retry without confusion. This is equally foundational alongside room creation.

**Independent Test**: One browser tab creates a room. A second tab enters a made-up code and confirms the error message is displayed. Then the second tab enters the real room code and successfully joins, landing on the lobby.

**Acceptance Scenarios**:

1. **Given** a room with code "ABCD" exists, **When** a second player provides name "Bob" and code "ABCD", **Then** they successfully join and are redirected to the lobby showing both players.
2. **Given** no room exists with code "ZZZZ", **When** a player provides name "Bob" and code "ZZZZ", **Then** an inline error message (e.g. "Room not found" or "Invalid room code") is displayed and they remain on the join form.
3. **Given** a player enters a code with lowercase letters (e.g. "abcd"), **When** they submit, **Then** the code is accepted as equivalent to "ABCD" and the join succeeds.
4. **Given** a player provides a name with leading/trailing whitespace for an existing room, **When** they join, **Then** the name is stored trimmed.
5. **Given** a player provides an empty or whitespace-only name, **When** they submit the join form, **Then** an inline error message is displayed and they are not joined to the room.

### User Story 3 — Lobby Auto-Refreshes for All Participants (Priority: P2)

Once a player is in the lobby (either as creator or joiner), the participant list automatically refreshes every ~2 seconds so all players see new joiners without manually clicking a refresh button.

**Why this priority**: Manual refresh is present in the starter but is poor UX. Automatic polling creates a seamless waiting experience. It is lower priority than the core create/join flows because those must work first.

**Independent Test**: One tab creates a room and lands on the lobby. A second tab joins the room. Within ~4 seconds of the second tab joining, the first tab's participant list updates to include the new player without any manual refresh.

**Acceptance Scenarios**:

1. **Given** a host is viewing the lobby with 1 participant, **When** a second player joins the room, **Then** the host's participant list automatically updates within ~2-4 seconds without manual refresh.
2. **Given** a player is viewing the lobby, **When** they navigate away (e.g., close the tab or leave the page), **Then** polling stops and no error occurs.

### User Story 4 — Host Starts the Game (Priority: P2)

Once at least 2 players are present in the lobby, the host can start the game by clicking the "Start Game" button. Non-host participants never see this button.

**Why this priority**: Game start completes the lobby phase and transitions to gameplay. It is P2 because the lobby must be functional first, but it is the natural conclusion of the lobby flow.

**Acceptance Scenarios**:

1. **Given** a room has 2 or more participants and the current user is the host, **When** they click "Start Game", **Then** the room status changes to "playing" and all participants are redirected to the game page.
2. **Given** a room has only 1 participant (the host), **When** the host views the lobby, **Then** the "Start Game" button is disabled with an indication that more players are needed.
3. **Given** a user who is not the host views the lobby, **When** they inspect the page, **Then** no "Start Game" button or game-start control is visible.
4. **Given** a non-host participant is on the lobby page with polling active, **When** the host starts the game and the room status transitions to "playing" **Then** the lobby page's poll detects the status change and automatically navigates to the game page within ~4 seconds.

### Edge Cases

- **Double-join**: A player who is already in the room (same participantId) attempts to join again via the join endpoint. The system should either reject with an error or silently return the existing room state.
- **Room code format**: Codes are 4-character alphanumeric (uppercase letters + digits, excluding ambiguous chars like O, 0, I, 1). The join form should accept lowercase and convert to uppercase.
- **Maximum participants**: No explicit limit is defined in the starter. The system should handle at least 10 concurrent participants without degradation.
- **Host leaves and rejoins**: If the host is the only participant and refreshes (same participantId), they should still be host when the room is fetched. If they explicitly leave via the leave endpoint and later rejoin with a new participantId, they join as a regular participant. The host role transfers to the first remaining participant when the host leaves.
- **Rapid successive joins**: Multiple players joining simultaneously should all be visible in the participant list within two poll cycles.
- **Network error during polling**: If a poll request fails (network error, server restart), the lobby should show a non-blocking error indicator and continue attempting to poll. It should not crash or redirect.
- **Initial lobby loading state**: When the lobby page first loads, the room code badge is shown immediately (from the creation response or URL parameter). The participant list and controls are populated once the first room snapshot fetch completes. No full-page spinner is shown.
- **Empty room code submission**: The join form should validate that the code is not empty before submitting and display a specific message (e.g. "Room code is required").
- **Special characters in names**: Player names containing special characters should be accepted as-is (no sanitization beyond trimming).

## Requirements

### Functional Requirements

- **FR-001**: System MUST designate the room creator as the host. If the host leaves via the leave endpoint, the host MUST transfer to the first remaining participant.
- **FR-002**: System MUST reject room creation and joining with an empty or whitespace-only player name and display a specific error message (e.g. "Name is required" or "Name cannot be empty").
- **FR-003**: System MUST trim leading and trailing whitespace from player names before storing or returning them.
- **FR-004**: System MUST accept room codes case-insensitively on the join endpoint and normalize to uppercase.
- **FR-005**: System MUST return a specific error message (e.g. "Room not found") when a join request references a non-existent room code.
- **FR-006**: System MUST expose room data including a `hostParticipantId` field so the frontend can identify the host.
- **FR-007**: The lobby frontend MUST automatically poll the room snapshot endpoint every ~2 seconds while the page is active.
- **FR-008**: Polling MUST stop when the user navigates away from the lobby page (component unmounts).
- **FR-009**: Only the host MUST be able to start the game. Non-host participants MUST NOT see or have access to the start-game control.
- **FR-010**: The start-game action MUST be blocked on the backend unless the requesting user is the host and there are at least 2 participants.
- **FR-011**: The frontend MUST disable the "Start Game" button when there are fewer than 2 participants and show a contextual message (e.g. "Waiting for players...").
- **FR-012**: The back end MUST provide a start-game endpoint (`POST /rooms/:code/start`) that transitions the room status from "lobby" to "playing" when preconditions are met.
- **FR-013**: Starting the game MUST return an error if invoked by a non-host participant or when the room has fewer than 2 participants.
- **FR-014**: The lobby frontend MUST detect room status changes (from "lobby" to "playing") during polling and navigate all participants to the game page automatically.
- **FR-015**: Network errors during polling MUST NOT crash the lobby page; a non-blocking error indicator SHOULD be displayed and polling SHOULD continue.
- **FR-016**: Room snapshots returned by the API MUST accurately reflect the current participant list including any participants who joined since the last fetch.

### Key Entities

- **Room**: A game session identified by a unique 4-character code. Has a status (`lobby`, `playing`), a list of participants, a host, and timestamps. All data lives in-memory.
- **Participant**: A player in a room. Identified by a UUID. Has a name (trimmed, non-empty), and a `joinedAt` timestamp.
- **Host**: The participant who created the room. Tracked via a `hostParticipantId` field on the Room. The host role transfers to the next earliest-joined participant when the current host explicitly leaves.
- **RoomSnapshot**: A read-only projection of a Room returned to API consumers. Includes `code`, `status`, `participants`, `hostParticipantId`, `availableWords`, and `roles`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A player can create a room, see themselves as host, see "Start Game" disabled, have a second player join, see the participant list auto-update within ~4 seconds, and start the game — all in under 30 seconds total.
- **SC-002**: A player entering an invalid room code sees an inline error message within 2 seconds of submitting the form.
- **SC-003**: Two players can join a room, see each other in the lobby via automatic polling, and the host can start the game without any manual page refresh.
- **SC-004**: Empty or whitespace-only player names are rejected 100% of the time with a clear message.
- **SC-005**: The start-game endpoint can only be triggered by the host; non-host attempts are rejected 100% of the time.
- **SC-006**: The lobby page handles network errors gracefully — polling continues and the page does not crash or redirect.

## Discovery Notes & Relevant Files

📄 Full cross-feature discovery notes (gaps, risks, edge cases, assumptions, architecture): [`../discovery-notes.md`](../discovery-notes.md)

### Backend

| File | Current State | Required Changes |
|---|---|---|
| `backend/src/services/roomStore.ts` | `createRoom` returns room + participantId but no host field. `toRoomSnapshot` ignores viewerParticipantId. | Add `hostParticipantId` to Room model. Set it in `createRoom`. Expose in `toRoomSnapshot`. Add `startGame` function with host+min-players validation. |
| `backend/src/models/game.ts` | `Room` has no `hostParticipantId`. `RoomStatus` is only `"lobby"`. `RoomSnapshot` has no host field. | Add `hostParticipantId: string` to Room and RoomSnapshot. Add `"playing"` to RoomStatus union type. |
| `backend/src/api/rooms.ts` | Three routes: create, join, fetch. No start route. | Add `POST /:code/start` route. Add host validation to create/join response. |
| `backend/src/api/schemas.ts` | Player name is `z.string().optional()` with no validation. | Add `playerName` schema with `.trim().min(1)` and rejection of whitespace-only. Add start-game schema with participantId. |
| `backend/src/api/router.ts` | Error-handler catches ZodError with generic message. | May need more specific error messages for join/start validation failures. |
| `backend/src/seed/starterData.ts` | Seed words and roles. | No changes needed for this feature group. |

### Frontend

| File | Current State | Required Changes |
|---|---|---|
| `frontend/src/services/api.ts` | Base URL has `/bug` typo. Three methods (createRoom, joinRoom, fetchRoom). | Fix base URL typo. Add `startGame(code, participantId)` method. |
| `frontend/src/state/roomStore.ts` | `RoomState` has no host or game-start fields. `fetchRoom` is manual only. | Add `hostParticipantId` to state shape. Add `startGame` action. Add polling interval management (start/stop). |
| `frontend/src/pages/LobbyPage.tsx` | "Start Game" button visible to everyone. Manual refresh only. | Gate "Start Game" visibility/disabled state by host + participant count. Replace manual refresh with auto-polling via `useEffect` + `setInterval`. Show loading/error states for polling. Detect room status transition from "lobby" to "playing" during polling and navigate to `/game`. |
| `frontend/src/pages/CreateRoomPage.tsx` | Accepts empty names. | Add frontend-side validation for empty/whitespace-only names before submitting. Show inline error. |
| `frontend/src/pages/JoinRoomPage.tsx` | Accepts empty names. Hardcoded room code validation only (uppercase conversion). | Add frontend-side validation for empty/whitespace-only names. Validate room code is non-empty. Show inline error messages from API. |

### Missing Tests

| Area | What's Missing |
|---|---|
| `roomStore.test.ts` | Host tracking on create; host preserved on join; startGame with valid/invalid preconditions; multi-room host isolation; name trimming behavior |
| `schemas.test.ts` | Invalid playerName (empty, whitespace, too long); valid trimmed name; invalid room code format |
| `api.test.ts` | startGame endpoint call; error response handling in failing join; network failure handling |
| Frontend store | Polling lifecycle (start, tick, stop); host identification in state; startGame action |
| LobbyPage | Host vs non-host button visibility; disabled state with <2 players; auto-polling and cleanup; redirect on missing room |
| Integration | Two-browser lobby flow; join with invalid code error display |

## Assumptions

- **Host transfer on leave**: The host role is assigned at room creation. If the host leaves via the leave endpoint, the host transfers to the first remaining participant (the earliest joiner after the previous host). Closing the tab without calling leave does not trigger transfer — the host remains assigned.
- **Polling start**: Polling begins immediately when the lobby page mounts (no initial delay). The interval fires every ~2 seconds.
- **Error recovery**: If a poll request fails, the frontend logs a non-blocking error indicator and retries on the next interval. After 3 consecutive failures, a persistent message is shown but polling continues.
- **Start-game button visibility**: Non-host participants see no start-game control at all (not just disabled). The host always sees the button but it is disabled when <2 players are present.
- **Participant limit**: No hard limit is enforced for this feature group. The system is expected to handle typical multiplayer scenarios (2–10 players).
