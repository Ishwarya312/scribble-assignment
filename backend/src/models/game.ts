export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  lineWidth: number;
}

export interface Guess {
  participantId: string;
  word: string;
  correct: boolean;
  timestamp: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string;
  drawerParticipantId?: string;
  secretWord?: string;
  drawing: Stroke[];
  guessHistory: Guess[];
  scores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string;
  drawerParticipantId?: string;
  role?: ParticipantRole;
  secretWord?: string;
  drawing: Stroke[];
  guessHistory: Guess[];
  scores: Record<string, number>;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
