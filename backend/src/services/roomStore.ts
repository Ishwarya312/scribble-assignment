import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
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

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostParticipantId: room.hostParticipantId,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.status === "playing" && room.drawerParticipantId) {
    snapshot.drawerParticipantId = room.drawerParticipantId;

    if (viewerParticipantId) {
      snapshot.role = viewerParticipantId === room.drawerParticipantId ? "drawer" : "guesser";
    }

    if (viewerParticipantId === room.drawerParticipantId && room.secretWord) {
      snapshot.secretWord = room.secretWord;
    }
  }

  return snapshot;
}
