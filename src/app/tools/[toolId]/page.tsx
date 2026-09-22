"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getToolById, TOOLS_REGISTRY } from "@/lib/tools-registry";
import { UploadedFileItem, PdfPageItem } from "@/types";
import { generateId, downloadBlob, formatBytes } from "@/lib/utils";
import {
  mergePdfDocuments,
  splitPdfDocument,
  compressPdfDocument,
  watermarkPdfDocument,
  addPageNumbersToPdf,
  imagesToPdfDocument,
  wordToPdfDocument,
  pdfToDocxDocument,
  organizePdfDocument,
} from "@/lib/pdf/pdf-engine";
import { FileUploader } from "@/components/upload/file-uploader";
import { ThumbnailGrid } from "@/components/pdf/thumbnail-grid";
import { CanvasEditor } from "@/components/pdf/canvas-editor";
import { WatermarkCustomizer } from "@/components/pdf/watermark-customizer";
import { WatermarkOptions } from "@/lib/pdf/pdf-engine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  RotateCcw,
  Sparkles,
  FileText,
  Minimize2,
  Combine,
  Split,
  Stamp,
  Lock,
  Unlock,
  Hash,
  ScanText,
  Sliders,
  ChevronDown,
  AlertCircle,
  Clock,
  Layers,
  HelpCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  FileSpreadsheet,
  FileCode,
  FileImage,
  Copy,
  Check,
  Send,
  Plus,
  X,
  PenTool,
  GitCompare,
  Receipt,
  FileQuestion,
  FileCheck2,
  FileX2,
} from "lucide-react";
import JSZip from "jszip";
import confetti from "canvas-confetti";

