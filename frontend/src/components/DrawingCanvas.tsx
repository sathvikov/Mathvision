"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  onDrawEnd: (blob: Blob | null) => void;
  onClear: () => void;
  clearTrigger?: number;
  initialImageUrl?: string | null;
}

export default function DrawingCanvas({
  onDrawEnd,
  onClear,
  clearTrigger,
  initialImageUrl,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState<number>(7);
  const [history, setHistory] = useState<ImageData[]>([]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // Load external image onto canvas (for presets)
  useEffect(() => {
    if (!initialImageUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.min(hRatio, vRatio) * 0.85;
      const centerShiftX = (canvas.width - img.width * ratio) / 2;
      const centerShiftY = (canvas.height - img.height * ratio) / 2;
      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShiftX,
        centerShiftY,
        img.width * ratio,
        img.height * ratio
      );
      try {
        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([snapshot]);
        canvas.toBlob((blob) => {
          if (blob) onDrawEnd(blob);
        }, "image/png");
      } catch (err) {
        console.warn("Could not capture preset snapshot:", err);
      }
    };
    img.src = initialImageUrl;
  }, [initialImageUrl, onDrawEnd]);

  useEffect(() => {
    if (clearTrigger !== undefined && clearTrigger > 0) {
      initCanvas();
      onDrawEnd(null);
    }
  }, [clearTrigger, initCanvas, onDrawEnd]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), snapshot]);
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    saveState();
    setIsDrawing(true);
    ctx.beginPath();
    const { x, y } = getCanvasCoords(e);
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
      canvas.toBlob((blob) => {
        onDrawEnd(blob);
      }, "image/png");
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) {
      initCanvas();
      onDrawEnd(null);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const previousState = history[history.length - 2];
    ctx.putImageData(previousState, 0, 0);
    setHistory((prev) => prev.slice(0, -1));

    canvas.toBlob((blob) => {
      onDrawEnd(blob);
    }, "image/png");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs font-mono text-gray-400 px-1">
        <div className="flex items-center gap-2">
          <span>STROKE:</span>
          {[
            { label: "Fine", size: 4 },
            { label: "Medium", size: 7 },
            { label: "Thick", size: 11 },
          ].map((b) => (
            <button
              key={b.size}
              type="button"
              onClick={() => setBrushSize(b.size)}
              className={`px-2 py-0.5 rounded transition ${
                brushSize === b.size
                  ? "bg-accent text-black font-bold"
                  : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleUndo}
          disabled={history.length === 0}
          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          &larr; Undo
        </button>
      </div>

      <div
        className="w-full relative border border-card-border rounded-md overflow-hidden bg-white shadow-inner select-none"
        style={{ touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-[180px] cursor-crosshair block touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    </div>
  );
}
