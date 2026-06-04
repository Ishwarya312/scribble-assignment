# Data Model: Game Initialization and Role Assignment

## Entities

### Room

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Unique 4-character alphanumeric identifier (uppercase, no ambiguous chars) |
| `status` | `"lobby" \| "playing"` | Current room state |
| `participants` | `Participant[]` | Ordered list of participants (first = host) |
| `hostParticipantId` | `string` | UUID of the room creator |
| `drawerParticipantId` | `string` (optional) | UUID of the assigned drawer; set when status transitions to "playing" |
| `secretWord` | `string` (optional) | The word guessers must guess; set when game starts, stored only on Room (not exposed to guessers in snapshot) |
| `createdAt` | `string` (ISO 8601) | Room creation timestamp |
| `updatedAt` | `string` (ISO 8601) | Last mutation timestamp |

### Participant

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique participant identifier |
| `name` | `string` | Display name (trimmed, non-empty) |
| `joinedAt` | `string` (ISO 8601) | Join timestamp |

### RoomSnapshot (viewer-contextualized)

| Field | Type | Condition |
|-------|------|-----------|
| `code` | `string` | Always present |
| `status` | `"lobby" \| "playing"` | Always present |
| `participants` | `Participant[]` | Always present |
| `hostParticipantId` | `string` | Always present |
| `drawerParticipantId` | `string` | Present when status is "playing" |
| `role` | `"drawer" \| "guesser"` | Present when status is "playing" and viewerParticipantId is provided |
| `secretWord` | `string` | Present only when viewer is the drawer (viewerParticipantId === drawerParticipantId) |
| `availableWords` | `string[]` | Always present (starter word list) |
| `roles` | `ParticipantRole[]` | Always present (starter role list) |

## State Transitions

```
lobby ──(host clicks Start Game with ≥2 participants)──▶ playing
```

- `lobby → playing`: Triggered by `POST /rooms/:code/start`. Validates: requester is host, ≥2 participants, status is "lobby". Sets drawerParticipantId = first participant, selects secretWord deterministically.
- `playing → playing`: No transitions within this feature (round end is spec 004).

## Validation Rules

- Player name: trim, min 1 character after trimming
- Room code: case-insensitive matching, normalized to uppercase
- Start game: requester must be host, ≥2 participants, status must be "lobby"
