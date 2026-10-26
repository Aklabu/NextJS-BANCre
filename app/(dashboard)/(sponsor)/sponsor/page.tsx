"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
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
  fetchLoanRequests,
  deleteLoanRequest,
  type SponsorLoanRequestItem,
  type SponsorDashboardData,
} from "../_api/loan-requests-api";
import CreateLoanRequestModal from "../_components/CreateLoanRequestModal";
import UpdateLoanRequestModal from "../_components/UpdateLoanRequestModal";
import SponsorLoanRequestCard from "../_components/SponsorLoanRequestCard";
import LoanRequestQuotesModal from "../_components/LoanRequestQuotesModal";

// ── Types ────────────────────────────────────────────────────────────────────

interface Property {
  id: number;
  property_name: string;
  property_address: string;
  property_type: string;
  latitude: string;
  longitude: string;
  property_image_url?: string | null;
  thumbnail_url?: string | null;
  property_images?: string[];
  created_at: string;
  updated_at: string;
  // Explicitly define extra fields so we can control them
  number_of_units?: number;
  rentable_area?: string;
  year_built?: number;
  year_renovated?: number | null;
  occupancy?: string;
  parking_spaces?: number;
  documents?: any[];
}

interface MemorandumSummary {
  id: number;
  property: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
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

const getTimestamp = (value?: string) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const isPublished = (status?: string) =>
  (status || "").trim().toLowerCase() === "published";

const pickPreferredMemorandum = (
  current: MemorandumSummary | undefined,
  candidate: MemorandumSummary,
) => {
  if (!current) return candidate;

  const currentPublished = isPublished(current.status);
  const candidatePublished = isPublished(candidate.status);

  if (candidatePublished !== currentPublished) {
    return candidatePublished ? candidate : current;
  }

  const currentStamp = getTimestamp(current.updated_at || current.created_at);
  const candidateStamp = getTimestamp(
    candidate.updated_at || candidate.created_at,
  );

  return candidateStamp > currentStamp ? candidate : current;
};

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
  const queryClient = useQueryClient();

  // 1. Fetch Sponsor Dashboard Data (Postman: GET /api/v1/loans/dashboard/sponsor/)
  const { data: dashboardData, isLoading: statsLoading } =
    useQuery<SponsorDashboardData>({
      queryKey: ["sponsor-dashboard"],
      queryFn: fetchSponsorDashboard,
      staleTime: 60 * 1000,
    });

  // 2. Fetch All Loan Requests (Postman: GET /api/v1/loans/requests/)
  const { data: loanRequests = [], isLoading: requestsLoading } =
    useQuery<SponsorLoanRequestItem[]>({
      queryKey: ["loan-requests"],
      queryFn: fetchLoanRequests,
      staleTime: 60 * 1000,
    });

  // 3. State for Properties, Markers & Modals
  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [visiblePropertyCount, setVisiblePropertyCount] = useState(6);

  // Loan Request Modals state
  const [isCreateLoanModalOpen, setIsCreateLoanModalOpen] = useState(false);
  const [selectedPropertyForLoan, setSelectedPropertyForLoan] = useState<
    number | null
  >(null);
  const [editingLoanRequest, setEditingLoanRequest] =
    useState<SponsorLoanRequestItem | null>(null);
  const [deletingLoanRequest, setDeletingLoanRequest] =
    useState<SponsorLoanRequestItem | null>(null);
  const [selectedQuotesRequest, setSelectedQuotesRequest] =
    useState<SponsorLoanRequestItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState<PropertyCardData | null>(null);

