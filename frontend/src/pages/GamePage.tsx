import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { api } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [pollError, setPollError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) {
      return;
    }

    async function poll() {
      try {
        await roomStore.fetchRoom();
        setPollError(null);
        setInitialLoad(false);
      } catch (caughtError) {
        setPollError(caughtError instanceof Error ? caughtError.message : "Poll failed");
        setInitialLoad(false);
      }
    }

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (pollRef.current !== null) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [roomStore, room]);

  if (!room) {
    return null;
  }

  const roomCode = room.code;

  async function handleExit() {
    if (!participantId) {
      navigate("/lobby");
      return;
    }
    try {
      await api.leaveRoom(roomCode, participantId);
    } catch {
    }
    navigate("/lobby");
  }

  if (initialLoad) {
    return (
      <section className="panel game-page">
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          <p>Loading game...</p>
        </div>
      </section>
    );
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawerName = room.participants.find((participant) => participant.id === room.drawerParticipantId)?.name ?? "Unknown";
  const isDrawer = room.role === "drawer";

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">{isDrawer ? "You are drawing!" : "Guess the Word!"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <div className="canvas-placeholder" style={{ minHeight: '500px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
              Waiting for drawer...
            </div>
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{room.role === "drawer" ? "Drawing" : "Guessing"}</dd>
              </div>
            </dl>
          </Card>

          {isDrawer ? (
            <Card title="Your Word">
              <p style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', padding: '8px', margin: 0 }}>{room.secretWord}</p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center' }}>Draw the word for others to guess</p>
            </Card>
          ) : (
            <Card title="Drawer">
              <p>{drawerName} is drawing</p>
            </Card>
          )}

          <Card title="Your Guess">
            {isDrawer ? (
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>You are drawing — no guessing needed</p>
            ) : (
              <GuessForm />
            )}
          </Card>
        </aside>
      </div>

      <div>
        {pollError ? <p style={{ padding: '8px', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '4px', textAlign: 'center' }}>{pollError}</p> : null}
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={handleExit}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
