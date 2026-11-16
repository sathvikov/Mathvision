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
  const [brushSize, setBrushSize] = useState<number>(5);
  const [history, setHistory] = useState<ImageData[]>([]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // Load external image onto canvas if requested (for presets)
  useEffect(() => {
    if (!initialImageUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.min(hRatio, vRatio) * 0.88;
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
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([snapshot]);
      canvas.toBlob((blob) => {
        onDrawEnd(blob);
      }, "image/png");
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), snapshot]);
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ("touches" in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    saveState();
    setIsDrawing(true);
    ctx.beginPath();
    const { x, y } = getCanvasCoords(e);
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas) {
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
    const ctx = canvas.getContext("2d");
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
            { label: "Fine", size: 3 },
            { label: "Medium", size: 5 },
            { label: "Thick", size: 8 },
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
        className="w-full relative border border-card-border rounded-md overflow-hidden bg-white shadow-inner"
        style={{ touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-[180px] cursor-crosshair block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
}
