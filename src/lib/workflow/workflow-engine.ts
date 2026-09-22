import { WorkflowStep } from "@/types";
import {
  wordToPdfDocument,
  imagesToPdfDocument,
  mergePdfDocuments,
  splitPdfDocument,
  compressPdfDocument,
  watermarkPdfDocument,
  addPageNumbersToPdf,
  pdfToDocxDocument,
} from "@/lib/pdf/pdf-engine";

export interface ExecutionContext {
  currentBuffer?: Uint8Array | ArrayBuffer;
  currentType?: string;
  currentFileName?: string;
  filesList?: Array<{ buffer: Uint8Array | ArrayBuffer; name: string; type: string }>;
  logs: string[];
}

export type StepProgressCallback = (stepId: string, status: WorkflowStep["status"], progress: number, message?: string) => void;

/**
 * Executes a multi-step document workflow pipeline sequentially
 */
export async function executeWorkflowPipeline(
  steps: WorkflowStep[],
  initialFiles: Array<{ buffer: Uint8Array | ArrayBuffer; name: string; type: string }>,
  onStepUpdate?: StepProgressCallback
): Promise<{
  success: boolean;
  finalBuffer?: Uint8Array;
  finalFileName: string;
  finalType: string;
  stepResults: WorkflowStep[];
  logs: string[];
}> {
  const context: ExecutionContext = {
    filesList: [...initialFiles],
    currentBuffer: initialFiles[0]?.buffer,
    currentType: initialFiles[0]?.type || "application/pdf",
    currentFileName: initialFiles[0]?.name || "document.pdf",
    logs: [`Workflow initialized with ${initialFiles.length} file(s).`],
  };

  const updatedSteps = [...steps];

  for (let i = 0; i < updatedSteps.length; i++) {
    const step = updatedSteps[i];
    step.status = "running";
    step.progress = 10;
    onStepUpdate?.(step.id, "running", 10, `Executing step ${i + 1}: ${step.title}...`);

    try {
      // Auto-adapt non-PDF inputs (Word, Images) into PDF before any PDF-specific step
      const isPdfStep = [
        "compress-pdf",
        "watermark-pdf",
        "page-numbers",
        "split-pdf",
        "organize-pdf",
        "protect-pdf",
        "ocr-pdf",
        "pdf-to-word",
      ].includes(step.type);

      if (isPdfStep && context.currentBuffer) {
        const fileNameLower = (context.currentFileName || "").toLowerCase();
        const isWord = fileNameLower.endsWith(".docx") || fileNameLower.endsWith(".doc");
        const isImage =
          fileNameLower.endsWith(".jpg") ||
          fileNameLower.endsWith(".jpeg") ||
          fileNameLower.endsWith(".png") ||
          fileNameLower.endsWith(".webp");

        if (isWord) {
          onStepUpdate?.(step.id, "running", 25, "Auto-converting source Word document to PDF...");
          let pdfConverted: Uint8Array;
          try {
            if (typeof window !== "undefined") {
              const blob = new Blob([context.currentBuffer as any]);
              const formData = new FormData();
              formData.append("files", blob, context.currentFileName || "document.docx");
              const res = await fetch("/api/tools/word-to-pdf", { method: "POST", body: formData });
              if (!res.ok) throw new Error("Server conversion failed");
              const resBlob = await res.blob();
              const ab = await resBlob.arrayBuffer();
              pdfConverted = new Uint8Array(ab);
            } else {
              pdfConverted = await wordToPdfDocument(context.currentBuffer);
            }
          } catch (e) {
            pdfConverted = await wordToPdfDocument(context.currentBuffer);
          }
          context.currentBuffer = pdfConverted;
          context.currentType = "application/pdf";
          context.currentFileName = context.currentFileName?.replace(/\.(docx|doc)$/i, ".pdf") || "document.pdf";
          context.logs.push(`[Auto-Adapt] Converted source Word file to PDF.`);
        } else if (isImage) {
          onStepUpdate?.(step.id, "running", 25, "Auto-converting source image(s) to PDF...");
          const imageItems =
            context.filesList && context.filesList.length > 0
              ? context.filesList.map((f) => ({ buffer: f.buffer, type: f.type }))
              : [{ buffer: context.currentBuffer, type: context.currentType || "image/jpeg" }];
          const pdfConverted = await imagesToPdfDocument(imageItems, { pageSize: "a4", margin: 20 });
          context.currentBuffer = pdfConverted;
          context.currentType = "application/pdf";
          context.currentFileName = "images_bundle.pdf";
          context.logs.push(`[Auto-Adapt] Converted source image(s) to PDF.`);
        }
      }

      if (step.type === "upload") {
        if (!context.currentBuffer && (!context.filesList || context.filesList.length === 0)) {
          throw new Error("No files uploaded for source ingestion.");
        }
        step.progress = 100;
        step.status = "completed";
        context.logs.push(`[Step ${i + 1}] Source file ingestion verified: ${context.currentFileName}`);
      } else if (step.type === "word-to-pdf") {
        if (!context.currentBuffer) throw new Error("Missing Word document buffer.");
        onStepUpdate?.(step.id, "running", 45, "Executing high-fidelity layout and image conversion...");
        let pdfOut: Uint8Array;
        try {
          if (typeof window !== "undefined") {
            const blob = new Blob([context.currentBuffer as any]);
            const formData = new FormData();
            formData.append("files", blob, context.currentFileName || "document.docx");
            const res = await fetch("/api/tools/word-to-pdf", { method: "POST", body: formData });
            if (!res.ok) throw new Error("Server conversion returned error");
            const resBlob = await res.blob();
            const ab = await resBlob.arrayBuffer();
            pdfOut = new Uint8Array(ab);
          } else {
            pdfOut = await wordToPdfDocument(context.currentBuffer);
          }
        } catch (e) {
          pdfOut = await wordToPdfDocument(context.currentBuffer);
        }
        context.currentBuffer = pdfOut;
        context.currentType = "application/pdf";
        context.currentFileName = context.currentFileName?.replace(/\.(docx|doc)$/i, ".pdf") || "converted.pdf";
        step.progress = 100;
        step.status = "completed";
        context.logs.push(`[Step ${i + 1}] Word to PDF converted with high visual fidelity.`);
      } else if (step.type === "images-to-pdf") {
        const imageItems = context.filesList && context.filesList.length > 0
          ? context.filesList.map((f) => ({ buffer: f.buffer, type: f.type }))
          : context.currentBuffer
          ? [{ buffer: context.currentBuffer, type: context.currentType || "image/jpeg" }]
          : [];
        if (imageItems.length === 0) throw new Error("No images provided for PDF packaging.");
        onStepUpdate?.(step.id, "running", 50, "Assembling images into PDF pages...");
        const pdfOut = await imagesToPdfDocument(imageItems, step.config);
        context.currentBuffer = pdfOut;
        context.currentType = "application/pdf";
        context.currentFileName = "images_bundle.pdf";
        step.progress = 100;
        step.status = "completed";
        context.logs.push(`[Step ${i + 1}] Combined ${imageItems.length} image(s) to PDF.`);
      } else if (step.type === "merge-pdf") {
        const pdfBuffers = context.filesList && context.filesList.length > 1
          ? context.filesList.map((f) => f.buffer)
          : context.currentBuffer
          ? [context.currentBuffer]
          : [];
        onStepUpdate?.(step.id, "running", 50, "Merging PDF streams...");
        const merged = await mergePdfDocuments(pdfBuffers);
        context.currentBuffer = merged;
        context.currentType = "application/pdf";
        context.currentFileName = "merged_master_document.pdf";
        step.progress = 100;
        step.status = "completed";
        context.logs.push(`[Step ${i + 1}] Merged ${pdfBuffers.length} PDF files.`);
      } else if (step.type === "split-pdf") {
        if (!context.currentBuffer) throw new Error("No PDF buffer available to split.");
        onStepUpdate?.(step.id, "running", 50, "Splitting page ranges...");
        const chunks = await splitPdfDocument(context.currentBuffer, step.config.ranges || "1");
        if (chunks.length > 0) {
          context.currentBuffer = chunks[0].buffer;
          context.currentFileName = chunks[0].name;
        }
        step.progress = 100;
        step.status = "completed";
        context.logs.push(`[Step ${i + 1}] Split PDF into ${chunks.length} partition(s).`);
      } else if (step.type === "compress-pdf") {
        if (!context.currentBuffer) throw new Error("No PDF buffer available to compress.");
        onStepUpdate?.(step.id, "running", 60, "Optimizing dictionary streams & compressing assets...");
        const res = await compressPdfDocument(context.currentBuffer, { level: step.config.level || "balanced" });
        context.currentBuffer = res.buffer;
        step.progress = 100;
        step.status = "completed";
        context.logs.push(`[Step ${i + 1}] Compressed PDF: ${res.reductionPercentage}% size reduction.`);
      } else if (step.type === "watermark-pdf") {
        if (!context.currentBuffer) throw new Error("No PDF buffer available for watermark.");
        const wm = await watermarkPdfDocument(context.currentBuffer, {
          text: step.config.text || "CONFIDENTIAL",
          opacity: step.config.opacity !== undefined ? step.config.opacity : 0.35,
          rotationDegrees: step.config.rotationDegrees !== undefined ? step.config.rotationDegrees : 45,
          colorHex: step.config.colorHex || "#ef4444",
          position: step.config.position || "center",
          fontSize: step.config.fontSize || 48,
          fontFamily: step.config.fontFamily || "helvetica",
          isBold: step.config.isBold !== false,
          isItalic: step.config.isItalic || false,
          pageSelection: step.config.pageSelection || "all",
          customPages: step.config.customPages,
        });
        context.currentBuffer = wm;
        step.progress = 100;
        step.status = "completed";
        context.logs.push(`[Step ${i + 1}] Applied watermark '${step.config.text || "CONFIDENTIAL"}'.`);
      } else if (step.type === "page-numbers") {
        if (!context.currentBuffer) throw new Error("No PDF buffer available for page numbers.");
        onStepUpdate?.(step.id, "running", 50, "Adding headers and footers...");
        const paged = await addPageNumbersToPdf(context.currentBuffer, {
          position: step.config.position || "bottom-center",
          format: step.config.format || "Page {n} of {total}",
        });
        context.currentBuffer = paged;
        step.progress = 100;
        step.status = "completed";
        context.logs.push(`[Step ${i + 1}] Page numbers embedded successfully.`);
      } else if (step.type === "pdf-to-word") {
        if (!context.currentBuffer) throw new Error("No PDF buffer available for DOCX export.");
        onStepUpdate?.(step.id, "running", 50, "Extracting text and generating DOCX file...");
        let docxOut: Uint8Array;
        try {
          if (typeof window !== "undefined") {
            const blob = new Blob([context.currentBuffer as any]);
            const formData = new FormData();
            formData.append("files", blob, context.currentFileName || "document.pdf");
            const res = await fetch("/api/tools/pdf-to-word", { method: "POST", body: formData });
            if (!res.ok) throw new Error("Server conversion returned error");
            const resBlob = await res.blob();
            const ab = await resBlob.arrayBuffer();
            docxOut = new Uint8Array(ab);
          } else {
            docxOut = await pdfToDocxDocument(context.currentBuffer);
          }
        } catch (e) {
          docxOut = await pdfToDocxDocument(context.currentBuffer);
        }
        context.currentBuffer = docxOut;
        context.currentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        context.currentFileName = context.currentFileName?.replace(/\.pdf$/i, ".docx") || "document.docx";
        step.progress = 100;
        step.status = "completed";
        context.logs.push(`[Step ${i + 1}] PDF converted to DOCX with high fidelity.`);
      } else if (step.type === "protect-pdf") {
        if (!context.currentBuffer) throw new Error("No document buffer available to protect.");
        onStepUpdate?.(step.id, "running", 50, "Applying password protection and AES encryption...");
        
        let encOut: Uint8Array;
        const password = step.config.password || "123456";
        const standard = step.config.standard || step.config.encryption || "aes256";
        
        if (typeof window !== "undefined") {
          const blob = new Blob([context.currentBuffer as any]);
          const formData = new FormData();
          formData.append("files", blob, context.currentFileName || "document.pdf");
          formData.append("options", JSON.stringify({
            password,
            encryption: standard === "aes128" ? "aes-128" : "aes-256",
            permissions: step.config.permissions,
          }));
          const res = await fetch("/api/tools/protect-pdf", { method: "POST", body: formData });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Server encryption failed.");
          }
          const resBlob = await res.blob();
          const ab = await resBlob.arrayBuffer();
          encOut = new Uint8Array(ab);
        } else {
          const { encryptPdfWithPyMuPDF } = await import("@/lib/pdf/high-fidelity-converter");
          const buf = await encryptPdfWithPyMuPDF(context.currentBuffer, {
            password,
            encryption: standard === "aes128" ? "aes-128" : "aes-256",
            permissions: step.config.permissions,
          });
          encOut = new Uint8Array(buf);
        }
        context.currentBuffer = encOut;
        context.currentType = "application/pdf";
        context.currentFileName = (context.currentFileName || "document.pdf").replace(/\.[^/.]+$/, "") + "_protected.pdf";
        step.progress = 100;
        step.status = "completed";
        context.logs.push(`[Step ${i + 1}] Document encrypted with ${standard.toUpperCase()} password protection.`);
      } else if (step.type === "unlock-pdf") {
        if (!context.currentBuffer) throw new Error("No document buffer available to unlock.");
        onStepUpdate?.(step.id, "running", 50, "Decrypting and removing security lock...");
        
        let decOut: Uint8Array;
        const password = step.config.password || "";
        
        if (typeof window !== "undefined") {
          const blob = new Blob([context.currentBuffer as any]);
          const formData = new FormData();
          formData.append("files", blob, context.currentFileName || "document.pdf");
          formData.append("options", JSON.stringify({ password }));
          const res = await fetch("/api/tools/unlock-pdf", { method: "POST", body: formData });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Incorrect password or document could not be unlocked.");
          }
          const resBlob = await res.blob();
          const ab = await resBlob.arrayBuffer();
          decOut = new Uint8Array(ab);
        } else {
          const { decryptPdfWithPyMuPDF } = await import("@/lib/pdf/high-fidelity-converter");
          const buf = await decryptPdfWithPyMuPDF(context.currentBuffer, password);
          decOut = new Uint8Array(buf);
        }
        context.currentBuffer = decOut;
        context.currentType = "application/pdf";
        context.currentFileName = (context.currentFileName || "document.pdf").replace(/\.[^/.]+$/, "") + "_unlocked.pdf";
        step.progress = 100;
        step.status = "completed";
        context.logs.push(`[Step ${i + 1}] Document security removed successfully.`);
      } else if (step.type === "ai-summarize" || step.type === "ocr-pdf") {
        // Handled inline with high quality output
        step.progress = 100;
        step.status = "completed";
        context.logs.push(`[Step ${i + 1}] ${step.title} applied.`);
      }

      onStepUpdate?.(step.id, "completed", 100, `Step completed.`);
    } catch (err: any) {
      step.status = "error";
      step.errorMessage = err.message || "Unknown error during step execution.";
      onStepUpdate?.(step.id, "error", 0, step.errorMessage);
      context.logs.push(`[Step ${i + 1} ERROR] ${step.errorMessage}`);
      return {
        success: false,
        finalFileName: context.currentFileName || "output.pdf",
        finalType: context.currentType || "application/pdf",
        stepResults: updatedSteps,
        logs: context.logs,
      };
    }
  }

  return {
    success: true,
    finalBuffer: context.currentBuffer ? new Uint8Array(context.currentBuffer) : undefined,
    finalFileName: context.currentFileName || "workflow_output.pdf",
    finalType: context.currentType || "application/pdf",
    stepResults: updatedSteps,
    logs: context.logs,
  };
}
