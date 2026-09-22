"use client";

import * as React from "react";
import { PdfPageItem } from "@/types";
import {
  RotateCw,
  Trash2,
  Copy,
  CheckSquare,
  Square,
  Undo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThumbnailGridProps {
  pages: PdfPageItem[];
  onRotatePage: (pageIndex: number) => void;
  onDeletePage: (pageIndex: number) => void;
  onDuplicatePage: (pageIndex: number) => void;
  onReorderPages: (newPages: PdfPageItem[]) => void;
  onToggleSelectPage: (pageIndex: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRotateAll: () => void;
  onReverseOrder: () => void;
}

export function ThumbnailGrid({
  pages,
  onRotatePage,
  onDeletePage,
  onDuplicatePage,
  onReorderPages,
  onToggleSelectPage,
  onSelectAll,
  onDeselectAll,
  onRotateAll,
  onReverseOrder,
}: ThumbnailGridProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = React.useState<number>(1); // 0.8, 1, 1.2

  const activePages = pages.filter((p) => !p.deleted);
  const selectedCount = pages.filter((p) => p.selected && !p.deleted).length;

  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIdx) return;
    const reordered = [...pages];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIdx, 0, moved);
    setDraggedIndex(targetIdx);
    onReorderPages(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Workspace Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
            {activePages.length} {activePages.length === 1 ? "Page" : "Pages"}
          </span>
          {selectedCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-medium">
              {selectedCount} selected
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={onRotateAll} title="Rotate All 90°" className="text-xs gap-1.5">
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate All</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={onReverseOrder} title="Reverse Page Sequence" className="text-xs gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Reverse</span>
          </Button>

          {selectedCount === activePages.length ? (
            <Button variant="ghost" size="sm" onClick={onDeselectAll} className="text-xs gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Deselect</span>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onSelectAll} className="text-xs gap-1.5">
              <Square className="w-3.5 h-3.5" />
              <span>Select All</span>
            </Button>
          )}

          {/* Zoom buttons */}
          <div className="hidden sm:flex items-center border-l border-slate-200 dark:border-slate-800 pl-2 ml-1 gap-1">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.15))}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-500 w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Pages Grid */}
      <div
        className="grid gap-4 p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 min-h-[320px] max-h-[560px] overflow-y-auto"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${Math.floor(150 * zoomLevel)}px, 1fr))`,
        }}
      >
        {pages.map((page, idx) => {
          if (page.deleted) return null;

          return (
            <div
              key={page.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              onClick={() => onToggleSelectPage(idx)}
              className={`group relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-150 cursor-pointer bg-white dark:bg-slate-900 select-none ${
                page.selected
                  ? "border-indigo-600 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/20"
                  : "border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50"
              } ${draggedIndex === idx ? "opacity-30 scale-95" : "opacity-100"}`}
            >
              {/* Select Checkbox badge */}
              <div className="absolute top-2 left-2 z-10">
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    page.selected
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200/80 dark:bg-slate-800 text-transparent group-hover:text-slate-400"
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Page Number badge */}
              <div className="absolute top-2 right-2 z-10 text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-900/70 text-white backdrop-blur-sm">
                #{idx + 1}
              </div>

              {/* Simulated Page Canvas / Thumbnail */}
              <div
                className="w-full aspect-[1/1.414] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col p-3 shadow-sm transition-transform duration-200 overflow-hidden relative"
                style={{ transform: `rotate(${page.rotation}deg)` }}
              >
                {/* Visual document lines mockup */}
                <div className="w-1/3 h-2 rounded bg-indigo-500/40 mb-3" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-full h-1.5 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="w-5/6 h-1.5 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="w-4/6 h-1.5 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="w-full h-1.5 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="w-3/4 h-1.5 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="w-5/6 h-1.5 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="text-[8px] text-center font-mono text-slate-400 mt-auto pt-2">
                  Page {page.pageNumber}
                </div>
              </div>

              {/* Hover Page Action Bar */}
              <div
                className="flex items-center justify-center gap-1 mt-2.5 w-full opacity-80 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onRotatePage(idx)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                  title="Rotate page 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDuplicatePage(idx)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                  title="Duplicate page"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeletePage(idx)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                  title="Delete page"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
