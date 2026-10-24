"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import PropertyCard from "@/components/PropertyCard";
import StatusCard from "@/components/StatusCard";
import api from "@/lib/apiClient";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface Property {
  id: number;
  place_id?: string;
  property_name: string;
  property_address: string;
  property_type: string;
  latitude?: string;
  longitude?: string;
  property_image_url?: string | null;
  memorandum_id?: number | null;
  created_at: string;
  updated_at: string;
}

interface PropertiesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  page_size: number;
  results: Property[];
}

interface Memorandum {
  id: number;
  title: string;
  property: number;
  property_name: string;
  property_image_url?: string;
  thumbnail_url?: string;
  property_images?: string[];
  status: string;
  mode: string;
  created_at: string;
  updated_at?: string;
}

// ── API Fetchers ─────────────────────────────────────────────────────────────

async function fetchProperties(page: number = 1, pageSize: number = 9): Promise<PropertiesResponse> {
  try {
    const response = await api.get(`/api/properties/?page=${page}&page_size=${pageSize}`);
    
    const data = response?.data?.data ?? response?.data;
    
    return {
      count: data?.count || 0,
      next: data?.next || null,
      previous: data?.previous || null,
      total_pages: data?.total_pages || 1,
      current_page: data?.current_page || page,
      page_size: data?.page_size || pageSize,
      results: Array.isArray(data?.results) ? data.results : [],
    };
  } catch (error: any) {
    console.error("Failed to fetch properties:", error);
    toast.error(error?.response?.data?.message || "Failed to load properties");
    return {
      count: 0,
      next: null,
      previous: null,
      total_pages: 1,
      current_page: 1,
      page_size: pageSize,
      results: [],
    };
  }
}

async function fetchMemorandums(): Promise<Memorandum[]> {
  try {
    const response = await api.get("/api/memorandums/");
    const raw = response?.data?.data ?? response?.data?.results ?? response?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.results)) return raw.results;
    return [];
  } catch (err: any) {
    console.error("Failed to fetch memorandums:", err);
    return [];
  }
}

// ── Component ────────────────────────────────────────────────────────────────

const MemorandamPage = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // Fetch properties with pagination
  const {
    data: propertiesData,
    isLoading: propertiesLoading,
  } = useQuery({
    queryKey: ["properties", currentPage, pageSize],
    queryFn: () => fetchProperties(currentPage, pageSize),
    staleTime: 60 * 1000,
  });

  const properties = propertiesData?.results || [];

  // Fetch memorandums for statistics
  const {
    data: memorandums = [],
    isLoading: memorandumsLoading,
  } = useQuery<Memorandum[]>({
    queryKey: ["memorandums"],
    queryFn: fetchMemorandums,
    staleTime: 60 * 1000,
  });

  const memorandumStats = useMemo(() => {
    const stats = {
      total: memorandums.length,
      generating: 0,
      draft: 0,
      published: 0,
      previewMode: 0,
    };

    for (const item of memorandums) {
      const status = (item.status || "").toLowerCase();
      const mode = (item.mode || "").toLowerCase();

      if (status === "generating") stats.generating += 1;
      if (status === "draft" || status === "ready") stats.draft += 1;
      if (status === "published") stats.published += 1;
      if (mode === "preview") stats.previewMode += 1;
    }

    return stats;
  }, [memorandums]);

  // Build card data from properties
  const cardData = useMemo(
    () =>
      properties.map((property) => ({
        id: property.id,
        property: String(property.id),
        title: property.property_name,
        property_address: property.property_address,
        property_type: property.property_type,
        thumbnail_url: property.property_image_url,
        property_image_url: property.property_image_url,
        property_images: property.property_image_url ? [property.property_image_url] : [],
        latitude: property.latitude,
        longitude: property.longitude,
        created_at: property.created_at,
        updated_at: property.updated_at,
        location: property.property_address,
        status: property.memorandum_id ? "published" : "draft",
        link: `/property/${property.id}`,
        memorandum_id: property.memorandum_id,
      })),
    [properties],
  );

  const isLoading = propertiesLoading;

  const handleCardClick = (propertyId: number) => {
    router.push(`/property/${propertyId}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (propertiesData?.total_pages || 1)) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading) {
    return (
      <div className="">
        <h1 className="text-start text-lg md:text-2xl font-semibold py-2">
          Memorandums
        </h1>
        <p className="text-base text-start lg:text-lg md:text-lg text-[#4A5565]">
          Monitor your memorandums and related details below.
        </p>

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 2xl:gap-10 my-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 w-44 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-72 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <h1 className="text-start text-lg md:text-2xl font-semibold py-2">
        Memorandums
      </h1>
      <p className="text-base text-start lg:text-lg md:text-lg text-[#4A5565]">
        Monitor your memorandums and related details below.
      </p>

      <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 2xl:gap-10 my-10">
        <StatusCard
          type="Properties"
          titleOverride="Total Memorandums"
          statusLabelOverride="published"
          data={{
            value: memorandumStats.total,
            status: memorandumStats.published,
          }}
        />
        <StatusCard
          type="quotes"
          titleOverride="Generating"
          statusLabelOverride="currently running"
          data={{
            value: memorandumStats.generating,
            status: memorandumStats.generating,
          }}
        />
        <StatusCard
          type="documents"
          titleOverride="Draft"
          statusLabelOverride="ready to review"
          data={{ value: memorandumStats.draft, status: memorandumStats.draft }}
        />
        <StatusCard
          type="value"
          titleOverride="Published"
          statusLabelOverride="in preview mode"
          data={{
            value: memorandumStats.published,
            status: memorandumStats.previewMode,
          }}
        />
      </div>

      <div className="mb-10">
        {cardData.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5 place-items-center">
              {cardData.map((property) => (
                <div
                  key={property.id}
                  onClick={() => handleCardClick(property.id)}
                  className="cursor-pointer transition-transform hover:scale-[1.02] w-full"
                >
                  <PropertyCard
                    data={property}
                    size="large"
                  />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {propertiesData && propertiesData.total_pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!propertiesData.previous}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-600">
                  Page {propertiesData.current_page} of {propertiesData.total_pages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!propertiesData.next}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500 py-10">No properties available.</p>
        )}
      </div>
    </div>
  );
};

export default MemorandamPage;
