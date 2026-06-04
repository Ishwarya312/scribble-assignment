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
  it("completes a full game lifecycle: create → join → start → guess → draw → clear → end → restart", () => {
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

    // --- Verify lobby snapshot ---
    const lobbySnapshot = toRoomSnapshot(getRoom(code)!, hostId);
    expect(lobbySnapshot.status).toBe("lobby");
    expect(lobbySnapshot.participants).toHaveLength(3);

    // --- Start game ---
    const startResult = startGame(code, hostId);
    expect("error" in startResult).toBe(false);
    const playingRoom = "room" in startResult ? startResult.room : null;
    expect(playingRoom?.status).toBe("playing");
    expect(playingRoom?.drawerParticipantId).toBeDefined();
    expect(playingRoom?.secretWord).toBeDefined();

    // --- Drawer is first participant (Alice) ---
    expect(playingRoom?.drawerParticipantId).toBe(hostId);

    // --- Drawer snapshot includes secret word ---
    const drawerSnapshot = toRoomSnapshot(playingRoom!, hostId);
    expect(drawerSnapshot.role).toBe("drawer");
    expect(drawerSnapshot.secretWord).toBeDefined();

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

    // --- Submit correct guess ---
    const secretWord = getRoom(code)?.secretWord;
    expect(secretWord).toBeDefined();
    const correctGuess = submitGuess(code, bobId, secretWord!);
    expect("error" in correctGuess).toBe(false);
    if ("guess" in correctGuess) {
      expect(correctGuess.guess.correct).toBe(true);
      expect(correctGuess.score).toBe(100);
    }

    // --- Already-correct guesser is rejected ---
    const repeatGuess = submitGuess(code, bobId, secretWord!);
    expect("error" in repeatGuess).toBe(true);
    if ("error" in repeatGuess) {
      expect(repeatGuess.error).toMatch(/already guessed correctly/i);
    }

    // --- Another guesser guesses correctly ---
    const charlieGuess = submitGuess(code, charlieId, secretWord!);
    expect("error" in charlieGuess).toBe(false);
    if ("guess" in charlieGuess) {
      expect(charlieGuess.guess.correct).toBe(true);
      expect(charlieGuess.score).toBe(100);
    }

    // --- Drawer adds stroke ---
    const drawResult = addStroke(code, hostId, makeStroke());
    expect("error" in drawResult).toBe(false);
    if ("drawing" in drawResult) {
      expect(drawResult.drawing).toHaveLength(1);
    }

    // --- Non-drawer cannot draw ---
    const bobDraw = addStroke(code, bobId, makeStroke());
    expect("error" in bobDraw).toBe(true);
    if ("error" in bobDraw) {
      expect(bobDraw.error).toMatch(/only the drawer/i);
    }

    // --- Clear canvas ---
    const clearResult = clearDrawing(code, hostId);
    expect("error" in clearResult).toBe(false);
    if ("drawing" in clearResult) {
      expect(clearResult.drawing).toHaveLength(0);
    }

    // --- Re-draw after clear ---
    const reDraw = addStroke(code, hostId, makeStroke());
    expect("error" in reDraw).toBe(false);
    if ("drawing" in reDraw) {
      expect(reDraw.drawing).toHaveLength(1);
    }

    // --- End round ---
    const endResult = endRound(code, hostId);
    expect("error" in endResult).toBe(false);

    // --- Verify finished state ---
    const finishedRoom = getRoom(code);
    expect(finishedRoom?.status).toBe("finished");

    // --- Finished snapshot exposes secret word to all ---
    const finishedSnapshot = toRoomSnapshot(finishedRoom!, bobId);
    expect(finishedSnapshot.secretWord).toBeDefined();
    expect(finishedSnapshot.scores[bobId]).toBe(100);
    expect(finishedSnapshot.scores[charlieId]).toBe(100);
    expect(finishedSnapshot.guessHistory).toHaveLength(3);

    // --- Non-host cannot end round ---
    const nonHostEnd = endRound(code, bobId);
    expect("error" in nonHostEnd).toBe(true);

    // --- Cannot end round twice ---
    const doubleEnd = endRound(code, hostId);
    expect("error" in doubleEnd).toBe(true);

    // --- Restart game ---
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

    // --- Participants preserved after restart ---
    expect(restartedRoom?.participants).toHaveLength(3);
    expect(restartedRoom?.participants[0].name).toBe("Alice");
    expect(restartedRoom?.participants[1].name).toBe("Bob");
    expect(restartedRoom?.participants[2].name).toBe("Charlie");

    // --- Non-host cannot restart ---
    const nonHostRestart = restartGame(code, bobId);
    expect("error" in nonHostRestart).toBe(true);

    // --- Cannot restart from lobby ---
    const lobbyRestart = restartGame(code, hostId);
    expect("error" in lobbyRestart).toBe(true);
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

  it("rejects draw for non-existent room", () => {
    const result = addStroke("ZZZZ", "any-id", makeStroke());
    expect("error" in result).toBe(true);
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

  it("rejects draw when room is not playing", () => {
    const { room } = createRoom("Alice");
    const result = addStroke(room.code, "any-id", makeStroke());
    expect("error" in result).toBe(true);
  });

  it("rejects clear when room is not playing", () => {
    const { room } = createRoom("Alice");
    const result = clearDrawing(room.code, "any-id");
    expect("error" in result).toBe(true);
  });
});
