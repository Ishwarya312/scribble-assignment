# Quickstart: Lobby, Validation & Host Management

## Prerequisites

- Node.js 20+
- Backend and frontend dependencies installed (`cd backend && npm install` + `cd frontend && npm install`)

## Running

```bash
# Terminal 1: Start backend
cd backend && npm run dev     # Runs on http://localhost:3001

# Terminal 2: Start frontend
cd frontend && npm run dev    # Runs on http://localhost:5173
```

## Validation Scenarios

### Scenario 1: Create a room with valid name

1. Open `http://localhost:5173`
2. Click "Create Room"
3. Enter name "Alice" → click Submit
4. **Expected**: Redirected to lobby. Room code visible. "Alice" in participant list. "Start Game" button visible but disabled. "Waiting for players..." message shown.

### Scenario 2: Create room with empty name rejected

1. Click "Create Room"
2. Leave name empty → click Submit
3. **Expected**: Error message "Name is required" displayed. No redirect.

### Scenario 3: Join a room with valid code

1. From Scenario 1 lobby, note the room code (e.g. "ABCD")
2. Open a second browser tab at `http://localhost:5173`
3. Click "Join Room"
4. Enter name "Bob" and code "ABCD" → click Submit
5. **Expected**: Redirected to lobby. Both "Alice" and "Bob" in participant list. "Start Game" button visible to Alice's tab but not Bob's.

### Scenario 4: Join with invalid room code

1. Click "Join Room"
2. Enter name "Bob" and code "ZZZZ" → click Submit
3. **Expected**: Error message "Room not found" displayed. No redirect.

### Scenario 5: Lobby auto-polling

1. Already on lobby in Scenario 3 (both tabs)
2. **Expected**: Within ~4 seconds of Bob joining, Alice's participant list updates to show Bob.

### Scenario 6: Host starts the game

1. Alice's tab has ≥2 participants and "Start Game" enabled
2. Alice clicks "Start Game"
3. **Expected**: Alice's tab navigates to `/game` immediately. Bob's tab detects the status change via polling and navigates to `/game` within ~4 seconds. Room status is now "playing".

### Scenario 7: Non-host cannot start

1. Bob's tab has no "Start Game" button visible
2. **Expected**: Bob cannot find or interact with any start-game control.

## Verification

- Check backend API directly:
  ```bash
  # Create room
  curl -s -X POST http://localhost:3001/rooms/ \
    -H "Content-Type: application/json" \
    -d '{"playerName":"Alice"}'
  
  # Fetch room (use code from response)
  curl -s http://localhost:3001/rooms/ABCD
  
  # Join room
  curl -s -X POST http://localhost:3001/rooms/ABCD/join \
    -H "Content-Type: application/json" \
    -d '{"playerName":"Bob"}'
  
  # Start game (use host participantId from create response)
  curl -s -X POST http://localhost:3001/rooms/ABCD/start \
    -H "Content-Type: application/json" \
    -d '{"participantId":"<host-uuid>"}'
  ```

## Running Tests

```bash
cd backend && npm test     # Backend vitest suite
cd frontend && npm test    # Frontend vitest suite (requires jsdom)
```

Refer to [data-model.md](data-model.md) for entity definitions and [contracts/](contracts/) for API shapes.
