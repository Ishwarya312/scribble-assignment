import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Name is required")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Name is required")
});

export const startGameSchema = z.object({
  participantId: z.string()
});

export const leaveRoomSchema = z.object({
  participantId: z.string()
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const guessSchema = z.object({
  participantId: z.string(),
  word: z.string().trim().min(1, "Guess cannot be empty").max(100, "Guess is too long")
});

const pointSchema = z.object({
  x: z.number(),
  y: z.number()
});

const strokeSchema = z.object({
  points: z.array(pointSchema).min(1).max(10000),
  color: z.string(),
  lineWidth: z.number().positive()
});

export const drawSchema = z.object({
  participantId: z.string(),
  stroke: strokeSchema
});

export const clearSchema = z.object({
  participantId: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
