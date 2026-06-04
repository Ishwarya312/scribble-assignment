# Feature Specification: Game Initialization and Role Assignment

**Feature Branch**: `002-game-start-role-assign`

**Created**: 2026-06-04

**Status**: Draft

**Input**: User description: "Create a specification for "Game Initialization and Role Assignment"."

## User Scenarios & Testing

### User Story 1 — Host Starts the Game, Drawer Assigned and Word Selected (Priority: P1)

The host clicks "Start Game" when at least 2 participants are in the lobby. The backend validates the request, transitions the room from "lobby" to "playing", assigns the host as the drawer, and selects a secret word deterministically from the starter word list. The drawer immediately sees the secret word on the game page. Guessers see that the game has started and that the drawer has been selected, but they do not see the secret word.

**Why this priority**: Game start is the gateway to all gameplay. Without correct drawer assignment and word selection, no subsequent game mechanics (guessing, scoring) can function. This is the foundational transaction for the playing phase.

**Independent Test**: Open two browser tabs in the same room with the host in tab A. Tab A clicks "Start Game". Both tabs are redirected to the game page. Tab A shows the drawer identity and the secret word. Tab B shows the drawer identity but no secret word. The room status in the API response is "playing".

**Acceptance Scenarios**:

1. **Given** a room with 2+ participants where the current user is the host, **When** the host starts the game, **Then** the room status changes to "playing", the host is assigned as the drawer, a secret word is deterministically selected, and the API returns the word to the drawer and no word to guessers.
2. **Given** a game has started, **When** the drawer fetches the room state, **Then** the response includes the `secretWord` field with the selected word.
3. **Given** a game has started, **When** a guesser fetches the room state, **Then** the response does NOT include the `secretWord` field (or it is null/undefined).
4. **Given** a room has only 1 participant (the host), **When** the host attempts to start the game, **Then** the request is rejected and the room remains in "lobby" status.

---

### User Story 2 — All Participants See Their Assigned Role (Priority: P2)

After the game starts, every participant can see their own role ("drawer" or "guesser") and who the drawer is. The drawer sees the drawer role indicator and the secret word. Guessers see the guesser role and the name of who is drawing, but no secret word.

**Why this priority**: Role clarity is essential for the user experience. Without it, participants would not know whether they should be drawing or guessing. This is P2 because the system functions correctly without it (the drawer can see the word and start drawing), but the experience is confusing.

**Independent Test**: Start a game with 3 participants (Alice host, Bob, Charlie). Alice's game page shows role "drawer" with the secret word visible. Bob's and Charlie's game pages show role "guesser" with no secret word but with an indication that Alice is the drawer.

**Acceptance Scenarios**:

1. **Given** a game has started, **When** any participant fetches the room snapshot, **Then** the response includes a `drawerParticipantId` field identifying the drawer.
2. **Given** a game has started, **When** the drawer fetches the room snapshot, **Then** the response includes the drawer's participant information, and the `role` for the viewer is "drawer".
3. **Given** a game has started, **When** a guesser fetches the room snapshot, **Then** the response includes the drawer's participant information, and the `role` for the viewer is "guesser".

---

### User Story 3 — Game Page Polls for Game State (Priority: P2)

Once the game starts, all participants' game pages automatically poll the room state every ~2 seconds. This ensures late-arriving state updates (e.g., the game starting while another player is mid-poll) are captured promptly. Polling continues through the playing phase.

**Why this priority**: Without polling, participants would need to manually refresh to see state changes. Polling is the only sync mechanism available (no WebSockets), so it must be functional for the game to work as a real-time experience.

**Independent Test**: Open two tabs, start the game from tab A. Tab B's poll catches the status change from "lobby" to "playing" within ~4 seconds without any manual action. Tab B navigates to the game page showing the role and drawer info.

**Acceptance Scenarios**:

1. **Given** a participant is on the game page, **When** the room state changes (e.g., a guess is submitted, score updates), **Then** the poll interval fetches the latest state and updates the UI without manual refresh.
2. **Given** a participant is on the game page, **When** they navigate away, **Then** polling stops and no error occurs.

---

### Edge Cases

- **Single-player room start**: The game cannot be started with only the host present. The start action is rejected and a clear message is shown.
- **Non-host tries to start**: A non-host participant who somehow triggers the start action (e.g., by calling the API directly) receives a rejection. The room state does not change.
- **Room with only 2 participants**: The minimum viable game. The host becomes the drawer and the other player is the sole guesser. All roles function correctly.
- **Room with many participants**: With 3+ participants, exactly one drawer is assigned and all others are guessers. There is no limit on the number of guessers.
- **Drawer leaves after game start**: If the drawer disconnects or leaves, the game continues in its current state. Drawer rotation is out of scope.
- **Rapid start requests**: If the start endpoint is called multiple times in rapid succession, only the first call succeeds; subsequent calls return an error (game already started).
- **Network failure during game-page polling**: If a poll request fails, the game page should show a non-blocking error indicator and continue polling. The page should not crash.
- **Participant re-fetches after game starts**: A participant who refreshes their browser after the game starts should receive the correct game state (including their role and the secret word if they are the drawer) from the API.

## Requirements

### Functional Requirements

