import { WorkflowStep, WorkflowStepType, WorkflowTemplate } from "@/types";
import { generateId } from "@/lib/utils";

export interface ParsedWorkflowResult {
  title: string;
  summary: string;
  steps: WorkflowStep[];
  detectedInputFormat: "docx" | "pdf" | "image" | "auto";
  suggestedName: string;
}

export const PRESET_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "email-ready-doc",
    title: "Email-Ready Document Pipeline",
    description: "Convert Word/Docs to PDF, compress below 2MB, add professional footer numbering.",
    badge: "Popular",
    promptExample: "Convert Word document to PDF, compress below 2 MB, and add page numbers.",
    steps: [
      { type: "upload", title: "Upload Word / Source Document" },
      { type: "word-to-pdf", title: "Word to PDF Conversion" },
      { type: "compress-pdf", title: "Compress PDF (Target < 2MB)", config: { level: "balanced" } },
      { type: "page-numbers", title: "Add Footer Page Numbers", config: { position: "bottom-center", format: "Page {n} of {total}" } },
    ],
  },
  {
    id: "confidential-legal-bundle",
    title: "Confidential Legal Pack",
    description: "Merge multiple exhibits, stamp with CONFIDENTIAL watermark, and protect with 256-bit password.",
    badge: "Legal",
    promptExample: "Merge PDFs, apply CONFIDENTIAL watermark, and encrypt with password.",
    steps: [
      { type: "upload", title: "Upload Contract / Exhibit PDFs" },
      { type: "merge-pdf", title: "Merge Documents into Single Master" },
      { type: "watermark-pdf", title: "Stamp Diagonal Watermark", config: { text: "CONFIDENTIAL", opacity: 0.35, rotationDegrees: 45 } },
      { type: "protect-pdf", title: "Apply Password Encryption", config: { password: "" } },
    ],
  },
  {
    id: "receipt-ocr-archive",
    title: "Expense Receipt OCR & Archival",
    description: "Convert receipt photos to PDF, perform multi-language OCR, and compress for cloud archiving.",
    badge: "Finance",
    promptExample: "Convert JPG receipt photos to PDF, OCR text, and compress.",
    steps: [
      { type: "upload", title: "Upload Receipt Images (JPG/PNG)" },
      { type: "images-to-pdf", title: "Combine Images to PDF", config: { pageSize: "a4", margin: 20 } },
      { type: "ocr-pdf", title: "Extract Selectable Text (OCR)", config: { language: "eng" } },
      { type: "compress-pdf", title: "Optimize for Cloud Storage", config: { level: "extreme" } },
    ],
  },
  {
    id: "report-executive-brief",
    title: "AI Report Digest & Extraction",
    description: "Convert document to PDF, extract AI executive summary, and generate clean Word digest.",
    badge: "AI",
    promptExample: "Summarize this PDF report, extract key bullet points, and export as editable DOCX.",
    steps: [
      { type: "upload", title: "Upload Annual Report / Document" },
      { type: "ai-summarize", title: "Generate AI Executive Summary", config: { length: "medium" } },
      { type: "pdf-to-word", title: "Generate Editable Brief (DOCX)" },
    ],
  },
];

/**
 * Natural Language Workflow Parser
 * Analyzes natural language instructions and translates into an executable DAG step pipeline
 */
