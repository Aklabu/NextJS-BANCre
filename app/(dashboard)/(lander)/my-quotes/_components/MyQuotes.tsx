"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/apiClient";
import {
  Quote,
  QuoteFilter,
  QuoteStat,
  QuoteStatus,
} from "@/types/my-quotes";
import {
  fetchLenderQuoteStats,
  fetchAllLenderQuotes,
  formatCurrency,
  formatDate,
  formatPercent,
  formatLoanTerm,
  getDaysUntil,
  normalizeQuoteStatus,
  normalizeImageUrl,
  type QuoteItem,
} from "../api";
import StatsCardsQuotes from "./StatsCardsQuotes";
import QuotesList from "./QuotesList";

type ApiEnvelope<T> = {
  data?: T;
};

const FALLBACK_PROPERTY_IMAGE = "/images/SponsorDashboard.png";

//========== My Quotes Component ===========

const MyQuotes: React.FC = () => {
  const router = useRouter();
  //========== State Management ===========
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QuoteStat[]>([]);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);

  const fetchMyQuotesData = useCallback(async () => {
    setLoading(true);

    try {
      // Fetch data from new APIs in parallel
      const [quoteStatsData, quotesData] = await Promise.all([
        fetchLenderQuoteStats(),
        fetchAllLenderQuotes(),
      ]);

      // Build stats cards from API data
      const statsCards: QuoteStat[] = [
        {
          id: 1,
          label: "Total Quotes",
          value: String(quoteStatsData.total_quotes),
          icon: "file",
          bgColor: "bg-blue-50",
          iconColor: "bg-blue-600 text-white",
          borderColor: "border-blue-200",
        },
        {
          id: 2,
          label: "Under Review",
          value: String(quoteStatsData.under_review_quotes),
          icon: "clock",
          bgColor: "bg-indigo-50",
          iconColor: "bg-indigo-600 text-white",
          borderColor: "border-indigo-200",
        },
        {
          id: 3,
          label: "Accepted Quotes",
          value: String(quoteStatsData.accepted_quotes),
          icon: "check",
          bgColor: "bg-green-50",
          iconColor: "bg-green-600 text-white",
          borderColor: "border-green-200",
        },
        {
          id: 4,
          label: "Declined Quotes",
          value: String(quoteStatsData.declined_quotes),
          icon: "x",
          bgColor: "bg-red-50",
          iconColor: "bg-red-600 text-white",
          borderColor: "border-red-200",
        },
      ];
      setStats(statsCards);

      // Transform quotes data to display format
      const mappedQuotes: Quote[] = quotesData.map((quote: QuoteItem) => {
        const expiresIn = getDaysUntil(quote.expires_at);
        const status = normalizeQuoteStatus(quote.status);

        // Extract city and state from address
        const addressParts = quote.property_address.split(',').map(s => s.trim());
        const state = addressParts[addressParts.length - 1] || "-";
        const city = addressParts[addressParts.length - 2] || "-";

        return {
          id: quote.id,
          quoteId: quote.id,
          loanRequestId: quote.loan_request,
          propertyId: quote.property_id,
          propertyName: quote.property_name,
          address: quote.property_address,
          city,
          state,
          sponsor: "N/A",
          image: normalizeImageUrl(quote.property_image_url) || FALLBACK_PROPERTY_IMAGE,
          status,
          statusLabel: quote.status,
          priority: expiresIn <= 3 ? "urgent" : "normal",
          propertyType: quote.property_type,
          interestRate: formatPercent(quote.interest_rate),
          term: formatLoanTerm(quote.term),
          ltv: formatPercent(quote.max_as_is_ltv),
          submittedDate: formatDate(quote.submitted_at),
          expiresIn,
          quotedAmount: formatCurrency(quote.loan_amount),
          competingQuotes: 0,
          avgResponseTime: "-",
          lenderName: quote.lender_name,
          guarantor: quote.guarantor,
          rawLoanAmount: String(quote.loan_amount),
          rawInterestRate: String(quote.interest_rate),
          rawExpiresAt: quote.expires_at,
          raw: quote as any, // Type compatibility
        };
      });

      console.log("Mapped Quotes:", mappedQuotes);
      setAllQuotes(mappedQuotes);
    } catch (error) {
      console.error("Failed to load lender quotes", error);
      toast.error("Unable to load your quote dashboard right now.");
      setAllQuotes([]);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyQuotesData();
  }, [fetchMyQuotesData]);

  const filters: QuoteFilter[] = useMemo(() => {
    const submittedCount = allQuotes.filter(
      (quote) => quote.status === "submitted",
    ).length;
    const underReviewCount = allQuotes.filter(
      (quote) => quote.status === "under_review",
    ).length;
    const acceptedCount = allQuotes.filter(
      (quote) => quote.status === "accepted",
    ).length;
    const rejectedCount = allQuotes.filter(
      (quote) => quote.status === "rejected",
    ).length;

    return [
      { id: "all", label: "All", count: allQuotes.length },
      { id: "submitted", label: "Submitted", count: submittedCount },
      { id: "under_review", label: "Under Review", count: underReviewCount },
      { id: "accepted", label: "Accepted", count: acceptedCount },
      { id: "rejected", label: "Rejected", count: rejectedCount },
    ];
  }, [allQuotes]);

  //========== Filter Quotes ===========
  const filteredQuotes = useMemo(
    () =>
      allQuotes.filter((quote) => {
        if (activeFilter !== "all" && quote.status !== activeFilter) {
          return false;
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            quote.propertyName.toLowerCase().includes(query) ||
            quote.address.toLowerCase().includes(query) ||
            quote.lenderName.toLowerCase().includes(query) ||
            quote.city.toLowerCase().includes(query)
          );
        }

        return true;
      }),
    [activeFilter, allQuotes, searchQuery],
  );

  const handleViewQuote = (quote: Quote) => {
    router.push(`/my-quotes/${quote.quoteId}/details`);
  };

  const handleEditQuote = (quote: Quote) => {
    if (!quote.quoteId) {
      toast.error("No submitted quote found for this loan request yet.");
      return;
    }

    router.push(`/my-quotes/${quote.quoteId}/edit`);
  };

  const handleViewProperty = (quote: Quote) => {
    if (!quote.propertyId) {
      toast.error("Property information is not available for this quote.");
      return;
    }

    router.push(`/my-quotes/property/${quote.propertyId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* ====== Clean Header ====== */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Quotes</h1>
              <p className="text-gray-600 mt-2 text-sm md:text-base">
                Manage and track your submitted loan quotes
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    allQuotes.reduce((sum, q) => sum + Number(q.rawLoanAmount || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ====== Enhanced Stats Cards with Shadows ====== */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 rounded-2xl border border-gray-200 bg-white shadow-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.id}
                className={`${stat.bgColor} rounded-2xl p-6 border ${stat.borderColor} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`${stat.iconColor} w-12 h-12 rounded-xl flex items-center justify-center shadow-md`}
                  >
                    {stat.icon === "file" && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {stat.icon === "clock" && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {stat.icon === "check" && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {stat.icon === "x" && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ====== Main Content Card ====== */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          {/* Search and Filters Bar */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search quotes by property, lender, or location..."
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      activeFilter === filter.id
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                    }`}
                  >
                    {filter.label}
                    {filter.count !== undefined && (
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          activeFilter === filter.id
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {filter.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quotes List */}
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-48 rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quotes Found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery
                    ? "Try adjusting your search or filters"
                    : "You haven't submitted any quotes yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="group border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 bg-gradient-to-r from-white to-gray-50/50"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Quote Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                              {quote.propertyName}
                            </h3>
                            <p className="text-sm text-gray-500">{quote.lenderName}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Loan Amount</p>
                            <p className="text-sm font-semibold text-gray-900">{quote.quotedAmount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Interest Rate</p>
                            <p className="text-sm font-semibold text-gray-900">{quote.interestRate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Term</p>
                            <p className="text-sm font-semibold text-gray-900">{quote.term}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">LTV</p>
                            <p className="text-sm font-semibold text-gray-900">{quote.ltv}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Submitted {quote.submittedDate}
                          </span>
                          {quote.expiresIn > 0 && (
                            <span
                              className={`flex items-center gap-1 ${
                                quote.expiresIn <= 3
                                  ? "text-red-600 font-medium"
                                  : "text-gray-500"
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Expires in {quote.expiresIn} days
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex lg:flex-col gap-2 justify-end items-start">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            quote.status === "accepted"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : quote.status === "rejected"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : quote.status === "under_review"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : "bg-purple-100 text-purple-800 border border-purple-200"
                          }`}
                        >
                          {quote.statusLabel}
                        </span>
                        <button
                          onClick={() => handleViewQuote(quote)}
                          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        {quote.status === "submitted" && (
                          <button
                            onClick={() => handleEditQuote(quote)}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyQuotes;
