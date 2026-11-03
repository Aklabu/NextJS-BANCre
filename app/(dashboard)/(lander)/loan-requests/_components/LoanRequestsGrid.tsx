"use client";

import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import LoanRequestCard from "./LoanRequestCard";
import LoanRequestsMapView from "./LoanRequestsMapView";
import { LoanRequest, ViewMode } from "./types";

// Mock data for design purposes - will be replaced with API data
const mockLoanRequests = [
  {
    id: 1,
    propertyName: "Downtown Plaza",
    address: "123 Main Street, Los Angeles, CA 90012",
    amount: "$5.0M",
    term: "5 yrs",
    ltv: "75%",
    propertyType: "Commercial",
    occupancy: "85.5%",
    yearBuilt: "2015",
    status: "Active",
    propertyImage: null,
    location: { lat: 34.0522, lng: -118.2437 },
  },
  {
    id: 2,
    propertyName: "Sunset Apartments",
    address: "456 Sunset Blvd, Beverly Hills, CA 90210",
    amount: "$3.5M",
    term: "3 yrs",
    ltv: "70%",
    propertyType: "Residential",
    occupancy: "92.3%",
    yearBuilt: "2018",
    status: "Active",
    propertyImage: null,
    location: { lat: 34.0736, lng: -118.4004 },
  },
  {
    id: 3,
    propertyName: "[Property name]",
    address: "[Address]",
    amount: "$0.0M",
    term: "0 yrs",
    ltv: "0%",
    propertyType: "[Type]",
    occupancy: "0%",
    yearBuilt: "Year",
    status: "Active",
    propertyImage: null,
    location: { lat: 34.0522, lng: -118.3437 },
  },
  {
    id: 4,
    propertyName: "[Property name]",
    address: "[Address]",
    amount: "$0.0M",
    term: "0 yrs",
    ltv: "0%",
    propertyType: "[Type]",
    occupancy: "0%",
    yearBuilt: "Year",
    status: "Active",
    propertyImage: null,
    location: { lat: 34.0622, lng: -118.2537 },
  },
  {
    id: 5,
    propertyName: "[Property name]",
    address: "[Address]",
    amount: "$0.0M",
    term: "0 yrs",
    ltv: "0%",
    propertyType: "[Type]",
    occupancy: "0%",
    yearBuilt: "Year",
    status: "Active",
    propertyImage: null,
    location: { lat: 34.0422, lng: -118.2337 },
  },
  {
    id: 6,
    propertyName: "[Property name]",
    address: "[Address]",
    amount: "$0.0M",
    term: "0 yrs",
    ltv: "0%",
    propertyType: "[Type]",
    occupancy: "0%",
    yearBuilt: "Year",
    status: "Active",
    propertyImage: null,
    location: { lat: 34.0322, lng: -118.2637 },
  },
];

const LoanRequestsGrid = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("any");
  const [termFilter, setTermFilter] = useState("any");
  const [currentPage, setCurrentPage] = useState(1);

  const totalRequests = 23;
  const itemsPerPage = 6;
  const totalPages = Math.ceil(totalRequests / itemsPerPage);

  const handleSubmitQuote = (id: number) => {
    console.log("Submit quote for request:", id);
    // Will be implemented with navigation
  };

  const handleViewDetails = (id: number) => {
    console.log("View details for request:", id);
    // Will be implemented with navigation
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {mockLoanRequests.map((request) => (
              <LoanRequestCard
                key={request.id}
                request={request}
                onSubmitQuote={handleSubmitQuote}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} · {itemsPerPage} per page
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <LoanRequestsMapView
          requests={mockLoanRequests}
          onViewRequest={handleViewDetails}
        />
      )}
    </div>
  );
};

export default LoanRequestsGrid;