- **FR-001**: System MUST assign the drawer as the first participant in the participant list (the host) when the game starts, using a deterministic rule.
- **FR-002**: System MUST select a secret word deterministically from the starter word list (rocket, pizza, castle, guitar, sunflower) when the game starts.
- **FR-003**: System MUST transition the room status from "lobby" to "playing" upon successful game start.
- **FR-004**: System MUST reject a start-game request if the requesting participant is not the host, returning an appropriate error.
- **FR-005**: System MUST reject a start-game request if the room has fewer than 2 participants, returning an appropriate error.
- **FR-006**: System MUST reject a start-game request if the room status is already "playing", returning an appropriate error (idempotency guard).
- **FR-007**: The room snapshot returned by the API MUST include a `drawerParticipantId` field when the room status is "playing".
- **FR-008**: The room snapshot returned to a viewer MUST include a `role` field indicating whether the viewer is "drawer" or "guesser", determined by comparing the viewer's participant ID against `drawerParticipantId`.
- **FR-009**: The room snapshot returned to a viewer identified as the drawer MUST include the `secretWord` field with the selected word.
- **FR-010**: The room snapshot returned to a viewer identified as a guesser MUST NOT include the `secretWord` field (it must be absent, null, or undefined — never the actual word).
- **FR-011**: The game page frontend MUST poll the room snapshot endpoint every ~2 seconds while the page is active.
- **FR-012**: Polling MUST stop when the user navigates away from the game page.

### Key Entities

- **Room**: A game session. Gains fields `drawerParticipantId: string` and `secretWord: string` (stored internally) when the game starts. Status transitions from "lobby" to "playing".
- **Participant**: A player in a room. Their role ("drawer" or "guesser") is not stored on the participant but is derived by comparing their participant ID against the room's `drawerParticipantId`.
- **RoomSnapshot**: A viewer-contextualized projection of a Room. Adds conditional visibility: role is computed per-viewer; secretWord is included only when the viewer is the drawer.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A host with 2+ participants can start the game, and within 2 seconds all participants see the game page with correct role assignment and a deterministically-selected secret word.
- **SC-002**: The secret word is never visible to guessers in any API response, verified by testing the endpoint with both drawer and guesser participant IDs.
- **SC-003**: Start-game requests are rejected 100% of the time for non-host participants and for rooms with fewer than 2 participants.
- **SC-004**: Game state is available through polling within ~4 seconds (two poll cycles) of any state change, without manual page refresh.
- **SC-005**: The same secret word is always selected for the same room/round combination, verifiable by starting the game and checking the word multiple times.

## Discovery Notes & Relevant Files

### Backend

| File | Current State | Required Changes |
|---|---|---|
| `backend/src/models/game.ts` | `Room` has no `drawerParticipantId`, `secretWord`. `RoomStatus` is only `"lobby"`. `RoomSnapshot` has no role or drawer fields. | Add `"playing"` to `RoomStatus`. Add `drawerParticipantId: string`, `secretWord: string` to Room. Add `drawerParticipantId`, `role`, optionally `secretWord` to RoomSnapshot. |
| `backend/src/services/roomStore.ts` | `toRoomSnapshot` ignores `viewerParticipantId` parameter. No drawer assignment or word selection logic. | Implement snapshot contextualization based on viewer role. Add drawer assignment function (first participant). Add deterministic word selection function. |
| `backend/src/api/rooms.ts` | Three routes (create, join, fetch). `GET /:code` returns same snapshot to all viewers. | Contextualize `GET /:code` response based on `viewerParticipantId` query param. The `startGame` endpoint was already added by lobby spec (001); this spec defines what happens inside it. |
| `backend/src/seed/starterData.ts` | Contains `STARTER_WORDS` and `STARTER_ROLES`. | No changes needed; the data is already available for word selection. |

### Frontend

| File | Current State | Required Changes |
|---|---|---|
| `frontend/src/pages/GamePage.tsx` | Static placeholders only. No connection to actual game state. | Display the secret word when the viewer is the drawer. Show role indicator for all participants. Show who the drawer is. Display "Waiting for first guess..." or similar prompt. |
| `frontend/src/state/roomStore.ts` | No game state fields. No role awareness. | Add state fields for `secretWord` (nullable, only set for drawer), `drawerParticipantId`, `role`. Use viewer-contextualized snapshot data. |
| `frontend/src/services/api.ts` | `fetchRoom` returns raw snapshot. | No client-side changes needed for the API call itself, but the client must pass the `participantId` query parameter so the backend can contextualize. |
| `frontend/src/components/GuessForm.tsx` | Stub — no API call. | Hide the guess form if the viewer is the drawer (drawers don't guess their own word). This is a display concern, not a security measure. |

### Missing Tests

| Area | What's Missing |
|---|---|
| `roomStore.test.ts` | Drawer assignment on game start; deterministic word selection; snapshot contextualization (drawer sees word, guesser does not); multi-room game start isolation; idempotency guard (double start rejected) |
| `api.test.ts` | Start-game endpoint acceptance and rejection scenarios; viewer-contextualized GET response validation |
| Frontend store | Game state fields in store shape; drawer vs guesser state differentiation |
| GamePage | Drawer sees word; guesser does not see word; role indicator display; polling lifecycle on game page |
| Integration | Two-browser game start flow; drawer-only word visibility verified via API |

## Assumptions

- **Drawer identity**: The host (first participant in the participant list) becomes the drawer. The drawer assignment is permanent for the round and does not change.
- **Word selection formula**: The secret word is selected deterministically using a repeatable formula based on the room code and round index (e.g., char code sum of room code modulo word list length, or round index modulo word list length). With a single round, this ensures the same word is always selected for a given room.
- **Role derivation**: The participant's role is not stored as a field on the participant but is derived at snapshot time by comparing the viewer's participant ID against the room's `drawerParticipantId`.
- **Snapshot contextualization**: The existing `viewerParticipantId` query parameter on `GET /rooms/:code` is used to determine the viewer's role and conditionally include or exclude the secret word.
- **Polling behavior**: Game page polling follows the same pattern as lobby polling (~2s interval, stops on unmount, error resilience).
- **No drawer rotation**: If the drawer disconnects, the game continues without a replacement. Drawer rotation is explicitly out of scope per project constraints.
