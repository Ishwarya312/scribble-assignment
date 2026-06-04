# Contract: Fetch Room (Viewer-Contextualized)

**Endpoint**: `GET /rooms/:code`

**Query Parameters**:
- `participantId` (string, optional) — UUID of the viewer. When provided, the response includes viewer-specific fields (`role`, `secretWord`).

**Response Shape** (status 200):

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "participants": [
      { "id": "uuid-1", "name": "Alice", "joinedAt": "2026-06-04T..." },
      { "id": "uuid-2", "name": "Bob", "joinedAt": "2026-06-04T..." }
    ],
    "hostParticipantId": "uuid-1",
    "drawerParticipantId": "uuid-1",
    "role": "drawer",
    "secretWord": "rocket",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Conditional Fields**:

| Field | Present When |
|-------|-------------|
| `drawerParticipantId` | `status === "playing"` |
| `role` | `status === "playing"` AND `participantId` query param provided |
| `secretWord` | `status === "playing"` AND viewer is the drawer (`participantId === drawerParticipantId`) |

**Error Responses**:
- `404 { "message": "Unable to load room" }` — room code does not exist
- `400 { "message": "..." }` — invalid parameters (Zod validation)

**Frontend Usage**: Call via `api.fetchRoom(code, participantId)`. The returned `RoomSnapshot` is stored in `RoomStore` via `setRoomSnapshot()`. Fields `role`, `secretWord`, and `drawerParticipantId` are available for role-aware rendering.
