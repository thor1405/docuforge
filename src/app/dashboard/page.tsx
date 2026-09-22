"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  Download,
  Play,
  Trash2,
  HardDrive,
  CheckCircle2,
  Zap,
  ArrowRight,
  Plus,
  RefreshCw,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatBytes } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

export const dynamic = "force-dynamic";

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState<"files" | "workflows">("files");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const [dashboardData, setDashboardData] = React.useState<{
    stats: {
      dailyOperations: { current: number; quota: number; plan: string };
      savedBandwidthBytes: number;
      customWorkflows: { activeCount: number; totalExecutions: number };
      avgProcessingSpeedMs: number;
    };
    recentConversions: Array<{
      id: string;
      name: string;
      toolUsed: string;
      originalSize: number;
      resultSize: number;
      bandwidthSaved: number;
      processingTimeMs: number;
      status: string;
      createdAt: string;
    }>;
    savedWorkflows: Array<{
      id: string;
      name: string;
      description: string;
      steps: any[];
      stepsCount: number;
      runsCount: number;
      lastRunAt?: string;
      createdAt: string;
    }>;
  }>({
    stats: {
      dailyOperations: { current: 0, quota: 50, plan: "free" },
      savedBandwidthBytes: 0,
      customWorkflows: { activeCount: 0, totalExecutions: 0 },
      avgProcessingSpeedMs: 0,
    },
    recentConversions: [],
    savedWorkflows: [],
  });

  const fetchLiveDashboard = React.useCallback(async (showRefresh = false) => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }
    if (showRefresh) setIsRefreshing(true);
    try {
      const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
      if (res.ok) {
        const text = await res.text();
        if (text) {
          const json = JSON.parse(text);
          if (json.success) {
            setDashboardData({
              stats: json.stats,
              recentConversions: json.recentConversions || [],
              savedWorkflows: json.savedWorkflows || [],
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to load live dashboard:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLiveDashboard();
  }, [user]);

  const handleDeleteActivity = async (id: string) => {
    try {
      const res = await fetch(`/api/activities?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setDashboardData((prev) => ({
          ...prev,
          recentConversions: prev.recentConversions.filter((a) => a.id !== id),
        }));
      }
    } catch (err) {
      console.error("Error deleting activity:", err);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      const res = await fetch(`/api/workflows/saved?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setDashboardData((prev) => ({
          ...prev,
          savedWorkflows: prev.savedWorkflows.filter((w) => w.id !== id),
          stats: {
            ...prev.stats,
            customWorkflows: {
              ...prev.stats.customWorkflows,
              activeCount: Math.max(0, prev.stats.customWorkflows.activeCount - 1),
            },
          },
        }));
      }
    } catch (err) {
      console.error("Error deleting workflow:", err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return "Just now";
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} mins ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Dashboard Top Greeting & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              User Workspace & Activity
            </h1>
            <Badge variant="gradient" className="text-[10px]">
              Live MongoDB
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {user
              ? `Logged in as ${user.name} (${user.email}) • Real-time MongoDB metrics`
              : "Monitor document operations, manage saved pipelines, and access recent conversions."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLiveDashboard(true)}
            isLoading={isRefreshing}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Link href="/workspace">
            <Button className="gap-2 shadow-sm text-xs sm:text-sm">
              <Plus className="w-4 h-4" />
              <span>New Smart Workflow</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">Daily Operations</div>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {dashboardData.stats.dailyOperations.current} / {dashboardData.stats.dailyOperations.quota}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 uppercase tracking-wider font-mono">
            {dashboardData.stats.dailyOperations.plan} Plan Quota
          </div>
        </Card>

        <Card className="p-5 border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">Saved Bandwidth</div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatBytes(dashboardData.stats.savedBandwidthBytes)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Via Smart Compression</div>
        </Card>

        <Card className="p-5 border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">Custom Workflows</div>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {dashboardData.stats.customWorkflows.activeCount} Active
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {dashboardData.stats.customWorkflows.totalExecutions} Total Executions
          </div>
        </Card>

        <Card className="p-5 border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">Avg Processing Speed</div>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {dashboardData.stats.avgProcessingSpeedMs} ms
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Ultra-Low Latency</div>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("files")}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === "files"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Recent Conversions ({dashboardData.recentConversions.length})
          </button>
          <button
            onClick={() => setActiveTab("workflows")}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === "workflows"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Saved Workflows ({dashboardData.savedWorkflows.length})
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Loading real live data from MongoDB...</p>
          </div>
        ) : activeTab === "files" ? (
          dashboardData.recentConversions.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No document conversions yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Process any file with DocuForge utilities (Compress, Word to PDF, Watermark, etc.) to record live activity here.
                </p>
              </div>
              <Link href="/tools">
                <Button size="sm" className="gap-1.5">
                  <span>Explore Tools Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-subtle">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Document Name</th>
                      <th className="p-4">Tool Applied</th>
                      <th className="p-4">Original / Output Size</th>
                      <th className="p-4">Processed</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dashboardData.recentConversions.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="truncate max-w-xs">{file.name}</span>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">{file.toolUsed}</Badge>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                          {formatBytes(file.originalSize)} → {formatBytes(file.resultSize)}
                        </td>
                        <td className="p-4 text-slate-500 text-xs">{formatTimeAgo(file.createdAt)}</td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(file.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Remove from history"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : dashboardData.savedWorkflows.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No custom workflows saved</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Build reusable multi-step document pipelines with Natural Language in the Smart Workspace and save them to MongoDB.
              </p>
            </div>
            <Link href="/workspace">
              <Button size="sm" className="gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Build a Workflow</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardData.savedWorkflows.map((wf) => (
              <Card key={wf.id} hoverEffect className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="default">{wf.stepsCount} Steps</Badge>
                    <span className="text-[11px] text-slate-400 font-mono">Ran {wf.runsCount}x</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{wf.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-relaxed line-clamp-2">
                    {wf.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleDeleteWorkflow(wf.id)}
                    className="text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                  <Link href={`/workspace?prompt=${encodeURIComponent(wf.description)}`}>
                    <Button size="sm" className="text-xs gap-1.5">
                      <Play className="w-3 h-3 fill-white" /> Run
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
