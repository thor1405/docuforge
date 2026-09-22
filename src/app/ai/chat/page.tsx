"use client";

import * as React from "react";
import { AiChatInterface } from "@/components/ai/ai-chat-interface";
import { FileUploader } from "@/components/upload/file-uploader";
import { UploadedFileItem } from "@/types";
import { Sparkles, MessageSquare, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function AiChatPage() {
  const [files, setFiles] = React.useState<UploadedFileItem[]>([]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="gradient">AI Document Intelligence</Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Ask PDF & Interactive Document Chat
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Upload any PDF report, legal agreement, research paper, or financial statement. Ask questions, receive verified answers with page citations, and explore your document conversationally.
        </p>
      </div>

      {files.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-elevated">
          <FileUploader
            acceptedFormats={[".pdf", ".docx", ".txt"]}
            maxFiles={1}
            maxSizeMb={50}
            multiple={false}
            onFilesSelected={setFiles}
            selectedFiles={files}
            title="Upload document to start AI Chat"
            subtitle="PDF, DOCX, or TXT (up to 50 MB)"
          />
        </div>
      ) : (
        <AiChatInterface
          documentName={files[0].name}
          pageCount={4}
        />
      )}
    </div>
  );
}
