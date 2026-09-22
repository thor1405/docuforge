"use client";

import * as React from "react";
import { WorkflowStep, WorkflowStepType, UploadedFileItem } from "@/types";
import { generateId, downloadBlob, formatBytes } from "@/lib/utils";
import { executeWorkflowPipeline } from "@/lib/workflow/workflow-engine";
import { FileUploader } from "@/components/upload/file-uploader";
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  Settings2,
  Download,
  Save,
  FileText,
  Minimize2,
  Layers,
  Stamp,
  Hash,
  ScanText,
  Lock,
  Sparkles,
  ArrowDown,
  Sliders,
  Terminal,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import confetti from "canvas-confetti";

interface WorkflowBuilderProps {
  initialSteps: WorkflowStep[];
  workflowTitle?: string;
  onSaveWorkflow?: (title: string, steps: WorkflowStep[]) => void;
}

const AVAILABLE_STEPS: Array<{ type: WorkflowStepType; title: string; desc: string; icon: any; defaultDoc: string }> = [
  { type: "word-to-pdf", title: "Word to PDF", desc: "Convert DOCX to standard PDF", icon: FileText, defaultDoc: "docx" },
  { type: "images-to-pdf", title: "Images to PDF", desc: "Bundle JPG/PNG into PDF", icon: Layers, defaultDoc: "image" },
  { type: "merge-pdf", title: "Merge PDFs", desc: "Combine multiple PDF documents", icon: Layers, defaultDoc: "pdf" },
  { type: "split-pdf", title: "Split PDF", desc: "Extract page ranges into separate files", icon: Layers, defaultDoc: "pdf" },
  { type: "compress-pdf", title: "Compress PDF", desc: "Reduce file size maintaining clarity", icon: Minimize2, defaultDoc: "pdf" },
  { type: "watermark-pdf", title: "Watermark PDF", desc: "Apply text watermark stamp", icon: Stamp, defaultDoc: "pdf" },
  { type: "page-numbers", title: "Page Numbers", desc: "Embed header/footer page numbers", icon: Hash, defaultDoc: "pdf" },
  { type: "protect-pdf", title: "Protect PDF", desc: "Encrypt with AES password", icon: Lock, defaultDoc: "pdf" },
  { type: "ocr-pdf", title: "OCR Text", desc: "Extract searchable text layer", icon: ScanText, defaultDoc: "pdf" },
  { type: "pdf-to-word", title: "PDF to Word", desc: "Export editable DOCX document", icon: FileText, defaultDoc: "pdf" },
  { type: "ai-summarize", title: "AI Summarize", desc: "Executive brief & insights", icon: Sparkles, defaultDoc: "pdf" },
];

