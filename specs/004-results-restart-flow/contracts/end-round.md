# POST /rooms/:code/end-round

## Purpose
Host ends the active round, transitioning the room from "playing" to "finished".

## Request
- **Method**: POST
- **Path**: `/rooms/:code/end-round`
- **Content-Type**: application/json

### Body (Zod schema)
```typescript
const endRoundSchema = z.object({
  participantId: z.string()
});
```

## Response

### 200 — Round ended
```json
{ "success": true }
```
The room snapshot (fetched via GET) will now have `status: "finished"` and all participants will see the correct word, scores, and guess history.

### 400 — Validation or business logic error
```json
{ "error": "Only the host can end the round" }
{ "error": "Round is not in progress" }
```

### 404 — Room not found
```json
{ "error": "Room not found" }
```
