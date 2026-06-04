import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import type { Point, Stroke } from "../services/api";

interface DrawingCanvasProps {
  roomCode: string;
  participantId: string;
  isDrawer: boolean;
  existingStrokes: Stroke[];
}

export function DrawingCanvas({ roomCode, participantId, isDrawer, existingStrokes }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStroke = useRef<Point[]>([]);
  const allStrokes = useRef<Stroke[]>(existingStrokes);
  const [clearCount, setClearCount] = useState(0);

  const COLOR = "#000000";
  const LINE_WIDTH = 3;

  useEffect(() => {
    allStrokes.current = existingStrokes;
    renderCanvas();
  }, [existingStrokes, clearCount]);

  function getCanvasCoord(event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    if ("touches" in event) {
      const touch = event.touches[0] ?? event.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * (canvas.width / rect.width),
        y: (touch.clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function renderCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";

    for (const stroke of allStrokes.current) {
      if (stroke.points.length < 2) {
        continue;
      }

      context.beginPath();
      context.strokeStyle = stroke.color;
      context.lineWidth = stroke.lineWidth;
      context.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let index = 1; index < stroke.points.length; index++) {
        context.lineTo(stroke.points[index].x, stroke.points[index].y);
      }

      context.stroke();
    }
  }

  const handlePointerDown = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer) {
      return;
    }

    event.preventDefault();
    const point = getCanvasCoord(event);
    currentStroke.current = [point];
    setIsDrawing(true);
  }, [isDrawer]);

  const handlePointerMove = useCallback((event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer) {
      return;
    }

    event.preventDefault();
    const point = getCanvasCoord(event);
    currentStroke.current.push(point);

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const points = currentStroke.current;
    if (points.length < 2) {
      return;
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = COLOR;
    context.lineWidth = LINE_WIDTH;
    context.beginPath();
    context.moveTo(points[points.length - 2].x, points[points.length - 2].y);
    context.lineTo(point.x, point.y);
    context.stroke();
  }, [isDrawing, isDrawer]);

  const handlePointerUp = useCallback(async () => {
    if (!isDrawing || !isDrawer) {
      return;
    }

    setIsDrawing(false);
    const points = currentStroke.current;

    if (points.length < 2) {
      return;
    }

    const stroke: Stroke = {
      points,
      color: COLOR,
      lineWidth: LINE_WIDTH
    };

    allStrokes.current.push(stroke);

    try {
      await api.addStroke(roomCode, participantId, stroke);
    } catch {
      // stroke is already rendered locally; retry on next poll
    }
  }, [isDrawing, isDrawer, roomCode, participantId]);

  async function handleClear() {
    if (!isDrawer) {
      return;
    }

    allStrokes.current = [];
    setClearCount((count) => count + 1);

    try {
      await api.clearCanvas(roomCode, participantId);
    } catch {
      // canvas already cleared locally
    }
  }

  return (
    <div className="drawing-canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="drawing-canvas"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "4px",
          display: "block",
          width: "100%",
          height: "auto",
          aspectRatio: "4 / 3",
          backgroundColor: "#ffffff",
          cursor: isDrawer ? "crosshair" : "default",
          touchAction: "none"
        }}
      />
      {isDrawer ? (
        <div className="button-row" style={{ marginTop: "8px" }}>
          <button className="button button--secondary" onClick={handleClear}>
            Clear Canvas
          </button>
        </div>
      ) : null}
    </div>
  );
}
