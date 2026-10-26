"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IoArrowBack } from "react-icons/io5";
import { useAuth } from "@/providers/AuthProvider";

import LoanQuotesTable from "../loan/_components/LoanQuotesTable";
import ConfirmActionModal from "@/components/ConfirmActionModal";
import { toast } from "sonner";
import type { LoanQuote } from "../loan/_components/loan-types";

import {
  fetchSponsorDashboard,
  type SponsorLoanDashboardData,
} from "../_api/loan-requests-api";
import {
  acceptQuote,
  declineQuote,
} from "../_api/loan-request-detail-api";

const DEFAULT_DASHBOARD_DATA: SponsorLoanDashboardData = {
  header_stats: {
    total_properties: 0,
    quotes_received: 0,
    documents_count: 0,
    portfolio_value: 0,
  },
  quote_card_view: [],
  quote_comparison: {
    total_quotes: 0,
    best_rate: 0,
    highest_ltv: 0,
    quotes: [],
  },
};

const QuotesPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24); // Show 24 quotes per page

  // TanStack Query for Dashboard Data
  const { data: dashboardData = DEFAULT_DASHBOARD_DATA, isLoading: dashboardLoading } =
    useQuery({
      queryKey: ["sponsor-dashboard"],
      queryFn: fetchSponsorDashboard,
      staleTime: 60 * 1000,
      enabled: !!user,
    });

  const [mutatingQuoteId, setMutatingQuoteId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: "accept" | "decline";
    quote: LoanQuote;
  } | null>(null);

  const executeAcceptQuote = async (quote: LoanQuote) => {
    try {
      setMutatingQuoteId(quote.id);
      await acceptQuote(quote.id);
      toast.success("Quote accepted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["sponsor-dashboard"] });
    } catch (error: any) {
      console.error("Failed to accept quote", error);
      toast.error(error.message || "Failed to accept quote.");
    } finally {
      setMutatingQuoteId(null);
    }
  };

  const executeDeclineQuote = async (quote: LoanQuote) => {
    try {
      setMutatingQuoteId(quote.id);
      await declineQuote(quote.id);
      toast.success("Quote declined successfully.");
      await queryClient.invalidateQueries({ queryKey: ["sponsor-dashboard"] });
    } catch (error: any) {
      console.error("Failed to decline quote", error);
      toast.error(error.message || "Failed to decline quote.");
    } finally {
      setMutatingQuoteId(null);
    }
  };

  const handleViewQuote = (quote: LoanQuote) => {
    router.push(`/loan/${quote.id}`);
  };

  const openConfirmAction = (
    type: "accept" | "decline",
    quote: LoanQuote,
  ) => {
    setPendingAction({ type, quote });
  };

  const closeConfirmAction = () => {
    if (mutatingQuoteId !== null) return;
    setPendingAction(null);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    if (pendingAction.type === "accept") {
      await executeAcceptQuote(pendingAction.quote);
    }

    if (pendingAction.type === "decline") {
      await executeDeclineQuote(pendingAction.quote);
    }

    setPendingAction(null);
  };

  const modalConfig = (() => {
    if (!pendingAction) {
      return {
        title: "",
        description: "",
        confirmText: "Confirm",
        destructive: false,
      };
    }

    const lenderName = pendingAction.quote.lender_name;

    if (pendingAction.type === "accept") {
      return {
        title: "Accept quote?",
        description: `This will accept the quote from ${lenderName} and close the related request.`,
        confirmText: "Accept Quote",
        destructive: false,
      };
    }

    return {
      title: "Decline quote?",
      description: `This will decline the quote from ${lenderName}. You can not undo this action.`,
      confirmText: "Decline Quote",
      destructive: true,
    };
  })();

  const allQuotes = dashboardData.quote_card_view || [];

  // Pagination logic
  const totalQuotes = allQuotes.length;
  const totalPages = Math.ceil(totalQuotes / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuotes = allQuotes.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <IoArrowBack />
          <span>Back</span>
        </button>
        
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">All Loan Quotes</h1>
          <p className="text-sm text-gray-600 mt-1">
            Best rate{" "}
            <span className="font-semibold text-gray-900">
              {dashboardData.quote_comparison.best_rate
                ? `${Number(dashboardData.quote_comparison.best_rate).toFixed(2)}%`
                : "0.00%"}
            </span>{" "}
            · Highest LTV{" "}
            <span className="font-semibold text-gray-900">
              {dashboardData.quote_comparison.highest_ltv
                ? `${Number(dashboardData.quote_comparison.highest_ltv).toFixed(0)}%`
                : "0%"}
            </span>{" "}
            · <span className="font-semibold text-gray-900">{totalQuotes}</span> total
          </p>
        </div>
      </div>

      {/* Quotes Table */}
      <LoanQuotesTable
        quotes={currentQuotes}
        loading={dashboardLoading}
        mutatingQuoteId={mutatingQuoteId}
        onAccept={(quote) => openConfirmAction("accept", quote)}
        onDecline={(quote) => openConfirmAction("decline", quote)}
        onView={handleViewQuote}
        bestRate={dashboardData.quote_comparison.best_rate}
        highestLTV={dashboardData.quote_comparison.highest_ltv}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, totalQuotes)} of {totalQuotes} quotes
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

                return (
                  <React.Fragment key={page}>
                    {showEllipsisBefore && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    
                    {showPage && (
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )}
                    
                    {showEllipsisAfter && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      <ConfirmActionModal
        open={Boolean(pendingAction)}
        onOpenChange={closeConfirmAction}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmText={modalConfig.confirmText}
        destructive={modalConfig.destructive}
        isLoading={mutatingQuoteId !== null}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};

export default QuotesPage;
