"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaPlus } from "react-icons/fa6";
import { LuFileText, LuDollarSign, LuArrowUpRight } from "react-icons/lu";

import PropertyCard from "@/components/PropertyCard";
import StatusCard from "@/components/StatusCard";
import GMAP from "../../_components/GMAP";
import ConfirmActionModal from "@/components/ConfirmActionModal";
import api from "@/lib/apiClient";
import { toast } from "sonner";

import {
  fetchSponsorDashboard,
  fetchAllSponsorQuotes,
  type SponsorLoanDashboardData,
} from "../_api/loan-requests-api";
import {
  acceptQuote,
  declineQuote,
  fetchQuoteDetail,
} from "../_api/loan-request-detail-api";
import type { LoanQuote } from "../loan/_components/loan-types";
import LoanQuotesTable from "../loan/_components/LoanQuotesTable";
import CreateLoanRequestModal from "../_components/CreateLoanRequestModal";

// ── Types ────────────────────────────────────────────────────────────────────

interface Property {
  id: number;
  place_id?: string;
  property_name: string;
  property_address: string;
  property_type: string;
  latitude: string;
  longitude: string;
  property_image_url?: string | null;
  thumbnail_url?: string | null;
  property_images?: string[];
  memorandum_id?: number | null;
  created_at: string;
  updated_at: string;
  // Legacy fields (optional)
  number_of_units?: number;
  rentable_area?: string;
  year_built?: number;
  year_renovated?: number | null;
  occupancy?: string;
  parking_spaces?: number;
  documents?: any[];
}

interface PropertyCardData extends Property {
  property: string;
  title: string;
  location: string;
  status: string;
  link?: string;
  link2?: string;
}

interface Marker {
  id: number;
  position: { lat: number; lng: number };
  title: string;
  icon: string;
  color: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const MARKER_ICON = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

// ── Skeletons ────────────────────────────────────────────────────────────────

const StatsSkeleton = () => (
  <div className="flex flex-wrap items-center justify-center xl:justify-start gap-5 lg:gap-7 xl:gap-10 my-10">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-28 w-44 rounded-xl bg-gray-100 animate-pulse" />
    ))}
  </div>
);

const PropertySkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="h-96 rounded-xl bg-gray-100 animate-pulse" />
    ))}
  </div>
);

// ── Page Component ───────────────────────────────────────────────────────────

