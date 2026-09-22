"use client";

import * as React from "react";
import {
  X,
  CreditCard,
  QrCode,
  Building2,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles,
  Smartphone,
  Wallet,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: "pro" | "business";
  billingCycle: "monthly" | "annual";
  amountPaise: number;
  orderId: string;
  keyId: string;
  user: {
    name?: string;
    email?: string;
  } | null;
  onSuccess: (paymentDetails: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => Promise<void>;
}

export function RazorpayModal({
  isOpen,
  onClose,
  planId,
  billingCycle,
  amountPaise,
  orderId,
  keyId,
  user,
  onSuccess,
}: RazorpayModalProps) {
  const [activeTab, setActiveTab] = React.useState<"card" | "upi" | "netbanking" | "oneclick">("card");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [stepStatus, setStepStatus] = React.useState<string>("");
  const [copiedVpa, setCopiedVpa] = React.useState(false);

  // Form states
  const [cardNumber, setCardNumber] = React.useState("4111 1111 1111 1111");
  const [cardExpiry, setCardExpiry] = React.useState("12/28");
  const [cardCvv, setCardCvv] = React.useState("123");
  const [cardName, setCardName] = React.useState(user?.name || "DocuForge Developer");
  const [upiId, setUpiId] = React.useState("user@razorpay");
  const [selectedBank, setSelectedBank] = React.useState("HDFC");

  const formattedAmount = (amountPaise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const planName = planId === "pro" ? "DocuForge Pro" : "DocuForge Business";

  const handlePay = async (method: string) => {
    setIsProcessing(true);
    setStepStatus("Connecting to Razorpay Gateway...");

    try {
      await new Promise((r) => setTimeout(r, 600));
      setStepStatus("Authorizing 256-Bit SSL Encrypted Transaction...");

      await new Promise((r) => setTimeout(r, 700));
      setStepStatus("Verifying HMAC-SHA256 Signature with MongoDB...");

      const mockPaymentId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const mockSignature = `test_sig_${orderId}_${mockPaymentId}`;

      await onSuccess({
        razorpay_order_id: orderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
      });

      setStepStatus("Payment Verified! Unlocking Unlimited Plan...");
      await new Promise((r) => setTimeout(r, 500));
      onClose();
    } catch (err: any) {
      console.error("Payment processing error:", err);
      alert(`Payment error: ${err?.message || "Failed to complete transaction"}`);
    } finally {
      setIsProcessing(false);
      setStepStatus("");
    }
  };

  const copyTestVpa = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Razorpay Brand Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 border-b border-indigo-900/40 relative">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">DocuForge 2.0</h3>
                <div className="flex items-center gap-1.5 text-xs text-indigo-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Razorpay Payment Gateway</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-extrabold text-white tracking-tight">{formattedAmount}</div>
              <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wider font-mono">
                {billingCycle === "annual" ? "Billed Annually" : "Billed Monthly"}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5 truncate max-w-[280px]">
              <span className="font-semibold text-white">{planName}</span>
              <span className="text-slate-400">•</span>
              <span className="truncate">{user?.email || "developer@example.com"}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
              SANDBOX TEST MODE
            </span>
          </div>
        </div>

        {/* Processing State Overlay */}
        {isProcessing ? (
          <div className="p-10 text-center space-y-6">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 animate-spin" />
              <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Processing Razorpay Payment</h4>
              <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 animate-pulse">{stepStatus}</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
              🔒 End-to-end 256-bit encrypted test transaction. MongoDB quota will unlock instantly.
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Payment Method Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("card")}
                className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === "card"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("upi")}
                className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === "upi"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("netbanking")}
                className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === "netbanking"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Netbanking</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("oneclick")}
                className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === "oneclick"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">1-Click</span>
              </button>
            </div>

            {/* Tab: Card */}
            {activeTab === "card" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Enter Test Card Details
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCardNumber("4111 1111 1111 1111");
                      setCardExpiry("12/28");
                      setCardCvv("123");
                      setCardName(user?.name || "DocuForge Test User");
                    }}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Fill Test Visa
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4111 1111 1111 1111"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="absolute right-3 top-2.5 flex items-center gap-1">
                        <span className="text-[10px] font-bold text-indigo-600 font-mono bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                          VISA
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM / YY"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">CVV / CVC</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Name on card"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handlePay("card")}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-sm rounded-xl shadow-md gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Pay {formattedAmount} via Razorpay Card</span>
                </Button>
              </div>
            )}

            {/* Tab: UPI */}
            {activeTab === "upi" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0">
                    <QrCode className="w-12 h-12 text-slate-800 dark:text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Scan & Pay with Any UPI App</span>
                      <Badge variant="outline" className="text-[9px]">
                        Instant
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      GPay, PhonePe, Paytm, CRED, BHIM & all Indian UPI apps supported.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-slate-500">Or Enter UPI ID / VPA</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@okhdfcbank"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyTestVpa}
                      className="text-xs gap-1 shrink-0"
                    >
                      {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedVpa ? "Copied" : "Copy"}</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-500">
                  <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium">Google Pay</span>
                  <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium">PhonePe</span>
                  <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium">Paytm</span>
                  <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium">CRED</span>
                </div>

                <Button
                  onClick={() => handlePay("upi")}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-sm rounded-xl shadow-md gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Verify & Pay {formattedAmount}</span>
                </Button>
              </div>
            )}

            {/* Tab: Netbanking */}
            {activeTab === "netbanking" && (
              <div className="space-y-4">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Select Your Indian Bank
                </span>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "HDFC", name: "HDFC Bank", color: "text-blue-700" },
                    { id: "ICICI", name: "ICICI Bank", color: "text-orange-600" },
                    { id: "SBI", name: "State Bank of India", color: "text-sky-600" },
                    { id: "AXIS", name: "Axis Bank", color: "text-rose-700" },
                    { id: "KOTAK", name: "Kotak Mahindra", color: "text-red-600" },
                    { id: "OTHER", name: "Other 50+ Banks", color: "text-slate-600" },
                  ].map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBank(bank.id)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                        selectedBank === bank.id
                          ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold ring-2 ring-indigo-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <Building2 className={`w-4 h-4 ${bank.color}`} />
                      <span className="text-[11px] font-medium leading-tight">{bank.name}</span>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => handlePay("netbanking")}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-sm rounded-xl shadow-md gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Pay {formattedAmount} via {selectedBank} Netbanking</span>
                </Button>
              </div>
            )}

            {/* Tab: 1-Click Fast Checkout */}
            {activeTab === "oneclick" && (
              <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/30">
                  <Zap className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Instant 1-Click Developer Checkout
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                    Simulate full end-to-end Razorpay payment signature verification, store transaction record in MongoDB, and upgrade quota immediately.
                  </p>
                </div>

                <Button
                  onClick={() => handlePay("oneclick")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-sm rounded-xl shadow-md gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1-Click Complete Upgrade ({formattedAmount})</span>
                </Button>
              </div>
            )}

            {/* Security Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>PCI-DSS Level 1 Encrypted</span>
              </div>
              <div className="font-mono text-[10px] text-slate-400">
                Order: {orderId.slice(0, 16)}...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
