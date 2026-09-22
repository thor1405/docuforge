import Link from "next/link";
import { Layers, ShieldCheck, Zap, Lock, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Col 1: Brand */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">DocuForge</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Enterprise-grade document engineering and PDF automation platform. Convert, organize, edit, secure, and compose workflows with AI.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 256-Bit SSL Encrypted
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-indigo-500" /> Ephemeral Processing
              </span>
            </div>
          </div>

          {/* Col 2: Convert & Organize */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
              Convert & Organize
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/tools/word-to-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Word to PDF</Link></li>
              <li><Link href="/tools/pdf-to-word" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">PDF to Word</Link></li>
              <li><Link href="/tools/merge-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Merge PDF</Link></li>
              <li><Link href="/tools/split-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Split PDF</Link></li>
              <li><Link href="/tools/organize-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Organize Pages</Link></li>
            </ul>
          </div>

          {/* Col 3: Optimize & Secure */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
              Optimize & Secure
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/tools/compress-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Compress PDF</Link></li>
              <li><Link href="/tools/watermark-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Watermark PDF</Link></li>
              <li><Link href="/tools/protect-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Protect PDF</Link></li>
              <li><Link href="/tools/ocr-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">OCR Searchable PDF</Link></li>
              <li><Link href="/tools/edit-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Edit & Annotate</Link></li>
            </ul>
          </div>

          {/* Col 4: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
              Workspace & AI
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/workspace" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1">Smart Workspace <Zap className="w-3 h-3" /></Link></li>
              <li><Link href="/ai/chat" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Ask PDF & Chat</Link></li>
              <li><Link href="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">User Dashboard</Link></li>
              <li><Link href="/pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing & Plans</Link></li>
              <li><Link href="/admin" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">System Health</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} DocuForge. High-throughput document intelligence.
          </div>
          <div className="flex items-center gap-6">
            <span>Privacy First: Files auto-deleted after processing</span>
            <span>API & Docker Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
