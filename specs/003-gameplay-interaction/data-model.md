# Data Model: Gameplay Interaction

## Entities

### Point

| Field | Type | Description |
|-------|------|-------------|
| `x` | `number` | X coordinate on the canvas |
| `y` | `number` | Y coordinate on the canvas |

### Stroke

| Field | Type | Description |
|-------|------|-------------|
| `points` | `Point[]` | Ordered sequence of points forming the stroke |
| `color` | `string` | Stroke color (hex, e.g. `"#000000"`) |
| `lineWidth` | `number` | Stroke width in pixels (default 3) |

### Guess

| Field | Type | Description |
|-------|------|-------------|
| `participantId` | `string` | UUID of the participant who guessed |
| `word` | `string` | The guessed word (trimmed, case-preserved) |
| `correct` | `boolean` | Whether the guess matched the secret word |
| `timestamp` | `string` (ISO 8601) | When the guess was submitted |

### Room (updated fields)

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Unique 4-character alphanumeric identifier |
| `status` | `"lobby" \| "playing"` | Current room state |
| `participants` | `Participant[]` | Ordered list of participants |
| `hostParticipantId` | `string` | UUID of the room creator |
| `drawerParticipantId` | `string` (optional) | UUID of the assigned drawer |
| `secretWord` | `string` (optional) | The word guessers must guess |
| `drawing` | `Stroke[]` | Ordered list of strokes on the canvas (empty array initially) |
| `guessHistory` | `Guess[]` | Ordered list of all guesses submitted |
| `scores` | `Record<string, number>` | Map of participantId → total score |
| `createdAt` | `string` (ISO 8601) | Room creation timestamp |
| `updatedAt` | `string` (ISO 8601) | Last mutation timestamp |

### RoomSnapshot (updated)

| Field | Type | Condition |
|-------|------|-----------|
| `code` | `string` | Always present |
| `status` | `"lobby" \| "playing"` | Always present |
| `participants` | `Participant[]` | Always present |
| `hostParticipantId` | `string` | Always present |
| `drawerParticipantId` | `string` | Present when status is "playing" |
| `role` | `"drawer" \| "guesser"` | Present when status is "playing" and viewerParticipantId provided |
| `secretWord` | `string` | Present only when viewer is the drawer |
| `drawing` | `Stroke[]` | Always present (empty array when no strokes) |
| `guessHistory` | `Guess[]` | Always present (empty array when no guesses) |
| `scores` | `Record<string, number>` | Always present (empty object when no scores) |
| `availableWords` | `string[]` | Always present |
| `roles` | `ParticipantRole[]` | Always present |

## State Transitions

```
lobby ──(host starts game)──▶ playing
playing ──(drawer adds stroke)──▶ playing  (drawing updated)
playing ──(drawer clears)──▶ playing      (drawing reset to [])
playing ──(guesser submits guess)──▶ playing  (guessHistory + scores updated)
```

- `drawing`: Appended to via `POST /:code/draw`. Cleared via `POST /:code/clear`. Full state returned in every snapshot.
- `guessHistory`: Appended to via `POST /:code/guess`. Never cleared during a round. Full list returned in every snapshot.
- `scores`: Updated when a correct guess is processed. Incremented by 100. Full map returned in every snapshot.

## Validation Rules

- Guess word: trim, min 1 char, max 100 chars after trimming
- Guess comparison: case-insensitive after trimming
- Already-correct guesser: subsequent guesses rejected with error
- Drawer cannot guess: drawer role cannot submit guesses (rejected by backend)
- Stroke: must have at least 1 point, max 10000 points per stroke
- Canvas clear: only drawer can clear
