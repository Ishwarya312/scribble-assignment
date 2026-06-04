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
  it("completes lifecycle with auto-end when all guessers correct", () => {
    // --- Create room ---
    const { room: created, participantId: hostId } = createRoom("Alice");
    const code = created.code;
    expect(created.hostParticipantId).toBe(hostId);

    // --- Join room (player 2) ---
    const joinResult1 = joinRoom(code, "Bob");
    expect(joinResult1).not.toBeNull();
    const bobId = joinResult1!.participantId;

    // --- Join room (player 3) ---
    const joinResult2 = joinRoom(code, "Charlie");
    expect(joinResult2).not.toBeNull();
    const charlieId = joinResult2!.participantId;

    // --- Start game ---
    const startResult = startGame(code, hostId);
    expect("error" in startResult).toBe(false);
    const playingRoom = "room" in startResult ? startResult.room : null;
    expect(playingRoom?.status).toBe("playing");
    expect(playingRoom?.drawerParticipantId).toBe(hostId);

    // --- Guesser snapshot hides secret word ---
    const guesserSnapshot = toRoomSnapshot(playingRoom!, bobId);
    expect(guesserSnapshot.role).toBe("guesser");
    expect(guesserSnapshot.secretWord).toBeUndefined();

    // --- Drawer cannot guess ---
    const drawerGuess = submitGuess(code, hostId, "rocket");
    expect("error" in drawerGuess).toBe(true);
    if ("error" in drawerGuess) {
      expect(drawerGuess.error).toMatch(/drawer/i);
    }

    // --- Submit wrong guess ---
    const wrongGuess = submitGuess(code, bobId, "wrongword");
    expect("error" in wrongGuess).toBe(false);
    if ("guess" in wrongGuess) {
      expect(wrongGuess.guess.correct).toBe(false);
      expect(wrongGuess.score).toBe(0);
    }

    // --- Bob guesses correctly; round stays playing (Charlie hasn't guessed) ---
    const secretWord = getRoom(code)?.secretWord;
    expect(secretWord).toBeDefined();
    const bobCorrect = submitGuess(code, bobId, secretWord!);
    expect("error" in bobCorrect).toBe(false);
    if ("guess" in bobCorrect) {
      expect(bobCorrect.guess.correct).toBe(true);
      expect(bobCorrect.score).toBe(100);
    }
    expect(getRoom(code)?.status).toBe("playing");

    // --- Already-correct Bob is rejected ---
    const repeatGuess = submitGuess(code, bobId, secretWord!);
    expect("error" in repeatGuess).toBe(true);
    if ("error" in repeatGuess) {
      expect(repeatGuess.error).toMatch(/already guessed correctly/i);
    }

    // --- Draw, clear, draw ---
    const drawResult = addStroke(code, hostId, makeStroke());
    expect("error" in drawResult).toBe(false);
    const clearResult = clearDrawing(code, hostId);
    expect("error" in clearResult).toBe(false);
    const reDraw = addStroke(code, hostId, makeStroke());
    expect("error" in reDraw).toBe(false);

    // --- Non-drawer cannot draw ---
    const bobDraw = addStroke(code, bobId, makeStroke());
    expect("error" in bobDraw).toBe(true);

    // --- Charlie guesses correctly → triggers auto-end ---
    const charlieCorrect = submitGuess(code, charlieId, secretWord!);
    expect("error" in charlieCorrect).toBe(false);
    expect(getRoom(code)?.status).toBe("finished");

    // --- Finished snapshot exposes word + scores to all ---
    const finishedSnapshot = toRoomSnapshot(getRoom(code)!, bobId);
    expect(finishedSnapshot.secretWord).toBe(secretWord);
    expect(finishedSnapshot.scores[bobId]).toBe(100);
    expect(finishedSnapshot.scores[charlieId]).toBe(100);
    expect(finishedSnapshot.guessHistory).toHaveLength(3);

    // --- End round now fails (already finished by auto-end) ---
    const endAfterAuto = endRound(code, hostId);
    expect("error" in endAfterAuto).toBe(true);

    // --- Restart ---
    const restartResult = restartGame(code, hostId);
    expect("error" in restartResult).toBe(false);

    // --- Verify restart state ---
    const restartedRoom = getRoom(code);
    expect(restartedRoom?.status).toBe("lobby");
    expect(restartedRoom?.secretWord).toBeUndefined();
    expect(restartedRoom?.drawerParticipantId).toBeUndefined();
    expect(restartedRoom?.drawing).toHaveLength(0);
    expect(restartedRoom?.guessHistory).toHaveLength(0);
    expect(restartedRoom?.scores).toEqual({});

    // --- Participants preserved ---
    expect(restartedRoom?.participants).toHaveLength(3);

    // --- Non-host cannot restart ---
    expect("error" in restartGame(code, bobId)).toBe(true);

    // --- Cannot restart from lobby ---
    expect("error" in restartGame(code, hostId)).toBe(true);
  });

  it("host can manually end round early before all guessers guess correctly", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const code = room.code;
    const joinBob = joinRoom(code, "Bob");
    expect(joinBob).not.toBeNull();
    const bobId = joinBob!.participantId;

    const startResult = startGame(code, hostId);
    expect("error" in startResult).toBe(false);

    // Bob guesses wrong — not all correct, host can end manually
    submitGuess(code, bobId, "wrong");
    const endResult = endRound(code, hostId);
    expect("error" in endResult).toBe(false);
    expect(getRoom(code)?.status).toBe("finished");
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
    if ("error" in result) {
      expect(result.error).toMatch(/only the host/i);
    }
  });

  it("rejects guess for non-existent room", () => {
    const result = submitGuess("ZZZZ", "any-id", "word");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toMatch(/room not found/i);
    }
  });

  it("rejects end-round for non-existent room", () => {
    const result = endRound("ZZZZ", "any-id");
    expect("error" in result).toBe(true);
  });

  it("rejects restart for non-existent room", () => {
    const result = restartGame("ZZZZ", "any-id");
    expect("error" in result).toBe(true);
  });

  it("rejects guess when room is not playing", () => {
    const { room, participantId } = createRoom("Alice");
    const join = joinRoom(room.code, "Bob");
    expect(join).not.toBeNull();
    const guess = submitGuess(room.code, join!.participantId, "rocket");
    expect("error" in guess).toBe(true);
    if ("error" in guess) {
      expect(guess.error).toMatch(/not in progress/i);
    }
  });
});
