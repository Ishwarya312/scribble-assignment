# POST /rooms/:code/restart

## Purpose
Host restarts the game after viewing results, returning the room to "lobby" status and clearing all round state.

## Request
- **Method**: POST
- **Path**: `/rooms/:code/restart`
- **Content-Type**: application/json

### Body (Zod schema)
```typescript
const restartSchema = z.object({
  participantId: z.string()
});
```

## Response

### 200 — Game restarted
```json
{ "success": true }
```
After this, the room snapshot (fetched via GET) will show `status: "lobby"`, scores reset to `{}`, guessHistory `[]`, drawing `[]`, and no secretWord or drawerParticipantId.

### 400 — Validation or business logic error
```json
{ "error": "Only the host can restart the game" }
{ "error": "Game is not in a finished state" }
```

### 404 — Room not found
```json
{ "error": "Room not found" }
```
