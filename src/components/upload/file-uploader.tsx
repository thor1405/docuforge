"use client";

import * as React from "react";
import { UploadedFileItem } from "@/types";
import { formatBytes, generateId, truncateFileName } from "@/lib/utils";
import {
  UploadCloud,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  GripVertical,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  acceptedFormats?: string[]; // e.g. ['.pdf', '.docx', '.jpg', '.png']
  maxFiles?: number;
  maxSizeMb?: number;
  multiple?: boolean;
  onFilesSelected: (files: UploadedFileItem[]) => void;
  selectedFiles: UploadedFileItem[];
  onRemoveFile?: (id: string) => void;
  onReorderFiles?: (files: UploadedFileItem[]) => void;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function FileUploader({
  acceptedFormats = [".pdf", ".docx", ".doc", ".jpg", ".png", ".xlsx", ".pptx"],
  maxFiles = 20,
  maxSizeMb = 50,
  multiple = true,
  onFilesSelected,
  selectedFiles,
  onRemoveFile,
  onReorderFiles,
  title = "Drop your files here",
  subtitle,
  className = "",
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = React.useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const formatListString = acceptedFormats.map((f) => f.replace(".", "").toUpperCase()).join(" • ");

  const validateAndProcessFiles = (rawFiles: FileList | File[]) => {
    const validItems: UploadedFileItem[] = [];
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    Array.from(rawFiles).forEach((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      const isTypeAllowed =
        acceptedFormats.length === 0 ||
        acceptedFormats.some((allowed) => allowed.toLowerCase() === ext || file.type.includes(allowed.replace(".", "")));

      if (!isTypeAllowed) {
        validItems.push({
          id: generateId("file"),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: "error",
          errorMessage: `Unsupported file format. Please upload ${formatListString}.`,
        });
        return;
      }

      if (file.size > maxSizeBytes) {
        validItems.push({
          id: generateId("file"),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: "error",
          errorMessage: `File exceeds the ${maxSizeMb} MB limit.`,
        });
        return;
      }

      validItems.push({
        id: generateId("file"),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 100,
        status: "ready",
      });
    });

    if (multiple) {
      const combined = [...selectedFiles, ...validItems].slice(0, maxFiles);
      onFilesSelected(combined);
    } else {
      onFilesSelected(validItems.slice(0, 1));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
    }
    // Reset file input value so re-uploading same file triggers change
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Drag-to-reorder uploaded items
  const handleItemDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const reordered = [...selectedFiles];
    const [movedItem] = reordered.splice(draggedItemIndex, 1);
    reordered.splice(index, 0, movedItem);
    setDraggedItemIndex(index);
    onReorderFiles?.(reordered);
  };

  const handleItemDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "")) {
      return <ImageIcon className="w-5 h-5 text-indigo-500" />;
    }
    return <FileText className="w-5 h-5 text-indigo-600" />;
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedFormats.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Main Drag-and-Drop Area */}
      {selectedFiles.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 flex flex-col items-center justify-center bg-white dark:bg-slate-900/50 ${
            isDragging
              ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 scale-[1.01] shadow-glow"
              : "border-slate-300 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/80"
          }`}
        >
          {/* Animated upload icon */}
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-subtle group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 max-w-md">
            {subtitle || "Drag and drop your document here, or browse from your device."}
          </p>

          <Button
            type="button"
            size="md"
            className="pointer-events-none px-6 shadow-sm group-hover:shadow-indigo-500/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            Choose Files
          </Button>

          <div className="mt-6 text-xs text-slate-400 dark:text-slate-500 font-mono tracking-wide">
            {formatListString} • Max {maxSizeMb} MB
          </div>
        </div>
      ) : (
        /* Selected Files List */
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span>Selected Files ({selectedFiles.length})</span>
              {multiple && selectedFiles.length > 1 && (
                <span className="text-xs text-slate-400 font-normal">Drag handles to reorder sequence</span>
              )}
            </div>
            {multiple && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add More
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {selectedFiles.map((item, idx) => (
              <div
                key={item.id}
                draggable={multiple && selectedFiles.length > 1}
                onDragStart={() => handleItemDragStart(idx)}
                onDragOver={(e) => handleItemDragOver(e, idx)}
                onDragEnd={handleItemDragEnd}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 bg-white dark:bg-slate-900 ${
                  item.status === "error"
                    ? "border-rose-300 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                } ${draggedItemIndex === idx ? "opacity-40 scale-[0.98]" : "opacity-100"}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {multiple && selectedFiles.length > 1 && (
                    <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}

                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getFileIcon(item.name)}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {truncateFileName(item.name, 38)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{formatBytes(item.size)}</span>
                      {item.status === "error" ? (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3" /> {item.errorMessage}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {onRemoveFile && (
                    <button
                      onClick={() => onRemoveFile(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
