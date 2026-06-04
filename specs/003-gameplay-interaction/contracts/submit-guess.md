# Contract: Submit Guess

**Endpoint**: `POST /rooms/:code/guess`

**Request Body**:

```json
{
  "participantId": "uuid-1",
  "word": "rocket"
}
```

**Validation**:
- `participantId`: string, required
- `word`: string, trimmed, min 1 char, max 100 chars

**Response (correct guess — 200)**:

```json
{
  "correct": true,
  "score": 100,
  "guessHistory": [
    {
      "participantId": "uuid-1",
      "word": "rocket",
      "correct": true,
      "timestamp": "2026-06-04T12:00:00.000Z"
    }
  ]
}
```

**Response (incorrect guess — 200)**:

```json
{
  "correct": false,
  "score": 0,
  "guessHistory": [
    {
      "participantId": "uuid-1",
      "word": "pizza",
      "correct": false,
      "timestamp": "2026-06-04T12:00:00.000Z"
    }
  ]
}
```

**Error Responses**:
- `400` — Empty/whitespace guess (`{ "message": "Guess cannot be empty" }`)
- `400` — Drawer cannot guess (`{ "message": "Drawer cannot submit guesses" }`)
- `400` — Already guessed correctly (`{ "message": "You have already guessed correctly" }`)
- `400` — Room not in playing state (`{ "message": "Game is not in progress" }`)
- `404` — Room not found (`{ "message": "Room not found" }`)

**Frontend Usage**: Call via `api.submitGuess(code, participantId, word)`. Use the `correct` field for immediate feedback. The `guessHistory` and score can be used to update local state, but the next poll will return the authoritative state.