const Page = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Fetch Sponsor Dashboard Data (GET /api/dashboard/sponsor/)
  const { data: dashboardData, isLoading: statsLoading } =
    useQuery<SponsorLoanDashboardData>({
      queryKey: ["sponsor-dashboard"],
      queryFn: fetchSponsorDashboard,
      staleTime: 60 * 1000,
    });

  // 2. Fetch all sponsor quotes with property names
  const { data: allSponsorQuotes = [], isLoading: quotesLoading } = useQuery<LoanQuote[]>({
    queryKey: ["sponsor-quotes"],
    queryFn: () => fetchAllSponsorQuotes(1, 100),
    staleTime: 60 * 1000,
  });

  // 3. State for Properties, Markers & Modals
  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  // Create Loan Request Modal state
  const [isCreateLoanModalOpen, setIsCreateLoanModalOpen] = useState(false);
  const [selectedPropertyForLoan, setSelectedPropertyForLoan] = useState<
    number | null
  >(null);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState<PropertyCardData | null>(null);

  // Quote action states
  const [mutatingQuoteId, setMutatingQuoteId] = useState<number | null>(null);
  const [pendingQuoteAction, setPendingQuoteAction] = useState<{
    type: "accept" | "decline";
    quote: LoanQuote;
  } | null>(null);

  // Fetch properties + map markers + memorandums
  const fetchProperties = useCallback(async () => {
    setPropertiesLoading(true);
    try {
      // Fetch only properties - will use this data for both property cards and map markers
      const propertyRes = await api.get("/api/properties/?page=1&page_size=100");

      console.log("Properties API Response:", propertyRes?.data);

      // Handle standard API response format with pagination
      const apiData = propertyRes?.data;
      
      // Try multiple possible response structures
      let propertyData: Property[] = [];
      
      // Structure 1: data.data.results (standard envelope + pagination)
      if (apiData?.data?.results && Array.isArray(apiData.data.results)) {
        propertyData = apiData.data.results;
        console.log("Using structure: data.data.results");
      }
      // Structure 2: data.results (direct pagination)
      else if (apiData?.results && Array.isArray(apiData.results)) {
        propertyData = apiData.results;
        console.log("Using structure: data.results");
      }
      // Structure 3: data.data (standard envelope, direct array)
      else if (apiData?.data && Array.isArray(apiData.data)) {
        propertyData = apiData.data;
        console.log("Using structure: data.data (array)");
      }
      // Structure 4: direct array in data
      else if (Array.isArray(apiData)) {
        propertyData = apiData;
        console.log("Using structure: data (direct array)");
      }

      console.log(`Fetched ${propertyData.length} properties`);
      console.log("First property:", propertyData[0]);

      const enrichedProperties: PropertyCardData[] = propertyData.map(
        (property) => {
          // Use memorandum_id from the property response
          const memorandumId = property.memorandum_id;

          // Create a clean object with ONLY the fields we want
          return {
            id: property.id,
            property: String(property.id),
            title: property.property_name,
            property_name: property.property_name,
            property_address: property.property_address,
            location: property.property_address,
            property_type: property.property_type,
            status: property.property_type,
            latitude: property.latitude,
            longitude: property.longitude,
            place_id: property.place_id,
            thumbnail_url: property.property_image_url || null,
            property_image_url: property.property_image_url || null,
            property_images: property.property_images || [],
            created_at: property.created_at,
            updated_at: property.updated_at,
            // Use memorandum_id directly from API response
            link: memorandumId ? `/memorandum/${memorandumId}` : undefined,
          } as PropertyCardData;
        },
      );

      console.log(`Enriched ${enrichedProperties.length} properties for display`);
      setProperties(enrichedProperties);

      // Build markers from properties data (no separate map API call)
      const markers: Marker[] = enrichedProperties
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          id: p.id,
          position: {
            lat: parseFloat(p.latitude),
            lng: parseFloat(p.longitude),
          },
          title: p.property_name,
          icon: MARKER_ICON,
          color: "red",
        }));
      
      console.log(`Created ${markers.length} map markers from properties`);
      setMarkers(markers);
    } catch (err) {
      console.error("Failed to fetch properties", err);
      console.error("Error details:", err);
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Quote action handlers
  const executeAcceptQuote = async (quote: LoanQuote) => {
    try {
      setMutatingQuoteId(quote.id);
      await acceptQuote(quote.id);
      toast.success("Quote accepted successfully.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sponsor-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["sponsor-quotes"] }),
      ]);
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sponsor-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["sponsor-quotes"] }),
      ]);
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

  const openConfirmQuoteAction = (
    type: "accept" | "decline",
    quote: LoanQuote,
  ) => {
    setPendingQuoteAction({ type, quote });
  };

  const closeConfirmQuoteAction = () => {
    if (mutatingQuoteId !== null) return;
    setPendingQuoteAction(null);
  };

  const handleConfirmQuoteAction = async () => {
    if (!pendingQuoteAction) return;

    if (pendingQuoteAction.type === "accept") {
      await executeAcceptQuote(pendingQuoteAction.quote);
    }

    if (pendingQuoteAction.type === "decline") {
      await executeDeclineQuote(pendingQuoteAction.quote);
    }

    setPendingQuoteAction(null);
  };

  const quoteModalConfig = useMemo(() => {
    if (!pendingQuoteAction) {
      return {
        title: "",
        description: "",
        confirmText: "Confirm",
        destructive: false,
      };
    }

    const lenderName = pendingQuoteAction.quote.lender_name;

    if (pendingQuoteAction.type === "accept") {
      return {
        title: "Accept quote?",
        description: `This will accept the quote from ${lenderName} and close the related request.`,
        confirmText: "Accept Quote",
        destructive: false,
      };
    }

    return {
      title: "Decline quote?",
      description: `This will decline the quote from ${lenderName}. You cannot undo this action.`,
      confirmText: "Decline Quote",
      destructive: true,
    };
  }, [pendingQuoteAction]);

  // Execute property deletion (DELETE /api/properties/{id}/)
  const confirmDeleteProperty = async () => {
    if (!deletingProperty) return;

    try {
      setIsDeleting(true);
      await api.delete(`/api/properties/${deletingProperty.id}/`);

      // Refresh properties list
      await fetchProperties();

      // Invalidate dashboard queries
      await queryClient.invalidateQueries({ queryKey: ["sponsor-dashboard"] });

      toast.success("Property deleted successfully.");
      setDeletingProperty(null);
    } catch (error: any) {
      console.error("Failed to delete property", error);
      const errorMessage = 
        error?.response?.data?.message || 
        error?.response?.data?.errors?.[0] || 
        "Failed to delete property. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const headerStats = dashboardData || {
    total_properties: properties.length,
    published_memorandums: 0,
    my_loan_requests: 0,
    quotes_received: 0,
    accepted_quotes: 0,
    rejected_quotes: 0,
  };

  // Calculate best rate and highest LTV from all quotes
  const bestRate = useMemo(() => {
    if (allSponsorQuotes.length === 0) return 0;
    return Math.min(...allSponsorQuotes.map(q => Number(q.interest_rate)));
  }, [allSponsorQuotes]);

  const highestLTV = useMemo(() => {
    if (allSponsorQuotes.length === 0) return 0;
    return Math.max(...allSponsorQuotes.map(q => Number(q.max_as_is_ltv)));
  }, [allSponsorQuotes]);

  const propertyOptions = useMemo(
    () =>
      properties.map((p) => ({
        id: p.id,
        property_name: p.property_name,
        property_address: p.property_address,
        property_type: p.property_type,
        thumbnail_url: p.thumbnail_url,
      })),
    [properties],
  );

  return (
    <div>
      {/* ── Header row with Action ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Sponsor Dashboard
          </h1>
          <p className="text-[#4A5565] text-sm mt-1">
            Manage your commercial real estate portfolio, request loans, and track lender quotes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedPropertyForLoan(null);
              setIsCreateLoanModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
          >
            <FaPlus className="text-xs" />
            <span>Request Loan</span>
          </button>
          <Link
            href="/processing"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <FaPlus className="text-xs" />
            <span>Add Property</span>
          </Link>
        </div>
      </div>

      {/* ── Status Cards (from /api/v1/loans/dashboard/sponsor/) ── */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 my-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4 my-8">
          {/* First Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {/* Total Properties */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <span className="text-2xl">🏢</span>
              </div>
              <p className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                {headerStats.total_properties ?? properties.length}
              </p>
              <p className="text-xs text-gray-500">Active listings</p>
            </div>

            {/* Published Memorandums */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Published Memorandums</p>
                <span className="text-2xl">📄</span>
              </div>
              <p className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                {headerStats.published_memorandums ?? 0}
              </p>
              <p className="text-xs text-gray-500">Live documents</p>
            </div>

            {/* My Loan Requests */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">My Loan Requests</p>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                {headerStats.my_loan_requests ?? 0}
              </p>
              <p className="text-xs text-gray-500">Submitted to lenders</p>
            </div>
          </div>
          
          {/* Second Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {/* Quotes Received */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Quotes Received</p>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                {headerStats.quotes_received ?? 0}
              </p>
              <p className="text-xs text-gray-500">From lenders</p>
            </div>

            {/* Accepted Quotes */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Accepted Quotes</p>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                {headerStats.accepted_quotes ?? 0}
              </p>
              <p className="text-xs text-gray-500 font-medium">Successfully closed</p>
            </div>

            {/* Rejected Quotes */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Rejected Quotes</p>
                <span className="text-2xl">❌</span>
              </div>
              <p className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                {headerStats.rejected_quotes ?? 0}
              </p>
              <p className="text-xs text-gray-500 font-medium">Declined offers</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Loan Requests Section ── */}
      <div className="mb-10">
        <div className="rounded-xl bg-white p-4 lg:p-6 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-gray-900">
                  Loan quotes
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  {allSponsorQuotes.length}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Best rate <span className="font-semibold text-gray-900">{bestRate > 0 ? `${bestRate.toFixed(2)}%` : '15.00%'}</span> · Highest LTV <span className="font-semibold text-gray-900">{highestLTV > 0 ? `${highestLTV.toFixed(0)}%` : '52%'}</span> · <span className="font-semibold text-gray-900">{allSponsorQuotes.length}</span> total
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedPropertyForLoan(null);
                setIsCreateLoanModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
            >
              <FaPlus className="text-[10px]" />
              <span>New Request</span>
            </button>
          </div>

          <LoanQuotesTable
            quotes={allSponsorQuotes}
            loading={quotesLoading}
            mutatingQuoteId={mutatingQuoteId}
            onAccept={(quote) => openConfirmQuoteAction("accept", quote)}
            onDecline={(quote) => openConfirmQuoteAction("decline", quote)}
            onView={handleViewQuote}
            bestRate={bestRate}
            highestLTV={highestLTV}
          />
        </div>
      </div>

      {/* ── Google Map ── */}
      <div className="mb-10">
        <div className="rounded-xl bg-white p-4 lg:p-6 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Your Properties on Map
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Currently you added <span className="font-semibold text-gray-900">{properties.length}</span> {properties.length === 1 ? 'property' : 'properties'} on BANCre.
              </p>
            </div>
          </div>
          <GMAP markersList={markers} />
        </div>
      </div>

      {/* ── My Properties ── */}
      <div className="mb-10">
        <div className="rounded-xl bg-white p-4 lg:p-6 border border-gray-200">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                My Properties
              </h2>
              <p className="text-sm text-gray-500">
                Properties with AI generated memorandum
              </p>
            </div>
            <Link
              href="/memorandum"
              className="flex gap-2 items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <span>View All</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="my-6">
            {propertiesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-96 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="col-span-full text-center py-16 text-[#6A7282]">
                <p className="text-lg mb-2">No properties yet</p>
                <p className="text-sm">
                  Add your first property to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
                {properties.slice(0, 3).map((property) => (
                  <PropertyCard
                    key={property.id}
                    data={property}
                    size="large"
                    onDelete={() => setDeletingProperty(property)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Create Loan Request Modal ── */}
      <CreateLoanRequestModal
        open={isCreateLoanModalOpen}
        onOpenChange={setIsCreateLoanModalOpen}
        properties={propertyOptions}
        preselectedPropertyId={selectedPropertyForLoan}
      />

      {/* ── Confirm Quote Action Modal ── */}
      <ConfirmActionModal
        open={Boolean(pendingQuoteAction)}
        onOpenChange={closeConfirmQuoteAction}
        title={quoteModalConfig.title}
        description={quoteModalConfig.description}
        confirmText={quoteModalConfig.confirmText}
        destructive={quoteModalConfig.destructive}
        isLoading={mutatingQuoteId !== null}
        onConfirm={handleConfirmQuoteAction}
      />

      {/* ── Delete Property Confirmation Modal ── */}
      <ConfirmActionModal
        open={Boolean(deletingProperty)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingProperty(null);
        }}
        title="Delete property?"
        description={
          deletingProperty
            ? `This will permanently delete "${deletingProperty.title}" and all associated data including memorandums and documents. This action cannot be undone.`
            : "This will permanently remove the selected property."
        }
        confirmText="Delete Property"
        destructive
        isLoading={isDeleting}
        onConfirm={confirmDeleteProperty}
      />
    </div>
  );
};

export default Page;
