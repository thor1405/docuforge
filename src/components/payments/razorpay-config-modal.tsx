"use client";

import * as React from "react";
import {
  Key,
  Lock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RazorpayConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (config: { keyId: string; mode: string }) => void;
}

export function RazorpayConfigModal({ isOpen, onClose, onConfigSaved }: RazorpayConfigModalProps) {
  const [keyId, setKeyId] = React.useState("");
  const [keySecret, setKeySecret] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(true);
  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentMode, setCurrentMode] = React.useState<string>("placeholder");
  const [isCustom, setIsCustom] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;

    const fetchConfig = async () => {
      setIsFetching(true);
      try {
        const res = await fetch("/api/payments/config");
        if (res.ok) {
          const data = await res.json();
          if (data.keyId) {
            setKeyId(data.keyId);
          }
          setCurrentMode(data.mode);
          setIsCustom(data.isCustom);
        }
      } catch (err) {
        console.error("Failed to load Razorpay config:", err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchConfig();
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyId.trim() || !keySecret.trim()) {
      setStatusMsg({
        type: "error",
        text: "Please enter both Razorpay Key ID and Key Secret.",
      });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/payments/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId: keyId.trim(), keySecret: keySecret.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save credentials.");
      }

      setStatusMsg({
        type: "success",
        text: data.message || "Razorpay keys saved successfully!",
      });

      onConfigSaved({ keyId: data.keyId, mode: data.mode });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to update Razorpay configuration.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Razorpay API Credentials</h3>
                <Badge variant="outline" className="text-[10px] text-indigo-300 border-indigo-400/40">
                  Live & Test Modes
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Connect your real Razorpay Merchant account for authentic checkout.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                statusMsg.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500 text-emerald-800 dark:text-emerald-200"
                  : "bg-rose-50 dark:bg-rose-950/60 border border-rose-500 text-rose-800 dark:text-rose-200"
              }`}
            >
              {statusMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Guide Alert */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-2 text-xs">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Where to get your Razorpay API Keys:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>
                Log into your Razorpay Dashboard:{" "}
                <a
                  href="https://dashboard.razorpay.com/app/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                >
                  dashboard.razorpay.com/app/keys <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Navigate to <b>Account & Settings → API Keys</b>.</li>
              <li>
                Generate or copy your <b>Key ID</b> (starts with <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">rzp_test_...</code> or <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">rzp_live_...</code>) and <b>Key Secret</b>.
              </li>
            </ol>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Razorpay Key ID
              </label>
              <input
                type="text"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                placeholder="rzp_test_... or rzp_live_..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Razorpay Key Secret
              </label>
              <input
                type="password"
                value={keySecret}
                onChange={(e) => setKeySecret(e.target.value)}
                placeholder="Enter your 24+ character key secret"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Save & Connect Razorpay</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
