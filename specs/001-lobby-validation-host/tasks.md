# Tasks: Lobby, Validation & Host Management

**Input**: Design documents from `specs/001-lobby-validation-host/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in feature specification — test tasks omitted per task generation rules.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Fix existing issues that block all API communication

- [ ] T001 Fix API base URL typo in `frontend/src/services/api.ts` (change `/bug` to empty string)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend model and schema updates that both US1 and US2 depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 [P] Add `hostParticipantId` field to Room and RoomSnapshot interfaces in `backend/src/models/game.ts`
- [ ] T003 [P] Add `"playing"` to RoomStatus type union in `backend/src/models/game.ts`
- [ ] T004 Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `hostParticipantId` in the returned snapshot

**Checkpoint**: Foundation ready — US1 and US2 backend models are in place.

---

## Phase 3: User Story 1 — Host Creates a Room and Manages the Lobby (Priority: P1) 🎯 MVP

**Goal**: A player can create a room with a valid name, is designated host, sees the lobby with the room code badge, and sees the Start Game button (disabled if alone).

**Independent Test**: One browser tab creates a room and lands on the lobby. Confirm the participantId returned from creation corresponds to the host. Confirm the "Start Game" button exists on the lobby page but is disabled. Call `GET /rooms/:code` and verify the response includes a `hostParticipantId` field matching the creator.

### Backend

- [ ] T005 Set `hostParticipantId` in `createRoom` function in `backend/src/services/roomStore.ts` to match the creator's participantId
- [ ] T006 [P] Add `playerName` Zod validation (`.trim().min(1)`) to `createRoomSchema` in `backend/src/api/schemas.ts` with error message `"Name is required"`
- [ ] T007 [P] Expose `hostParticipantId` in the create-room response by updating `createRoom` route in `backend/src/api/rooms.ts`

### Frontend

- [ ] T008 [P] Add frontend-side name validation (non-empty after trim) to `CreateRoomPage.tsx` before submitting to the API; show inline error "Name is required" on empty/whitespace names
- [ ] T009 [P] Add `hostParticipantId` to the room store state in `frontend/src/state/roomStore.ts`
- [ ] T010 Update `LobbyPage.tsx` to display the room code badge immediately on mount (from URL param or creation response) before the first poll completes
- [ ] T011 Update `LobbyPage.tsx` to show the "Start Game" button (disabled) when the viewer is the host and there is only 1 participant

**Checkpoint**: At this point, User Story 1 should be fully functional — a host can create a room, see the room code, see themselves in the participant list, and see a disabled Start Game button.

---

## Phase 4: User Story 2 — Player Joins a Room with Code Validation (Priority: P1)

**Goal**: A player can join an existing room with a valid code and name. Invalid codes show "Room not found". Empty names are rejected. Codes are matched case-insensitively.

**Independent Test**: Create a room in tab A. Open tab B, enter a made-up code, and confirm "Room not found" error. Then enter the real room code and successfully join, landing on the lobby with both participants visible.

### Backend

- [ ] T012 [P] Add `playerName` Zod validation (`.trim().min(1)`) to `joinRoomSchema` in `backend/src/api/schemas.ts` with error message `"Name is required"`
- [ ] T013 [P] Update `joinRoom` route in `backend/src/api/rooms.ts` to return `{ error: "Room not found" }` (status 404) when the room code does not match any existing room
- [ ] T014 Ensure join endpoint normalizes room codes to uppercase (`.toUpperCase()`) for case-insensitive matching — already in place, verify in `backend/src/api/rooms.ts`

### Frontend

- [ ] T015 [P] Add frontend-side name validation (non-empty after trim) to `JoinRoomPage.tsx` before submitting; show inline error "Name is required"
- [ ] T016 [P] Add frontend-side validation that room code is not empty in `JoinRoomPage.tsx` before submitting; show inline error "Room code is required"
- [ ] T017 Handle API error responses in `JoinRoomPage.tsx` — display "Room not found" inline when the join request returns 404

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently — a player can join a room and see the updated participant list, and invalid inputs are rejected with specific messages.

---

## Phase 5: User Story 3 — Lobby Auto-Refreshes for All Participants (Priority: P2)

**Goal**: Once in the lobby, the participant list auto-refreshes every ~2 seconds without manual refresh. Polling stops when navigating away.

**Independent Test**: Create a room in tab A. Open tab B and join. Within ~4 seconds, tab A's participant list updates to show tab B's player without any manual click. Close tab B — no errors in tab A.

### Backend

- [ ] T018 Verify `GET /rooms/:code` returns the current participant list including all recent joins — already implemented, verify snapshot freshness in `backend/src/services/roomStore.ts`

### Frontend

- [ ] T019 Add polling interval (`setInterval`, ~2000ms) in `LobbyPage.tsx` that calls `fetchRoom` on each tick
- [ ] T020 Handle polling errors in `LobbyPage.tsx` — show a non-blocking error indicator, continue polling on next interval
- [ ] T021 Stop polling on component unmount (`clearInterval` in useEffect cleanup) in `LobbyPage.tsx`

**Checkpoint**: All participants see live updates in the lobby without manual refresh.

---

## Phase 6: User Story 4 — Host Starts the Game (Priority: P2)

**Goal**: The host can start the game when ≥2 participants are present. Non-hosts never see the button. The button is disabled with "Waiting for players..." when alone.

**Independent Test**: Host is in a room with 1 participant — button is disabled. Second player joins — button enables. Host clicks — both participants see game page. Open second browser as joiner — no Start Game button visible.

### Backend

- [ ] T022 Implement `startGame` function in `backend/src/services/roomStore.ts` that validates:
- [ ] T023 [P] Add `startGameSchema` (with `participantId: z.string()`) to `backend/src/api/schemas.ts`
- [ ] T024 [P] Add `POST /:code/start` route in `backend/src/api/rooms.ts` that calls `startGame` and returns the updated room snapshot with status `"playing"`

### Frontend

- [ ] T025 [P] Add `startGame(code, participantId)` method to API client in `frontend/src/services/api.ts`
- [ ] T026 [P] Add `startGame` action to room store in `frontend/src/state/roomStore.ts`
- [ ] T027 Update `LobbyPage.tsx` to enable the Start Game button when `participants.length >= 2` and viewer is host; show contextual message "Waiting for players..." when disabled
- [ ] T028 Update `LobbyPage.tsx` to hide the Start Game button entirely for non-host participants

**Checkpoint**: Host can start the game, non-hosts cannot. The full lobby flow is complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T029 Run `cd backend && npm test` and `cd frontend && npm test` to confirm existing tests still pass
- [ ] T030 Run through all validation scenarios in `quickstart.md` to confirm end-to-end flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — can be the MVP
- **User Story 2 (Phase 4)**: Depends on Foundational — independent of US1
- **User Story 3 (Phase 5)**: Depends on US2 (needs two participants to join for polling to be observable)
- **User Story 4 (Phase 6)**: Depends on US1 (needs host) and US2 (needs ≥2 participants)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — independent of US1
- **User Story 3 (P2)**: Depends on US2 being implementable (needs two participants in room)
- **User Story 4 (P2)**: Depends on US1 (host exists) and US2 (≥2 participants exist)

### Within Each User Story

- Models before services — Services before endpoints — Core implementation before frontend integration

### Parallel Opportunities

- T002 and T003 (Phase 2) can run in parallel (different fields on same file, but low risk)
- T005/T006 (Phase 3 backend) and T007/T008 (Phase 3 frontend) can run in parallel
- T011/T012 (Phase 4 backend) and T014/T015/T016 (Phase 4 frontend) can run in parallel
- Phase 3 (US1) and Phase 4 (US2) can run in parallel after Foundational
- All frontend [P] tasks within a phase can run in parallel with the phase's backend tasks

---

## Parallel Example: User Story 1

```bash
# Backend and frontend can be done in parallel:
Task: "Set hostParticipantId in createRoom"        (backend)
Task: "Add playerName Zod validation to schema"     (backend)
Task: "Add hostParticipantId to room store state"   (frontend)
Task: "CreateRoomPage name validation"              (frontend)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Host creates room)
4. **STOP and VALIDATE**: Test US1 independently via quickstart.md
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → **MVP!**
3. Add User Story 2 → Test independently → join flow works
4. Add User Story 3 → Test independently → auto-polling works
5. Add User Story 4 → Test independently → game start works
6. Polish → full feature complete

### Parallel Team Strategy

With multiple developers:
1. Complete Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + User Story 4 (host-centric)
   - Developer B: User Story 2 + User Story 3 (joiner-centric)
3. Stories complete and integrate independently
