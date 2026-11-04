"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
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
  Percent,
  Banknote,
  Scale,
  Download,
  Edit,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchQuoteById,
  formatCurrency,
  formatPercent,
  formatDate,
  type QuoteItem,
} from "../../api";

const QuoteDetailsPage = () => {
  const params = useParams();
  const quoteId = Array.isArray(params.quoteId)
    ? params.quoteId[0]
    : params.quoteId;

  const numericQuoteId = Number(quoteId);

  const [activeTab, setActiveTab] = useState<"overview" | "terms" | "legal">("overview");
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteItem | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!Number.isFinite(numericQuoteId) || numericQuoteId <= 0) {
      toast.error("Invalid quote ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const payload = await fetchQuoteById(numericQuoteId);
      setQuote(payload);
    } catch (error: any) {
      console.error("Failed to load quote details", error);
      toast.error(error.message || "Unable to load quote details.");
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [numericQuoteId]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Loading quote details...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto" />
          <p className="text-lg font-medium text-gray-900">Quote not found</p>
          <Link
            href="/my-quotes"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Quotes
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(quote.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Link
                href="/my-quotes"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-xl font-bold text-gray-900">Quote Details</h1>
                  <span className="text-xs text-gray-500">#{quote.id}</span>
                </div>
                <p className="text-xs text-gray-600">{quote.property_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}></span>
                <span className={`font-semibold text-xs ${statusConfig.color}`}>{statusConfig.label}</span>
              </div>
              {quote.status === "submitted" && (
                <Link
                  href={`/my-quotes/${quote.id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Quote
                </Link>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-t border-gray-200 -mb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === "overview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              className={`px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === "terms"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Terms & Fees
            </button>
            <button
              onClick={() => setActiveTab("legal")}
              className={`px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === "legal"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Legal & Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Key Metrics Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span className="text-xs text-emerald-700 font-medium">Loan Amount</span>
            </div>
            <p className="text-2xl font-bold text-emerald-900">{formatCurrency(quote.loan_amount)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-blue-700 font-medium">Interest Rate</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{formatPercent(quote.interest_rate)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-xs text-purple-700 font-medium">Term</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{quote.term ? `${quote.term} months` : "-"}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-xs text-orange-700 font-medium">Max LTV</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">{formatPercent(quote.max_as_is_ltv)}</p>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="col-span-8 space-y-6">
              {/* Lender Information */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-semibold text-gray-900">Lender Information</h3>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Lender Name</p>
                    <p className="text-sm font-semibold text-gray-900">{quote.lender_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Guarantor</p>
                    <p className="text-sm font-semibold text-gray-900">{quote.guarantor || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Loan Structure */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-semibold text-gray-900">Loan Structure</h3>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-700 mb-2 font-medium">Total Loan</p>
                    <p className="text-base font-bold text-emerald-900">{formatCurrency(quote.loan_amount)}</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 mb-2 font-medium">Initial Funding</p>
                    <p className="text-base font-bold text-blue-900">{formatCurrency(quote.initial_funding)}</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-700 mb-2 font-medium">Future Funding</p>
                    <p className="text-base font-bold text-purple-900">{formatCurrency(quote.future_funding)}</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-700 mb-2 font-medium">Sponsor Equity</p>
                    <p className="text-base font-bold text-amber-900">{formatCurrency(quote.sponsor_equity)}</p>
                  </div>
                </div>
              </div>

              {/* Risk Metrics */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-purple-600" />
                    <h3 className="text-base font-semibold text-gray-900">Risk Metrics & Ratios</h3>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-6 gap-3">
                  {[
                    { label: "Max As-Is LTV", value: formatPercent(quote.max_as_is_ltv) },
                    { label: "Max LTC", value: formatPercent(quote.max_ltc) },
                    { label: "Max Stabilized LTV", value: formatPercent(quote.max_as_stabilized_ltv) },
                    { label: "DSCR", value: quote.dscr ? `${quote.dscr}x` : "-" },
                    { label: "Min As-Is DY", value: formatPercent(quote.min_as_is_dy) },
                    { label: "Min Stabilized DY", value: formatPercent(quote.min_stabilized_dy) },
                  ].map((metric, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
                      <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">{metric.label}</p>
                      <p className="text-sm font-bold text-gray-900">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-4 space-y-6">
              {/* Property Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="relative h-56">
                  <Image
                    src={quote.property_image_url || "/images/SponsorDashboard.png"}
                    alt={quote.property_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-lg text-xs font-medium text-gray-900">
                      {quote.property_type}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">{quote.property_name}</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{quote.property_address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Reference */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Reference</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Loan Request ID</span>
                    <span className="text-xs font-semibold text-gray-900">#{quote.loan_request}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Quote ID</span>
                    <span className="text-xs font-semibold text-gray-900">#{quote.id}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Status</span>
                    <span className={`text-xs font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-gray-500">Submitted</span>
                    <span className="text-xs font-semibold text-gray-900">{formatDate(quote.submitted_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terms & Fees Tab */}
        {activeTab === "terms" && (
          <div className="space-y-6">
            {/* Loan Terms */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-semibold text-gray-900">Loan Terms</h3>
                </div>
              </div>
              <div className="p-5 grid grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Interest Rate</p>
                  <p className="text-base font-semibold text-gray-900">{formatPercent(quote.interest_rate)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Term</p>
                  <p className="text-base font-semibold text-gray-900">{quote.term ? `${quote.term} months` : "-"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Amortization</p>
                  <p className="text-base font-semibold text-gray-900">{quote.amortization || "-"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Prepayment</p>
                  <p className="text-base font-semibold text-gray-900">{quote.prepayment || "-"}</p>
                </div>
              </div>
            </div>

            {/* Fees & Reserves */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-semibold text-gray-900">Fees & Reserves</h3>
                </div>
              </div>
              <div className="p-5 grid grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-700 mb-2">Origination Fee</p>
                  <p className="text-base font-bold text-amber-900">{formatPercent(quote.origination_fee)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-700 mb-2">CapEx Reserve</p>
                  <p className="text-base font-bold text-orange-900">{formatCurrency(quote.capex_reserve)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-700 mb-2">FF&E Reserve</p>
                  <p className="text-base font-bold text-yellow-900">{formatCurrency(quote.ff_and_e_reserve)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
                  <p className="text-xs text-red-700 mb-2">Interest Carry</p>
                  <p className="text-base font-bold text-red-900">{formatCurrency(quote.interest_carry_reserve)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legal & Timeline Tab */}
        {activeTab === "legal" && (
          <div className="space-y-6">
            {/* Legal & Security */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-600" />
                  <h3 className="text-base font-semibold text-gray-900">Legal & Security</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 mb-2 font-medium">Extension Conditions</p>
                  <p className="text-sm text-slate-900">{quote.extension_conditions || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-2 font-medium">Collateral</p>
                    <p className="text-sm text-slate-900">{quote.collateral || "-"}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-2 font-medium">Recourse</p>
                    <p className="text-sm text-slate-900">{quote.recourse || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-900">Timeline</h3>
                </div>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 mb-2 font-medium">Submitted Date</p>
                  <p className="text-base font-semibold text-blue-900">{formatDateTime(quote.submitted_at)}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-700 mb-2 font-medium">Expiration Date</p>
                  <p className="text-base font-semibold text-purple-900">{formatDateTime(quote.expires_at)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteDetailsPage;
