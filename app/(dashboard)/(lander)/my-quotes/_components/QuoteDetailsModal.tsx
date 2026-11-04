"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MapPin,
  User,
  ChevronRight,
  Info,
  Percent,
  Banknote,
  Scale,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Quote } from "@/types/my-quotes";

type QuoteDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote | null;
};

const toNumber = (value: string | number | undefined | null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatCurrency = (value: string | number | undefined) => {
  const parsed = toNumber(value);
  if (parsed === null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const formatPercent = (value: string | number | undefined) => {
  const parsed = toNumber(value);
  if (parsed === null) return "-";
  return `${parsed.toFixed(2)}%`;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const QuoteDetailsModal: React.FC<QuoteDetailsModalProps> = ({
  open,
  onOpenChange,
  quote,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "terms" | "legal">("overview");

  if (!quote) return null;

  const raw = quote.raw;

  const getStatusConfig = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("accept")) {
      return {
        icon: CheckCircle2,
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-300",
        label: "Accepted",
        dotColor: "bg-green-500",
      };
    }
    if (statusLower.includes("reject") || statusLower.includes("declin")) {
      return {
        icon: XCircle,
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-300",
        label: "Rejected",
        dotColor: "bg-red-500",
      };
    }
    if (statusLower.includes("review") || statusLower.includes("pending")) {
      return {
        icon: AlertCircle,
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-300",
        label: "Under Review",
        dotColor: "bg-amber-500",
      };
    }
    return {
      icon: Clock,
      color: "text-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-300",
      label: "Submitted",
      dotColor: "bg-purple-500",
    };
  };

  const statusConfig = getStatusConfig(quote.statusLabel);
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-hidden p-0 bg-gray-50" showCloseButton>
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-lg font-bold text-white">{quote.propertyName}</h2>
                    <span className="text-xs text-slate-400">#{quote.quoteId}</span>
                  </div>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {quote.address}
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}></span>
                <span className={`font-semibold text-xs ${statusConfig.color}`}>{statusConfig.label}</span>
              </div>
            </div>

            {/* Key Metrics - Horizontal */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-2 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-slate-300 uppercase tracking-wide">Loan Amount</span>
                </div>
                <p className="text-base font-bold text-white">{formatCurrency(raw?.loan_amount)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-2 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] text-slate-300 uppercase tracking-wide">Interest Rate</span>
                </div>
                <p className="text-base font-bold text-white">{formatPercent(raw?.interest_rate)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-2 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] text-slate-300 uppercase tracking-wide">Term</span>
                </div>
                <p className="text-base font-bold text-white">{raw?.term ? `${raw.term} months` : "-"}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-2 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-[10px] text-slate-300 uppercase tracking-wide">Max LTV</span>
                </div>
                <p className="text-base font-bold text-white">{formatPercent(raw?.max_as_is_ltv)}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 flex items-center gap-1 border-t border-slate-700/50">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2.5 text-xs font-medium transition-all relative ${
                activeTab === "overview"
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Overview
              {activeTab === "overview" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              className={`px-4 py-2.5 text-xs font-medium transition-all relative ${
                activeTab === "terms"
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Terms & Fees
              {activeTab === "terms" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("legal")}
              className={`px-4 py-2.5 text-xs font-medium transition-all relative ${
                activeTab === "legal"
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Legal & Timeline
              {activeTab === "legal" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-14rem)] bg-gray-50">
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-12 gap-4">
                {/* Left Column - Main Info */}
                <div className="col-span-8 space-y-4">
                  {/* Lender Card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-900">Lender Information</h3>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Lender Name</p>
                        <p className="text-sm font-semibold text-gray-900">{quote.lenderName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Guarantor</p>
                        <p className="text-sm font-semibold text-gray-900">{raw?.guarantor || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Loan Structure */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-sm font-semibold text-gray-900">Loan Structure</h3>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                        <p className="text-[10px] text-emerald-700 mb-1 font-medium">Total Loan</p>
                        <p className="text-sm font-bold text-emerald-900">{formatCurrency(raw?.loan_amount)}</p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                        <p className="text-[10px] text-blue-700 mb-1 font-medium">Initial</p>
                        <p className="text-sm font-bold text-blue-900">{formatCurrency(raw?.initial_funding)}</p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                        <p className="text-[10px] text-purple-700 mb-1 font-medium">Future</p>
                        <p className="text-sm font-bold text-purple-900">{formatCurrency(raw?.future_funding)}</p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                        <p className="text-[10px] text-amber-700 mb-1 font-medium">Sponsor Equity</p>
                        <p className="text-sm font-bold text-amber-900">{formatCurrency(raw?.sponsor_equity)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Risk Metrics */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-purple-600" />
                        <h3 className="text-sm font-semibold text-gray-900">Risk Metrics & Ratios</h3>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-6 gap-2">
                      {[
                        { label: "Max As-Is LTV", value: formatPercent(raw?.max_as_is_ltv) },
                        { label: "Max LTC", value: formatPercent(raw?.max_ltc) },
                        { label: "Max Stabilized LTV", value: formatPercent(raw?.max_as_stabilized_ltv) },
                        { label: "DSCR", value: raw?.dscr ? `${raw.dscr}x` : "-" },
                        { label: "Min As-Is DY", value: formatPercent(raw?.min_as_is_dy) },
                        { label: "Min Stabilized DY", value: formatPercent(raw?.min_stabilized_dy) },
                      ].map((metric, idx) => (
                        <div key={idx} className="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                          <p className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-wide">{metric.label}</p>
                          <p className="text-sm font-bold text-gray-900">{metric.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Property Details */}
                <div className="col-span-4 space-y-4">
                  {/* Property Image */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="relative h-48">
                      <Image
                        src={quote.image || "/images/SponsorDashboard.png"}
                        alt={quote.propertyName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-xs font-medium text-gray-900">
                          {quote.propertyType}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Property Details</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Location</span>
                          <span className="text-gray-900 font-medium text-right">{quote.city}, {quote.state}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Property Type</span>
                          <span className="text-gray-900 font-medium">{quote.propertyType}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4 text-gray-400" />
                      Quick Reference
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-500">Loan Request ID</span>
                        <span className="text-xs font-semibold text-gray-900">#{quote.loanRequestId}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-500">Quote ID</span>
                        <span className="text-xs font-semibold text-gray-900">#{quote.quoteId}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-gray-500">Status</span>
                        <span className={`text-xs font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Terms & Fees Tab */}
            {activeTab === "terms" && (
              <div className="space-y-4">
                {/* Terms */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-semibold text-gray-900">Loan Terms</h3>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-4 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Interest Rate</p>
                      <p className="text-sm font-semibold text-gray-900">{formatPercent(raw?.interest_rate)}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Term</p>
                      <p className="text-sm font-semibold text-gray-900">{raw?.term ? `${raw.term} months` : "-"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Amortization</p>
                      <p className="text-sm font-semibold text-gray-900">{raw?.amortization || "-"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Prepayment</p>
                      <p className="text-sm font-semibold text-gray-900">{raw?.prepayment || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Fees & Reserves */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                      <h3 className="text-sm font-semibold text-gray-900">Fees & Reserves</h3>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-4 gap-3">
                    <div className="p-3 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                      <p className="text-xs text-amber-700 mb-1">Origination Fee</p>
                      <p className="text-sm font-bold text-amber-900">{formatPercent(raw?.origination_fee)}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                      <p className="text-xs text-orange-700 mb-1">CapEx Reserve</p>
                      <p className="text-sm font-bold text-orange-900">{formatCurrency(raw?.capex_reserve)}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-yellow-700 mb-1">FF&E Reserve</p>
                      <p className="text-sm font-bold text-yellow-900">{formatCurrency(raw?.ff_and_e_reserve)}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
                      <p className="text-xs text-red-700 mb-1">Interest Carry</p>
                      <p className="text-sm font-bold text-red-900">{formatCurrency(raw?.interest_carry_reserve)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legal & Timeline Tab */}
            {activeTab === "legal" && (
              <div className="space-y-4">
                {/* Legal */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-600" />
                      <h3 className="text-sm font-semibold text-gray-900">Legal & Security</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-600 mb-1.5 font-medium">Extension Conditions</p>
                      <p className="text-xs text-slate-900">{raw?.extension_conditions || "-"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1.5 font-medium">Collateral</p>
                        <p className="text-xs text-slate-900">{raw?.collateral || "-"}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-600 mb-1.5 font-medium">Recourse</p>
                        <p className="text-xs text-slate-900">{raw?.recourse || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-900">Timeline</h3>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700 mb-1 font-medium">Submitted Date</p>
                      <p className="text-sm font-semibold text-blue-900">{formatDateTime(raw?.submitted_at)}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-xs text-purple-700 mb-1 font-medium">Expiration Date</p>
                      <p className="text-sm font-semibold text-purple-900">{formatDateTime(raw?.expires_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Quote #{quote.quoteId}</span>
            <span>•</span>
            <span>Request #{quote.loanRequestId}</span>
            <span>•</span>
            <span>{quote.lenderName}</span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-xs font-medium"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteDetailsModal;
