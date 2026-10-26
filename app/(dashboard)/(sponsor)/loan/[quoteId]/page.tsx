"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/apiClient";
import ConfirmActionModal from "@/components/ConfirmActionModal";
import type {
  LoanDocumentLink,
  LoanMemorandumLink,
  LoanQuoteDetail,
  LoanRequestDetail,
} from "../_components/loan-types";
import {
  fetchQuoteDetail,
  fetchLoanRequestDetail,
  acceptQuote,
  declineQuote,
} from "../../_api/loan-request-detail-api";
import { deleteLoanRequest } from "../../_api/loan-requests-api";

const toNumber = (value: string | number | undefined) => {
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

const formatTerm = (value: string | number | undefined) => {
  if (value === undefined || value === null || value === "") return "-";
  const num = Number(value);
  if (!isNaN(num)) {
    return `${num} mo`;
  }
  return String(value);
};

const getDaysUntilExpiry = (expiresAt: string | null | undefined) => {
  if (!expiresAt) return null;
  const days = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return days;
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const getFileNameFromUrl = (url: string) => {
  const safeUrl = url.split("?")[0];
  return decodeURIComponent(safeUrl.substring(safeUrl.lastIndexOf("/") + 1));
};

const isImageUrl = (url: string) =>
  /\.(png|jpg|jpeg|gif|webp|svg|bmp|avif)$/i.test(url);

const isPdfUrl = (url: string) => /\.pdf$/i.test(url);

const isFinalizedStatus = (status?: string) => {
  const normalized = (status || "").toLowerCase();
  return (
    normalized === "accepted" ||
    normalized === "declined" ||
    normalized === "decline"
  );
};

const Page = () => {
  const router = useRouter();
  const params = useParams();
  const quoteId = Array.isArray(params.quoteId)
    ? params.quoteId[0]
    : params.quoteId;

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    null | "accept" | "decline" | "delete"
  >(null);
  const [quote, setQuote] = useState<LoanQuoteDetail | null>(null);
  const [requestDetail, setRequestDetail] = useState<LoanRequestDetail | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    null | "accept" | "decline" | "delete"
  >(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!quoteId) return;

    setLoading(true);
    try {
      const quoteData = await fetchQuoteDetail(Number(quoteId));
      setQuote(quoteData as LoanQuoteDetail);

      const loanRequestId = Number(quoteData?.loan_request);
      if (Number.isFinite(loanRequestId) && loanRequestId > 0) {
        const requestData = await fetchLoanRequestDetail(loanRequestId);
        setRequestDetail(requestData as LoanRequestDetail);
      } else {
        setRequestDetail(null);
      }
    } catch (error: any) {
      console.error("Failed to load quote details", error);
      toast.error(error.message || "Unable to load quote details.");
      setQuote(null);
      setRequestDetail(null);
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const firstDocument = useMemo<LoanDocumentLink | null>(() => {
    return requestDetail?.document_links?.[0] ?? null;
  }, [requestDetail]);

  useEffect(() => {
    const cleanupPreviewUrl = () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    };

    if (!firstDocument?.url) {
      cleanupPreviewUrl();
      setPreviewUrl(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    let isActive = true;

    const loadPreview = async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewUrl(null);
      cleanupPreviewUrl();

      try {
        const response = await api.get(firstDocument.url, {
          responseType: "blob",
        });

        if (!isActive) {
          return;
        }

        const blobUrl = URL.createObjectURL(response.data as Blob);
        previewObjectUrlRef.current = blobUrl;
        setPreviewUrl(blobUrl);
      } catch (error) {
        console.error("Failed to load preview document", error);
        if (isActive) {
          setPreviewError("Unable to render this document preview.");
        }
      } finally {
        if (isActive) {
          setPreviewLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      isActive = false;
      cleanupPreviewUrl();
    };
  }, [firstDocument?.url]);

  const executeAccept = async () => {
    if (!quote) return;
    try {
      setActionLoading("accept");
      await acceptQuote(quote.id);
      toast.success("Quote accepted successfully.");
      await fetchDetails();
    } catch (error: any) {
      console.error("Failed to accept quote", error);
      toast.error(error.message || "Failed to accept quote.");
    } finally {
      setActionLoading(null);
    }
  };

  const executeDecline = async () => {
    if (!quote) return;
    try {
      setActionLoading("decline");
      await declineQuote(quote.id);
      toast.success("Quote declined successfully.");
      await fetchDetails();
    } catch (error: any) {
      console.error("Failed to decline quote", error);
      toast.error(error.message || "Failed to decline quote.");
    } finally {
      setActionLoading(null);
    }
  };

  const executeDeleteRequest = async () => {
    const loanRequestId = Number(quote?.loan_request ?? requestDetail?.id);
    if (!Number.isFinite(loanRequestId) || loanRequestId <= 0) {
      toast.error("Unable to resolve loan request id for delete.");
      return;
    }

    try {
      setActionLoading("delete");
      await deleteLoanRequest(loanRequestId);
      toast.success("Loan request deleted successfully.");
      router.push("/loan");
    } catch (error: any) {
      console.error("Failed to delete loan request", error);
      toast.error(error.message || "Failed to delete loan request.");
    } finally {
      setActionLoading(null);
    }
  };

  const closeConfirmAction = (open: boolean) => {
    if (!open && actionLoading === null) {
      setPendingAction(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    if (pendingAction === "accept") {
      await executeAccept();
    }

    if (pendingAction === "decline") {
      await executeDecline();
    }

    if (pendingAction === "delete") {
      await executeDeleteRequest();
    }

    setPendingAction(null);
  };

  const modalConfig = useMemo(() => {
    if (pendingAction === "accept") {
      return {
        title: "Accept quote?",
        description:
          "This will accept this quote and close the related loan request.",
        confirmText: "Accept Quote",
        destructive: false,
      };
    }

    if (pendingAction === "decline") {
      return {
        title: "Decline quote?",
        description:
          "This will decline this quote. You can not undo this action.",
        confirmText: "Decline Quote",
        destructive: true,
      };
    }

    if (pendingAction === "delete") {
      return {
        title: "Delete loan request?",
        description:
          "This will permanently delete this loan request and remove it from your dashboard.",
        confirmText: "Delete Request",
        destructive: true,
      };
    }

    return {
      title: "",
      description: "",
      confirmText: "Confirm",
      destructive: false,
    };
  }, [pendingAction]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="h-48 bg-white rounded-2xl mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-white rounded-xl"></div>
              <div className="h-96 bg-white rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50/30 py-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">Quote not found.</p>
        </div>
      </div>
    );
  }

  const isFinalizedQuote = isFinalizedStatus(quote.status);
  const daysLeft = getDaysUntilExpiry(quote.expires_at);
  const expiryDate = quote.expires_at ? new Date(quote.expires_at) : null;
  
  // Calculate funding percentages
  const initialFunding = toNumber(quote.initial_funding) || 0;
  const futureFunding = toNumber(quote.future_funding) || 0;
  const totalFunding = initialFunding + futureFunding;
  const initialPercent = totalFunding > 0 ? (initialFunding / totalFunding) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50/30 py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/loan"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {requestDetail?.property_name || "Back"}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">Quotes</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">{quote.lender_name}</span>
        </div>

        {/* Hero Card - Gradient Background */}
        <div className="relative rounded-2xl bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#3b82f6] p-8 text-white overflow-hidden">
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
              <div className="flex items-start gap-4">
                {/* Lender Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold shrink-0">
                  {getInitials(quote.lender_name)}
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold mb-2">{quote.lender_name}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-white/80">
                      Guarantor: <span className="text-white">{quote.guarantor || "N/A"}</span>
                    </span>
                    <span className="text-white/50">•</span>
                    <span className="text-white/80">
                      Submitted {formatDate(quote.submitted_at)}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium">
                      {quote.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!isFinalizedQuote && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setPendingAction("accept")}
                    disabled={actionLoading !== null}
                    className="px-6 py-2.5 rounded-lg bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    Accept quote
                  </button>
                  <button
                    onClick={() => setPendingAction("decline")}
                    disabled={actionLoading !== null}
                    className="px-6 py-2.5 rounded-lg bg-white/10 backdrop-blur-sm text-white font-semibold hover:bg-white/20 transition-colors disabled:opacity-50 border border-white/20"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-sm text-white/70 mb-1">Loan amount</p>
                <p className="text-3xl font-bold">{formatCurrency(quote.loan_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-white/70 mb-1">Interest rate</p>
                <p className="text-3xl font-bold">{toNumber(quote.interest_rate)?.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-sm text-white/70 mb-1">Term</p>
                <p className="text-3xl font-bold">{formatTerm(quote.term)}</p>
              </div>
              <div>
                <p className="text-sm text-white/70 mb-1">Origination fee</p>
                <p className="text-3xl font-bold">{toNumber(quote.origination_fee)?.toFixed(2)}%</p>
              </div>
            </div>

            {/* Quote Validity Progress Bar */}
            {expiryDate && daysLeft !== null && daysLeft > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white/80">Quote validity</span>
                  <span className="text-sm font-medium">
                    Expires {expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {daysLeft} days left
                  </span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${Math.min((daysLeft / 30) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Loan Structure */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                Loan structure
              </h2>

              {/* Funding Visualization */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="text-gray-700">
                    Initial funding <span className="font-semibold">{formatCurrency(quote.initial_funding)}</span>
                  </span>
                  <span className="text-gray-700">
                    Future funding <span className="font-semibold">{formatCurrency(quote.future_funding)}</span>
                  </span>
                </div>
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 h-full bg-blue-600 rounded-full"
                    style={{ width: `${initialPercent}%` }}
                  ></div>
                  <div 
                    className="absolute right-0 h-full bg-blue-400 rounded-full"
                    style={{ width: `${100 - initialPercent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {initialPercent.toFixed(0)}% funded at closing · {(100 - initialPercent).toFixed(0)}% funded later
                </p>
              </div>

              {/* Sponsor Equity */}
              <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <span className="text-sm text-gray-600">Sponsor equity required</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(quote.sponsor_equity)}</span>
              </div>
            </div>

            {/* Ratios */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                Ratios
              </h2>

              <div className="space-y-4">
                {/* Max as-is LTV */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Max as-is LTV</span>
                    <span className="text-sm font-semibold text-gray-900">{toNumber(quote.max_as_is_ltv)?.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${toNumber(quote.max_as_is_ltv)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Max LTC */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Max LTC</span>
                    <span className="text-sm font-semibold text-gray-900">{toNumber(quote.max_ltc)?.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${toNumber(quote.max_ltc)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Max as-stabilized LTV */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Max as-stabilized LTV</span>
                    <span className="text-sm font-semibold text-gray-900">{toNumber(quote.max_as_stabilized_ltv)?.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${toNumber(quote.max_as_stabilized_ltv)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Debt Yields */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Min as-is debt yield</p>
                    <p className="text-2xl font-bold text-gray-900">{toNumber(quote.min_as_is_dy)?.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Min stabilized debt yield</p>
                    <p className="text-2xl font-bold text-gray-900">{toNumber(quote.min_stabilized_dy)?.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                Terms
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Amortization</p>
                  <p className="text-base font-semibold text-gray-900">{quote.amortization || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Prepayment</p>
                  <p className="text-base font-semibold text-gray-900">{quote.prepayment || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Term</p>
                  <p className="text-base font-semibold text-gray-900">{quote.term} months</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Extension conditions</p>
                  <p className="text-base font-semibold text-gray-900">{quote.extension_conditions || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Recourse</p>
                  <p className="text-base font-semibold text-gray-900">{quote.recourse || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Collateral</p>
                  <p className="text-base font-semibold text-gray-900">{quote.collateral || "-"}</p>
                </div>
              </div>
            </div>

            {/* Reserves */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                  Reserves
                </h2>
                <span className="text-sm font-semibold text-gray-900">
                  Total {formatCurrency(
                    (toNumber(quote.capex_reserve) || 0) + 
                    (toNumber(quote.ff_and_e_reserve) || 0) + 
                    (toNumber(quote.interest_carry_reserve) || 0)
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Capex</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(quote.capex_reserve)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">FF&E</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(quote.ff_and_e_reserve)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Interest carry</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(quote.interest_carry_reserve)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* DSCR Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                DSCR
              </h2>

              {/* Circular Progress */}
              <div className="flex flex-col items-center py-6">
                <div className="relative w-40 h-40">
                  {/* Background Circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#E5E7EB"
                      strokeWidth="12"
                      fill="none"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#3B82F6"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 70}`}
                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - Math.min((toNumber(quote.dscr) || 0) / 2, 1))}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-gray-900">{toNumber(quote.dscr)?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium text-green-600 mt-4">Healthy coverage</p>
                <p className="text-xs text-gray-500 text-center mt-2 max-w-xs">
                  Min as-is debt yield ÷ interest rate ({toNumber(quote.min_as_is_dy)?.toFixed(2)} ÷ {toNumber(quote.interest_rate)?.toFixed(2)}). A quick indicator, not full underwriting.
                </p>
              </div>
            </div>

            {/* Loan Request */}
            {requestDetail && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                  Loan request
                </h2>

                <h3 className="font-semibold text-gray-900 mb-1">{requestDetail.property_name}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Requested {formatCurrency(requestDetail.requested_amount)} · {requestDetail.loan_term} mo · {requestDetail.ltv}% LTV
                </p>

                <Link
                  href={`/loan-request/${requestDetail.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View request
                </Link>
              </div>
            )}

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                Activity
              </h2>

              <div className="space-y-4">
                {/* Quote Submitted */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    <div className="w-px h-full bg-gray-200"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-gray-900">Quote submitted</p>
                    <p className="text-xs text-gray-500">{formatDate(quote.submitted_at)} · Sponsor emailed</p>
                  </div>
                </div>

                {/* Awaiting Decision */}
                {!isFinalizedQuote && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-300"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Awaiting your decision</p>
                      <p className="text-xs text-gray-500">
                        {expiryDate ? `Expires ${expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "No expiry"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmActionModal
          open={Boolean(pendingAction)}
          onOpenChange={closeConfirmAction}
          title={modalConfig.title}
          description={modalConfig.description}
          confirmText={modalConfig.confirmText}
          destructive={modalConfig.destructive}
          isLoading={actionLoading !== null}
          onConfirm={handleConfirmAction}
        />
      </div>
    </div>
  );
};

export default Page;
