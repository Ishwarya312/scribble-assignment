# Research: Lobby, Validation & Host Management

## Unresolved Items from Technical Context

No items marked NEEDS CLARIFICATION — all clarified during `/speckit.clarify` session.

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Host tracking | `hostParticipantId` on Room | Follows existing starter pattern; minimal footprint |
| Validation | Zod `.trim().min(1)` for names; normalized uppercase for codes | Reuses existing Zod infrastructure |
| Polling | `setInterval` in `useEffect` with cleanup on unmount | Standard React pattern; no new dependencies |
| Error messages | Specific per type (e.g. "Room not found", "Name is required") | Clarified during specification review |
| Start game guard | Backend enforces host + ≥2 participants; frontend gates UI | Defense in depth — backend is authoritative |
| HTTP routes | RESTful under `/rooms/:code` prefix | Consistent with existing route structure |

## Best Practices

- Poll interval should use `setInterval` + `clearInterval` on unmount to avoid memory leaks
- Store participantId in `sessionStorage` so page refresh preserves identity
- Room codes are 4-char alphanumeric from a 29-char alphabet (ambiguous chars excluded)
- All API errors return structured JSON with `{ error: string }` shape
