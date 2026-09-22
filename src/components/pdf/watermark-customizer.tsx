"use client";

import * as React from "react";
import { WatermarkOptions } from "@/lib/pdf/pdf-engine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Stamp,
  Type,
  Move,
  RotateCw,
  Palette,
  Eye,
  Sliders,
  Grid,
  Layers,
  Sparkles,
  Check,
  FileText,
} from "lucide-react";

interface WatermarkCustomizerProps {
  value: WatermarkOptions;
  onChange: (opts: WatermarkOptions) => void;
  fileName?: string;
}

const PRESET_TEXTS = [
  "CONFIDENTIAL",
  "DRAFT",
  "COPY",
  "ORIGINAL",
  "APPROVED",
  "TOP SECRET",
  "SAMPLE",
  "FOR REVIEW",
  "DO NOT DISTRIBUTE",
];

const PRESET_COLORS = [
  { label: "Crimson Red", hex: "#ef4444" },
  { label: "Indigo Blue", hex: "#6366f1" },
  { label: "Slate Gray", hex: "#64748b" },
  { label: "Emerald Green", hex: "#10b981" },
  { label: "Amber Gold", hex: "#f59e0b" },
  { label: "Midnight Black", hex: "#0f172a" },
];

export function WatermarkCustomizer({ value, onChange, fileName }: WatermarkCustomizerProps) {
  const [activeTab, setActiveTab] = React.useState<"text" | "style" | "position" | "pages">("text");
  const previewRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const update = (patch: Partial<WatermarkOptions>) => {
    onChange({ ...value, ...patch });
  };

  // Handle clicking or dragging on preview to set custom position
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    update({
      position: "custom",
      customX: Math.round(x),
      customY: Math.round(y),
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    update({
      position: "custom",
      customX: Math.round(x),
      customY: Math.round(y),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Compute watermark position coordinates for preview
  const getPreviewCoordinates = () => {
    const pos = value.position || "center";
    if (pos === "top-left") return { left: "22%", top: "18%" };
    if (pos === "top-center") return { left: "50%", top: "15%" };
    if (pos === "top-right") return { left: "78%", top: "18%" };
    if (pos === "center-left") return { left: "22%", top: "50%" };
    if (pos === "center") return { left: "50%", top: "50%" };
    if (pos === "center-right") return { left: "78%", top: "50%" };
    if (pos === "bottom-left") return { left: "22%", top: "82%" };
    if (pos === "bottom-center") return { left: "50%", top: "85%" };
    if (pos === "bottom-right") return { left: "78%", top: "82%" };
    if (pos === "custom") {
      return {
        left: `${value.customX ?? 50}%`,
        top: `${value.customY ?? 50}%`,
      };
    }
    return { left: "50%", top: "50%" };
  };

  const coords = getPreviewCoordinates();
  const rotation = value.rotationDegrees ?? 45;
  const opacity = value.opacity ?? 0.35;
  const fontSize = value.fontSize ?? 48;
  const colorHex = value.colorHex ?? "#ef4444";
  const fontFamily =
    value.fontFamily === "times"
      ? "'Times New Roman', Times, serif"
      : value.fontFamily === "courier"
      ? "'Courier New', Courier, monospace"
      : "Helvetica, Arial, sans-serif";

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT: Live Interactive Visual Document Preview */}
        <div className="w-full lg:w-5/12 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-500" /> Live Interactive Preview
            </span>
            <span className="text-[11px] text-slate-400">Click document to position textbox</span>
          </div>

          <div
            ref={previewRef}
            onClick={handlePreviewClick}
            className="relative w-full aspect-[1/1.414] max-w-[320px] bg-white dark:bg-slate-900 rounded-2xl shadow-elevated border-2 border-slate-200 dark:border-slate-800 p-5 overflow-hidden select-none cursor-crosshair group transition-all"
          >
            {/* Imitated Document Page Content Mock */}
            <div className="space-y-3 opacity-30 pointer-events-none">
              <div className="h-3 w-1/3 bg-slate-400 dark:bg-slate-600 rounded"></div>
              <div className="space-y-1.5 pt-2">
                <div className="h-2 w-full bg-slate-300 dark:bg-slate-700 rounded"></div>
                <div className="h-2 w-11/12 bg-slate-300 dark:bg-slate-700 rounded"></div>
                <div className="h-2 w-4/5 bg-slate-300 dark:bg-slate-700 rounded"></div>
                <div className="h-2 w-full bg-slate-300 dark:bg-slate-700 rounded"></div>
              </div>

              <div className="h-16 w-full bg-slate-200 dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="h-2 w-full bg-slate-300 dark:bg-slate-700 rounded"></div>
                <div className="h-2 w-10/12 bg-slate-300 dark:bg-slate-700 rounded"></div>
                <div className="h-2 w-full bg-slate-300 dark:bg-slate-700 rounded"></div>
                <div className="h-2 w-3/4 bg-slate-300 dark:bg-slate-700 rounded"></div>
              </div>
            </div>

            {/* WATERMARK OVERLAY */}
            {value.position === "tile" ? (
              /* Mosaic / Tile repeat mode */
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-4 p-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-center">
                    <span
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        opacity: opacity,
                        color: colorHex,
                        fontFamily: fontFamily,
                        fontWeight: value.isBold !== false ? "bold" : "normal",
                        fontStyle: value.isItalic ? "italic" : "normal",
                        fontSize: `${Math.max(9, Math.floor(fontSize * 0.18))}px`,
                      }}
                      className="whitespace-nowrap tracking-wider select-none font-bold"
                    >
                      {value.text || "WATERMARK"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* Single / Custom positioned Watermark Textbox */
              <div
                style={{
                  position: "absolute",
                  left: coords.left,
                  top: coords.top,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  opacity: opacity,
                  cursor: isDragging ? "grabbing" : "grab",
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="group/tag inline-flex items-center justify-center select-none"
              >
                <div className="relative border-2 border-dashed border-indigo-400/40 hover:border-indigo-600 rounded px-2 py-0.5 transition-all">
                  <span
                    style={{
                      color: colorHex,
                      fontFamily: fontFamily,
                      fontWeight: value.isBold !== false ? "bold" : "normal",
                      fontStyle: value.isItalic ? "italic" : "normal",
                      fontSize: `${Math.max(12, Math.floor(fontSize * 0.38))}px`,
                    }}
                    className="whitespace-nowrap tracking-wider select-none"
                  >
                    {value.text || "WATERMARK"}
                  </span>
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-indigo-600 rounded-full text-[8px] text-white opacity-0 group-hover/tag:opacity-100 flex items-center justify-center">
                    <Move className="w-2 h-2" />
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Drag the watermark box or click any position on the sheet.
          </p>
        </div>

        {/* RIGHT: Full Watermark Configuration Tabs */}
        <div className="w-full lg:w-7/12 space-y-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            {[
              { id: "text", label: "Watermark Text", icon: Type },
              { id: "style", label: "Style & Color", icon: Palette },
              { id: "position", label: "Position", icon: Move },
              { id: "pages", label: "Page Range", icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: TEXT CONTENT */}
          {activeTab === "text" && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Watermark Textbox Content
                </label>
                <input
                  type="text"
                  value={value.text}
                  onChange={(e) => update({ text: e.target.value })}
                  placeholder="Enter watermark text..."
                  className="w-full text-sm font-semibold p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                  Quick Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TEXTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => update({ text: preset })}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        value.text === preset
                          ? "bg-indigo-600 text-white border-indigo-600 font-semibold shadow-sm"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STYLE & COLOR */}
          {activeTab === "style" && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
              {/* Font Family & Styles */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Font Family
                  </label>
                  <select
                    value={value.fontFamily || "helvetica"}
                    onChange={(e) => update({ fontFamily: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <option value="helvetica">Helvetica (Clean Sans)</option>
                    <option value="times">Times New Roman (Serif)</option>
                    <option value="courier">Courier (Monospace)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Typography Style
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => update({ isBold: !(value.isBold !== false) })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        value.isBold !== false
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500"
                      }`}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ isItalic: !value.isItalic })}
                      className={`flex-1 py-2 rounded-xl text-xs italic font-serif border transition-all ${
                        value.isItalic
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500"
                      }`}
                    >
                      I
                    </button>
                  </div>
                </div>
              </div>

              {/* Font Size & Opacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Font Size</label>
                    <span className="text-xs font-mono text-indigo-600 font-bold">{fontSize} pt</span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="100"
                    step="2"
                    value={fontSize}
                    onChange={(e) => update({ fontSize: parseInt(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Opacity</label>
                    <span className="text-xs font-mono text-indigo-600 font-bold">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => update({ opacity: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              {/* Color Swatches + Hex Input */}
              <div className="pt-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Watermark Color
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => update({ colorHex: c.hex })}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-xl border-2 transition-all ${
                        colorHex.toLowerCase() === c.hex.toLowerCase()
                          ? "border-indigo-600 scale-110 shadow-md ring-2 ring-indigo-400/40"
                          : "border-white dark:border-slate-800 hover:scale-105"
                      }`}
                      title={c.label}
                    />
                  ))}
                  <div className="flex items-center gap-1.5 ml-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => update({ colorHex: e.target.value })}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={colorHex}
                      onChange={(e) => update({ colorHex: e.target.value })}
                      className="w-20 text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: POSITION & ROTATION */}
          {activeTab === "position" && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
              {/* Rotation */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-indigo-500" /> Rotation Angle
                  </label>
                  <span className="text-xs font-mono text-indigo-600 font-bold">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={rotation}
                  onChange={(e) => update({ rotationDegrees: parseInt(e.target.value) })}
                  className="w-full accent-indigo-600 mb-2"
                />
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "0° (Flat)", deg: 0 },
                    { label: "45° (Diagonal)", deg: 45 },
                    { label: "-45° (Reverse)", deg: -45 },
                    { label: "90° (Vertical)", deg: 90 },
                  ].map((preset) => (
                    <button
                      key={preset.deg}
                      type="button"
                      onClick={() => update({ rotationDegrees: preset.deg })}
                      className={`text-[11px] py-1.5 rounded-lg border text-center transition-all ${
                        rotation === preset.deg
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 font-semibold"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 9-Grid Position Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Position Preset Grid
                </label>
                <div className="grid grid-cols-3 gap-1.5 max-w-[260px] mx-auto">
                  {[
                    { id: "top-left", label: "TL" },
                    { id: "top-center", label: "Top" },
                    { id: "top-right", label: "TR" },
                    { id: "center-left", label: "Left" },
                    { id: "center", label: "Center" },
                    { id: "center-right", label: "Right" },
                    { id: "bottom-left", label: "BL" },
                    { id: "bottom-center", label: "Bottom" },
                    { id: "bottom-right", label: "BR" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => update({ position: p.id as any })}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        value.position === p.id
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => update({ position: "tile" })}
                    className={`w-full py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      value.position === "tile"
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Mosaic / Tile Mode (Repeated across whole page)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAGE TARGETING */}
          {activeTab === "pages" && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Apply Watermark To:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "all", label: "All Pages" },
                  { id: "first", label: "First Page Only" },
                  { id: "except-first", label: "All Except First" },
                  { id: "odd", label: "Odd Pages Only" },
                  { id: "even", label: "Even Pages Only" },
                  { id: "custom", label: "Custom Range" },
                ].map((pg) => (
                  <button
                    key={pg.id}
                    type="button"
                    onClick={() => update({ pageSelection: pg.id as any })}
                    className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                      (value.pageSelection || "all") === pg.id
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 font-semibold"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {pg.label}
                  </button>
                ))}
              </div>

              {value.pageSelection === "custom" && (
                <div className="pt-2">
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Custom Page Numbers (e.g. 1-3, 5, 8)
                  </label>
                  <input
                    type="text"
                    value={value.customPages || ""}
                    onChange={(e) => update({ customPages: e.target.value })}
                    placeholder="e.g. 1-3, 5"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
