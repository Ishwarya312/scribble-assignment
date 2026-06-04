# Quickstart Validation: Results and Restart Flow

## Prerequisites
- Backend dev server running: `cd backend && npm run dev`
- Frontend dev server running: `cd frontend && npm run dev`

## Validation Scenarios

### Scenario 1: Host ends round

1. Open two browser tabs, join the same room as host (Tab A) and guesser (Tab B).
2. Host starts the game (Tab A).
3. In Tab B, submit a few guesses (some correct, some incorrect).
4. In Tab A, **verify the "End Round" button is visible** (host-only, only during "playing").
5. Click "End Round" in Tab A.
6. **Verify in both tabs**: within ~4 seconds, both show:
   - Room status "finished"
   - The correct word visible to all
   - All participants' final scores
   - Full guess history (who guessed what, which were correct)
   - The final drawing still visible

### Scenario 2: Non-host cannot end round

1. While a game is in progress in Tab B (guesser), verify there is **no "End Round" button** visible.
2. (If the guesser tries to call the API directly from dev tools, they get a 400 error.)

### Scenario 3: Host restarts game

1. After completing Scenario 1, verify in Tab A:
   - A "Restart" button is visible (host-only, only when "finished").
2. Click "Restart" in Tab A.
3. **Verify in both tabs**: within ~4 seconds, both show:
   - Room status "lobby"
   - The same participants present
   - All scores at 0
   - No guess history
   - No drawing
   - No secret word
   - No drawer assignment

### Scenario 4: Non-host sees "Waiting for host"

1. After completing Scenario 1, verify in Tab B (guesser):
   - The results view shows the correct word, scores, and guess history.
   - There is **no "Restart" button** visible.
   - A "Waiting for host..." message is displayed.

### Scenario 5: Idempotency guards

1. **Double end-round**: After ending a round, try to end it again → gets a 400 error.
2. **Double restart**: After restarting, try to restart again → gets a 400 error.
3. **End round from lobby**: If the room is in "lobby" (before start), try end-round → gets a 400 error.
4. **Restart from playing**: During a game, try restart → gets a 400 error.

### Scenario 6: Network error handling

1. Stop the backend server while on the results view.
2. **Verify**: an inline error message appears near the action buttons, but the last successful data remains displayed.
3. Restart the backend, click "Restart" → should work normally.

## Commands

```bash
# Backend
cd backend && npm run dev        # Development server
cd backend && npm test           # Run tests
cd backend && npx tsc --noEmit   # TypeScript check

# Frontend
cd frontend && npm run dev       # Development server
cd frontend && npm test          # Run tests
cd frontend && npx tsc --noEmit  # TypeScript check
```
