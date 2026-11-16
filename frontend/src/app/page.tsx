"use client";

import React, { useState, useRef, useEffect } from "react";
import DrawingCanvas from "@/components/DrawingCanvas";

const PRESET_EXAMPLES = [
  { label: "2x + 5 = 15", file: "/examples/example_2xp5e15.png", desc: "Linear Equation" },
  { label: "3x - 7 = 11", file: "/examples/example_3xm7e11.png", desc: "Linear Equation" },
  { label: "7x = 35", file: "/examples/example_7xe35.png", desc: "Single Step" },
  { label: "4x + 2 = 18", file: "/examples/example_4xp2e18.png", desc: "Linear Equation" },
  { label: "12 + 8 = 20", file: "/examples/example_12p8e20.png", desc: "Arithmetic Check" },
  { label: "20 ÷ 4 = 5", file: "/examples/example_20d4e5.png", desc: "Division Check" },
];

export default function Home() {
  const [inputMode, setInputMode] = useState<"Draw" | "Upload">("Draw");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [presetUrl, setPresetUrl] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

  // Check backend health on mount
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setBackendStatus(data.online ? "online" : "offline");
        } else {
          if (isMounted) setBackendStatus("offline");
        }
      } catch {
        if (isMounted) setBackendStatus("offline");
      }
    };
    checkHealth();
    return () => {
      isMounted = false;
    };
  }, [API_URL]);

  const handleClear = () => {
    setBlob(null);
    setPresetUrl(null);
    setActivePreset(null);
    setClearTrigger((c) => c + 1);
    setResult(null);
    setError(null);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBlob(e.target.files[0]);
      setActivePreset(null);
      setPresetUrl(null);
      setResult(null);
      setError(null);
    }
  };

  const handleLoadPreset = (example: typeof PRESET_EXAMPLES[0]) => {
    setInputMode("Draw");
    setActivePreset(example.label);
    setPresetUrl(example.file);
    setResult(null);
    setError(null);
  };

  const handleSolve = async () => {
    if (!blob) {
      setError("Please draw or select an equation first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", blob, "equation.png");

    try {
      const res = await fetch(`${API_URL}/solve`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to solve equation.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while communicating with backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `Equation: ${result.equation}\nSolution: ${result.solution}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen p-6 md:p-10 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-card-border pb-4 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-accent">&Sigma;</span>
            <h1 className="text-2xl font-bold tracking-widest">MATHVISION</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono tracking-wider">
            HANDWRITTEN MATHEMATICAL RECOGNITION &amp; SYMBOLIC SOLVER
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-900 border border-card-border">
            <span
              className={`w-2 h-2 rounded-full inline-block ${
                backendStatus === "online"
                  ? "bg-accent shadow-[0_0_8px_#b4ff00]"
                  : backendStatus === "checking"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-red-500 shadow-[0_0_8px_#ff4444]"
              }`}
            ></span>
            <span className="text-gray-300">
              API: {backendStatus === "online" ? "ONLINE" : backendStatus === "checking" ? "CHECKING..." : "OFFLINE"}
            </span>
          </div>
          <a
            href="https://github.com/Sankethhhhhhh/Mathvision"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition"
          >
            GitHub &rarr;
          </a>
        </div>
      </header>

      {/* Preset Examples Shelf */}
      <section className="bg-zinc-950 border border-card-border rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
            Quick-Try Preset Equations
          </span>
          <span className="text-[11px] font-mono text-gray-500">1-click test real handwritten samples</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {PRESET_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => handleLoadPreset(ex)}
              className={`p-2.5 rounded border text-left transition flex flex-col justify-between ${
                activePreset === ex.label
                  ? "border-accent bg-accent/10"
                  : "border-card-border bg-card-bg hover:border-gray-500"
              }`}
            >
              <span className="font-mono text-sm font-semibold text-white block truncate">{ex.label}</span>
              <span className="text-[10px] font-mono text-gray-400 mt-1 block">{ex.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Main 2-Column Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Input Workspace */}
        <section className="mathvision-card flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs tracking-widest text-gray-300 font-mono">INPUT WORKSPACE</h2>
            <div className="flex border border-card-border rounded bg-black overflow-hidden text-xs font-mono">
              <button
                className={`px-4 py-1 transition ${
                  inputMode === "Draw" ? "bg-accent text-black font-semibold" : "text-gray-400 hover:text-white"
                }`}
                onClick={() => {
                  setInputMode("Draw");
                  handleClear();
                }}
              >
                Draw
              </button>
              <button
                className={`px-4 py-1 transition ${
                  inputMode === "Upload" ? "bg-accent text-black font-semibold" : "text-gray-400 hover:text-white"
                }`}
                onClick={() => {
                  setInputMode("Upload");
                  handleClear();
                }}
              >
                Upload
              </button>
            </div>
          </div>

          <div>
            {inputMode === "Draw" ? (
              <DrawingCanvas
                onDrawEnd={setBlob}
                onClear={() => setBlob(null)}
                clearTrigger={clearTrigger}
                initialImageUrl={presetUrl}
              />
            ) : (
              <div
                className="h-[180px] flex flex-col justify-center items-center text-gray-300 border-2 border-dashed border-card-border hover:border-accent/60 bg-zinc-950 rounded-md cursor-pointer transition p-4 text-center"
                onClick={() => fileInputRef.current?.click()}
              >
                {blob ? (
                  <div className="flex flex-col items-center gap-1 font-mono">
                    <span className="text-accent text-sm">Image Selected</span>
                    <span className="text-xs text-gray-400">{blob instanceof File ? blob.name : "Ready"}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 font-mono">
                    <span className="text-sm">Click to browse or drop an equation image</span>
                    <span className="text-xs text-gray-500">(Supports PNG, JPG, WEBP)</span>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleUpload}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded font-mono text-sm transition"
              onClick={handleClear}
            >
              CLEAR
            </button>
            <button
              className="flex-1 bg-accent text-black font-bold py-2.5 rounded font-mono text-sm hover:bg-[#c9ff33] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(180,255,0,0.25)]"
              disabled={!blob || loading}
              onClick={handleSolve}
            >
              {loading ? "SOLVING..." : "SOLVE EQUATION"}
            </button>
          </div>

          {error && (
            <div className="text-red-400 text-xs font-mono bg-red-950/40 border border-red-800/60 p-3 rounded">
              {error}
            </div>
          )}
        </section>

        {/* Right Side: Result & Explanation */}
        <section className="mathvision-card flex flex-col gap-5 justify-between">
          <div className="flex justify-between items-center border-b border-card-border pb-3">
            <h2 className="text-xs tracking-widest text-gray-300 font-mono">SOLVER RESULT</h2>
            {result && (
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-mono px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded transition"
              >
                {copied ? "COPIED ✔" : "COPY"}
              </button>
            )}
          </div>

          {result ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-gray-400 text-[11px] font-mono uppercase tracking-wider mb-1">
                  Recognized Expression
                </p>
                <div className="text-2xl font-mono p-3 bg-black rounded border border-card-border text-white">
                  {result.equation || <span className="text-gray-600">No expression</span>}
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-[11px] font-mono uppercase tracking-wider mb-1">
                  Computed Solution
                </p>
                <div className="text-2xl text-accent font-bold font-mono p-3 bg-black rounded border border-card-border">
                  {result.solution}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950 p-3 rounded border border-card-border">
                  <p className="text-gray-400 text-[11px] font-mono mb-1">CONFIDENCE</p>
                  <div className="text-lg font-mono font-bold text-white">
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-zinc-950 p-3 rounded border border-card-border">
                  <p className="text-gray-400 text-[11px] font-mono mb-1">INFERENCE LATENCY</p>
                  <div className="text-lg font-mono font-bold text-white">
                    {result.inference_time_ms ? result.inference_time_ms.toFixed(0) : "0"} ms
                  </div>
                </div>
              </div>

              {result.steps && result.steps.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-gray-400 text-[11px] font-mono uppercase tracking-wider border-b border-card-border pb-1">
                    Step-by-Step Derivation
                  </p>
                  <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                    {result.steps.map((step: any, i: number) => (
                      <div
                        key={i}
                        className="text-xs font-mono bg-zinc-950 p-2.5 rounded border border-card-border flex flex-col gap-1"
                      >
                        <span className="text-gray-400 text-[11px]">{step.operation}</span>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">{step.before}</span>
                          <span className="text-accent font-semibold">&rarr; {step.after}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.symbols && result.symbols.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-gray-400 text-[11px] font-mono uppercase tracking-wider border-b border-card-border pb-1">
                    Segmented Symbols ({result.symbols.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.symbols.map((sym: any, i: number) => (
                      <div
                        key={i}
                        className="bg-black border border-card-border p-2 rounded flex flex-col items-center min-w-[50px]"
                      >
                        <span className="text-lg font-mono font-bold text-white">{sym.symbol}</span>
                        <div className="w-full h-1 bg-card-border mt-1 relative rounded overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-accent"
                            style={{ width: `${sym.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 font-mono">
                          {(sym.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-mono text-sm bg-black rounded border border-card-border min-h-[300px] p-6 text-center">
              <span className="text-3xl text-gray-600 mb-2">&Sigma;</span>
              <p>DRAW AN EQUATION OR SELECT A PRESET TO SOLVE</p>
              <p className="text-xs text-gray-600 mt-1">Supports linear equations and arithmetic expressions</p>
            </div>
          )}
        </section>
      </div>

      {/* Pipeline Visualizer Footer */}
      <footer className="mathvision-card">
        <h2 className="text-xs tracking-widest text-gray-300 font-mono mb-3">SYSTEM INFERENCE PIPELINE</h2>
        <div className="flex flex-wrap justify-between items-center font-mono text-xs text-gray-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white"></span> INPUT
          </div>
          <span className="text-card-border hidden sm:inline">&rarr;</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span> PREPROCESS (OPENCV)
          </div>
          <span className="text-card-border hidden sm:inline">&rarr;</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span> SEGMENTATION
          </div>
          <span className="text-card-border hidden sm:inline">&rarr;</span>
          <div className="flex items-center gap-2 text-accent">
            <span className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_5px_#b4ff00]"></span> CUSTOM CNN
          </div>
          <span className="text-card-border hidden sm:inline">&rarr;</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span> RECONSTRUCTION
          </div>
          <span className="text-card-border hidden sm:inline">&rarr;</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span> SYMPY SOLVER
          </div>
        </div>
      </footer>
    </main>
  );
}
