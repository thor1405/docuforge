"use client";

import * as React from "react";
import { Sparkles, ArrowRight, CornerDownLeft, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NLInputProps {
  onGenerateWorkflow: (prompt: string) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

export const SUGGESTED_PROMPTS = [
  "Convert this Word document to PDF, compress it below 2 MB, add page numbers and watermark it with 'CONFIDENTIAL'",
  "Merge 3 contract PDFs, add footer page numbers, and encrypt with password",
  "Convert JPG receipts to PDF, OCR text to make searchable, and compress",
  "Extract pages 1-5 from PDF, apply watermark 'DRAFT', and convert to Word (DOCX)",
  "Optimize this PDF for email delivery and strip hidden author metadata",
];

export function NLInput({
  onGenerateWorkflow,
  placeholder = "Describe what you want to do with your documents...",
  initialValue = "",
  className = "",
}: NLInputProps) {
  const [prompt, setPrompt] = React.useState(initialValue);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setPrompt(initialValue);
  }, [initialValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim()) return;
    setIsSubmitting(true);
    onGenerateWorkflow(prompt.trim());
    setTimeout(() => setIsSubmitting(false), 400);
  };

  const handleChipClick = (suggestion: string) => {
    setPrompt(suggestion);
    onGenerateWorkflow(suggestion);
  };

  return (
    <div className={`w-full space-y-3 ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="w-full flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 shadow-sm transition-all"
      >
        <div className="pl-2.5 text-indigo-500 flex items-center shrink-0 pointer-events-none">
          <Wand2 className="w-5 h-5 text-indigo-500 animate-pulse-subtle" />
        </div>

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent py-2 px-2 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm sm:text-base focus:outline-none border-none ring-0 focus:ring-0"
        />

        <Button
          type="submit"
          size="md"
          isLoading={isSubmitting}
          className="shrink-0 h-10 px-4 sm:px-5 rounded-xl font-semibold gap-1.5 shadow-sm shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
        >
          <span>Create Workflow</span>
          <CornerDownLeft className="w-3.5 h-3.5 opacity-80 hidden sm:inline-block" />
        </Button>
      </form>

      {/* Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <span className="text-slate-400 font-mono text-[11px] shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" /> Try:
        </span>
        {SUGGESTED_PROMPTS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(s)}
            className="shrink-0 px-3 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800/80 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200/60 dark:border-slate-700/60 text-xs transition-colors text-left"
          >
            {s.length > 45 ? s.slice(0, 45) + "..." : s}
          </button>
        ))}
      </div>
    </div>
  );
}
