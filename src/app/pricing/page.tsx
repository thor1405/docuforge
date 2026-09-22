"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  Lock,
  CreditCard,
  Loader2,
  Key,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { RazorpayConfigModal } from "@/components/payments/razorpay-config-modal";
import confetti from "canvas-confetti";

export default function PricingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "annual">("annual");
  const [processingPlan, setProcessingPlan] = React.useState<string | null>(null);
  const [upgradedPlan, setUpgradedPlan] = React.useState<string | null>(null);
  const [configModalOpen, setConfigModalOpen] = React.useState(false);
  const [keyConfig, setKeyConfig] = React.useState<{ isConfigured: boolean; mode: string }>({
    isConfigured: false,
    mode: "placeholder",
  });

  // Load official Razorpay Checkout Script
  React.useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    // Fetch active Razorpay key status
    fetch("/api/payments/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setKeyConfig({
            isConfigured: data.isConfigured,
            mode: data.mode,
          });
        }
      })
      .catch(() => {});

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, []);

  const handleCheckout = async (planId: "free" | "pro" | "business") => {
    if (planId === "free") {
      if (!user) {
        router.push("/auth/register");
      } else {
        router.push("/dashboard");
      }
      return;
    }

    if (!user) {
      router.push(`/auth/login?redirect=/pricing`);
      return;
    }

    // If Razorpay keys are not yet configured by the user, prompt them to enter their real keys
    if (!keyConfig.isConfigured) {
      setConfigModalOpen(true);
      return;
    }

    setProcessingPlan(planId);

    try {
      // 1. Create real order on backend via Razorpay SDK
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to create payment order.");
      }

      // 2. Open the Official Razorpay Checkout Popup Modal
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "DocuForge 2.0",
          description: `Upgrade to ${planId.toUpperCase()} Plan (${billingCycle})`,
          order_id: orderData.orderId,
          prefill: {
            name: user.name || "",
            email: user.email || "",
          },
          theme: {
            color: "#4f46e5",
          },
          handler: async (response: any) => {
            try {
              // 3. Cryptographically verify signature on backend and upgrade in MongoDB
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id || orderData.orderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  planId,
                  billingCycle,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                await refreshUser();
                setUpgradedPlan(planId);
                try {
                  confetti({
                    particleCount: 130,
                    spread: 90,
                    origin: { y: 0.6 },
                    colors: ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6"],
                  });
                } catch (e) {}
              } else {
                alert(`Payment verification notice: ${verifyData.error || "Verification issue"}`);
              }
            } catch (vErr: any) {
              console.error("Verification error:", vErr);
              alert("Error verifying payment signature with server.");
            } finally {
              setProcessingPlan(null);
            }
          },
          modal: {
            ondismiss: () => {
              setProcessingPlan(null);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (resp: any) => {
          alert(`Payment Failed: ${resp.error?.description || "Transaction canceled."}`);
          setProcessingPlan(null);
        });
        rzp.open();
      } else {
        alert("Razorpay checkout script is still loading. Please try again in a moment.");
        setProcessingPlan(null);
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert(`Razorpay notice: ${err.message || "Unable to initiate payment."}`);
      setProcessingPlan(null);
    }
  };

  const plans = [
    {
      id: "free",
      name: "Free",
      description: "Essential document tools for individuals and quick one-off tasks.",
      priceMonthly: "$0",
      priceAnnual: "$0",
      inrMonthly: "₹0",
      inrAnnual: "₹0",
      period: "forever",
      badge: null,
      highlight: false,
      cta: user?.plan === "free" ? "Current Plan" : "Get Started Free",
      features: [
        "Up to 50 document operations daily",
        "50 MB maximum file size limit",
        "All core Convert, Merge & Split tools",
        "High-fidelity PyMuPDF compression",
        "Basic OCR text indexing",
        "Ephemeral auto-deletion after 1 hour",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      description: "Uncapped high-speed document processing, AI suite, and automated workflows.",
      priceMonthly: "$12",
      priceAnnual: "$9",
      inrMonthly: "₹799",
      inrAnnual: "₹599",
      period: "per month, billed annually",
      badge: "Most Popular",
      highlight: true,
      cta: user?.plan === "pro" ? "Current Active Plan" : "Upgrade with Razorpay",
      features: [
        "Unlimited document operations (10,000+/day)",
        "Up to 500 MB file size limit",
        "Smart PDF Workspace & Natural Language builder",
        "Full AI Document Suite (Ask PDF, Summarize, Diff)",
        "Unlimited multi-language OCR",
        "Batch parallel processing (up to 50 files)",
        "Save and export custom workflows in MongoDB",
        "Priority cloud processing queue",
      ],
    },
    {
      id: "business",
      name: "Business",
      description: "Dedicated enterprise infrastructure, team seats, REST API, and SSO.",
      priceMonthly: "$39",
      priceAnnual: "$29",
      inrMonthly: "₹2,999",
      inrAnnual: "₹2,199",
      period: "per seat/month, billed annually",
      badge: "Enterprise",
      highlight: false,
      cta: user?.plan === "business" || user?.plan === "enterprise" ? "Current Active Plan" : "Get Business Plan",
      features: [
        "Everything in Pro plan",
        "Team workspaces & shared workflows",
        "High-throughput REST API & Webhooks",
        "SOC2 & HIPAA compliant data handling",
        "Custom document retention policies",
        "SAML SSO & Admin management console",
        "99.9% Uptime SLA & Dedicated support",
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Official Razorpay Gateway • Instant Live Activation</span>
          </div>

          <button
            onClick={() => setConfigModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Key className="w-3 h-3 text-indigo-500" />
            <span>
              {keyConfig.isConfigured
                ? `Connected: ${keyConfig.mode.toUpperCase()} Mode`
                : "Connect Real Razorpay Keys"}
            </span>
          </button>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Simple, transparent plans for everyone.
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
          Start for free with zero setup. Upgrade to Pro or Business via Razorpay whenever you need unlimited volume and AI capabilities.
        </p>

        {/* Upgraded Plan Celebration Banner */}
        {upgradedPlan && (
          <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200 space-y-2 animate-in zoom-in-95 duration-200 shadow-elevated">
            <div className="flex items-center justify-center gap-2 font-bold text-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>Real Payment Verified! Upgraded to {upgradedPlan.toUpperCase()} Plan</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
              Your MongoDB profile and daily operations quota have been permanently unlocked to unlimited.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href="/dashboard">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold shadow-sm">
                  <span>Go to Workspace Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Billing Cycle Toggle */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span className={`text-xs sm:text-sm ${billingCycle === "monthly" ? "font-bold text-slate-900 dark:text-white" : "text-slate-500"}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle((c) => (c === "monthly" ? "annual" : "monthly"))}
            className="w-12 h-6 rounded-full bg-slate-200 dark:bg-slate-800 p-0.5 transition-colors relative"
            aria-label="Toggle billing cycle"
          >
            <div
              className={`w-5 h-5 rounded-full bg-indigo-600 transition-transform duration-200 ${
                billingCycle === "annual" ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-xs sm:text-sm flex items-center gap-1.5 ${billingCycle === "annual" ? "font-bold text-slate-900 dark:text-white" : "text-slate-500"}`}>
            Annual <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold">SAVE 25%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = user?.plan === plan.id || (plan.id === "business" && user?.plan === "enterprise");
          const isProcessing = processingPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-8 transition-all flex flex-col justify-between relative ${
                plan.highlight
                  ? "bg-white dark:bg-slate-900 border-2 border-indigo-600 shadow-elevated scale-[1.02]"
                  : "bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge variant="gradient">{plan.badge}</Badge>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                        Active Plan
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{plan.description}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                      {billingCycle === "annual" ? plan.priceAnnual : plan.priceMonthly}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      / {billingCycle === "annual" ? plan.inrAnnual : plan.inrMonthly}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{plan.period}</div>
                </div>

                <Button
                  variant={isCurrent ? "outline" : plan.highlight ? "primary" : "outline"}
                  disabled={isCurrent || !!processingPlan}
                  isLoading={isProcessing}
                  onClick={() => handleCheckout(plan.id as any)}
                  className="w-full font-semibold shadow-sm gap-2"
                >
                  {isCurrent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Current Plan
                    </>
                  ) : (
                    <>
                      <span>{plan.cta}</span>
                      {!isProcessing && <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </Button>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Features Included:
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Section */}
      <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="space-y-1.5">
          <ShieldCheck className="w-6 h-6 text-indigo-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Razorpay 256-Bit SSL</h4>
          <p className="text-xs text-slate-500">PCI-DSS Level 1 compliant secure payment processing.</p>
        </div>
        <div className="space-y-1.5">
          <Zap className="w-6 h-6 text-indigo-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Instant Activation</h4>
          <p className="text-xs text-slate-500">Immediate unlimited quota and AI tool unlocking in MongoDB.</p>
        </div>
        <div className="space-y-1.5">
          <Sparkles className="w-6 h-6 text-indigo-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cancel Anytime</h4>
          <p className="text-xs text-slate-500">Seamless subscription management with zero lock-in contracts.</p>
        </div>
      </div>

      {/* Razorpay API Configuration Modal */}
      <RazorpayConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onConfigSaved={(config) => {
          setKeyConfig({ isConfigured: true, mode: config.mode });
        }}
      />
    </div>
  );
}
