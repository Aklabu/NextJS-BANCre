"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import DashboardStats from "./_components/DashboardStats";
import AcceptedQuotesList from "./_components/AcceptedQuotesList";
import PropertiesMap from "./_components/PropertiesMap";
import {
  fetchLenderDashboardData,
  fetchAcceptedQuotes,
  type LenderDashboardStats,
  type AcceptedQuote,
  type PropertyMapItem,
} from "./api";

const DEFAULT_STATS: LenderDashboardStats = {
  active_requests: 0,
  quotes_provided: 0,
  pending_review: 0,
  accepted_quotes: 0,
};

const Page = () => {
  const router = useRouter();
  
  // State management
  const [stats, setStats] = useState<LenderDashboardStats>(DEFAULT_STATS);
  const [quotes, setQuotes] = useState<AcceptedQuote[]>([]);
  const [properties, setProperties] = useState<PropertyMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination state for quotes
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load dashboard data
  const loadDashboardData = async (showToast: boolean = false) => {
    try {
      setLoading(true);
      const data = await fetchLenderDashboardData();
      
      setStats(data.stats);
      setQuotes(data.quotes.results);
      setProperties(data.properties);
      setTotalPages(data.quotes.total_pages);
      setCurrentPage(data.quotes.current_page);
      
      if (showToast) {
        toast.success("Dashboard refreshed successfully");
      }
    } catch (error) {
      console.error("Failed to load lender dashboard:", error);
      toast.error("Failed to load dashboard data. Please try again.");
      
      // Set defaults on error
      setStats(DEFAULT_STATS);
      setQuotes([]);
      setProperties([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData(true);
  };

  // Load more quotes
  const handleLoadMoreQuotes = async () => {
    if (currentPage >= totalPages || loadingMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const data = await fetchAcceptedQuotes(nextPage);
      
      setQuotes((prev) => [...prev, ...data.results]);
      setCurrentPage(data.current_page);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error("Failed to load more quotes:", error);
      toast.error("Failed to load more quotes");
    } finally {
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 mb-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Lender Dashboard
              </h1>
              <p className="text-gray-600">
                Monitor your lending activity, accepted quotes, and available opportunities
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 space-y-8">
        {/* Statistics Section */}
        <section>
          <DashboardStats stats={stats} loading={loading} />
        </section>

        {/* Accepted Quotes Section */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Accepted Quotes
            </h2>
            <p className="text-gray-600">
              Track your successfully accepted loan quotes and deal details
            </p>
          </div>
          
          <AcceptedQuotesList
            quotes={quotes}
            loading={loading}
            onLoadMore={handleLoadMoreQuotes}
            hasMore={currentPage < totalPages}
            loadingMore={loadingMore}
          />
        </section>

        {/* Properties Map Section */}
        <section>
          <PropertiesMap properties={properties} loading={loading} />
        </section>
      </div>
    </div>
  );
};

export default Page;
