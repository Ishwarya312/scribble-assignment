# Quickstart: Game Initialization and Role Assignment

## Prerequisites

- Node.js 20+
- Backend and frontend dependencies installed (`cd backend && npm install` + `cd frontend && npm install`)
- Previous features (lobby, join, start-game) fully functional

## Running

```bash
# Terminal 1: Start backend
cd backend && npm run dev     # Runs on http://localhost:3001

# Terminal 2: Start frontend
cd frontend && npm run dev    # Runs on http://localhost:5173
```

## Validation Scenarios

### Scenario 1: Drawer sees role and secret word on game page

1. Open `http://localhost:5173` (Tab A)
2. Create a room as "Alice"
3. Open a second tab at `http://localhost:5173` (Tab B)
4. Join as "Bob" with Alice's room code
5. In Tab A, click "Start Game"
6. **Expected**: Tab A navigates to `/game`. Shows role "drawer" and the secret word (e.g., "rocket"). Tab B navigates to `/game` within ~4 seconds.

### Scenario 2: Guesser sees role and drawer identity, no secret word

1. After Scenario 1, inspect Tab B (Bob's view)
2. **Expected**: Shows role "guesser". Shows "Alice is drawing" or equivalent. The secret word is NOT visible. Shows "Waiting for first guess..." prompt.

### Scenario 3: Game page shows loading state initially

1. Create a room, join as second player, start the game
2. Navigate directly to `/game` in a tab that already has room state (from lobby)
3. **Expected**: Briefly shows "Loading game..." before first poll returns role-specific content

### Scenario 4: Game page polls for state changes

1. After Scenario 1, inspect the network tab
2. **Expected**: `GET /rooms/:code?participantId=` is called approximately every 2 seconds
3. Navigate away from the game page
4. **Expected**: Polling stops (no further requests to the fetch endpoint)

### Scenario 5: Non-host cannot start the game

1. After Scenario 1, inspect Tab B (Bob's view)
2. **Expected**: No "Start Game" button visible. No start-game controls on the page.

## Verification

```bash
# Fetch room as drawer (viewerParticipantId = drawer's UUID)
curl -s "http://localhost:3001/rooms/ABCD?participantId=<drawer-uuid>"

# Expected: response includes "role": "drawer" and "secretWord"

# Fetch room as guesser (viewerParticipantId = guesser's UUID)
curl -s "http://localhost:3001/rooms/ABCD?participantId=<guesser-uuid>"

# Expected: response includes "role": "guesser" but NO "secretWord" field
```

## Running Tests

```bash
cd backend && npm test     # Backend vitest suite
cd frontend && npm test    # Frontend vitest suite (requires jsdom)
```

Refer to [data-model.md](data-model.md) for entity definitions and [contracts/](contracts/) for API shapes.
