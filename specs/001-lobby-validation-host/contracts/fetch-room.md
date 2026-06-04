# GET /rooms/:code?participantId=<uuid>

Fetch the current state of a room. The `participantId` query param identifies the viewer for future contextualization.

## Response (200)

```json
{
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
```

## Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| 404 | `{ "error": "Room not found" }` | Room code does not match any existing room |
