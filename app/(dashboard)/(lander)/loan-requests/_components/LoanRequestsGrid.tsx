"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { toast } from "sonner";
import LoanRequestCard from "./LoanRequestCard";
import LoanRequestsMapView from "./LoanRequestsMapView";
import { LoanRequest, ViewMode } from "./types";
import {
  fetchPropertiesMap,
  fetchLoanRequests,
  normalizeImageUrl,
  formatCurrency,
  formatLoanTerm,
  formatLTV,
  formatOccupancy,
  parseCoordinate,
  PropertyMapItem,
  LoanRequestItem,
} from "../api";

const LoanRequestsGrid = () => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("any");
  const [termFilter, setTermFilter] = useState("any");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [allLoanRequests, setAllLoanRequests] = useState<LoanRequest[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 9;

  // Fetch data from API
  const loadLoanRequests = useCallback(async (page: number) => {
    setLoading(true);
    try {
      // Fetch both properties map and loan requests in parallel
      const [propertiesMap, loanRequestsData] = await Promise.all([
        fetchPropertiesMap(),
        fetchLoanRequests(page, itemsPerPage),
      ]);

      // Create a map of properties by ID for quick lookup
      const propertiesById = new Map<number, PropertyMapItem>(
        propertiesMap.map((prop) => [prop.id, prop])
      );

      // Transform API data to display format
      const transformedRequests: LoanRequest[] = loanRequestsData.results.map(
        (request: LoanRequestItem) => {
          const property = propertiesById.get(request.property);

          return {
            id: request.id,
            propertyId: request.property,
            propertyName: request.property_name,
            address: request.property_address,
            amount: formatCurrency(request.requested_amount),
            term: formatLoanTerm(request.loan_term),
            ltv: formatLTV(request.ltv),
            propertyType: request.property_type,
            occupancy: formatOccupancy(request.occupancy),
            yearBuilt: request.year_built?.toString() || "N/A",
            status: request.status,
            propertyImage: normalizeImageUrl(request.property_image_url),
            location: {
              lat: property ? parseCoordinate(property.latitude) : 0,
              lng: property ? parseCoordinate(property.longitude) : 0,
            },
            createdAt: request.created_at,
            rawAmount: parseFloat(request.requested_amount),
            rawTerm: request.loan_term,
          };
        }
      );

      setAllLoanRequests(transformedRequests);
      setLoanRequests(transformedRequests);
      setTotalRequests(loanRequestsData.count);
      setTotalPages(loanRequestsData.total_pages);
    } catch (error) {
      console.error("Failed to load loan requests:", error);
      toast.error("Unable to load loan requests. Please try again.");
      setAllLoanRequests([]);
      setLoanRequests([]);
      setTotalRequests(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoanRequests(currentPage);
  }, [currentPage, loadLoanRequests]);

  // Apply filters to loan requests
  useEffect(() => {
    let filtered = [...allLoanRequests];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.propertyName.toLowerCase().includes(query) ||
          request.address.toLowerCase().includes(query)
      );
    }

    // Property type filter
    if (propertyTypeFilter !== "all") {
      filtered = filtered.filter(
        (request) =>
          request.propertyType.toLowerCase() === propertyTypeFilter.toLowerCase()
      );
    }

    // Amount filter
    if (amountFilter !== "any") {
      filtered = filtered.filter((request) => {
        const amount = request.rawAmount;
        switch (amountFilter) {
          case "0-1m":
            return amount >= 0 && amount < 1000000;
          case "1m-5m":
            return amount >= 1000000 && amount < 5000000;
          case "5m-10m":
            return amount >= 5000000 && amount < 10000000;
          case "10m+":
            return amount >= 10000000;
          default:
            return true;
        }
      });
    }

    // Term filter
    if (termFilter !== "any") {
      filtered = filtered.filter((request) => {
        const termInYears = request.rawTerm / 12;
        switch (termFilter) {
          case "1-3":
            return termInYears >= 1 && termInYears < 3;
          case "3-5":
            return termInYears >= 3 && termInYears < 5;
          case "5-10":
            return termInYears >= 5 && termInYears < 10;
          case "10+":
            return termInYears >= 10;
          default:
            return true;
        }
      });
    }

    setLoanRequests(filtered);
    setTotalRequests(filtered.length);
  }, [
    searchQuery,
    propertyTypeFilter,
    amountFilter,
    termFilter,
    allLoanRequests,
  ]);

  const handleSubmitQuote = (id: number) => {
    router.push(`/loan-requests/${id}/submit-quote`);
  };

  const handleViewDetails = (id: number) => {
    router.push(`/loan-requests/${id}`);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Calculate display values for current page of filtered results
  const displayedRequests = loanRequests;
  const displayTotalPages = Math.ceil(loanRequests.length / itemsPerPage) || 1;
  const displayedOnPage = loanRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, propertyTypeFilter, amountFilter, termFilter]);

  return (
    <div className="p-4 md:p-6">
      {/* Header with View Toggle */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Loan requests</h1>
          <p className="text-sm text-gray-600 mt-1">
            {totalRequests} active requests open for quotes.
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex rounded-lg border border-gray-300 bg-white">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors border-l ${
              viewMode === "map"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Property name or address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Property Type Filter */}
        <div>
          <select
            value={propertyTypeFilter}
            onChange={(e) => setPropertyTypeFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All types</option>
            <option value="commercial">Commercial</option>
            <option value="residential">Residential</option>
            <option value="industrial">Industrial</option>
            <option value="mixed">Mixed-Use</option>
          </select>
        </div>

        {/* Amount Filter */}
        <div>
          <select
            value={amountFilter}
            onChange={(e) => setAmountFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="any">Any amount</option>
            <option value="0-1m">$0 - $1M</option>
            <option value="1m-5m">$1M - $5M</option>
            <option value="5m-10m">$5M - $10M</option>
            <option value="10m+">$10M+</option>
          </select>
        </div>

        {/* Term Filter */}
        <div>
          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="any">Any term</option>
            <option value="1-3">1-3 years</option>
            <option value="3-5">3-5 years</option>
            <option value="5-10">5-10 years</option>
            <option value="10+">10+ years</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === "list" ? (
        <>
          {/* Grid of Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {Array.from({ length: itemsPerPage }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-96 rounded-lg border border-gray-200 bg-gray-50 animate-pulse"
                />
              ))}
            </div>
          ) : loanRequests.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600 mb-6">
              No loan requests found matching your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {displayedOnPage.map((request) => (
                <LoanRequestCard
                  key={request.id}
                  request={request}
                  onSubmitQuote={handleSubmitQuote}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && loanRequests.length > 0 && (
            <div className="flex items-center justify-between py-4">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {displayTotalPages} · {itemsPerPage} per page
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === displayTotalPages}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <LoanRequestsMapView
          requests={loanRequests}
          onViewRequest={handleViewDetails}
          loading={loading}
        />
      )}
    </div>
  );
};

export default LoanRequestsGrid;
