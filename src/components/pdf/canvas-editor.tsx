"use client";

import * as React from "react";
import {
  Pen,
  Highlighter,
  Type,
  Square,
  Circle,
  Stamp,
  FileSignature,
  Undo,
  Trash2,
  Download,
  Palette,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ToolMode = "select" | "pen" | "highlighter" | "text" | "rectangle" | "circle" | "stamp" | "signature";

interface CanvasEditorProps {
  fileName?: string;
  onExport: (dataUrl: string) => void;
}

export function CanvasEditor({ fileName = "document.pdf", onExport }: CanvasEditorProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = React.useState<ToolMode>("pen");
  const [strokeColor, setStrokeColor] = React.useState<string>("#4f46e5");
  const [strokeWidth, setStrokeWidth] = React.useState<number>(3);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [history, setHistory] = React.useState<ImageData[]>([]);
  const [currentStamp, setCurrentStamp] = React.useState<string>("APPROVED");
  const [signatureText, setSignatureText] = React.useState<string>("");

  // Initialize canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw standard document background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw document layout mockup
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(40, 40, canvas.width - 80, 24);

    ctx.fillStyle = "#334155";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillText("Executive Agreement & Document Review", 45, 58);

    ctx.fillStyle = "#94a3b8";
    for (let y = 90; y < canvas.height - 80; y += 22) {
      const w = (y % 40 === 0) ? (canvas.width - 160) : (canvas.width - 100);
      ctx.fillRect(45, y, w, 8);
    }

    // Save initial state
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setHistory((prev) => [...prev.slice(-10), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const nextHistory = [...history];
    nextHistory.pop();
    const previousState = nextHistory[nextHistory.length - 1];
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
      setHistory(nextHistory);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "pen" || activeTool === "highlighter") {
      setIsDrawing(true);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = activeTool === "highlighter" ? "rgba(250, 204, 21, 0.45)" : strokeColor;
      ctx.lineWidth = activeTool === "highlighter" ? 18 : strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    } else if (activeTool === "text") {
      const text = prompt("Enter text annotation:") || "";
      if (text) {
        ctx.fillStyle = strokeColor;
        ctx.font = `${strokeWidth * 4 + 12}px sans-serif`;
        ctx.fillText(text, x, y);
        saveState();
      }
    } else if (activeTool === "stamp") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.2);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.strokeRect(-60, -20, 120, 40);
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(currentStamp, 0, 0);
      ctx.restore();
      saveState();
    } else if (activeTool === "rectangle") {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.strokeRect(x - 40, y - 25, 80, 50);
      saveState();
    } else if (activeTool === "circle") {
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, 2 * Math.PI);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
      saveState();
    } else if (activeTool === "signature") {
      const name = signatureText || "J. Doe";
      ctx.font = "italic bold 24px 'Brush Script MT', cursive, sans-serif";
      ctx.fillStyle = strokeColor;
      ctx.fillText(name, x, y);
      ctx.font = "10px monospace";
      ctx.fillStyle = "#64748b";
      ctx.fillText(`Digitally signed: ${new Date().toLocaleDateString()}`, x, y + 14);
      saveState();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onExport(dataUrl);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      {/* Editor Toolbox */}
      <div className="w-full lg:w-64 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-subtle shrink-0">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono mb-2">Tools</h4>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setActiveTool("pen")}
              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-colors ${
                activeTool === "pen"
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-semibold"
                  : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Pen className="w-4 h-4" /> Draw Pen
            </button>
            <button
              onClick={() => setActiveTool("highlighter")}
              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-colors ${
                activeTool === "highlighter"
                  ? "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-semibold"
                  : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Highlighter className="w-4 h-4" /> Highlight
            </button>
            <button
              onClick={() => setActiveTool("text")}
              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-colors ${
                activeTool === "text"
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 font-semibold"
                  : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Type className="w-4 h-4" /> Add Text
            </button>
            <button
              onClick={() => setActiveTool("stamp")}
              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-colors ${
                activeTool === "stamp"
                  ? "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-semibold"
                  : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Stamp className="w-4 h-4" /> Stamps
            </button>
            <button
              onClick={() => setActiveTool("rectangle")}
              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-colors ${
                activeTool === "rectangle"
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-indigo-300 font-semibold"
                  : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Square className="w-4 h-4" /> Rectangle
            </button>
            <button
              onClick={() => setActiveTool("signature")}
              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-colors ${
                activeTool === "signature"
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-indigo-300 font-semibold"
                  : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <FileSignature className="w-4 h-4" /> Sign
            </button>
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono mb-2">Color</h4>
          <div className="flex items-center gap-2">
            {["#4f46e5", "#ef4444", "#10b981", "#0284c7", "#000000"].map((c) => (
              <button
                key={c}
                onClick={() => setStrokeColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  strokeColor === c ? "scale-125 border-slate-900 dark:border-white ring-2 ring-indigo-500" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Stamp Selector */}
        {activeTool === "stamp" && (
          <div>
            <h4 className="text-xs font-semibold text-slate-500 mb-1.5">Stamp Text</h4>
            <select
              value={currentStamp}
              onChange={(e) => setCurrentStamp(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            >
              <option value="APPROVED">APPROVED</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="DRAFT">DRAFT</option>
              <option value="FINAL">FINAL</option>
              <option value="VOID">VOID</option>
            </select>
          </div>
        )}

        {/* Signature Input */}
        {activeTool === "signature" && (
          <div>
            <h4 className="text-xs font-semibold text-slate-500 mb-1.5">Signature Name</h4>
            <input
              type="text"
              placeholder="e.g. Johnathan Doe"
              value={signatureText}
              onChange={(e) => setSignatureText(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>
        )}

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <Button variant="outline" size="sm" onClick={undo} className="w-1/2 text-xs gap-1">
            <Undo className="w-3.5 h-3.5" /> Undo
          </Button>
          <Button size="sm" onClick={handleExport} className="w-1/2 text-xs gap-1">
            <Download className="w-3.5 h-3.5" /> Save
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-center">
        <canvas
          ref={canvasRef}
          width={580}
          height={780}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="bg-white rounded-lg shadow-elevated cursor-crosshair border border-slate-300 dark:border-slate-700"
        />
      </div>
    </div>
  );
}