export function parseNaturalLanguageToWorkflow(prompt: string): ParsedWorkflowResult {
  const p = prompt.toLowerCase();
  const steps: WorkflowStep[] = [];

  // Step 0: Ingestion node
  let detectedFormat: "docx" | "pdf" | "image" | "auto" = "auto";
  if (p.includes("word") || p.includes("docx") || p.includes("doc")) {
    detectedFormat = "docx";
  } else if (p.includes("image") || p.includes("jpg") || p.includes("png") || p.includes("photo") || p.includes("receipt")) {
    detectedFormat = "image";
  } else if (p.includes("pdf")) {
    detectedFormat = "pdf";
  }

  steps.push({
    id: generateId("step"),
    toolId: "upload",
    title: "Source Document Ingestion",
    type: "upload",
    description: `Accepts ${detectedFormat === "auto" ? "any supported file" : detectedFormat.toUpperCase()} inputs.`,
    status: "pending",
    config: { acceptedType: detectedFormat },
  });

  // 1. Conversion to PDF
  if (p.includes("word") || p.includes("docx") || p.includes("doc to pdf")) {
    steps.push({
      id: generateId("step"),
      toolId: "word-to-pdf",
      title: "Word to PDF",
      type: "word-to-pdf",
      description: "Convert Word document to standardized PDF format.",
      status: "pending",
      config: {},
    });
  } else if (p.includes("jpg to pdf") || p.includes("image to pdf") || (p.includes("image") && p.includes("to pdf"))) {
    steps.push({
      id: generateId("step"),
      toolId: "jpg-to-pdf",
      title: "Images to PDF",
      type: "images-to-pdf",
      description: "Package images into multi-page PDF document.",
      status: "pending",
      config: { pageSize: "a4", margin: 20 },
    });
  }

  // 2. Merge PDFs
  if (p.includes("merge") || p.includes("combine") || p.includes("unite") || p.includes("join")) {
    steps.push({
      id: generateId("step"),
      toolId: "merge-pdf",
      title: "Merge PDF Documents",
      type: "merge-pdf",
      description: "Combine uploaded documents in chronological sequence.",
      status: "pending",
      config: {},
    });
  }

  // 3. Split PDF
  if (p.includes("split") || p.includes("extract page") || p.includes("divide")) {
    const rangeMatch = prompt.match(/\b\d+-\d+\b/);
    steps.push({
      id: generateId("step"),
      toolId: "split-pdf",
      title: "Split PDF",
      type: "split-pdf",
      description: "Extract page segments or burst into individual files.",
      status: "pending",
      config: { ranges: rangeMatch ? rangeMatch[0] : "1-3, 4-6" },
    });
  }

  // 4. Organize / Rotate / Reorder
  if (p.includes("rotate") || p.includes("reorder") || p.includes("organize") || p.includes("delete page")) {
    steps.push({
      id: generateId("step"),
      toolId: "organize-pdf",
      title: "Organize Pages",
      type: "organize-pdf",
      description: "Apply page rotations and sequence structure.",
      status: "pending",
      config: { rotation: 90 },
    });
  }

  // 5. OCR & Text recognition
  if (p.includes("ocr") || p.includes("scanned") || p.includes("recognize text") || p.includes("searchable")) {
    steps.push({
      id: generateId("step"),
      toolId: "ocr-pdf",
      title: "OCR Text Extraction",
      type: "ocr-pdf",
      description: "Convert raster scans into selectable searchable text.",
      status: "pending",
      config: { language: "eng" },
    });
  }

  // 6. Compress PDF
  if (p.includes("compress") || p.includes("reduce size") || p.includes("below") || p.includes("shrink") || p.includes("optimize")) {
    let target = "balanced";
    if (p.includes("2 mb") || p.includes("1 mb") || p.includes("maximum") || p.includes("extreme")) {
      target = "extreme";
    }
    steps.push({
      id: generateId("step"),
      toolId: "compress-pdf",
      title: "Compress PDF",
      type: "compress-pdf",
      description: `Compress document streams (mode: ${target}).`,
      status: "pending",
      config: { level: target },
    });
  }

  // 7. Page Numbers
  if (p.includes("page number") || p.includes("number page") || p.includes("add numbering") || p.includes("page numbers")) {
    steps.push({
      id: generateId("step"),
      toolId: "page-numbers",
      title: "Add Page Numbers",
      type: "page-numbers",
      description: "Embed dynamic footer page numbers (Page {n} of {total}).",
      status: "pending",
      config: { position: "bottom-center", format: "Page {n} of {total}" },
    });
  }

  // 8. Watermark
  if (p.includes("watermark") || p.includes("stamp") || p.includes("confidential") || p.includes("draft")) {
    let wmText = "CONFIDENTIAL";
    const quotedMatch = prompt.match(/['"]([^'"]+)['"]/);
    if (quotedMatch && quotedMatch[1]) {
      wmText = quotedMatch[1].toUpperCase();
    } else if (p.includes("draft")) {
      wmText = "DRAFT";
    } else if (p.includes("sample")) {
      wmText = "SAMPLE";
    } else if (p.includes("approved")) {
      wmText = "APPROVED";
    }
    steps.push({
      id: generateId("step"),
      toolId: "watermark-pdf",
      title: "Apply Watermark",
      type: "watermark-pdf",
      description: `Stamp '${wmText}' diagonally across all pages.`,
      status: "pending",
      config: { text: wmText, opacity: 0.35, rotationDegrees: 45 },
    });
  }

  // 9. Protect / Password
  if (p.includes("password") || p.includes("encrypt") || p.includes("protect") || p.includes("lock")) {
    steps.push({
      id: generateId("step"),
      toolId: "protect-pdf",
      title: "Password Encryption",
      type: "protect-pdf",
      description: "Secure PDF with AES password protection.",
      status: "pending",
      config: { password: "" },
    });
  }

  // 10. AI Summarize / Extract
  if (p.includes("summarize") || p.includes("summary") || p.includes("executive brief")) {
    steps.push({
      id: generateId("step"),
      toolId: "ai-summarize",
      title: "AI Executive Brief",
      type: "ai-summarize",
      description: "Synthesize executive summary and key insights.",
      status: "pending",
      config: { length: "medium" },
    });
  }

  // 11. PDF to Word / Export
  if (p.includes("pdf to word") || p.includes("to docx") || p.includes("to word") || p.includes("export word")) {
    steps.push({
      id: generateId("step"),
      toolId: "pdf-to-word",
      title: "PDF to Word (DOCX)",
      type: "pdf-to-word",
      description: "Generate editable DOCX document from PDF content.",
      status: "pending",
      config: {},
    });
  }

  // If no specific middle steps detected, default to a smart optimization workflow
  if (steps.length === 1) {
    steps.push({
      id: generateId("step"),
      toolId: "compress-pdf",
      title: "Optimize Document",
      type: "compress-pdf",
      description: "Optimize PDF dictionary streams and compress assets.",
      status: "pending",
      config: { level: "balanced" },
    });
    steps.push({
      id: generateId("step"),
      toolId: "page-numbers",
      title: "Add Page Numbers",
      type: "page-numbers",
      description: "Add clean footer numbering.",
      status: "pending",
      config: { position: "bottom-center", format: "Page {n} of {total}" },
    });
  }

  const generatedTitle = `Custom Workflow: ${steps
    .filter((s) => s.type !== "upload")
    .map((s) => s.title)
    .join(" → ")}`;

  return {
    title: generatedTitle,
    summary: `Configured pipeline with ${steps.length} operational steps tailored to your request.`,
    steps,
    detectedInputFormat: detectedFormat,
    suggestedName: `Workflow_${Date.now().toString(36).toUpperCase()}`,
  };
}
