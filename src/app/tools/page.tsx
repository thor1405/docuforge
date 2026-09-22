"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Layers,
  Sparkles,
  ShieldCheck,
  Minimize2,
  Lock,
  ArrowRight,
  Combine,
  Split,
  Stamp,
  Hash,
  Search,
  Sliders,
  ScanText,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CATEGORIES_CONFIG, TOOLS_REGISTRY, ToolCategory } from "@/lib/tools-registry";

export default function ToolsDirectoryPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<ToolCategory | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <Badge variant="default">Complete Tool Directory</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          All Document & PDF Utilities
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Browse our full catalog of 40+ professional document conversion, organization, compression, editing, and security tools.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
              selectedCategory === "all"
                ? "bg-indigo-600 text-white font-semibold shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All ({TOOLS_REGISTRY.length})
          </button>
          {CATEGORIES_CONFIG.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tools Grid */}
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

              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Open Tool</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