export function WorkflowBuilder({ initialSteps, workflowTitle = "Custom Document Pipeline", onSaveWorkflow }: WorkflowBuilderProps) {
  const [steps, setSteps] = React.useState<WorkflowStep[]>(initialSteps);
  const [title, setTitle] = React.useState<string>(workflowTitle);
  const [files, setFiles] = React.useState<UploadedFileItem[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [executionLogs, setExecutionLogs] = React.useState<string[]>([]);
  const [finalResult, setFinalResult] = React.useState<{ buffer?: Uint8Array; fileName: string; type: string } | null>(null);
  const [editingStep, setEditingStep] = React.useState<WorkflowStep | null>(null);
  const [draftConfig, setDraftConfig] = React.useState<Record<string, any>>({});
  const [showModalPassword, setShowModalPassword] = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [saveName, setSaveName] = React.useState(workflowTitle);
  const [saveMessage, setSaveMessage] = React.useState("");

  React.useEffect(() => {
    setSteps(initialSteps);
    setTitle(workflowTitle);
  }, [initialSteps, workflowTitle]);

  const handleOpenConfig = (step: WorkflowStep) => {
    setEditingStep(step);
    setDraftConfig({ ...step.config });
  };

  const updateDraftConfig = (patch: Record<string, any>) => {
    setDraftConfig((prev) => ({ ...prev, ...patch }));
  };

  const handleApplyDraftConfig = () => {
    if (!editingStep) return;
    setSteps((prev) =>
      prev.map((s) => (s.id === editingStep.id ? { ...s, config: { ...s.config, ...draftConfig } } : s))
    );
    setEditingStep(null);
  };

  const handleAddStep = (stepType: WorkflowStepType) => {
    const template = AVAILABLE_STEPS.find((s) => s.type === stepType);
    if (!template) return;

    const newStep: WorkflowStep = {
      id: generateId("step"),
      toolId: stepType,
      title: template.title,
      type: stepType,
      description: template.desc,
      status: "pending",
      config:
        stepType === "compress-pdf"
          ? { level: "balanced" }
          : stepType === "watermark-pdf"
          ? { text: "CONFIDENTIAL", opacity: 0.35, rotationDegrees: 45 }
          : stepType === "page-numbers"
          ? { position: "bottom-center", format: "Page {n} of {total}" }
          : stepType === "split-pdf"
          ? { ranges: "1-2" }
          : {},
    };

    setSteps((prev) => [...prev, newStep]);
    setShowAddModal(false);
  };

  const handleRemoveStep = (stepId: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
  };

  const handleMoveStep = (idx: number, direction: "up" | "down") => {
    if (idx === 0 && direction === "up") return;
    if (idx === steps.length - 1 && direction === "down") return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    // Don't move before the first upload ingestion node
    if (steps[0].type === "upload" && (idx === 0 || targetIdx === 0)) return;

    const updated = [...steps];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setSteps(updated);
  };

  const handleRunWorkflow = async () => {
    if (files.length === 0) {
      alert("Please upload at least one source document to begin.");
      return;
    }

    setIsRunning(true);
    setFinalResult(null);
    setExecutionLogs(["Starting pipeline execution..."]);

    // Read buffers for files
    const fileBuffers: Array<{ buffer: ArrayBuffer; name: string; type: string }> = [];
    for (const f of files) {
      const buf = await f.file.arrayBuffer();
      fileBuffers.push({ buffer: buf, name: f.name, type: f.type });
    }

    const result = await executeWorkflowPipeline(
      steps,
      fileBuffers,
      (stepId, status, progress, message) => {
        setSteps((prev) =>
          prev.map((s) => (s.id === stepId ? { ...s, status, progress } : s))
        );
        if (message) {
          setExecutionLogs((prev) => [...prev, message]);
        }
      }
    );

    setIsRunning(false);
    setExecutionLogs(result.logs);

    if (result.success && result.finalBuffer) {
      setFinalResult({
        buffer: result.finalBuffer,
        fileName: result.finalFileName,
        type: result.finalType,
      });
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
    }
  };

  const handleDownloadOutput = () => {
    if (!finalResult?.buffer) return;
    const blob = new Blob([finalResult.buffer as any], { type: finalResult.type });
    downloadBlob(blob, finalResult.fileName);
  };

  const handleSaveToAccount = () => {
    onSaveWorkflow?.(saveName, steps);
    setSaveMessage("Workflow saved to your dashboard!");
    setTimeout(() => {
      setShowSaveModal(false);
      setSaveMessage("");
    }, 1200);
  };

  const getStepIcon = (type: WorkflowStepType) => {
    switch (type) {
      case "upload":
        return <Layers className="w-5 h-5 text-indigo-500" />;
      case "word-to-pdf":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "compress-pdf":
        return <Minimize2 className="w-5 h-5 text-emerald-500" />;
      case "watermark-pdf":
        return <Stamp className="w-5 h-5 text-rose-500" />;
      case "page-numbers":
        return <Hash className="w-5 h-5 text-indigo-500" />;
      case "merge-pdf":
        return <Layers className="w-5 h-5 text-cyan-500" />;
      case "split-pdf":
        return <Sliders className="w-5 h-5 text-amber-500" />;
      case "ocr-pdf":
        return <ScanText className="w-5 h-5 text-purple-500" />;
      case "protect-pdf":
        return <Lock className="w-5 h-5 text-red-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="mt-1 p-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 shrink-0">
            <span className="block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="space-y-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug break-words">
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {steps.length} sequential operations configured • Real-time processing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowSaveModal(true)}
            className="text-xs sm:text-sm h-10 px-4 rounded-xl gap-1.5 flex-1 sm:flex-none font-medium"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Save Template</span>
          </Button>

          <Button
            size="md"
            isLoading={isRunning}
            onClick={handleRunWorkflow}
            className="text-xs sm:text-sm h-10 px-5 rounded-xl gap-2 font-semibold shadow-md shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white flex-1 sm:flex-none"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Run Workflow</span>
          </Button>
        </div>
      </div>

      {/* Input File Ingestion Area */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Step 1: Upload Source Documents</span>
          </h3>
          {files.length > 0 && (
            <span className="text-xs text-emerald-600 font-medium">
              {files.length} document(s) loaded
            </span>
          )}
        </div>

        <FileUploader
          acceptedFormats={[".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png", ".webp", ".xlsx", ".pptx", ".txt"]}
          onFilesSelected={setFiles}
          selectedFiles={files}
          onRemoveFile={(id) => setFiles((f) => f.filter((item) => item.id !== id))}
          title="Upload files for workflow processing"
          subtitle="Supports PDF, Word (DOCX/DOC), Images (JPG/PNG), Excel, PowerPoint, and TXT"
          maxFiles={10}
        />
      </div>

      {/* Visual Step Pipeline Nodes */}
      <div className="space-y-3 relative">
        {steps.map((step, idx) => {
          if (step.type === "upload") return null; // Rendered above

          return (
            <React.Fragment key={step.id}>
              {/* Connector Arrow */}
              <div className="flex justify-center py-0.5">
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Step Node Card */}
              <div
                className={`p-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 ${
                  step.status === "running"
                    ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-glow"
                    : step.status === "completed"
                    ? "border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : step.status === "error"
                    ? "border-rose-300 dark:border-rose-800"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getStepIcon(step.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                          #{idx + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {step.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Status & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {step.status === "running" && (
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                      </span>
                    )}
                    {step.status === "completed" && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Ready
                      </span>
                    )}
                    {step.status === "error" && (
                      <span className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-4 h-4" /> Error
                      </span>
                    )}

                    {/* Step Options Button */}
                    <button
                      onClick={() => handleOpenConfig(step)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Configure Step"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>

                    {/* Move Up/Down */}
                    <button
                      onClick={() => handleMoveStep(idx, "up")}
                      disabled={idx <= 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveStep(idx, "down")}
                      disabled={idx >= steps.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* Remove Step */}
                    <button
                      onClick={() => handleRemoveStep(step.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Delete Step"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar when running */}
                {step.status === "running" && (
                  <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${step.progress || 30}%` }}
                    />
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* Add Step Button */}
        <div className="pt-2 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="text-xs gap-1.5 border-dashed hover:border-indigo-400"
          >
            <Plus className="w-3.5 h-3.5" /> Add Workflow Operation
          </Button>
        </div>
      </div>

      {/* Completion Banner with Download */}
      {finalResult && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-cyan-500/10 border border-emerald-300 dark:border-emerald-800/80 space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Workflow Execution Complete!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generated: <span className="font-mono font-medium">{finalResult.fileName}</span> (
                  {formatBytes(finalResult.buffer?.byteLength || 0)})
                </p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleDownloadOutput}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md shadow-emerald-600/20 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" /> Download Processed File
            </Button>
          </div>
        </div>
      )}

      {/* Live Execution Console Logs */}
      {executionLogs.length > 0 && (
        <div className="rounded-2xl bg-slate-950 text-slate-200 p-4 font-mono text-xs space-y-2 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400">
            <span className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Execution Pipeline Console
            </span>
            <span>{executionLogs.length} events</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1">
            {executionLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                <span className="text-indigo-400">›</span> {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Step Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Operation Step">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 max-h-[400px] overflow-y-auto p-1">
          {AVAILABLE_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <button
                key={step.type}
                onClick={() => handleAddStep(step.type)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-left transition-all flex items-start gap-2.5 group"
              >
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">{step.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{step.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Step Config Modal */}
      {editingStep && (
        <Modal
          isOpen={!!editingStep}
          onClose={() => setEditingStep(null)}
          title={`Configure: ${editingStep.title}`}
        >
          <div className="space-y-4 mt-3 max-h-[70vh] overflow-y-auto pr-1">
            {/* 1. WORD TO PDF */}
            {editingStep.type === "word-to-pdf" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Conversion Quality Engine
                  </label>
                  <select
                    value={draftConfig.engine || "native-high-fidelity"}
                    onChange={(e) => updateDraftConfig({ engine: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                  >
                    <option value="native-high-fidelity">Native Office COM / docx2pdf (100% Vector Fidelity)</option>
                    <option value="standard">Standard Fast Layout Engine</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Paper Size
                    </label>
                    <select
                      value={draftConfig.pageSize || "a4"}
                      onChange={(e) => updateDraftConfig({ pageSize: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    >
                      <option value="a4">A4 (Standard)</option>
                      <option value="letter">US Letter</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Orientation
                    </label>
                    <select
                      value={draftConfig.orientation || "auto"}
                      onChange={(e) => updateDraftConfig({ orientation: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    >
                      <option value="auto">Auto-Detect</option>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Embedded Images & Logos
                  </label>
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Preserve 100% vector resolution and high-DPI image graphics.</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PDF TO WORD */}
            {editingStep.type === "pdf-to-word" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Reconstruction Engine
                  </label>
                  <select
                    value={draftConfig.mode || "pdf2docx"}
                    onChange={(e) => updateDraftConfig({ mode: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <option value="pdf2docx">High-Fidelity Flowing Layout (Extract tables, styles, images)</option>
                    <option value="text-extract">Plain Text Extraction</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    OCR Scanned Page Detection
                  </label>
                  <select
                    value={draftConfig.ocrFallback || "auto"}
                    onChange={(e) => updateDraftConfig({ ocrFallback: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <option value="auto">Auto-detect and extract text layer</option>
                    <option value="enabled">Force OCR on all pages</option>
                  </select>
                </div>
              </div>
            )}

            {/* 3. IMAGES TO PDF */}
            {editingStep.type === "images-to-pdf" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Page Size
                    </label>
                    <select
                      value={draftConfig.pageSize || "a4"}
                      onChange={(e) => updateDraftConfig({ pageSize: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    >
                      <option value="a4">A4</option>
                      <option value="letter">US Letter</option>
                      <option value="fit">Auto-fit to Image</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Orientation
                    </label>
                    <select
                      value={draftConfig.orientation || "auto"}
                      onChange={(e) => updateDraftConfig({ orientation: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    >
                      <option value="auto">Auto</option>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Margin (px)
                  </label>
                  <select
                    value={draftConfig.margin || 20}
                    onChange={(e) => updateDraftConfig({ margin: parseInt(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <option value="0">None (0 px - Borderless)</option>
                    <option value="10">Small (10 px)</option>
                    <option value="20">Standard (20 px)</option>
                    <option value="40">Wide (40 px)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 4. COMPRESS PDF */}
            {editingStep.type === "compress-pdf" && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Compression Preset
                </label>
                <select
                  value={draftConfig.level || "balanced"}
                  onChange={(e) => updateDraftConfig({ level: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                >
                  <option value="extreme">Extreme Compression (Maximum size drop, target &lt;2MB)</option>
                  <option value="balanced">Balanced (Recommended, crisp text & vectors)</option>
                  <option value="high_quality">High Quality (Minimal compression)</option>
                </select>
              </div>
            )}

            {/* 5. WATERMARK PDF */}
            {editingStep.type === "watermark-pdf" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Watermark Text
                  </label>
                  <input
                    type="text"
                    value={draftConfig.text ?? "CONFIDENTIAL"}
                    onChange={(e) => updateDraftConfig({ text: e.target.value })}
                    placeholder="Enter watermark text..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                  />
                  {/* Preset quick chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {["CONFIDENTIAL", "DRAFT", "COPY", "APPROVED", "TOP SECRET", "SAMPLE"].map((txt) => (
                      <button
                        key={txt}
                        type="button"
                        onClick={() => updateDraftConfig({ text: txt })}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          draftConfig.text === txt
                            ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        {txt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Font Family
                    </label>
                    <select
                      value={draftConfig.fontFamily || "helvetica"}
                      onChange={(e) => updateDraftConfig({ fontFamily: e.target.value })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    >
                      <option value="helvetica">Helvetica (Sans)</option>
                      <option value="times">Times Roman (Serif)</option>
                      <option value="courier">Courier (Mono)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Font Size: {draftConfig.fontSize || 48} pt
                    </label>
                    <input
                      type="range"
                      min="14"
                      max="90"
                      step="2"
                      value={draftConfig.fontSize || 48}
                      onChange={(e) => updateDraftConfig({ fontSize: parseInt(e.target.value) })}
                      className="w-full accent-indigo-600 mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Opacity: {Math.round((draftConfig.opacity ?? 0.35) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={draftConfig.opacity ?? 0.35}
                      onChange={(e) => updateDraftConfig({ opacity: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Angle: {draftConfig.rotationDegrees ?? 45}°
                    </label>
                    <select
                      value={draftConfig.rotationDegrees ?? 45}
                      onChange={(e) => updateDraftConfig({ rotationDegrees: parseInt(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    >
                      <option value="45">45° (Diagonal)</option>
                      <option value="0">0° (Horizontal)</option>
                      <option value="-45">-45° (Reverse)</option>
                      <option value="90">90° (Vertical)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Position Layout
                  </label>
                  <select
                    value={draftConfig.position || "center"}
                    onChange={(e) => updateDraftConfig({ position: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <option value="center">Center</option>
                    <option value="tile">Mosaic / Tile (Across entire sheet)</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>
              </div>
            )}

            {/* 6. PAGE NUMBERS */}
            {editingStep.type === "page-numbers" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Position
                  </label>
                  <select
                    value={draftConfig.position || "bottom-center"}
                    onChange={(e) => updateDraftConfig({ position: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <option value="bottom-center">Bottom Center (Footer)</option>
                    <option value="bottom-right">Bottom Right (Footer)</option>
                    <option value="bottom-left">Bottom Left (Footer)</option>
                    <option value="top-center">Top Center (Header)</option>
                    <option value="top-right">Top Right (Header)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Format Template
                  </label>
                  <input
                    type="text"
                    value={draftConfig.format || "Page {n} of {total}"}
                    onChange={(e) => updateDraftConfig({ format: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>
            )}

            {/* 7. SPLIT PDF */}
            {editingStep.type === "split-pdf" && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Page Ranges (e.g., "1-3, 4-6, 7")
                </label>
                <input
                  type="text"
                  value={draftConfig.ranges || "1-3, 4-6"}
                  onChange={(e) => updateDraftConfig({ ranges: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>
            )}

            {/* 8. PROTECT PDF */}
            {editingStep.type === "protect-pdf" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                      Document Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
                        let gen = "";
                        for (let i = 0; i < 12; i++) gen += chars.charAt(Math.floor(Math.random() * chars.length));
                        updateDraftConfig({ password: gen });
                        setShowModalPassword(true);
                      }}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Generate Strong Password
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showModalPassword ? "text" : "password"}
                      value={draftConfig.password || ""}
                      onChange={(e) => updateDraftConfig({ password: e.target.value })}
                      placeholder="Enter encryption password..."
                      className="w-full text-xs p-2.5 pr-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    >
                      {showModalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Encryption Standard
                  </label>
                  <select
                    value={draftConfig.standard || "aes256"}
                    onChange={(e) => updateDraftConfig({ standard: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <option value="aes256">AES 256-bit (Enterprise Military-Grade - Recommended)</option>
                    <option value="aes128">AES 128-bit (Standard Legacy Compatibility)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Security Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftConfig.permissions?.allowPrinting !== false}
                        onChange={(e) =>
                          updateDraftConfig({
                            permissions: { ...(draftConfig.permissions || {}), allowPrinting: e.target.checked },
                          })
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                        Allow Printing
                      </span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftConfig.permissions?.allowCopying !== false}
                        onChange={(e) =>
                          updateDraftConfig({
                            permissions: { ...(draftConfig.permissions || {}), allowCopying: e.target.checked },
                          })
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                        Allow Text Copy
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 9. OCR TEXT */}
            {editingStep.type === "ocr-pdf" && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  OCR Recognition Language
                </label>
                <select
                  value={draftConfig.language || "eng"}
                  onChange={(e) => updateDraftConfig({ language: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                >
                  <option value="eng">English (Latin)</option>
                  <option value="spa">Spanish (Español)</option>
                  <option value="fra">French (Français)</option>
                  <option value="deu">German (Deutsch)</option>
                  <option value="chi_sim">Chinese Simplified</option>
                </select>
              </div>
            )}

            {/* 10. AI SUMMARIZE */}
            {editingStep.type === "ai-summarize" && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Summary Length & Depth
                </label>
                <select
                  value={draftConfig.length || "medium"}
                  onChange={(e) => updateDraftConfig({ length: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                >
                  <option value="short">Brief Executive Bullets (&lt;1 min read)</option>
                  <option value="medium">Standard Digest with Action Items</option>
                  <option value="detailed">In-Depth Analytical Synthesis</option>
                </select>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setEditingStep(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleApplyDraftConfig} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Apply & Save Settings
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Save Template Modal */}
      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} title="Save Workflow Template">
        <div className="space-y-4 mt-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Workflow Name
            </label>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
            />
          </div>
          {saveMessage && <div className="text-xs text-emerald-600 font-medium">{saveMessage}</div>}
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSaveModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveToAccount}>
              Save to Dashboard
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
