# Data Model: Results and Restart Flow

## Room Status Enum (updated)

```typescript
type RoomStatus = "lobby" | "playing" | "finished";
```

`"finished"` is the new status value added to the existing union.

## State Transitions

```
lobby  ──[startGame]──→  playing  ──[endRound]──→  finished
                                                         │
                                              [restartGame]
                                                         │
                                                          └──→ lobby
```

- `endRound` valid only when current status is `"playing"` and requester is host.
- `restartGame` valid only when current status is `"finished"` and requester is host.

## Room Entity (existing, no new fields)

| Field | Type | Notes |
|-------|------|-------|
| status | `RoomStatus` | `"finished"` added |
| scores | `Record<string, number>` | Cleared on restart (already exists) |
| guessHistory | `Guess[]` | Cleared on restart (already exists) |
| drawing | `Stroke[]` | Cleared on restart (already exists) |
| secretWord | `string?` | Cleared on restart (already exists) |
| drawerParticipantId | `string?` | Cleared on restart (already exists) |
| participants | `Participant[]` | Preserved on restart (no change) |
| hostParticipantId | `string` | Preserved on restart (no change) |

## RoomSnapshot (updated getter logic)

The `toRoomSnapshot` function already conditionally exposes `secretWord`. Update:

- When `status === "playing"`: existing logic (only drawer sees secretWord).
- When `status === "finished"`: all participants see `secretWord`, `drawerParticipantId`, `role`, `drawing`, `scores`, `guessHistory` — regardless of role.
- All participants continue to see `drawing` (visible in results view per clarification).

## API Contracts

### POST /rooms/:code/end-round

**Request body:**
```json
{ "participantId": "uuid-string" }
```

**Success response (200):**
```json
{ "success": true }
```

**Error responses:**
| Status | Condition |
|--------|-----------|
| 400 | Not the host, or room not in "playing" state |
| 404 | Room not found |

### POST /rooms/:code/restart

**Request body:**
```json
{ "participantId": "uuid-string" }
```

**Success response (200):**
```json
{ "success": true }
```

**Error responses:**
| Status | Condition |
|--------|-----------|
| 400 | Not the host, or room not in "finished" state |
| 404 | Room not found |
