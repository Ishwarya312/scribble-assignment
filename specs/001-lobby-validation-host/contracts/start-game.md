# POST /rooms/:code/start

Start the game. Only the host can start, and at least 2 participants must be present.

## Request

```json
{
  "participantId": "host-uuid"
}
```

- `participantId`: string, required. Must match the room's `hostParticipantId`.

## Response (200)

```json
{
  "code": "ABCD",
  "status": "playing",
  "participants": [
    { "id": "host-uuid", "name": "Alice", "joinedAt": "..." },
    { "id": "joiner-uuid", "name": "Bob", "joinedAt": "..." }
  ],
  "hostParticipantId": "host-uuid",
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"]
}
```

## Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| 403 | `{ "error": "Only the host can start the game" }` | Requesting user is not the host |
| 400 | `{ "error": "At least 2 participants required to start" }` | Room has fewer than 2 participants |
| 400 | `{ "error": "Game has already started" }` | Room status is already `"playing"` |
