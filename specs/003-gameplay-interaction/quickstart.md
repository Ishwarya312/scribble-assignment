# Quickstart: Gameplay Interaction

## Prerequisites

- Node.js 20+
- Dependencies installed (`cd backend && npm install` + `cd frontend && npm install`)
- Previous features (lobby, join, start-game, game page) fully functional

## Running

```bash
# Terminal 1: Start backend
cd backend && npm run dev     # Runs on http://localhost:3001

# Terminal 2: Start frontend
cd frontend && npm run dev    # Runs on http://localhost:5173
```

## Validation Scenarios

### Scenario 1: Drawer draws on canvas and clears

1. Open `http://localhost:5173` (Tab A) — create room as "Alice"
2. Open Tab B — join as "Bob"
3. Tab A clicks "Start Game"
4. **Expected**: Tab A shows blank canvas, "You are drawing!" title, secret word card
5. Draw a few strokes on the canvas
6. **Expected**: Each stroke appears immediately on Tab A's canvas
7. Click "Clear" button
8. **Expected**: All strokes disappear, canvas is blank

### Scenario 2: Guesser submits a guess

1. After Scenario 1, note the secret word shown to Alice (Tab A)
2. In Tab B (Bob), type the correct word in the guess form and submit
3. **Expected**: "Correct!" feedback shown, Bob's score shows 100
4. Submit an incorrect word
5. **Expected**: "Incorrect" feedback shown, score remains 100
6. Submit an empty guess
7. **Expected**: Rejected with error message, no score change

### Scenario 3: Drawing and guess sync via polling

1. After Scenario 1, open Tab A (drawer) and Tab B (guesser) side by side
2. Draw a star shape in Tab A
3. **Expected**: Within ~4 seconds, Tab B shows the same star shape
4. Submit "pizza" (incorrect) in Tab B
5. **Expected**: Within ~4 seconds, Tab A shows "pizza" in the guess history with an incorrect indicator
6. Submit the correct word in Tab B
7. **Expected**: Within ~4 seconds, Tab A shows the correct guess in history, Tab B's score shows 100

### Scenario 4: Scores visible to all

1. After Scenario 2, observe both tabs
2. **Expected**: Both tabs show Bob's score as 100, Alice's score as 0
3. Open Tab C — join as "Charlie"
4. Charlie guesses correctly
5. **Expected**: All three tabs show Charlie's score as 100 after poll

### Scenario 5: Drawer cannot guess

1. In Tab A (Alice, drawer), verify there is no guess input form
2. **Expected**: The "Your Guess" card shows "You are drawing — no guessing needed"
3. Try calling the guess API directly:
   ```bash
   curl -X POST http://localhost:3001/rooms/ABCD/guess \
     -H "Content-Type: application/json" \
     -d '{"participantId": "<alice-uuid>", "word": "rocket"}'
   ```
4. **Expected**: 400 error, `"Drawer cannot submit guesses"`

## Verification

```bash
# Submit a guess
curl -X POST "http://localhost:3001/rooms/ABCD/guess" \
  -H "Content-Type: application/json" \
  -d '{"participantId": "<guesser-uuid>", "word": "rocket"}'

# Expected: {"correct":true,"score":100,"guessHistory":[...]}

# Add a stroke
curl -X POST "http://localhost:3001/rooms/ABCD/draw" \
  -H "Content-Type: application/json" \
  -d '{"participantId": "<drawer-uuid>", "stroke": {"points": [{"x":0,"y":0},{"x":100,"y":100}], "color": "#000000", "lineWidth": 3}}'

# Expected: {"drawing":[{"points":[...],"color":"#000000","lineWidth":3}]}

# Clear canvas
curl -X POST "http://localhost:3001/rooms/ABCD/clear" \
  -H "Content-Type: application/json" \
  -d '{"participantId": "<drawer-uuid>"}'

# Expected: {"drawing":[]}
```

## Running Tests

```bash
cd backend && npm test     # Backend vitest suite
cd frontend && npm test    # Frontend vitest suite (requires jsdom)
```

Refer to [data-model.md](data-model.md) for entity definitions and [contracts/](contracts/) for API shapes.
