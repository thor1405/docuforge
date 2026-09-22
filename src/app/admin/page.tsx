"use client";

import * as React from "react";
import {
  Activity,
  Server,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  Zap,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const toolStats = [
    { name: "Word to PDF", count: 4820, percentage: 32 },
    { name: "Compress PDF", count: 3410, percentage: 23 },
    { name: "Merge PDF", count: 2890, percentage: 19 },
    { name: "Smart Workflows", count: 1950, percentage: 13 },
    { name: "OCR PDF", count: 1120, percentage: 8 },
    { name: "AI Document Chat", count: 750, percentage: 5 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default">System Operations Console</Badge>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All Systems Operational
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Cluster Telemetry & Health
          </h1>
        </div>

        <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={isRefreshing} className="gap-2 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Metrics
        </Button>
      </div>

      {/* Cluster Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Active Jobs in Queue</span>
            <Server className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">0 Queued</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Throughput: 142 ops/min</div>
        </Card>

        <Card className="p-5 border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Worker Cluster</span>
            <Cpu className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">4 Nodes</div>
          <div className="text-[11px] text-slate-400 mt-1">LibreOffice & Python Active</div>
        </Card>

        <Card className="p-5 border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Ephemeral Storage</span>
            <HardDrive className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">3.2 GB / 50 GB</div>
          <div className="text-[11px] text-slate-400 mt-1">Auto-cleanup TTL: 1 Hour</div>
        </Card>

        <Card className="p-5 border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Job Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">99.94%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">14,940 Successful Jobs</div>
        </Card>
      </div>

      {/* Tool Distribution and System Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tool Usage Breakdown */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Tool Volume Distribution</h3>
          <div className="space-y-3">
            {toolStats.map((t) => (
              <div key={t.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-800 dark:text-slate-200">{t.name}</span>
                  <span className="text-slate-500 font-mono">{t.count.toLocaleString()} ops ({t.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${t.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worker Telemetry Logs */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-950 text-slate-200 border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Worker Node Telemetry Stream</span>
            <span className="text-emerald-400">● LIVE</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            <div><span className="text-slate-500">[16:30:12]</span> <span className="text-cyan-400">WORKER-01</span>: Job #49120 word-to-pdf completed in 214ms</div>
            <div><span className="text-slate-500">[16:30:14]</span> <span className="text-emerald-400">CLEANUP</span>: Purged 14 expired temporary buffers from RAM</div>
            <div><span className="text-slate-500">[16:30:18]</span> <span className="text-cyan-400">WORKER-02</span>: Job #49121 compress-pdf (8.4MB → 2.1MB) -75%</div>
            <div><span className="text-slate-500">[16:30:22]</span> <span className="text-indigo-400">WORKFLOW</span>: Pipeline #8819 compiled with 4 nodes</div>
            <div><span className="text-slate-500">[16:30:26]</span> <span className="text-cyan-400">WORKER-03</span>: OCR batch processed in 410ms (100% confidence)</div>
            <div><span className="text-slate-500">[16:30:30]</span> <span className="text-cyan-400">WORKER-01</span>: Health check OK. Memory 18.2% utilized</div>
          </div>
        </div>
      </div>
    </div>
  );
}
