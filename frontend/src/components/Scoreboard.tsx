import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function Scoreboard() {
  const { room } = useRoomState();

  const participants = room?.participants ?? [];
  const scores = room?.scores ?? {};

  const sorted = [...participants].sort((a, b) => {
    const scoreA = scores[a.id] ?? 0;
    const scoreB = scores[b.id] ?? 0;
    return scoreB - scoreA;
  });

  return (
    <Card title="Scoreboard">
      {sorted.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sorted.map((participant) => {
            const score = scores[participant.id] ?? 0;
            return (
              <li
                key={participant.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "0.875rem"
                }}
              >
                <span>{participant.name}</span>
                <strong>{score}</strong>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
