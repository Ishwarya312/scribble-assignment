import { Router } from "express";
import {
  clearSchema,
  createRoomSchema,
  drawSchema,
  endRoundSchema,
  guessSchema,
  HttpError,
  joinRoomSchema,
  leaveRoomSchema,
  restartSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema
} from "./schemas.js";
import { addStroke, clearDrawing, createRoom, endRound, getRoom, joinRoom, removeParticipant, restartGame, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code.toUpperCase(), playerName);

      if (!result) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const result = startGame(code.toUpperCase(), participantId);

      if ("error" in result) {
        throw new HttpError(400, result.error);
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/leave", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = leaveRoomSchema.parse(request.body);
      const room = removeParticipant(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(404, "Room or participant not found");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, word } = guessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, word);

      if ("error" in result) {
        throw new HttpError(400, result.error);
      }

      response.json({
        correct: result.guess.correct,
        score: result.score,
        guessHistory: result.guessHistory
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/draw", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, stroke } = drawSchema.parse(request.body);
      const result = addStroke(code.toUpperCase(), participantId, stroke);

      if ("error" in result) {
        throw new HttpError(400, result.error);
      }

      response.json({
        drawing: result.drawing
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearSchema.parse(request.body);
      const result = clearDrawing(code.toUpperCase(), participantId);

      if ("error" in result) {
        throw new HttpError(400, result.error);
      }

      response.json({
        drawing: result.drawing
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end-round", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = endRoundSchema.parse(request.body);
      const result = endRound(code.toUpperCase(), participantId);

      if ("error" in result) {
        throw new HttpError(400, result.error);
      }

      response.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartSchema.parse(request.body);
      const result = restartGame(code.toUpperCase(), participantId);

      if ("error" in result) {
        throw new HttpError(400, result.error);
      }

      response.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
