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
  type QuoteItem,
} from "../api";
import StatsCardsQuotes from "./StatsCardsQuotes";
import QuotesList from "./QuotesList";
import QuoteDetailsModal from "./QuoteDetailsModal";

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
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

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

        return {
          id: quote.id,
          quoteId: quote.id,
          loanRequestId: quote.loan_request,
          propertyId: null, // Will be populated when property endpoint is integrated
          propertyName: `Loan Request #${quote.loan_request}`, // Temporary until we integrate property data
          address: "-", // Will be populated when property endpoint is integrated
          city: "-",
          state: "-",
          sponsor: "N/A",
          image: "/images/SponsorDashboard.png", // Default image until property data is integrated
          status,
          statusLabel: quote.status,
          priority: expiresIn <= 3 ? "urgent" : "normal",
          propertyType: "-", // Will be populated when property endpoint is integrated
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
    setSelectedQuote(quote);
    setIsQuoteModalOpen(true);
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
    <div className="min-h-screen bg-white overflow-x-hidden pb-6">
      {/* ====== Header ====== */}
      <header className="bg-white text-start rounded-2xl p-4 md:p-6 mb-4 md:mb-6 mx-3 md:mx-0">
        <h1 className="text-xl md:text-2xl font-normal text-gray-900">
          My Quotes
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Live lender quote dashboard, quote list, and management actions.
        </p>
      </header>

      {/* ====== Stats Cards ====== */}
      <div className="mx-3 md:mx-0">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-24 rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <StatsCardsQuotes stats={stats} />
        )}
      </div>

      {/* ====== Quotes List with Search and Filters ====== */}
      <div className="mx-3 md:mx-0">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                className="h-56 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <QuotesList
            quotes={filteredQuotes}
            filters={filters}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onViewQuote={handleViewQuote}
            onEditQuote={handleEditQuote}
            onViewProperty={handleViewProperty}
          />
        )}
      </div>

      <QuoteDetailsModal
        open={isQuoteModalOpen}
        onOpenChange={setIsQuoteModalOpen}
        quote={selectedQuote}
      />
    </div>
  );
};

export default MyQuotes;
