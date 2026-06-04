# POST /rooms/:code/join

Join an existing room by code. Code matching is case-insensitive.

## Request

```json
{
  "playerName": "Bob"
}
```

- `playerName`: string, required. Trimmed server-side. Must be non-empty after trimming.

## Response (200)

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "host-uuid", "name": "Alice", "joinedAt": "..." },
      { "id": "joiner-uuid", "name": "Bob", "joinedAt": "..." }
    ],
    "hostParticipantId": "host-uuid",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

## Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{ "error": "Name is required" }` | Empty or whitespace-only name |
| 404 | `{ "error": "Room not found" }` | Room code does not match any existing room |