  // Fetch properties + map markers + memorandums
  const fetchProperties = useCallback(async () => {
    setPropertiesLoading(true);
    try {
      const [propertyRes, mapRes, memorandumRes] = await Promise.all([
        api
          .get("/api/properties/")
          .catch(() => api.get("/api/properties/")),
        api
          .get("/api/v1/properties/map/")
          .catch(() => api.get("/api/properties/map/"))
          .catch(() => null),
        api
          .get("/api/memorandums/")
          .catch(() => api.get("/api/memorandums/"))
          .catch(() => null),
      ]);

      const propRaw = propertyRes?.data?.data ?? propertyRes?.data;
      const propertyData: Property[] = Array.isArray(propRaw)
        ? propRaw
        : Array.isArray(propRaw?.results)
          ? propRaw.results
          : [];

      const rawMemorandums =
        memorandumRes?.data?.data ??
        memorandumRes?.data?.results ??
        memorandumRes?.data ??
        [];
      const memorandumData: MemorandumSummary[] = Array.isArray(rawMemorandums)
        ? rawMemorandums
        : Array.isArray((rawMemorandums as any)?.results)
          ? (rawMemorandums as any).results
          : [];

      const memorandumByProperty = new Map<number, MemorandumSummary>();
      for (const memorandum of memorandumData) {
        const propertyId = Number(memorandum.property);
        if (!Number.isFinite(propertyId) || propertyId <= 0) continue;

        const current = memorandumByProperty.get(propertyId);
        const preferred = pickPreferredMemorandum(current, memorandum);
        memorandumByProperty.set(propertyId, preferred);
      }

      const enrichedProperties: PropertyCardData[] = propertyData.map(
        (property) => {
          const matchedMemorandum = memorandumByProperty.get(property.id);

          // Create a clean object with ONLY the fields we want (matching memorandum cards)
          // Using explicit property selection to ensure no extra fields leak through
          return {
            id: property.id,
            property: String(property.id),
            title: property.property_name,
            property_address: property.property_address,
            location: property.property_address,
            property_type: property.property_type,
            status: property.property_type,
            latitude: property.latitude,
            longitude: property.longitude,
            thumbnail_url: property.thumbnail_url || null,
            property_image_url:
              property.thumbnail_url ||
              (Array.isArray(property.property_images)
                ? property.property_images[0]
                : null) ||
              property.property_image_url ||
              null,
            property_images: property.property_images || [],
            created_at: property.created_at,
            updated_at: property.updated_at,
            link: matchedMemorandum
              ? `/memorandum/${matchedMemorandum.id}`
              : undefined,
          } as PropertyCardData;
        },
      );

      setProperties(enrichedProperties);

      // Build markers
      const mapItems = mapRes?.data?.data ?? mapRes?.data ?? [];
      if (Array.isArray(mapItems) && mapItems.length > 0) {
        const derivedMapMarkers: Marker[] = mapItems
          .filter((p: any) => p.latitude && p.longitude)
          .map((p: any) => ({
            id: p.id,
            position: {
              lat: parseFloat(p.latitude),
              lng: parseFloat(p.longitude),
            },
            title: p.property_name,
            icon: MARKER_ICON,
            color: "red",
          }));
        setMarkers(derivedMapMarkers);
      } else {
        const derived: Marker[] = enrichedProperties
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
        setMarkers(derived);
      }
    } catch (err) {
      console.error("Failed to fetch properties", err);
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Execute loan request deletion (Postman: DELETE /api/v1/loans/requests/{{id}}/)
  const confirmDeleteLoanRequest = async () => {
    if (!deletingLoanRequest) return;

    try {
      setIsDeleting(true);
      await deleteLoanRequest(deletingLoanRequest.id);

      // Invalidate queries to refresh dashboard and requests
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["loan-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["sponsor-dashboard"] }),
      ]);

      toast.success("Loan request deleted successfully.");
      setDeletingLoanRequest(null);
    } catch (error) {
      console.error("Failed to delete loan request", error);
      toast.error("Failed to delete loan request. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Execute property deletion (DELETE /api/properties/{id}/)
  const confirmDeleteProperty = async () => {
    if (!deletingProperty) return;

    try {
      setIsDeleting(true);
      await api.delete(`/api/properties/${deletingProperty.id}/`);

      // Refresh properties list
      await fetchProperties();

      // Reset visible count if we deleted a property and visible count is now more than total
      setVisiblePropertyCount((prev) => {
        const newTotal = properties.length - 1;
        return prev > newTotal ? newTotal : prev;
      });

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

  const visibleProperties = properties.slice(0, visiblePropertyCount);
  const hasMoreProperties = properties.length > visiblePropertyCount;

  const handleShowMore = () => {
    setVisiblePropertyCount(prev => Math.min(prev + 6, properties.length));
  };

  const headerStats = dashboardData || {
    total_properties: properties.length,
    total_loan_requests: 0,
    quotes_received: 0,
    accepted_quotes: 0,
  };

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
        <StatsSkeleton />
      ) : (
        <div className="flex flex-wrap items-center justify-center xl:justify-start gap-5 lg:gap-7 xl:gap-10 my-8">
          <StatusCard
            type="Properties"
            data={{ value: headerStats.total_properties ?? properties.length }}
          />
          <StatusCard
            type="quotes"
            titleOverride="My Loan Requests"
            data={{ value: headerStats.total_loan_requests ?? 0 }}
          />
          <StatusCard
            type="documents"
            titleOverride="Quotes Received"
            data={{ value: headerStats.quotes_received ?? 0 }}
          />
          <StatusCard
            type="value"
            titleOverride="Accepted Quotes"
            data={{ value: headerStats.accepted_quotes ?? 0 }}
          />
        </div>
      )}

      {/* ── Active Loan Requests Section ── */}
      <div className="mb-10">
        <div className="rounded-xl bg-white p-4 lg:p-6 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-gray-900">
                  Active Loan Requests
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  {loanRequests.length}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Commercial loan requests submitted to lenders for quotes
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

          {requestsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 py-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : loanRequests.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-3">
                <LuDollarSign />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                No active loan requests yet
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                Submit terms for any of your properties to receive competitive loan quotes from our lender network.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedPropertyForLoan(null);
                  setIsCreateLoanModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
              >
                <FaPlus className="text-xs" />
                <span>Create Loan Request</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
              {loanRequests.map((req) => (
                <SponsorLoanRequestCard
                  key={req.id}
                  request={req}
                  onEdit={(item) => setEditingLoanRequest(item)}
                  onDelete={(item) => setDeletingLoanRequest(item)}
                  onViewQuotes={(item) => setSelectedQuotesRequest(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Google Map ── */}
      <div className="my-6">
        <GMAP markersList={markers} />
      </div>

      {/* ── Property Portfolio ── */}
      <div className="mb-10">
        <div className="rounded-xl bg-white p-4 lg:p-6 border border-[#0000001A]">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Property Portfolio
              </h2>
              <p className="text-sm text-[#6A7282]">
                Manage, view documents, and request loans for your properties
              </p>
            </div>
            <Link
              href="/processing"
              className="flex gap-2 button-primary rounded-full py-2 px-3 min-w-24 cursor-pointer justify-center items-center"
            >
              <FaPlus className="hidden md:flex text-xs" />
              <p className="text-xs sm:text-sm font-medium">Add Property</p>
            </Link>
          </div>

          <div className="my-6">
            {propertiesLoading ? (
              <PropertySkeleton />
            ) : properties.length === 0 ? (
              <div className="col-span-full text-center py-16 text-[#6A7282]">
                <p className="text-lg mb-2">No properties yet</p>
                <p className="text-sm">
                  Add your first property to get started.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {visibleProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      data={property}
                      onRequestLoan={() => {
                        setSelectedPropertyForLoan(property.id);
                        setIsCreateLoanModalOpen(true);
                      }}
                      onDelete={() => setDeletingProperty(property)}
                    />
                  ))}
                </div>

                {hasMoreProperties && (
                  <div className="flex justify-center pt-6">
                    <button
                      type="button"
                      onClick={handleShowMore}
                      className="button-outline rounded-full px-6 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Show More Properties ({properties.length - visiblePropertyCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Quotes Received (from /api/v1/loans/dashboard/sponsor/ quote_card_view) ── */}
      {dashboardData?.quote_card_view &&
        dashboardData.quote_card_view.length > 0 && (
          <div className="mb-10">
            <div className="rounded-xl bg-white p-4 lg:p-6 border border-gray-200">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Recent Lender Quotes Received
                  </h2>
                  <p className="text-sm text-gray-500">
                    Review and accept quotes from competitive commercial lenders
                  </p>
                </div>
                <Link
                  href="/loan"
                  className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  <span>View All Quotes ({dashboardData.quote_card_view.length})</span>
                  <LuArrowUpRight className="text-base" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.quote_card_view.slice(0, 3).map((quote: any) => (
                  <div
                    key={quote.id}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-900 text-sm">
                          {quote.lender_name || "Commercial Lender"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
                          {quote.status || "Active Quote"}
                        </span>
                      </div>
                      <div className="text-lg font-extrabold text-blue-600 mb-1">
                        ${Number(quote.loan_amount || 0).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>Rate: <b>{quote.interest_rate}%</b></span>
                        <span>Term: <b>{quote.term} mo</b></span>
                        <span>LTV: <b>{quote.max_as_is_ltv}%</b></span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                      <Link
                        href={`/loan/${quote.id}`}
                        className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <span>Inspect Quote</span>
                        <LuArrowUpRight className="text-xs" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* ── Create Loan Request Modal ── */}
      <CreateLoanRequestModal
        open={isCreateLoanModalOpen}
        onOpenChange={setIsCreateLoanModalOpen}
        properties={propertyOptions}
        preselectedPropertyId={selectedPropertyForLoan}
      />

      {/* ── Update Loan Request Modal ── */}
      <UpdateLoanRequestModal
        open={Boolean(editingLoanRequest)}
        onOpenChange={(open) => {
          if (!open) setEditingLoanRequest(null);
        }}
        loanRequest={editingLoanRequest}
      />

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmActionModal
        open={Boolean(deletingLoanRequest)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingLoanRequest(null);
        }}
        title="Delete loan request?"
        description={
          deletingLoanRequest
            ? `This will permanently delete the loan request of $${Number(
                deletingLoanRequest.requested_amount || 0,
              ).toLocaleString()} for "${deletingLoanRequest.property_name}".`
            : "This will permanently remove the selected loan request."
        }
        confirmText="Delete Request"
        destructive
        isLoading={isDeleting}
        onConfirm={confirmDeleteLoanRequest}
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

      {/* ── Loan Request Quotes Modal ── */}
      <LoanRequestQuotesModal
        open={Boolean(selectedQuotesRequest)}
        onOpenChange={(open) => {
          if (!open) setSelectedQuotesRequest(null);
        }}
        loanRequestId={selectedQuotesRequest?.id ?? null}
        loanRequest={selectedQuotesRequest}
      />
    </div>
  );
};

export default Page;
