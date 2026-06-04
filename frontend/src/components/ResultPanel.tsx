import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();

  const guesses = room?.guessHistory ?? [];

  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses yet.</p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {guesses.map((guess, index) => {
            const name = room?.participants.find((p) => p.id === guess.participantId)?.name ?? "Unknown";
            return (
              <li
                key={index}
                style={{
                  padding: "6px 0",
                  borderBottom: index < guesses.length - 1 ? "1px solid #e5e7eb" : "none",
                  fontSize: "0.875rem"
                }}
              >
                <span style={{ fontWeight: 500 }}>{name}</span>: "{guess.word}"
                <span style={{ color: guess.correct ? "#059669" : "#dc2626", marginLeft: "4px" }}>
                  {guess.correct ? "✓" : "✗"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
