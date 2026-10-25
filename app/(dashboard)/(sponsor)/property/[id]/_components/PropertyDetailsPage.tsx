"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Image from "next/image";
import {
  IoLocationOutline,
  IoChevronBack,
  IoMapOutline,
  IoDocumentTextOutline,
} from "react-icons/io5";
import {
  LuFileText,
  LuExternalLink,
} from "react-icons/lu";
import { toast } from "sonner";
import { fetchProperty } from "../../../_api/properties-api";
import type { PropertyResponse } from "../../../_api/properties-api";

// ── Component ────────────────────────────────────────────────────────────────

const FALLBACK_IMAGE = "/images/SponsorDashboard.png";

const PropertyDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id as string;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch property details
  const {
    data: property,
    isLoading,
    error,
  } = useQuery<PropertyResponse, Error>({
    queryKey: ["property", propertyId],
    queryFn: () => fetchProperty(Number(propertyId)),
    staleTime: 60 * 1000,
    enabled: !!propertyId && !isNaN(Number(propertyId)),
    retry: (failureCount, error) => {
      // Don't retry on 404, 403, or 401 errors
      const message = error?.message || "";
      if (
        message.includes("not found") ||
        message.includes("permission") ||
        message.includes("Authentication")
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const openInGoogleMaps = () => {
    if (property?.latitude && property?.longitude) {
      const url = `https://www.google.com/maps?q=${property.latitude},${property.longitude}`;
      window.open(url, "_blank");
    }
  };

  const getDirections = () => {
    if (property?.latitude && property?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`;
      window.open(url, "_blank");
    }
  };

  const handleViewMemorandum = () => {
    if (property?.memorandum_id) {
      router.push(`/memorandum/${property.memorandum_id}`);
    }
  };

  const handleDocumentOpen = (documentUrl: string) => {
    window.open(documentUrl, "_blank");
  };

  const getDocumentName = (doc: PropertyResponse["documents"][0]) => {
    // Try to extract filename from URL if name is not provided
    if (!doc.file_url) return `Document ${doc.id}`;
    
    try {
      const urlPath = doc.file_url.split("/").pop() || "";
      const fileName = decodeURIComponent(urlPath).split("?")[0].split("#")[0];
      return fileName || `Document ${doc.id}`;
    } catch {
      return `Document ${doc.id}`;
    }
  };

  // Property type colors
  const typePillColor: Record<string, string> = {
    Multifamily: "bg-blue-100 text-blue-700 border-blue-200",
    multifamily: "bg-blue-100 text-blue-700 border-blue-200",
    Commercial: "bg-emerald-100 text-emerald-700 border-emerald-200",
    commercial: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Retail: "bg-orange-100 text-orange-700 border-orange-200",
    retail: "bg-orange-100 text-orange-700 border-orange-200",
    Industrial: "bg-yellow-100 text-yellow-700 border-yellow-200",
    industrial: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Office: "bg-purple-100 text-purple-700 border-purple-200",
    office: "bg-purple-100 text-purple-700 border-purple-200",
    Mixed: "bg-teal-100 text-teal-700 border-teal-200",
    mixed: "bg-teal-100 text-teal-700 border-teal-200",
  };

  const pillColor =
    typePillColor[property?.property_type?.trim() || ""] ||
    "bg-gray-100 text-gray-700 border-gray-200";

  // Get all images
  const allImages = [
    property?.property_image_url,
    ...(property?.property_photos_urls || []),
  ].filter(Boolean) as string[];

  const displayImages = allImages.length > 0 ? allImages : [FALLBACK_IMAGE];
  const totalPhotos = displayImages.length;

  if (error) {
    const errorMessage = error?.message || "Failed to load property details";
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Property</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.back()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push("/memorandum")}
              className="w-full px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              View All Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb skeleton */}
          <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
          
          {/* Header skeleton */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-80 h-64 bg-gray-200 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-4">
                <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>

          {/* Facts skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg font-medium">Property not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <IoChevronBack className="text-base" />
            My properties
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">{property.property_name}</span>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Cover Image */}
              <div className="w-full lg:w-96 shrink-0">
                <div className="relative w-full h-64 lg:h-full rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={displayImages[selectedImageIndex] || FALLBACK_IMAGE}
                    alt={property.property_name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {totalPhotos > 1 && (
                    <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full">
                      {selectedImageIndex + 1} / {totalPhotos}
                    </div>
                  )}
                </div>
              </div>

              {/* Property Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Property Type Badge */}
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${pillColor}`}
                  >
                    {property.property_type}
                  </span>

                  {/* Property Name */}
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                    {property.property_name}
                  </h1>

                  {/* Address */}
                  <div className="flex items-start gap-2 text-gray-600">
                    <IoLocationOutline className="text-xl mt-1 shrink-0" />
                    <span className="text-base">{property.property_address}</span>
                  </div>

                  {/* View Memorandum Button */}
                  {property.memorandum_id ? (
                    <button
                      onClick={handleViewMemorandum}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors font-medium shadow-md"
                    >
                      <IoDocumentTextOutline className="text-xl" />
                      View memorandum
                      <LuExternalLink className="text-base" />
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-500 rounded-lg font-medium">
                      <IoDocumentTextOutline className="text-xl" />
                      No memorandum available
                    </div>
                  )}

                  <p className="text-sm text-gray-500">
                    {property.memorandum_id
                      ? "Opens the published memorandum page"
                      : "Create a memorandum for this property"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Facts */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Property facts</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {property.number_of_units !== undefined && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-600 mb-1 font-medium">Number of units</div>
                <div className="text-2xl font-bold text-gray-900">{property.number_of_units}</div>
              </div>
            )}

            {property.rentable_area && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-600 mb-1 font-medium">
                  Rentable area (sq.ft)
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {Number(property.rentable_area).toLocaleString()}
                </div>
              </div>
            )}

            {property.year_built && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-600 mb-1 font-medium">Year built</div>
                <div className="text-2xl font-bold text-gray-900">{property.year_built}</div>
              </div>
            )}

            {property.year_renovated && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-600 mb-1 font-medium">Year renovated</div>
                <div className="text-2xl font-bold text-gray-900">{property.year_renovated}</div>
              </div>
            )}

            {property.occupancy !== undefined && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-600 mb-1 font-medium">Occupancy</div>
                <div className="text-2xl font-bold text-gray-900">{property.occupancy}%</div>
              </div>
            )}

            {property.parking_spaces !== undefined && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-600 mb-1 font-medium">Parking spaces</div>
                <div className="text-2xl font-bold text-gray-900">{property.parking_spaces}</div>
              </div>
            )}
          </div>
        </div>

        {/* Photo Gallery */}
        {totalPhotos > 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Photo gallery</h2>
              <span className="text-sm text-gray-500">Showing {totalPhotos} photos</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {displayImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative aspect-video rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity ${
                    selectedImageIndex === index ? "ring-4 ring-blue-500" : ""
                  }`}
                >
                  <Image
                    src={image}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                    Photo{String(index + 1).padStart(2, "0")}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        {property.documents && property.documents.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Documents</h2>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-200">
              {property.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <LuFileText className="text-xl text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getDocumentName(doc)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Uploaded {formatDate(doc.uploaded_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDocumentOpen(doc.file_url)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Location</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Map Placeholder */}
            <div className="bg-gray-200 rounded-xl h-64 lg:h-80 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 opacity-50" />
              <div className="relative z-10 text-center">
                <IoMapOutline className="text-6xl text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">Map preview</p>
              </div>
              {property.latitude && property.longitude && (
                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                  <button
                    onClick={openInGoogleMaps}
                    className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors font-medium text-sm"
                  >
                    Open in Google Maps
                  </button>
                  <button
                    onClick={getDirections}
                    className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  >
                    Get directions
                  </button>
                </div>
              )}
            </div>

            {/* Location Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">Address</p>
                <p className="text-sm text-gray-900">{property.property_address}</p>
              </div>

              {property.latitude && property.longitude && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Latitude</p>
                      <p className="text-sm text-gray-900 font-mono">{property.latitude}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Longitude</p>
                      <p className="text-sm text-gray-900 font-mono">{property.longitude}</p>
                    </div>
                  </div>

                  {property.place_id && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Place ID</p>
                      <p className="text-xs text-gray-900 font-mono break-all bg-gray-50 p-2 rounded">
                        {property.place_id}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Dates */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-200">
          <span>Created {formatDate(property.created_at)}</span>
          <span>Last updated {formatDate(property.updated_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;
