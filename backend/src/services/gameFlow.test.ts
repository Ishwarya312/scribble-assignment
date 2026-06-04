import { describe, expect, it } from "vitest";
import {
  addStroke,
  clearDrawing,
  createRoom,
  endRound,
  getRoom,
  joinRoom,
  restartGame,
  startGame,
  submitGuess,
  toRoomSnapshot,
} from "./roomStore.js";
import type { Stroke } from "../models/game.js";

function makeStroke(): Stroke {
  return {
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 200 },
    ],
    color: "#000000",
    lineWidth: 2,
  };
}

describe("full game flow integration", () => {
  it("correct guess auto-ends round and shows results; restart preserves players", () => {
    // --- Create room ---
    const { room: created, participantId: hostId } = createRoom("Alice");
    const code = created.code;

    // --- Join room (player 2) ---
    const joinBob = joinRoom(code, "Bob");
    expect(joinBob).not.toBeNull();
    const bobId = joinBob!.participantId;

    // --- Join room (player 3) ---
    const joinCharlie = joinRoom(code, "Charlie");
    expect(joinCharlie).not.toBeNull();
    const charlieId = joinCharlie!.participantId;

    // --- Start game ---
    const startResult = startGame(code, hostId);
    expect("error" in startResult).toBe(false);
    expect(getRoom(code)?.status).toBe("playing");

    // --- Drawer cannot guess ---
    expect(submitGuess(code, hostId, "rocket")).toMatchObject({ error: expect.stringMatching(/drawer/i) });

    // --- Bob guesses wrong ---
    const wrongGuess = submitGuess(code, bobId, "wrongword");
    expect("error" in wrongGuess).toBe(false);
    if ("guess" in wrongGuess) {
      expect(wrongGuess.guess.correct).toBe(false);
      expect(wrongGuess.score).toBe(0);
    }

    // --- Drawer draws and clears ---
    expect("error" in addStroke(code, hostId, makeStroke())).toBe(false);
    expect("error" in clearDrawing(code, hostId)).toBe(false);
    expect("error" in addStroke(code, hostId, makeStroke())).toBe(false);

    // --- Non-drawer cannot draw ---
    expect(addStroke(code, bobId, makeStroke())).toMatchObject({ error: expect.stringMatching(/only the drawer/i) });

    // --- Bob guesses correctly → round auto-ends ---
    const secretWord = getRoom(code)?.secretWord;
    expect(secretWord).toBeDefined();
    const correctGuess = submitGuess(code, bobId, secretWord!);
    expect("error" in correctGuess).toBe(false);
    if ("guess" in correctGuess) {
      expect(correctGuess.guess.correct).toBe(true);
      expect(correctGuess.score).toBe(100);
    }

    // --- Verify round ended ---
    expect(getRoom(code)?.status).toBe("finished");

    // --- Already-correct guesser and remaining guesser both get "not in progress" (status check fires first) ---
    expect(submitGuess(code, bobId, secretWord!)).toMatchObject({ error: expect.stringMatching(/not in progress/i) });
    expect(submitGuess(code, charlieId, secretWord!)).toMatchObject({ error: expect.stringMatching(/not in progress/i) });

    // --- Finished snapshot exposes word + scores to all ---
    const snapshot = toRoomSnapshot(getRoom(code)!, bobId);
    expect(snapshot.secretWord).toBe(secretWord);
    expect(snapshot.scores[bobId]).toBe(100);

    // --- endRound fails (already finished by auto-end) ---
    expect(endRound(code, hostId)).toMatchObject({ error: expect.stringMatching(/not in progress/i) });

    // --- Non-host cannot restart ---
    expect(restartGame(code, bobId)).toMatchObject({ error: expect.stringMatching(/only the host/i) });

    // --- Restart ---
    expect("error" in restartGame(code, hostId)).toBe(false);

    // --- Verify restart state ---
    const restartedRoom = getRoom(code);
    expect(restartedRoom?.status).toBe("lobby");
    expect(restartedRoom?.secretWord).toBeUndefined();
    expect(restartedRoom?.drawerParticipantId).toBeUndefined();
    expect(restartedRoom?.drawing).toHaveLength(0);
    expect(restartedRoom?.guessHistory).toHaveLength(0);
    expect(restartedRoom?.scores).toEqual({});
    expect(restartedRoom?.participants).toHaveLength(3);
  });

  it("rejects start with fewer than 2 players", () => {
    const { room, participantId } = createRoom("Solo");
    const result = startGame(room.code, participantId);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toMatch(/at least 2 players/i);
    }
  });

  it("rejects non-host start", () => {
    const { room: r } = createRoom("Host");
    const guestJoin = joinRoom(r.code, "Guest");
    expect(guestJoin).not.toBeNull();
    const result = startGame(r.code, guestJoin!.participantId);
    expect("error" in result).toBe(true);
    expect(result).toMatchObject({ error: expect.stringMatching(/only the host/i) });
  });

  it("rejects actions for non-existent room", () => {
    expect(submitGuess("ZZZZ", "any-id", "word")).toMatchObject({ error: expect.stringMatching(/room not found/i) });
    expect(endRound("ZZZZ", "any-id")).toMatchObject({ error: expect.stringMatching(/room not found/i) });
    expect(restartGame("ZZZZ", "any-id")).toMatchObject({ error: expect.stringMatching(/room not found/i) });
  });

  it("rejects guess when room is not playing", () => {
    const { room, participantId } = createRoom("Alice");
    const join = joinRoom(room.code, "Bob");
    expect(join).not.toBeNull();
    const guess = submitGuess(room.code, join!.participantId, "rocket");
    expect("error" in guess).toBe(true);
    expect(guess).toMatchObject({ error: expect.stringMatching(/not in progress/i) });
  });
});
