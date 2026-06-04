# Tasks: Game Initialization and Role Assignment

**Input**: Design documents from `specs/002-game-start-role-assign/`

**Prerequisites**: plan.md, research.md, data-model.md, contracts/

**Tests**: Not requested in feature specification — test tasks omitted per task generation rules.

**Organization**: Tasks are grouped by implementation order, one file change per task.

## Context

The backend for this feature (FR-001 through FR-010) was already implemented during the lobby feature. All tasks below are **frontend-only**, targeting `GamePage.tsx`.

Available data via `useRoomState()`:
- `room.drawerParticipantId` — UUID of the drawer (present when status is "playing")
- `room.role` — `"drawer"` or `"guesser"` for the current viewer (present when status is "playing")
- `room.secretWord` — the secret word (present only when viewer is the drawer)
- `room.participants` — can find the drawer's name by matching `drawerParticipantId`

---

## T001 Add "Loading game..." initial state to GamePage

**File**: `frontend/src/pages/GamePage.tsx`

**Description**: Before the first poll completes, show a generic loading state instead of the full game layout. Once `room.status === "playing"`, render the game content. This prevents showing stale or incorrect content before the role-contextualized snapshot arrives.

**Acceptance**:
- [ ] When GamePage mounts with `room.status === "playing"`, shows "Loading game..." indicator
- [ ] After first poll returns, the loading state is replaced with role-specific content
- [ ] The "Loading game..." indicator is centered, visually distinct, and non-blocking

**Note**: In practice, since GamePage is only reached after the lobby redirects on status change, the first render will already have `status: "playing"` and `role` from the redirecting poll. The loading state covers the edge case where the user navigates directly to `/game` before the store is populated.

---

## T002 Add game-page polling to GamePage

**File**: `frontend/src/pages/GamePage.tsx`

**Description**: Add automatic polling of the room snapshot every ~2 seconds while the game page is active, following the same pattern as LobbyPage.

**Acceptance**:
- [ ] Polling starts when GamePage mounts
- [ ] `fetchRoom` is called every ~2000ms via `setInterval`
- [ ] Polling errors are handled non-blockingly (error state displayed, polling continues)
- [ ] Polling stops when GamePage unmounts (`clearInterval` in effect cleanup)
- [ ] Loading state cleared on first successful poll

---

## T003 Add role-aware rendering to GamePage

**File**: `frontend/src/pages/GamePage.tsx`

**Description**: Render role-specific content based on `room.role`:

- **Drawer view** (`role === "drawer"`):
  - Show "You are drawing!" as the title
  - Show the secret word prominently (e.g., in a styled word display card)
  - Show "Draw the word for others to guess" helper text
  - Show "Waiting for guessers..." instead of a guess form
  - Identify themselves as the drawer in the Player Info card

- **Guesser view** (`role === "guesser"`):
  - Show "Guess the Word!" as the title
  - Find the drawer's name from `room.participants` by matching `drawerParticipantId`
  - Show "[Drawer name] is drawing" indicator
  - Do NOT show the secret word
  - Show the GuessForm component
  - Show "Waiting for first guess..." prompt

- **Both views**:
  - Show the exit button
  - Show the room code badge
  - Keep Scoreboard and ResultPanel in the sidebar (they will be populated in spec 003)

**Acceptance**:
- [ ] Drawer sees the secret word displayed prominently
- [ ] Drawer does not see the GuessForm
- [ ] Guesser sees the drawer's name
- [ ] Guesser does NOT see the secret word
- [ ] Guesser sees the GuessForm
- [ ] Player Info shows correct role label

---

## T004 Hide GuessForm for drawer

**File**: `frontend/src/pages/GamePage.tsx`

**Description**: Pass `disabled` prop or conditionally render the GuessForm based on role. The drawer should not see a guess input.

**Acceptance**:
- [ ] GuessForm is rendered only when `role === "guesser"`
- [ ] When `role === "drawer"`, the "Your Guess" card shows "You are drawing — no guessing needed" or similar text

---

## T005 Run tests and verify

**Description**: Run both backend and frontend test suites and TypeScript checks to confirm no regressions.

**Acceptance**:
- [ ] `cd backend && npm test && npx tsc --noEmit` passes
- [ ] `cd frontend && npm test && npx tsc --noEmit` passes

---

## T006 Add invalid-state error handling to GamePage (FR-013)

**File**: `frontend/src/pages/GamePage.tsx`

**Description**: Add distinct error states for invalid navigation to the game page:

- **Bad room code** (`room` is null, no valid room loaded): redirect to `"/"` immediately
- **Missing participantId** (`participantId` is null/undefined in store): show an error card with "You need to rejoin the game" message and a link to the join page
- **Participant removed** (participantId not found in `room.participants`): show "You have left the game" message with a "Return to Home" button

The bad-room-code redirect is already partially handled by the existing `if (!room) navigate("/")` guard — this task ensures the remaining two states have dedicated UI.

**Acceptance**:
- [ ] Bad room code redirects to "/"
- [ ] Missing participantId shows error card with rejoin link
- [ ] Removed participant shows "You have left the game" with "Return to Home" button
- [ ] All error states are visually distinct from normal game UI
