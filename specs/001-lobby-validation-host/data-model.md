# Data Model: Lobby, Validation & Host Management

## Entities

### Room

A game session identified by a unique code. All data lives in-memory.

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | 4-char alphanumeric unique identifier (uppercase, excluding O/0/I/1) |
| `status` | `"lobby"` or `"playing"` | Current room phase |
| `participants` | `Participant[]` | Ordered list of participants (creation order) |
| `hostParticipantId` | `string` | UUID of the participant who created the room |
| `createdAt` | `string` | ISO 8601 timestamp of room creation |
| `updatedAt` | `string` | ISO 8601 timestamp of last mutation |

**Validation rules**:
- `code` is auto-generated, must be unique across all rooms
- `hostParticipantId` must match exactly one participant's `id`
- Status transitions: `"lobby"` → `"playing"` only
- At least 2 participants required before status can transition to `"playing"`

---

### Participant

A player in a room.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | UUID generated at creation/join time |
| `name` | `string` | Player display name (trimmed, non-empty) |
| `joinedAt` | `string` | ISO 8601 timestamp of when the player joined |

**Validation rules**:
- `name` must be non-empty after trimming whitespace
- `name` with only whitespace is rejected
- Special characters in `name` are accepted as-is (no sanitization beyond trimming)

---

### RoomSnapshot

A read-only projection of a Room returned to API consumers.

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Room code |
| `status` | `"lobby"` or `"playing"` | Current room phase |
| `participants` | `Participant[]` | All participants currently in the room |
| `hostParticipantId` | `string` | UUID of the host participant |
| `availableWords` | `string[]` | Seed word list (included for future game start) |
| `roles` | `string[]` | Available roles (included for future game start) |

---

## State Transitions

```text
                    ┌──────────────┐
                    │    lobby     │
                    │  (created)   │
                    └──────┬───────┘
                           │
                    host starts game
                    (≥2 participants)
                           │
                           ▼
                    ┌──────────────┐
                    │   playing    │
                    │  (playing)   │
                    └──────────────┘
```

- Room is created in `"lobby"` status
- Room transitions to `"playing"` when host calls start-game with ≥2 participants
- Host-less rooms remain in their current state (cannot transition without host)

## Identity & Uniqueness

- **Room code**: Unique across all rooms, generated server-side
- **Participant ID**: UUID, unique per participant instance
- **Same participant re-joining**: Identified by matching participantId; should be rejected or return existing state
