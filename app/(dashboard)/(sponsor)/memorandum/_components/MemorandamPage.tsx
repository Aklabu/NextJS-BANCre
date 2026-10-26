"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import PropertyCard from "@/components/PropertyCard";
import StatusCard from "@/components/StatusCard";
import ConfirmActionModal from "@/components/ConfirmActionModal";
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
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // State for delete confirmation
  const [deletingProperty, setDeletingProperty] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      totalProperties: properties.length,
      total: memorandums.length,
      draft: 0,
      published: 0,
    };

    for (const item of memorandums) {
      const status = (item.status || "").toLowerCase();

      if (status === "draft" || status === "ready") stats.draft += 1;
      if (status === "published") stats.published += 1;
    }

    return stats;
  }, [memorandums, properties]);

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

  const handleDeleteProperty = async () => {
    if (!deletingProperty) return;

    try {
      setIsDeleting(true);
      const response = await api.delete(`/api/properties/${deletingProperty.id}/`);
      
      // Check for success response
      const data = response?.data;
      if (data?.success || data?.statusCode === 200) {
        toast.success(data?.message || "Property deleted successfully");
      } else {
        toast.success("Property deleted successfully");
      }
      
      setDeletingProperty(null);
      
      // Refresh the properties and memorandums list
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
        queryClient.invalidateQueries({ queryKey: ["memorandums"] }),
      ]);
      
      setCurrentPage(1); // Reset to first page after deletion
    } catch (error: any) {
      console.error("Failed to delete property:", error);
      
      const status = error?.response?.status;
      const data = error?.response?.data;
      
      let errorMessage = "Failed to delete property. Please try again.";
      
      // Handle specific error responses
      if (status === 404) {
        errorMessage = "Property not found.";
      } else if (status === 403) {
        errorMessage = data?.message || "You do not have permission to delete this property.";
      } else if (status === 401) {
        if (data?.code === "token_not_valid") {
          errorMessage = "Your session has expired. Please log in again.";
        } else {
          errorMessage = data?.detail || "Authentication required. Please log in.";
        }
      } else if (data?.message) {
        errorMessage = data.message;
      } else if (data?.detail) {
        errorMessage = data.detail;
      } else if (data?.errors) {
        errorMessage = Object.values(data.errors).flat().join(", ");
      }
      
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-gray-100 animate-pulse" />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-600">Total Properties</p>
            <span className="text-gray-400">📊</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900 mb-2">{memorandumStats.totalProperties}</p>
          <p className="text-xs text-gray-500">active listings</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-600">Total Memorandums</p>
            <span className="text-gray-400">📄</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900 mb-2">{memorandumStats.total}</p>
          <p className="text-xs text-gray-500">All processed</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-600">Draft</p>
            <span className="text-gray-400">⏰</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900 mb-2">{memorandumStats.draft}</p>
          <p className="text-xs text-gray-500">{memorandumStats.draft} ready to review</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-600">Published</p>
            <span className="text-gray-400">📈</span>
          </div>
          <p className="text-3xl font-semibold text-gray-900 mb-2">{memorandumStats.published}</p>
          <p className="text-xs text-gray-500">live</p>
        </div>
      </div>

      <div className="mb-10">
        {/* Section Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">My Properties</h2>
            <p className="text-sm text-gray-600">Properties with AI generated memorandum</p>
          </div>
          <button
            onClick={() => router.push('/processing')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
          >
            <span className="text-lg">+</span>
            <span>Add Property</span>
          </button>
        </div>

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
                    onDelete={() => setDeletingProperty(property)}
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

      {/* Delete Property Confirmation Modal */}
      <ConfirmActionModal
        open={Boolean(deletingProperty)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingProperty(null);
        }}
        title="Delete property?"
        description={
          deletingProperty
            ? `Deleting the property means all the property info with AI generated memorandum will also be deleted. This action cannot be undone.`
            : "This will permanently remove the selected property and its memorandum."
        }
        confirmText="Delete Property"
        destructive
        isLoading={isDeleting}
        onConfirm={handleDeleteProperty}
      />
    </div>
  );
};

export default MemorandamPage;
