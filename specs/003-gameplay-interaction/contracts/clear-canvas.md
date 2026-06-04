# Contract: Clear Canvas

**Endpoint**: `POST /rooms/:code/clear`

**Request Body**:

```json
{
  "participantId": "uuid-1"
}
```

**Validation**:
- `participantId`: string, required

**Response (200)**:

```json
{
  "drawing": []
}
```

**Error Responses**:
- `400` — Only drawer can clear (`{ "message": "Only the drawer can clear the canvas" }`)
- `400` — Room not in playing state (`{ "message": "Game is not in progress" }`)
- `404` — Room not found (`{ "message": "Room not found" }`)

**Frontend Usage**: Call via `api.clearCanvas(code, participantId)`. The drawer's local canvas is cleared immediately. All participants see the empty canvas on the next poll.
