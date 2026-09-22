"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NLInput } from "@/components/workflow/nl-input";
import { WorkflowBuilder } from "@/components/workflow/workflow-builder";
import { parseNaturalLanguageToWorkflow, PRESET_WORKFLOW_TEMPLATES } from "@/lib/workflow/nlp-parser";
import { WorkflowStep, WorkflowTemplate } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wand2, Zap, Bookmark, Layers, ArrowRight, Loader2 } from "lucide-react";

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const initialPromptQuery = searchParams.get("prompt") || "";

  const [currentPrompt, setCurrentPrompt] = React.useState<string>(
    initialPromptQuery || "Convert this Word document to PDF, compress it below 2 MB, add page numbers and watermark it with 'CONFIDENTIAL'"
  );

  const [workflowState, setWorkflowState] = React.useState<{
    title: string;
    steps: WorkflowStep[];
  }>(() => {
    const parsed = parseNaturalLanguageToWorkflow(
      initialPromptQuery || "Convert this Word document to PDF, compress it below 2 MB, add page numbers and watermark it with 'CONFIDENTIAL'"
    );
    return {
      title: parsed.title,
      steps: parsed.steps,
    };
  });

  const handleGenerateWorkflow = (promptText: string) => {
    setCurrentPrompt(promptText);
    const parsed = parseNaturalLanguageToWorkflow(promptText);
    setWorkflowState({
      title: parsed.title,
      steps: parsed.steps,
    });
  };

  const handleSelectTemplate = (tpl: WorkflowTemplate) => {
    setCurrentPrompt(tpl.promptExample);
    const parsed = parseNaturalLanguageToWorkflow(tpl.promptExample);
    setWorkflowState({
      title: tpl.title,
      steps: parsed.steps,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Workspace Header */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Smart PDF Workspace • Natural Language Pipeline Compiler</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Natural Language Document Automation
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Describe the multi-step operations you want to execute in plain English. DocuForge parses your requirements into an executable sequential pipeline with real-time browser execution.
        </p>
      </div>

      {/* Natural Language Prompt Input Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
          <Wand2 className="w-4 h-4 text-indigo-500" /> What would you like to do?
        </div>
        <NLInput
          initialValue={currentPrompt}
          onGenerateWorkflow={handleGenerateWorkflow}
          placeholder="e.g. Convert Word to PDF, compress below 2MB, add page numbers and watermark..."
        />
      </div>

      {/* Preset Workflow Templates Carousel */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-indigo-500" /> Reusable Workflow Templates
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_WORKFLOW_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-subtle text-left transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                    <Layers className="w-4 h-4" />
                  </div>
                  {tpl.badge && <Badge variant="secondary">{tpl.badge}</Badge>}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {tpl.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Load Pipeline</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* The Visual Workflow Builder */}
      <WorkflowBuilder
        initialSteps={workflowState.steps}
        workflowTitle={workflowState.title}
        onSaveWorkflow={async (title, steps) => {
          try {
            await fetch("/api/workflows/saved", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: title,
                description: steps.map((s: any) => s.title || s.type).join(" → "),
                steps,
              }),
            });
          } catch (e) {
            console.error("Could not save workflow to MongoDB:", e);
          }

          if (typeof window !== "undefined") {
            const saved = JSON.parse(localStorage.getItem("docuforge_saved_workflows") || "[]");
            saved.unshift({
              id: `wf_${Date.now()}`,
              name: title,
              steps,
              createdAt: new Date().toISOString(),
            });
            localStorage.setItem("docuforge_saved_workflows", JSON.stringify(saved));
          }
        }}
      />
    </div>
  );
}

export default function SmartWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 font-mono">Initializing Smart Workspace...</p>
        </div>
      }
    >
      <WorkspaceContent />
    </Suspense>
  );
}
