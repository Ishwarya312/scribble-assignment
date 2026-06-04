# Research: Gameplay Interaction

## Findings

### Drawing Data Format

| Decision | Rationale |
|----------|-----------|
| Stroke: array of Point + color + lineWidth | Simple, self-contained, easy to serialize/deserialize |
| Point: { x: number, y: number } | Standard canvas coordinate format |
| Full state per snapshot, no diffing | Simpler implementation; drawing data is small enough (<100KB for typical game) |
| POST /:code/draw sends full stroke array | Each POST appends one stroke; clear resets to empty array |

### Canvas Implementation

| Decision | Rationale |
|----------|-----------|
| HTML Canvas API (`<canvas>` element) | Lightweight, no extra dependencies, well-supported in modern browsers |
| Custom DrawingCanvas component | Encapsulates mouse/touch event handling and rendering |
| Real-time local rendering + poll-based sync | Drawer sees strokes immediately; guessers pick up via ~2s polling |
| Color: black (#000000), lineWidth: 3 | Simple default rendering — no color picker needed for MVP |

### Guess API Shape

| Decision | Rationale |
|----------|-----------|
| `POST /:code/guess` with `{ participantId, word }` | Matches existing API pattern |
| Response includes `{ correct: boolean, score: number, guessHistory: Guess[] }` | Client needs immediate feedback; full history returned for polling consistency |
| Guess validated: trim, non-empty, max 100 chars | Prevents abuse while allowing reasonable input |

### Scoring Model

| Decision | Rationale |
|----------|-----------|
| `scores: Record<string, number>` on Room | Simple key-value mapping (participantId → score) |
| 100 points per correct guess, 0 for incorrect | Fixed scoring per constitution Principle II |
| Already-correct guesser blocked at service layer | Prevents score inflation via repeated correct guesses |

### Polling & State Sync

| Decision | Rationale |
|----------|-----------|
| Existing `GET /rooms/:code?participantId=` returns drawing, guessHistory, scores | Single endpoint for all game state, minimizing API surface |
| Drawing, guess history, scores added to RoomSnapshot | All participants see the same game state (word visibility still contextualized) |
| ~2s poll interval (same as lobby pattern) | Consistent with existing pattern; ~4s max delay for state sync |

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| SVG-based drawing | Canvas is simpler for freehand drawing; SVG adds DOM overhead |
| Third-party canvas library (Fabric.js, Konva) | Adds dependency; vanilla Canvas API sufficient for freehand drawing |
| Incremental stroke sync (per-point streaming) | Over-engineered for polling-based sync; full stroke list is small |
| Separate drawing endpoint vs. room snapshot | Single snapshot endpoint is simpler; drawing is part of game state |
| WebSocket for canvas sync | Violates "No WebSockets" constraint |

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Canvas drawing performance at high DPI | Use devicePixelRatio scaling for crisp rendering |
| Large stroke data in polling responses | Strokes are arrays of {x,y} — even 100 strokes at 50 points each is ~40KB |
| Drawer clears while guesser is mid-poll | Snapshot returns empty stroke array; guesser sees blank canvas next poll |
| Multiple rapid stroke submissions | Each stroke appends independently; ordering preserved by array order |
| Network failure during stroke submission | Drawer retries on next poll cycle; local canvas shows the stroke |
