"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  fetchLoanRequestDetail,
  fetchQuotesForLoanRequest,
  acceptQuote,
  declineQuote,
  extractApiErrorMessage,
  type LoanRequestDetail,
  type QuoteDetail,
} from "../../_api/loan-request-detail-api";

const FALLBACK_IMAGE = "/images/SponsorDashboard.png";

export default function LoanRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const requestId = params?.id ? Number(params.id) : null;

  const [selectedQuotes, setSelectedQuotes] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("lowest-rate");
  const [mutatingQuoteId, setMutatingQuoteId] = useState<number | null>(null);

  // Fetch loan request details
  const {
    data: loanRequest,
    isLoading: loadingRequest,
    error: requestError,
  } = useQuery<LoanRequestDetail>({
    queryKey: ["loan-request-detail", requestId],
    queryFn: () => fetchLoanRequestDetail(requestId!),
    enabled: !!requestId,
    staleTime: 30 * 1000,
  });

  // Fetch quotes for this loan request
  const {
    data: quotes = [],
    isLoading: loadingQuotes,
    error: quotesError,
  } = useQuery<QuoteDetail[]>({
    queryKey: ["loan-request-quotes", requestId],
    queryFn: () => fetchQuotesForLoanRequest(requestId!),
    enabled: !!requestId,
    staleTime: 30 * 1000,
  });

  if (!requestId) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <p className="text-gray-600">Invalid loan request ID</p>
      </div>
    );
  }

  if (loadingRequest || loadingQuotes) {
    return (
      <div className="min-h-screen bg-gray-50/30 pb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 h-48"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (requestError || !loanRequest) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load loan request details</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const activeQuotes = quotes.filter((q) =>
    ["submitted", "active"].includes(q.status.toLowerCase())
  );
  const quotesReceived = activeQuotes.length;
  const bestRate =
    quotesReceived > 0
      ? Math.min(...activeQuotes.map((q) => parseFloat(q.interest_rate)))
      : 0;
  const highestLTV =
    quotesReceived > 0
      ? Math.max(...activeQuotes.map((q) => parseFloat(q.max_as_is_ltv || "0")))
      : 0;

  const getNextExpiry = () => {
    const validExpiries = activeQuotes
      .filter((q) => q.expires_at)
      .map((q) => new Date(q.expires_at!).getTime())
      .filter((time) => time > Date.now());

    if (validExpiries.length === 0) return 0;

    const nextExpiry = Math.min(...validExpiries);
    return Math.ceil((nextExpiry - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getDaysUntilExpiry = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return null;
    const days = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const toggleQuoteSelection = (quoteId: number) => {
    setSelectedQuotes((prev) =>
      prev.includes(quoteId)
        ? prev.filter((id) => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === "submitted" || s === "active") return "bg-blue-100 text-blue-700";
    if (s === "declined") return "bg-gray-100 text-gray-700";
    if (s === "accepted") return "bg-green-100 text-green-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const getRequestStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === "active") return "bg-green-50 text-green-700";
    if (s === "closed") return "bg-gray-100 text-gray-700";
    if (s.includes("review")) return "bg-purple-50 text-purple-700";
    return "bg-blue-50 text-blue-700";
  };

  const handleAcceptQuote = async (quote: QuoteDetail) => {
    if (
      !confirm(
        `Accept quote from ${quote.lender_name}? This will decline all other quotes and close this loan request.`
      )
    ) {
      return;
    }

    try {
      setMutatingQuoteId(quote.id);
      await acceptQuote(quote.id);
      toast.success("Quote accepted successfully!");

      // Refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["loan-request-detail", requestId] }),
        queryClient.invalidateQueries({ queryKey: ["loan-request-quotes", requestId] }),
        queryClient.invalidateQueries({ queryKey: ["loan-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["sponsor-dashboard"] }),
      ]);
    } catch (error: any) {
      console.error("Failed to accept quote", error);
      toast.error(error.message || "Failed to accept quote");
    } finally {
      setMutatingQuoteId(null);
    }
  };

  const handleDeclineQuote = async (quote: QuoteDetail) => {
    if (
      !confirm(`Decline quote from ${quote.lender_name}? This action cannot be undone.`)
    ) {
      return;
    }

    try {
      setMutatingQuoteId(quote.id);
      await declineQuote(quote.id);
      toast.success("Quote declined successfully!");

      // Refresh data
      await queryClient.invalidateQueries({
        queryKey: ["loan-request-quotes", requestId],
      });
    } catch (error: any) {
      console.error("Failed to decline quote", error);
      toast.error(error.message || "Failed to decline quote");
    } finally {
      setMutatingQuoteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 pb-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/my-loan-requests"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          ← My loan requests
        </Link>
        <span className="text-sm text-gray-500 mx-2">/</span>
        <span className="text-sm text-gray-700">{loanRequest.property_name}</span>
      </div>

      {/* Property Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Property Image */}
          <div className="relative w-40 h-32 bg-gray-100 rounded-lg overflow-hidden shrink-0">
            <Image
              src={loanRequest.property_image_url || FALLBACK_IMAGE}
              alt={loanRequest.property_name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Property Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {loanRequest.property_name}
              </h1>
              <span
                className={`px-3 py-1 rounded-md text-xs font-medium ${getRequestStatusBadgeClass(
                  loanRequest.status
                )}`}
              >
                {loanRequest.status}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {loanRequest.property_address} · {loanRequest.property_type}
              {loanRequest.occupancy && ` · ${loanRequest.occupancy}% occupied`}
              {loanRequest.year_built && ` · Built ${loanRequest.year_built}`}
            </p>

            {/* Loan Request Details */}
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-600 mb-1">Requested amount</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(loanRequest.requested_amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Term</p>
                <p className="text-lg font-bold text-gray-900">
                  {loanRequest.loan_term} months
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">LTV</p>
                <p className="text-lg font-bold text-gray-900">{loanRequest.ltv}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Created</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(loanRequest.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Quotes received</p>
          <p className="text-3xl font-bold text-gray-900">{quotesReceived}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Best rate</p>
          <p className="text-3xl font-bold text-gray-900">
            {bestRate > 0 ? `${bestRate.toFixed(2)}%` : "—"}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Highest LTV</p>
          <p className="text-3xl font-bold text-gray-900">
            {highestLTV > 0 ? `${highestLTV}%` : "—"}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Next expiry</p>
          <p className="text-3xl font-bold text-gray-900">{getNextExpiry()} days</p>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            All quotes for this request
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="lowest-rate">Lowest rate</option>
                <option value="highest-ltv">Highest LTV</option>
                <option value="expiry">Expiry date</option>
              </select>
            </div>
            {selectedQuotes.length > 0 && (
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                Compare selected ({selectedQuotes.length})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQuotes(activeQuotes.map((q) => q.id));
                      } else {
                        setSelectedQuotes([]);
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Lender
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Loan amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Max LTV
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Term
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Fee
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  DSCR
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Expires
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    No quotes received yet
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => {
                  const daysLeft = getDaysUntilExpiry(quote.expires_at);
                  const isActive = ["submitted", "active"].includes(
                    quote.status.toLowerCase()
                  );
                  const isMutating = mutatingQuoteId === quote.id;

                  return (
                    <tr 
                      key={quote.id} 
                      onClick={() => router.push(`/loan/${quote.id}`)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedQuotes.includes(quote.id)}
                          onChange={() => toggleQuoteSelection(quote.id)}
                          className="rounded border-gray-300"
                          disabled={!isActive}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {quote.lender_name}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">
                          {formatCurrency(quote.loan_amount)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {parseFloat(quote.interest_rate).toFixed(2)}%
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">
                          {quote.max_as_is_ltv
                            ? `${parseFloat(quote.max_as_is_ltv).toFixed(0)}%`
                            : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{quote.term} mo</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">
                          {parseFloat(quote.origination_fee).toFixed(2)}%
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">
                          {quote.dscr ? quote.dscr.toFixed(2) : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {quote.expires_at ? (
                          <div>
                            <p className="text-sm text-gray-900">
                              {formatDate(quote.expires_at)}
                            </p>
                            {daysLeft !== null && (
                              <p className="text-xs text-gray-500">
                                {daysLeft > 0 ? `${daysLeft} days` : "Expired"}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">—</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusBadgeClass(
                            quote.status
                          )}`}
                        >
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {isActive ? (
                            <>
                              <button
                                onClick={() => handleAcceptQuote(quote)}
                                disabled={isMutating}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleDeclineQuote(quote)}
                                disabled={isMutating}
                                className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Decline
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => router.push(`/loan/${quote.id}`)}
                              className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            Click a row to open the full quote in a side drawer. Accepting a
            quote declines the others, closes this request and notifies all
            lenders.
          </p>
        </div>
      </div>
    </div>
  );
}