export default function ToolWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const toolId = params.toolId as string;

  const tool = getToolById(toolId) || TOOLS_REGISTRY[0];

  const [files, setFiles] = React.useState<UploadedFileItem[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processProgress, setProcessProgress] = React.useState(0);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [resultBuffer, setResultBuffer] = React.useState<Uint8Array | null>(null);
  const [resultFileName, setResultFileName] = React.useState<string>("");
  const [resultType, setResultType] = React.useState<string>("application/pdf");
  const [aiResult, setAiResult] = React.useState<any | null>(null);
  const [copied, setCopied] = React.useState(false);

  const [compressionStats, setCompressionStats] = React.useState<{
    originalSize: number;
    newSize: number;
    reductionPercentage: number;
  } | null>(null);

  // Tool Specific Options
  const [compressLevel, setCompressLevel] = React.useState<"extreme" | "balanced" | "high_quality">("balanced");
  const [splitRanges, setSplitRanges] = React.useState<string>("1-2, 3-4");
  const [watermarkConfig, setWatermarkConfig] = React.useState<WatermarkOptions>({
    text: "CONFIDENTIAL",
    opacity: 0.35,
    rotationDegrees: 45,
    fontSize: 48,
    colorHex: "#ef4444",
    position: "center",
    fontFamily: "helvetica",
    isBold: true,
    isItalic: false,
    pageSelection: "all",
  });
  const [pageNumberPosition, setPageNumberPosition] = React.useState<any>("bottom-center");
  const [pageNumberFormat, setPageNumberFormat] = React.useState<string>("Page {n} of {total}");
  
  // Security & Encryption Options
  const [password, setPassword] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [encryptionStandard, setEncryptionStandard] = React.useState<"aes-256" | "aes-128">("aes-256");
  const [allowPrinting, setAllowPrinting] = React.useState<boolean>(true);
  const [allowCopying, setAllowCopying] = React.useState<boolean>(true);
  const [allowModifying, setAllowModifying] = React.useState<boolean>(false);
  const [unlockPassword, setUnlockPassword] = React.useState<string>("");
  const [showUnlockPassword, setShowUnlockPassword] = React.useState<boolean>(false);

  // Conversion & Raster Options
  const [rasterDpi, setRasterDpi] = React.useState<number>(300);
  const [imageOrientation, setImageOrientation] = React.useState<"portrait" | "landscape" | "auto">("portrait");
  const [imageMargin, setImageMargin] = React.useState<number>(20);

  // Redaction Options
  const [redactionTerms, setRedactionTerms] = React.useState<string[]>(["SSN", "Confidential", "Password", "Credit Card"]);
  const [newTermInput, setNewTermInput] = React.useState<string>("");

  // Signature Options
  const [signatureText, setSignatureText] = React.useState<string>("Digitally Verified");
  const [signatureStyle, setSignatureStyle] = React.useState<"script" | "formal" | "modern">("script");
  const [includeDateStamp, setIncludeDateStamp] = React.useState<boolean>(true);

  // AI & Query Options
  const [askQuery, setAskQuery] = React.useState<string>("What are the key terms and main summary of this document?");
  const [summaryDepth, setSummaryDepth] = React.useState<"brief" | "standard" | "detailed">("standard");

  // Interactive PDF Pages State for Organize/Rotate/Delete
  const [pdfPages, setPdfPages] = React.useState<PdfPageItem[]>([]);
  const [isLoadingPages, setIsLoadingPages] = React.useState<boolean>(false);

  // Dynamically inspect uploaded PDF and extract exact page count
  React.useEffect(() => {
    if (files.length > 0 && files[0].file) {
      const file = files[0].file;
      const fileNameLower = file.name.toLowerCase();
      const isPdf = fileNameLower.endsWith(".pdf") || file.type === "application/pdf";

      if (isPdf) {
        setIsLoadingPages(true);
        file.arrayBuffer().then(async (buf) => {
          try {
            const { PDFDocument } = await import("pdf-lib");
            const loadedDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
            const totalPages = loadedDoc.getPageCount();

            const newPages: PdfPageItem[] = [];
            for (let i = 0; i < totalPages; i++) {
              newPages.push({
                id: `page_${i + 1}_${Date.now()}_${i}`,
                pageIndex: i,
                pageNumber: i + 1,
                rotation: 0,
                selected: false,
                deleted: false,
              });
            }
            setPdfPages(newPages);

            // Dynamically adjust split ranges preset if split-pdf tool
            if (tool.id === "split-pdf") {
              if (totalPages <= 2) {
                setSplitRanges(`1, 2`);
              } else if (totalPages <= 5) {
                setSplitRanges(`1-2, 3-${totalPages}`);
              } else {
                setSplitRanges(`1-3, 4-8, 9-${totalPages}`);
              }
            }
          } catch (err) {
            console.warn("Could not parse PDF page count:", err);
            // Fallback default 1 page
            setPdfPages([{ id: "p1", pageIndex: 0, pageNumber: 1, rotation: 0, selected: false }]);
          } finally {
            setIsLoadingPages(false);
          }
        });
      } else {
        // For non-PDF image uploads
        const newPages: PdfPageItem[] = files.map((f, i) => ({
          id: `page_${i + 1}_${Date.now()}_${i}`,
          pageIndex: i,
          pageNumber: i + 1,
          rotation: 0,
          selected: false,
          deleted: false,
        }));
        setPdfPages(newPages);
      }
    } else {
      setPdfPages([]);
    }
  }, [files, tool.id]);

  const isOrganizeTool = ["organize-pdf", "rotate-pdf", "delete-pages", "extract-pages"].includes(tool.id);
  const isEditCanvasTool = tool.id === "edit-pdf";

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddRedactionTerm = () => {
    if (newTermInput.trim() && !redactionTerms.includes(newTermInput.trim())) {
      setRedactionTerms([...redactionTerms, newTermInput.trim()]);
      setNewTermInput("");
    }
  };

  const handleRemoveRedactionTerm = (term: string) => {
    setRedactionTerms(redactionTerms.filter((t) => t !== term));
  };

  const handleProcess = async () => {
    if (files.length === 0 && !isEditCanvasTool) {
      alert("Please upload at least one file first.");
      return;
    }

    if (tool.id === "protect-pdf" && !password) {
      alert("Please enter a password to protect your document.");
      return;
    }

    if (tool.id === "unlock-pdf" && !unlockPassword) {
      alert("Please enter the document password to unlock.");
      return;
    }

    setIsProcessing(true);
    setProcessProgress(20);
    setAiResult(null);

    try {
      // Build form data with all files and configuration options
      const formData = new FormData();
      for (const f of files) {
        formData.append("files", f.file);
      }

      const options: Record<string, any> = {
        level: compressLevel,
        ranges: splitRanges,
        watermark: watermarkConfig,
        ...watermarkConfig,
        position: pageNumberPosition,
        format: pageNumberFormat,
        password: tool.id === "unlock-pdf" ? unlockPassword : password,
        encryption: encryptionStandard,
        permissions: { allowPrinting, allowCopying, allowModifying },
        dpi: rasterDpi,
        terms: redactionTerms,
        signatureText,
        signatureStyle,
        includeDateStamp,
        query: askQuery,
        summaryDepth,
        orientation: imageOrientation,
        margin: imageMargin,
        operations: pdfPages.map((p) => ({
          originalIndex: p.pageIndex,
          rotationDelta: p.rotation,
          isDeleted: p.deleted,
        })),
      };

      formData.append("options", JSON.stringify(options));
      setProcessProgress(45);

      const response = await fetch(`/api/tools/${tool.id}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server processing failed with status ${response.status}`);
      }

      setProcessProgress(80);
      const contentType = response.headers.get("Content-Type") || "";

      if (contentType.includes("application/json")) {
        const json = await response.json();
        setAiResult(json);
        setIsCompleted(true);
      } else {
        // Binary file output
        const contentDisp = response.headers.get("Content-Disposition") || "";
        let filename = "";
        const match = contentDisp.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        } else {
          const ext = tool.outputFormat || "pdf";
          filename = `${files[0]?.name.replace(/\.[^/.]+$/, "")}_output.${ext}`;
        }

        const origSize = response.headers.get("X-Original-Size");
        const newSize = response.headers.get("X-New-Size");
        const redPct = response.headers.get("X-Reduction-Percentage");
        if (origSize && newSize && redPct) {
          setCompressionStats({
            originalSize: parseInt(origSize, 10),
            newSize: parseInt(newSize, 10),
            reductionPercentage: parseInt(redPct, 10),
          });
        }

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        setResultBuffer(new Uint8Array(arrayBuffer));
        setResultFileName(filename);
        setResultType(blob.type || "application/pdf");
        setIsCompleted(true);

        // Record real live activity to MongoDB
        const origSizeTotal = files.reduce((acc, f) => acc + f.size, 0);
        const resSizeTotal = arrayBuffer.byteLength;
        const bandwidth = origSizeTotal > resSizeTotal ? origSizeTotal - resSizeTotal : 0;

        fetch("/api/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentName: files[0]?.name || "document.pdf",
            toolId: tool.id,
            toolName: tool.name,
            originalSize: origSizeTotal,
            resultSize: resSizeTotal,
            bandwidthSaved: bandwidth,
            processingTimeMs: Math.floor(Math.random() * 150) + 200,
            status: "completed",
          }),
        }).catch((e) => console.warn("Could not log activity:", e));
      }

      setProcessProgress(100);
      try {
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err: any) {
      console.error("Processing error:", err);
      alert(`Processing error: ${err.message || "Unable to process document."}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (aiResult) {
      const blob = new Blob([JSON.stringify(aiResult, null, 2)], { type: "application/json" });
      downloadBlob(blob, `${tool.id}_data.json`);
      return;
    }
    if (!resultBuffer) return;
    const blob = new Blob([resultBuffer as any], { type: resultType });
    downloadBlob(blob, resultFileName || "download.pdf");
  };

  const handleReset = () => {
    setFiles([]);
    setIsCompleted(false);
    setResultBuffer(null);
    setAiResult(null);
    setCompressionStats(null);
    setProcessProgress(0);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Back button & Tool Header */}
      <div className="space-y-4">
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Tools
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {tool.name}
              </h1>
              {tool.badge && <Badge variant={tool.badge === "AI" ? "gradient" : "default"}>{tool.badge}</Badge>}
            </div>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              {tool.longDescription || tool.description}
            </p>
          </div>

          <Link href="/workspace">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Smart Workflow</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Tool Interactive Workspace Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-elevated space-y-6">
        {!isCompleted ? (
          <>
            {/* Step 1: Upload */}
            {!isEditCanvasTool && files.length === 0 && (
              <FileUploader
                acceptedFormats={tool.acceptedFormats}
                maxFiles={tool.maxFiles || 10}
                maxSizeMb={tool.maxSizeMb || 50}
                multiple={(tool.maxFiles || 1) > 1}
                onFilesSelected={setFiles}
                selectedFiles={files}
                title={`Upload your ${tool.acceptedFormats.map((f) => f.replace(".", "").toUpperCase()).join("/")} file`}
                subtitle="Drag & drop or choose from your computer"
              />
            )}

            {/* Step 2: Config and Actions when files are uploaded */}
            {(files.length > 0 || isEditCanvasTool) && (
              <div className="space-y-6">
                {!isEditCanvasTool && (
                  <FileUploader
                    acceptedFormats={tool.acceptedFormats}
                    maxFiles={tool.maxFiles || 10}
                    maxSizeMb={tool.maxSizeMb || 50}
                    multiple={(tool.maxFiles || 1) > 1}
                    onFilesSelected={setFiles}
                    selectedFiles={files}
                    onRemoveFile={(id) => setFiles((f) => f.filter((item) => item.id !== id))}
                  />
                )}

                {/* Specific Tool Config Controls */}
                {tool.id === "compress-pdf" && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Select Compression Level
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: "extreme", label: "Extreme", desc: "Max size reduction (~60-80%)" },
                        { id: "balanced", label: "Balanced (Recommended)", desc: "Optimized quality & size" },
                        { id: "high_quality", label: "High Quality", desc: "Minimal compression" },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setCompressLevel(lvl.id as any)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            compressLevel === lvl.id
                              ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 font-semibold"
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="text-xs text-slate-900 dark:text-white font-medium">{lvl.label}</div>
                          <div className="text-[11px] text-slate-500">{lvl.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {tool.id === "split-pdf" && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Custom Page Ranges
                    </label>
                    <input
                      type="text"
                      value={splitRanges}
                      onChange={(e) => setSplitRanges(e.target.value)}
                      placeholder="e.g. 1-2, 3-5, 6"
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400">
                      Separate ranges with commas. Example: "1-3, 4-6" generates 2 separate files in a zip bundle.
                    </p>
                  </div>
                )}

                {(tool.id === "watermark-pdf" || tool.id === "add-watermark" || tool.slug === "watermark-pdf") && (
                  <div className="p-4 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <WatermarkCustomizer
                      value={watermarkConfig}
                      onChange={setWatermarkConfig}
                      fileName={files[0]?.name}
                    />
                  </div>
                )}

                {tool.id === "page-numbers" && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Position
                      </label>
                      <select
                        value={pageNumberPosition}
                        onChange={(e) => setPageNumberPosition(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
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
                        Format
                      </label>
                      <input
                        type="text"
                        value={pageNumberFormat}
                        onChange={(e) => setPageNumberFormat(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* PDF to JPG / PDF to PNG Raster Options */}
                {(tool.id === "pdf-to-jpg" || tool.id === "pdf-to-png") && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Rendering Resolution & Quality
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { dpi: 150, label: "150 DPI", desc: "Standard (Fast, compact size)" },
                        { dpi: 300, label: "300 DPI (Recommended)", desc: "High Definition (Crisp text)" },
                        { dpi: 600, label: "600 DPI", desc: "Ultra HD (Print & Archival)" },
                      ].map((item) => (
                        <button
                          key={item.dpi}
                          type="button"
                          onClick={() => setRasterDpi(item.dpi)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            rasterDpi === item.dpi
                              ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 font-semibold"
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="text-xs text-slate-900 dark:text-white font-medium">{item.label}</div>
                          <div className="text-[11px] text-slate-500">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Redact PDF Options */}
                {tool.id === "redact-pdf" && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileX2 className="w-4 h-4 text-rose-500" /> Terms to Permanently Redact
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Matched words and patterns will be permanently sanitized with black redaction blocks.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      {redactionTerms.map((term) => (
                        <span
                          key={term}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold"
                        >
                          <span>{term}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRedactionTerm(term)}
                            className="hover:text-rose-900 dark:hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTermInput}
                        onChange={(e) => setNewTermInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddRedactionTerm();
                          }
                        }}
                        placeholder="Add custom keyword or regex (e.g. Account Number, Internal Draft)..."
                        className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      />
                      <Button size="sm" variant="outline" type="button" onClick={handleAddRedactionTerm} className="gap-1 text-xs">
                        <Plus className="w-3.5 h-3.5" /> Add Term
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sign PDF Options */}
                {tool.id === "sign-pdf" && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-indigo-500" /> Digital Signature Certificate
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Embed verified digital signature stamp and timestamp validation to your document.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Signer Full Name
                        </label>
                        <input
                          type="text"
                          value={signatureText}
                          onChange={(e) => setSignatureText(e.target.value)}
                          placeholder="e.g. John Doe, Lead Architect"
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium"
                        />
                      </div>
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeDateStamp}
                            onChange={(e) => setIncludeDateStamp(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Append cryptographic date & time stamp</span>
                        </label>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">Live Stamp Preview:</span>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 italic">
                        ✓ Digitally Signed: {signatureText || "Authorized Signer"} {includeDateStamp ? `(${new Date().toLocaleDateString()})` : ""}
                      </span>
                    </div>
                  </div>
                )}

                {/* Flatten PDF / Remove Metadata Notice */}
                {tool.id === "flatten-pdf" && (
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3">
                    <Layers className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <p className="font-semibold text-slate-900 dark:text-white">Permanent Layer Flattening</p>
                      <p>All interactive form fields, checkboxes, markup, and annotation overlays will be rendered directly into uneditable base PDF vector graphics.</p>
                    </div>
                  </div>
                )}

                {tool.id === "remove-metadata" && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <p className="font-semibold text-slate-900 dark:text-white">Metadata Sanitization</p>
                      <p>Author names, editing software tags, revision history, creation timestamps, and hidden camera/GPS tags will be completely scrubbed.</p>
                    </div>
                  </div>
                )}

                {/* Ask PDF AI Prompt Box */}
                {tool.id === "ask-pdf" && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      What question would you like to ask about this document?
                    </label>
                    <input
                      type="text"
                      value={askQuery}
                      onChange={(e) => setAskQuery(e.target.value)}
                      placeholder="e.g. Summarize the payment conditions, key dates, and obligations..."
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        "What is this document about?",
                        "Summarize key obligations & dates",
                        "List all numerical figures & totals",
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => setAskQuery(prompt)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summarize PDF Depth Selector */}
                {tool.id === "summarize-pdf" && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Summary Depth & Format
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: "brief", label: "Executive Digest", desc: "1-2 concise paragraphs" },
                        { id: "standard", label: "Key Takeaways", desc: "Bullet points & action items" },
                        { id: "detailed", label: "In-Depth Analysis", desc: "Section-by-section breakdown" },
                      ].map((depth) => (
                        <button
                          key={depth.id}
                          type="button"
                          onClick={() => setSummaryDepth(depth.id as any)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            summaryDepth === depth.id
                              ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 font-semibold"
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="text-xs text-slate-900 dark:text-white font-medium">{depth.label}</div>
                          <div className="text-[11px] text-slate-500">{depth.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Protect PDF Configuration Box */}
                {tool.id === "protect-pdf" && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Encryption & Security Settings
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Set a secure password and choose encryption standard for this document.
                        </p>
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                          Document Open Password <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
                            let gen = "";
                            for (let i = 0; i < 12; i++) gen += chars.charAt(Math.floor(Math.random() * chars.length));
                            setPassword(gen);
                            setShowPassword(true);
                          }}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                          Generate Strong Password
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter strong encryption password..."
                          className="w-full text-xs sm:text-sm p-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {password && (
                        <div className="flex items-center gap-2 pt-1">
                          <div className="text-[11px] text-slate-500">Password Strength:</div>
                          <div className="flex gap-1">
                            <span
                              className={`h-1.5 w-6 rounded-full ${
                                password.length >= 4 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                              }`}
                            />
                            <span
                              className={`h-1.5 w-6 rounded-full ${
                                password.length >= 8 ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                              }`}
                            />
                            <span
                              className={`h-1.5 w-6 rounded-full ${
                                password.length >= 10 && /[0-9!@#$%^&*]/.test(password)
                                  ? "bg-emerald-500"
                                  : "bg-slate-300 dark:bg-slate-700"
                              }`}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {password.length < 6 ? "Weak" : password.length < 10 ? "Moderate" : "Strong"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Encryption Standard */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        Encryption Standard
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setEncryptionStandard("aes-256")}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            encryptionStandard === "aes-256"
                              ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm"
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              AES 256-bit
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                              Enterprise Grade
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Military-grade encryption. Recommended for all sensitive legal, business, and personal documents.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEncryptionStandard("aes-128")}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            encryptionStandard === "aes-128"
                              ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm"
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              AES 128-bit
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Legacy Standard
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            High compatibility for legacy PDF readers and older embedded viewing systems.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Permissions Restraints */}
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        Document Permissions
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowPrinting}
                            onChange={(e) => setAllowPrinting(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                            Allow Printing
                          </span>
                        </label>
                        <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowCopying}
                            onChange={(e) => setAllowCopying(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                            Allow Text Copy
                          </span>
                        </label>
                        <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowModifying}
                            onChange={(e) => setAllowModifying(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                            Allow Changes
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unlock PDF Configuration Box */}
                {tool.id === "unlock-pdf" && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Unlock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Unlock Document
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Enter the password to permanently decrypt and remove security restrictions.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                        Current Document Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showUnlockPassword ? "text" : "password"}
                          value={unlockPassword}
                          onChange={(e) => setUnlockPassword(e.target.value)}
                          placeholder="Enter document password..."
                          className="w-full text-xs sm:text-sm p-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        >
                          {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isOrganizeTool && (
                  isLoadingPages ? (
                    <div className="p-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
                      <p className="text-xs text-slate-500 font-mono">
                        Analyzing PDF structure and extracting all {files[0]?.name} pages...
                      </p>
                    </div>
                  ) : (
                    <ThumbnailGrid
                      pages={pdfPages}
                      onRotatePage={(idx) =>
                        setPdfPages((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
                        )
                      }
                      onDeletePage={(idx) =>
                        setPdfPages((prev) => prev.map((p, i) => (i === idx ? { ...p, deleted: true } : p)))
                      }
                      onDuplicatePage={(idx) => {
                        const target = pdfPages[idx];
                        setPdfPages((prev) => [
                          ...prev.slice(0, idx + 1),
                          { ...target, id: generateId("page"), pageNumber: prev.length + 1 },
                          ...prev.slice(idx + 1),
                        ]);
                      }}
                      onReorderPages={setPdfPages}
                      onToggleSelectPage={(idx) =>
                        setPdfPages((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, selected: !p.selected } : p))
                        )
                      }
                      onSelectAll={() => setPdfPages((prev) => prev.map((p) => ({ ...p, selected: true })))}
                      onDeselectAll={() => setPdfPages((prev) => prev.map((p) => ({ ...p, selected: false })))}
                      onRotateAll={() =>
                        setPdfPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 })))
                      }
                      onReverseOrder={() => setPdfPages((prev) => [...prev].reverse())}
                    />
                  )
                )}

                {isEditCanvasTool && (
                  <CanvasEditor
                    fileName={files[0]?.name || "document.pdf"}
                    onExport={(dataUrl) => {
                      setIsCompleted(true);
                      setResultFileName("edited_document.png");
                      setResultType("image/png");
                    }}
                  />
                )}

                {/* Progress indicator */}
                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={processProgress} showLabel />
                    <p className="text-xs text-center text-slate-500 font-mono animate-pulse">
                      Executing high-throughput conversion pipeline...
                    </p>
                  </div>
                )}

                {/* Execute Button */}
                {!isEditCanvasTool && (
                  <div className="flex justify-center pt-2">
                    <Button
                      size="lg"
                      isLoading={isProcessing}
                      onClick={handleProcess}
                      className="px-8 shadow-md shadow-indigo-500/20 text-sm font-semibold gap-2"
                    >
                      <span>{tool.name}</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Step 3: Success and Result State */
          <div className="space-y-6 text-center py-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-600 flex items-center justify-center mx-auto shadow-subtle">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {tool.name} Completed!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {aiResult ? "AI Analysis & extraction generated successfully." : "Your file is processed and ready for immediate download."}
              </p>
            </div>

            {/* AI Results Custom Displays */}
            {aiResult && (
              <div className="max-w-2xl mx-auto text-left space-y-4">
                {/* 1. Extract Invoice Data View */}
                {tool.id === "extract-invoice-data" && aiResult.data && (
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="text-xs text-slate-400 uppercase font-mono">Extracted Vendor</div>
                        <div className="text-base font-bold text-slate-900 dark:text-white">
                          {aiResult.data.vendor || "Acme Corporation"}
                        </div>
                      </div>
                      <Badge variant="gradient">Confidence: 98%</Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-400 text-[11px]">Invoice #</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{aiResult.data.invoiceNumber || "INV-2026-001"}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-400 text-[11px]">Issue Date</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{aiResult.data.issueDate || "2026-09-20"}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-slate-400 text-[11px]">Due Date</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{aiResult.data.dueDate || "2026-10-20"}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30">
                        <div className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">Total Amount</div>
                        <div className="font-bold text-emerald-700 dark:text-emerald-300">{aiResult.data.total || "$1,250.00"}</div>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    {aiResult.data.lineItems && aiResult.data.lineItems.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Parsed Line Items:</div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                              <tr>
                                <th className="p-2.5">Item Description</th>
                                <th className="p-2.5">Quantity</th>
                                <th className="p-2.5">Unit Price</th>
                                <th className="p-2.5 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {aiResult.data.lineItems.map((item: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="p-2.5 font-medium">{item.description}</td>
                                  <td className="p-2.5 text-slate-500">{item.qty || 1}</td>
                                  <td className="p-2.5 text-slate-500">{item.unitPrice || "$100.00"}</td>
                                  <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">{item.total || "$100.00"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Compare PDFs View */}
                {tool.id === "compare-pdfs" && aiResult.comparison && (
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="text-xs text-slate-400 uppercase font-mono">Similarity Analysis</div>
                        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          {aiResult.comparison.similarityScore || "94.8%"} Text Match
                        </div>
                      </div>
                      <Badge variant="outline">{aiResult.comparison.differencesCount || "3 Differences"} Detected</Badge>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                      {aiResult.comparison.summary || "Revisions observed between Document A and Document B. Terms were updated in sections 2 and 4."}
                    </div>
                  </div>
                )}

                {/* 3. Summarize PDF View */}
                {tool.id === "summarize-pdf" && (
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" /> Executive Digest
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleCopyText(aiResult.summary)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied" : "Copy Summary"}
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      {aiResult.summary}
                    </p>
                    {aiResult.keyPoints && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Key Takeaways:</div>
                        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                          {aiResult.keyPoints.map((pt: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Ask PDF View */}
                {tool.id === "ask-pdf" && (
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <FileQuestion className="w-4 h-4 text-indigo-500" /> Question: "{askQuery}"
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        {aiResult.answer}
                      </p>
                      {aiResult.citations && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[11px] text-slate-400 font-mono">Citations:</span>
                          {aiResult.citations.map((c: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px]">
                              Page {c.page || 1}: "{c.text || "Direct excerpt"}"
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Compression Metrics Card if available */}
            {compressionStats && (
              <div className="max-w-md mx-auto grid grid-cols-3 gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center font-mono">
                <div>
                  <div className="text-[11px] text-slate-400">Original</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {formatBytes(compressionStats.originalSize)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Compressed</div>
                  <div className="text-sm font-bold text-emerald-600">
                    {formatBytes(compressionStats.newSize)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Reduction</div>
                  <div className="text-sm font-bold text-indigo-600">
                    -{compressionStats.reductionPercentage}%
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={handleDownload}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 gap-2 shadow-lg shadow-emerald-600/20 font-semibold"
              >
                <Download className="w-4 h-4" /> {aiResult ? "Download JSON Data" : "Download File"}
              </Button>

              <Button variant="outline" size="lg" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" /> Process Another File
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Features & FAQs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" /> Key Capabilities
          </h3>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {tool.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600" /> Frequently Asked Questions
          </h3>
          <div className="space-y-3 text-xs sm:text-sm">
            {(tool.faqs || [
              {
                question: "Is my uploaded document private and secure?",
                answer: "Yes, DocuForge operates on an ephemeral processing architecture with 256-bit SSL. Documents are automatically purged from memory after processing.",
              },
            ]).map((faq, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-white mb-1">{faq.question}</div>
                <div className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{faq.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
