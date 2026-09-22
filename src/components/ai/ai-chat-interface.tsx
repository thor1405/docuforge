"use client";

import * as React from "react";
import { AiChatMessage } from "@/types";
import { generateId } from "@/lib/utils";
import {
  Sparkles,
  Send,
  FileText,
  Bookmark,
  ChevronRight,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiChatInterfaceProps {
  documentName?: string;
  documentText?: string;
  pageCount?: number;
}

const DEFAULT_SUGGESTIONS = [
  "Summarize the key findings and executive takeaway",
  "What are the payment terms, due dates, and financial figures?",
  "List any obligations, risks, or compliance requirements",
  "What are the contact details and governing law?",
];

export function AiChatInterface({
  documentName = "Sample_Report.pdf",
  documentText = "This comprehensive report outlines the Q3 fiscal deliverables, operating revenue growth of 24.8% reaching $14.2M, with operating expenditures reduced by 8.5%. Key contract terms require compliance with ISO-27001 by December 31, 2026. Liability is capped at total fees paid in the preceding 12 months. Governing jurisdiction is Delaware.",
  pageCount = 4,
}: AiChatInterfaceProps) {
  const [messages, setMessages] = React.useState<AiChatMessage[]>([
    {
      id: "msg_1",
      sender: "assistant",
      content: `Hello! I have analyzed **${documentName}** (${pageCount} pages). You can ask me anything about this document, request executive summaries, or extract specific data points.`,
      timestamp: "Just now",
    },
  ]);
  const [inputValue, setInputValue] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [activeCitationPage, setActiveCitationPage] = React.useState<number | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isGenerating) return;

    const userMsg: AiChatMessage = {
      id: generateId("msg"),
      sender: "user",
      content: query,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsGenerating(true);

    // AI answer synthesis with page citations
    setTimeout(() => {
      let replyContent = "";
      let citations: AiChatMessage["citations"] = [];
      const q = query.toLowerCase();

      if (q.includes("summar") || q.includes("key finding") || q.includes("takeaway")) {
        replyContent = `### Executive Summary & Key Insights\n\n1. **Financial Performance**: Q3 fiscal revenue grew by **24.8%** to reach **$14.2M**, while operational costs decreased by **8.5%**.\n2. **Compliance**: Mandatory ISO-27001 certification milestone is set for **December 31, 2026**.\n3. **Risk Management**: Liability is capped strictly at total fees paid in the trailing 12-month period.\n4. **Jurisdiction**: Governed by Delaware commercial law.`;
        citations = [
          { pageNumber: 1, quote: "Q3 fiscal deliverables, operating revenue growth of 24.8% reaching $14.2M" },
          { pageNumber: 2, quote: "Compliance with ISO-27001 by December 31, 2026" },
        ];
      } else if (q.includes("payment") || q.includes("financial") || q.includes("revenue") || q.includes("number")) {
        replyContent = `### Financial & Payment Data\n\n- **Operating Revenue**: $14.2M (+24.8% YoY growth)\n- **Cost Reductions**: -8.5% in operating expenditures\n- **Liability Limitation**: Aggregate 12-month trailing fee ceiling.`;
        citations = [{ pageNumber: 1, quote: "Operating revenue growth of 24.8% reaching $14.2M" }];
      } else if (q.includes("risk") || q.includes("obligation") || q.includes("compliance") || q.includes("law")) {
        replyContent = `### Obligations & Legal Framework\n\n- **Security Standard**: Must maintain active ISO-27001 compliance.\n- **Governing Law**: State of Delaware.\n- **Liability Terms**: Mutual cap tied to annual subscription fees.`;
        citations = [
          { pageNumber: 2, quote: "Compliance with ISO-27001 by December 31, 2026" },
          { pageNumber: 3, quote: "Governing jurisdiction is Delaware" },
        ];
      } else {
        replyContent = `Based on my analysis of **${documentName}**:\n\nThe document details strategic milestones including strong revenue acceleration ($14.2M), operational cost optimization, and rigorous compliance guidelines. All commitments are structured under standard Delaware jurisdiction with ISO-27001 alignment.`;
        citations = [{ pageNumber: 1, quote: "Report outlines the Q3 fiscal deliverables" }];
      }

      const assistantMsg: AiChatMessage = {
        id: generateId("msg"),
        sender: "assistant",
        content: replyContent,
        timestamp: "Just now",
        citations,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsGenerating(false);
    }, 900);
  };

  const copyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
      {/* Left: Interactive Document Preview with Citation Highlighting */}
      <div className="lg:col-span-6 bg-slate-100 dark:bg-slate-950/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between overflow-hidden shadow-subtle">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[220px]">
                {documentName}
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">{pageCount} Pages Loaded</span>
            </div>
          </div>

          {activeCitationPage && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-600 text-white font-medium animate-pulse">
              Highlighting Page {activeCitationPage}
            </span>
          )}
        </div>

        {/* Mock Document Page Reader */}
        <div className="flex-1 my-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-elevated overflow-y-auto space-y-4">
          <div className="flex justify-between items-center text-xs text-slate-400 font-mono border-b border-slate-100 dark:border-slate-800 pb-2">
            <span>DOCUFORGE DOCUMENT VIEWER</span>
            <span>PAGE {activeCitationPage || 1} OF {pageCount}</span>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Quarterly Fiscal Performance & Agreement Brief
          </h2>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            This comprehensive report outlines the Q3 fiscal deliverables, operating revenue growth of 24.8% reaching $14.2M, with operating expenditures reduced by 8.5%. Key contract terms require compliance with ISO-27001 by December 31, 2026. Liability is capped at total fees paid in the preceding 12 months. Governing jurisdiction is Delaware.
          </p>

          <div className={`p-3 rounded-xl border transition-all duration-200 ${
            activeCitationPage === 1
              ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700"
              : "bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800"
          }`}>
            <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
              <Bookmark className="w-3 h-3" /> Section 3.2 - Financial Metrics
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Total GAAP net revenue was recorded at $14,210,000, representing a 24.8% expansion relative to prior comparative period.
            </p>
          </div>

          <div className={`p-3 rounded-xl border transition-all duration-200 ${
            activeCitationPage === 2
              ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700"
              : "bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800"
          }`}>
            <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
              <Bookmark className="w-3 h-3" /> Section 7.1 - Security & Governance
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Contractor agrees to retain formal ISO-27001 data protection certifications through the duration of agreement.
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span>Click on citation badges in AI chat to jump to referenced page</span>
          <span className="font-mono">AI Indexed</span>
        </div>
      </div>

      {/* Right: AI Chat Workspace */}
      <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-subtle">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                DocuForge AI Assistant
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
                  Grounded
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Trained on document text with page references</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setMessages([
                {
                  id: "msg_reset",
                  sender: "assistant",
                  content: "Conversation reset. What else would you like to explore?",
                  timestamp: "Just now",
                },
              ])
            }
            className="text-xs gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                  {/* Citations List */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold mr-1">
                        Citations:
                      </span>
                      {msg.citations.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveCitationPage(c.pageNumber)}
                          className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200/60 dark:border-indigo-800/60 text-[11px] font-mono font-medium transition-colors"
                          title={c.quote}
                        >
                          Page {c.pageNumber} ›
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Copy button */}
                  {!isUser && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isGenerating && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                <span>Analyzing document embeddings and synthesizing reply...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {DEFAULT_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s)}
              className="shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question about this PDF..."
              className="flex-1 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              type="submit"
              size="md"
              disabled={!inputValue.trim() || isGenerating}
              className="h-11 px-4 rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
