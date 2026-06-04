# Contract: Add Stroke

**Endpoint**: `POST /rooms/:code/draw`

**Request Body**:

```json
{
  "participantId": "uuid-1",
  "stroke": {
    "points": [
      { "x": 100, "y": 200 },
      { "x": 150, "y": 250 },
      { "x": 200, "y": 300 }
    ],
    "color": "#000000",
    "lineWidth": 3
  }
}
```

**Validation**:
- `participantId`: string, required
- `stroke.points`: array, min 1 item, max 10000 items
- `stroke.color`: string, required
- `stroke.lineWidth`: number, positive

**Response (200)**:

```json
{
  "drawing": [
    {
      "points": [
        { "x": 100, "y": 200 },
        { "x": 150, "y": 250 },
        { "x": 200, "y": 300 }
      ],
      "color": "#000000",
      "lineWidth": 3
    }
  ]
}
```

**Error Responses**:
- `400` — Only drawer can draw (`{ "message": "Only the drawer can draw" }`)
- `400` — Room not in playing state (`{ "message": "Game is not in progress" }`)
- `404` — Room not found (`{ "message": "Room not found" }`)

**Frontend Usage**: Call via `api.addStroke(code, participantId, stroke)`. Called once per stroke after the user finishes drawing (mouseup/touchend). The returned `drawing` array contains all strokes. The drawer's local canvas already shows the stroke; the response confirms server sync.
