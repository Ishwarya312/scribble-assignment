import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot, Stroke } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function displayName(name?: string) {
  return name || "Player";
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostParticipantId: participant.id,
    drawing: [],
    guessHistory: [],
    scores: {},
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function removeParticipant(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const index = room.participants.findIndex((p) => p.id === participantId);

  if (index === -1) {
    return null;
  }

  room.participants.splice(index, 1);

  if (room.hostParticipantId === participantId && room.participants.length > 0) {
    room.hostParticipantId = room.participants[0].id;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);
  return cloneRoom(room);
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

type StartGameResult =
  | { error: string }
  | { room: Room };

export function startGame(code: string, participantId: string): StartGameResult {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.status !== "lobby") {
    return { error: "Game already started" };
  }

  if (room.hostParticipantId !== participantId) {
    return { error: "Only the host can start the game" };
  }

  if (room.participants.length < 2) {
    return { error: "Need at least 2 players" };
  }

  room.status = "playing";
  room.drawerParticipantId = room.participants[0].id;

  const codeSum = room.code.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  room.secretWord = STARTER_WORDS[codeSum % STARTER_WORDS.length];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

type SubmitGuessResult =
  | { error: string }
  | { guess: Guess; score: number; guessHistory: Guess[] };

export function submitGuess(code: string, participantId: string, word: string): SubmitGuessResult {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.status !== "playing") {
    return { error: "Game is not in progress" };
  }

  if (room.drawerParticipantId === participantId) {
    return { error: "Drawer cannot submit guesses" };
  }

  const alreadyCorrect = room.guessHistory.find((g) => g.participantId === participantId && g.correct);
  if (alreadyCorrect) {
    return { error: "You have already guessed correctly" };
  }

  const trimmedWord = word.trim();
  const correct = trimmedWord.toLowerCase() === (room.secretWord?.toLowerCase() ?? "");

  const guess: Guess = {
    participantId,
    word: trimmedWord,
    correct,
    timestamp: now()
  };

  room.guessHistory.push(guess);

  if (correct) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;

    const allCorrect = room.participants
      .filter((p) => p.id !== room.drawerParticipantId)
      .every((p) => room.guessHistory.some((g) => g.participantId === p.id && g.correct));

    if (allCorrect) {
      room.status = "finished";
    }
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  const score = room.scores[participantId] ?? 0;
  return { guess, score, guessHistory: [...room.guessHistory] };
}

type DrawResult =
  | { error: string }
  | { drawing: Stroke[] };

export function addStroke(code: string, participantId: string, stroke: Stroke): DrawResult {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.status !== "playing") {
    return { error: "Game is not in progress" };
  }

  if (room.drawerParticipantId !== participantId) {
    return { error: "Only the drawer can draw" };
  }

  room.drawing.push(stroke);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { drawing: structuredClone(room.drawing) };
}

type ClearResult =
  | { error: string }
  | { drawing: Stroke[] };

export function clearDrawing(code: string, participantId: string): ClearResult {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.status !== "playing") {
    return { error: "Game is not in progress" };
  }

  if (room.drawerParticipantId !== participantId) {
    return { error: "Only the drawer can clear the canvas" };
  }

  room.drawing = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { drawing: [] };
}

type EndRoundResult =
  | { error: string }
  | { success: true };

export function endRound(code: string, participantId: string): EndRoundResult {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.status !== "playing") {
    return { error: "Round is not in progress" };
  }

  if (room.hostParticipantId !== participantId) {
    return { error: "Only the host can end the round" };
  }

  room.status = "finished";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { success: true };
}

type RestartResult =
  | { error: string }
  | { success: true };

export function restartGame(code: string, participantId: string): RestartResult {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.status !== "finished") {
    return { error: "Game is not in a finished state" };
  }

  if (room.hostParticipantId !== participantId) {
    return { error: "Only the host can restart the game" };
  }

  room.status = "lobby";
  room.drawerParticipantId = undefined;
  room.secretWord = undefined;
  room.drawing = [];
  room.guessHistory = [];
  room.scores = {};
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { success: true };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostParticipantId: room.hostParticipantId,
    drawing: structuredClone(room.drawing),
    guessHistory: structuredClone(room.guessHistory),
    scores: { ...room.scores },
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.drawerParticipantId) {
    snapshot.drawerParticipantId = room.drawerParticipantId;

    if (viewerParticipantId) {
      snapshot.role = viewerParticipantId === room.drawerParticipantId ? "drawer" : "guesser";
    }
  }

  if (room.status === "playing" && viewerParticipantId === room.drawerParticipantId && room.secretWord) {
    snapshot.secretWord = room.secretWord;
  }

  if (room.status === "finished" && room.secretWord) {
    snapshot.secretWord = room.secretWord;
  }

  return snapshot;
}
