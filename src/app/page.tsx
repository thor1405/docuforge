"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Layers,
  Sparkles,
  ShieldCheck,
  Minimize2,
  Lock,
  ArrowRight,
  Zap,
  CheckCircle2,
  ScanText,
  Combine,
  Split,
  Stamp,
  Hash,
  Search,
  Sliders,
  TrendingUp,
  Cpu,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileUploader } from "@/components/upload/file-uploader";
import { NLInput } from "@/components/workflow/nl-input";
import { CATEGORIES_CONFIG, TOOLS_REGISTRY, ToolCategory, ToolDefinition } from "@/lib/tools-registry";
import { UploadedFileItem } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState<ToolCategory | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [heroFiles, setHeroFiles] = React.useState<UploadedFileItem[]>([]);

  const handleHeroFilesSelected = (files: UploadedFileItem[]) => {
    setHeroFiles(files);
    if (files.length > 0) {
      const file = files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "docx" || ext === "doc") {
        router.push("/tools/word-to-pdf");
      } else if (["jpg", "jpeg", "png"].includes(ext || "")) {
        router.push("/tools/jpg-to-pdf");
      } else {
        router.push("/tools/merge-pdf");
      }
    }
  };

  const handleCreateWorkflowFromPrompt = (prompt: string) => {
    router.push(`/workspace?prompt=${encodeURIComponent(prompt)}`);
  };

  const filteredTools = TOOLS_REGISTRY.filter((tool) => {
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case "FileText":
        return <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case "Combine":
      case "Layers":
        return <Combine className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
      case "Split":
        return <Split className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case "Minimize2":
        return <Minimize2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case "Stamp":
        return <Stamp className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case "Lock":
        return <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case "Hash":
        return <Hash className="w-5 h-5 text-violet-600 dark:text-violet-400" />;
      case "ScanText":
        return <ScanText className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case "Sparkles":
      case "MessageSquare":
        return <Sparkles className="w-5 h-5 text-indigo-500" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-grid-pattern">
        {/* Glow ambient background gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none opacity-40 dark:opacity-20 flex justify-between">
          <div className="w-96 h-96 rounded-full bg-indigo-500/30 blur-[120px]" />
          <div className="w-96 h-96 rounded-full bg-cyan-500/30 blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-subtle">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>DocuForge 2.0 • The Intelligent Document Workspace</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-mono">NEW</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Everything you need to work with{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                documents and PDFs.
              </span>
            </h1>
            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Convert, edit, compress, organize, secure and automate your documents in one powerful, privacy-first workspace.
            </p>
          </div>

          {/* Smart Workspace Natural Language Input Bar */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-500" /> Smart PDF Workflow Builder
            </div>
            <NLInput onGenerateWorkflow={handleCreateWorkflowFromPrompt} />
          </div>

          {/* Quick File Drop Area */}
          <div className="max-w-2xl mx-auto pt-4">
            <FileUploader
              onFilesSelected={handleHeroFilesSelected}
              selectedFiles={heroFiles}
              title="Or drop your files here to start"
              subtitle="DOCX • PDF • JPG • PNG • XLSX • PPTX"
              maxFiles={10}
            />
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/workspace">
              <Button size="lg" className="shadow-elevated gap-2 font-semibold">
                <span>Launch Smart Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/tools">
              <Button variant="outline" size="lg">
                Explore All 40+ Tools
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Enterprise Metrics Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <div className="flex items-center gap-3.5 p-2">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">&lt; 100ms</div>
              <div className="text-xs text-slate-500">In-Browser Processing</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">100% Private</div>
              <div className="text-xs text-slate-500">Auto-Deleting Ephemeral Files</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">40+ Utilities</div>
              <div className="text-xs text-slate-500">All-in-One Engine</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-2">
            <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">AI Grounded</div>
              <div className="text-xs text-slate-500">Page Citation Engine</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Directory & Category Browser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <Badge variant="default" className="mb-2">
              Comprehensive Suite
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Document Engineering & PDF Tools
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select a dedicated tool or combine them using our Smart Workspace.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 40+ tools..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-subtle"
            />
          </div>
        </div>

        {/* Category Tabs Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
              selectedCategory === "all"
                ? "bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-500/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            All Tools ({TOOLS_REGISTRY.length})
          </button>
          {CATEGORIES_CONFIG.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-500/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Tools Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => (
            <Link key={tool.id} href={`/tools/${tool.slug}`} className="group">
              <Card hoverEffect className="h-full flex flex-col justify-between p-5 border-slate-200/80 dark:border-slate-800/80">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 group-hover:scale-105 transition-transform duration-200">
                      {getToolIcon(tool.iconName)}
                    </div>
                    {tool.badge && (
                      <Badge
                        variant={
                          tool.badge === "AI"
                            ? "gradient"
                            : tool.badge === "Popular"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {tool.badge}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Feature: Smart PDF Workspace Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white relative overflow-hidden border border-indigo-800/40 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5" /> Signature Innovation
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Automate complex document routines with natural language.
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Describe multi-step tasks in plain English. DocuForge automatically compiles and connects conversion, compression, page numbering, and watermarking into a synchronized execution pipeline.
              </p>

              <div className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Interactive node editor with full step configuration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Save and share reusable team workflow templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Run end-to-end batches in parallel</span>
                </div>
              </div>

              <Link href="/workspace">
                <Button size="lg" className="bg-indigo-500 hover:bg-indigo-600 text-white mt-2 shadow-lg shadow-indigo-500/30 gap-2">
                  <span>Try Smart Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Visual Workflow Mockup */}
            <div className="lg:col-span-6 bg-slate-900/90 rounded-2xl border border-slate-700/60 p-5 space-y-3 shadow-elevated font-sans">
              <div className="text-xs font-mono text-cyan-400 flex items-center justify-between border-b border-slate-800 pb-2">
                <span>PIPELINE ENGINE: ACTIVE</span>
                <span>4 NODES LINKED</span>
              </div>

              {/* Node Sequence */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold">Word to PDF</span>
                  </div>
                  <span className="text-emerald-400 text-[11px] font-mono">Ready</span>
                </div>

                <div className="flex justify-center text-slate-500">↓</div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Minimize2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold">Compress (Target &lt; 2MB)</span>
                  </div>
                  <span className="text-emerald-400 text-[11px] font-mono">Balanced</span>
                </div>

                <div className="flex justify-center text-slate-500">↓</div>

                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-violet-400" />
                    <span className="font-semibold">Add Footer Page Numbers</span>
                  </div>
                  <span className="text-emerald-400 text-[11px] font-mono">Page {'{n}'} of {'{total}'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
