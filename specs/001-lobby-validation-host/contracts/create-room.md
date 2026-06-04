# POST /rooms/

Create a new room. The creator is automatically designated as the host.

## Request

```json
{
  "playerName": "Alice"
}
```

- `playerName`: string, required. Trimmed server-side. Must be non-empty after trimming. Whitespace-only rejected with `"Name is required"`.

## Response (201)

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      {
        "id": "uuid-string",
        "name": "Alice",
        "joinedAt": "2026-06-04T12:00:00.000Z"
      }
    ],
    "hostParticipantId": "uuid-string",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

## Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| 400 | `{ "error": "Name is required" }` | Empty or whitespace-only name |
