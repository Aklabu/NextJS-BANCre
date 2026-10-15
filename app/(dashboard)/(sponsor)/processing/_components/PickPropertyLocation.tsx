"use client";

import React from "react";
import GMAP from "@/app/(dashboard)/_components/GMAP";
import Button from "@/components/Button";
import api from "@/lib/apiClient";
import { toast } from "sonner";
import type { PlaceData } from "./place-types";

type PickPropertyLocationProps = {
  id: number;
  title?: string;
  description?: string;
  setCurrentStep?: React.Dispatch<React.SetStateAction<number>>;
  setPlaceData: React.Dispatch<React.SetStateAction<PlaceData | null>>;
};

const PickPropertyLocation = ({
  id,
  title,
  description,
  setCurrentStep,
  setPlaceData,
}: PickPropertyLocationProps) => {
  const [selectedPlace, setSelectedPlace] = React.useState<PlaceData | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFetchingPlace, setIsFetchingPlace] = React.useState(false);

  const handlePlaceSelection = React.useCallback((place: PlaceData) => {
    setSelectedPlace(place);
    setIsFetchingPlace(false);
    
    if (place.photos && place.photos.length > 0) {
      toast.success(`Location selected with ${place.photos.length} image${place.photos.length > 1 ? 's' : ''} fetched.`);
    } else {
      toast.info("Location selected. No images available from Google Maps.");
    }
  }, []);

  const handleContinue = async () => {
    if (!selectedPlace) {
      toast.error("Please search for a location or select one from the map.");
      return;
    }

    if (!selectedPlace.place_id) {
      toast.error("Please choose a specific place from the search results.");
      return;
    }

    setIsSubmitting(true);

    // Show loading toast for AI enrichment
    const loadingToast = toast.loading("Enriching property data with AI...");

    try {
      const payload = {
        place_id: selectedPlace.place_id,
        name: selectedPlace.name,
        address: selectedPlace.address,
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
        photos: selectedPlace.photos || [],
        types: selectedPlace.types || [],
      };

      const response = await api.post("/api/properties/places/", payload);
      
      // Extract enriched data from API response
      const enrichedData = (response?.data?.data ?? response?.data ?? {}) as Record<
        string,
        unknown
      >;

      // Merge original place data with AI-enriched property data
      const mergedPlaceData: PlaceData = {
        // Core place identification
        place_id: String(enrichedData.place_id || selectedPlace.place_id || ""),
        name: String(enrichedData.name || selectedPlace.name || ""),
        address: String(enrichedData.address || selectedPlace.address || ""),
        lat: typeof enrichedData.lat === "number" 
          ? enrichedData.lat 
          : selectedPlace.lat,
        lng: typeof enrichedData.lng === "number" 
          ? enrichedData.lng 
          : selectedPlace.lng,
        photos: Array.isArray(enrichedData.photos) && enrichedData.photos.length > 0
          ? (enrichedData.photos as string[])
          : selectedPlace.photos,
        rating: typeof enrichedData.rating === "number" 
          ? enrichedData.rating 
          : selectedPlace.rating ?? null,
        types: enrichedData.types
          ? (enrichedData.types as string[] | string)
          : selectedPlace.types,
        
        // AI-enriched property fields (from Claude)
        property_name: enrichedData.property_name 
          ? String(enrichedData.property_name)
          : undefined,
        property_address: enrichedData.property_address 
          ? String(enrichedData.property_address)
          : undefined,
        property_type: enrichedData.property_type 
          ? String(enrichedData.property_type)
          : undefined,
        number_of_units: enrichedData.number_of_units !== null && enrichedData.number_of_units !== undefined
          ? (typeof enrichedData.number_of_units === 'number' || typeof enrichedData.number_of_units === 'string' 
              ? enrichedData.number_of_units 
              : undefined)
          : undefined,
        rentable_area: enrichedData.rentable_area !== null && enrichedData.rentable_area !== undefined
          ? (typeof enrichedData.rentable_area === 'number' || typeof enrichedData.rentable_area === 'string' 
              ? enrichedData.rentable_area 
              : undefined)
          : undefined,
        year_built: enrichedData.year_built !== null && enrichedData.year_built !== undefined
          ? (typeof enrichedData.year_built === 'number' || typeof enrichedData.year_built === 'string' 
              ? enrichedData.year_built 
              : undefined)
          : undefined,
        occupancy: enrichedData.occupancy !== null && enrichedData.occupancy !== undefined
          ? (typeof enrichedData.occupancy === 'number' || typeof enrichedData.occupancy === 'string' 
              ? enrichedData.occupancy 
              : undefined)
          : undefined,
        year_renovated: enrichedData.year_renovated !== null && enrichedData.year_renovated !== undefined
          ? (typeof enrichedData.year_renovated === 'number' || typeof enrichedData.year_renovated === 'string' 
              ? enrichedData.year_renovated 
              : undefined)
          : undefined,
        parking_spaces: enrichedData.parking_spaces !== null && enrichedData.parking_spaces !== undefined
          ? (typeof enrichedData.parking_spaces === 'number' || typeof enrichedData.parking_spaces === 'string' 
              ? enrichedData.parking_spaces 
              : undefined)
          : undefined,
      };

      setPlaceData(mergedPlaceData);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show success message
      const enrichedMessage = response?.data?.message || "Property data enriched successfully.";
      toast.success(enrichedMessage);
      
      setCurrentStep?.((prev) => prev + 1);
    } catch (error: unknown) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      const err = error as {
        response?: { 
          data?: { 
            message?: string; 
            errors?: unknown;
            statusCode?: number;
          }; 
          status?: number;
        };
      };
      
      const statusCode = err?.response?.status || err?.response?.data?.statusCode;
      const apiErrors = err?.response?.data?.errors;
      const message = err?.response?.data?.message;

      // Handle different error scenarios
      if (statusCode === 401) {
        toast.error("Authentication required. Please log in again.");
      } else if (statusCode === 400) {
        // Validation errors
        if (apiErrors && typeof apiErrors === 'object') {
          const errorMessages = Object.entries(apiErrors).map(([field, msgs]) => {
            if (Array.isArray(msgs)) {
              return `${field}: ${msgs.join(', ')}`;
            }
            return `${field}: ${JSON.stringify(msgs)}`;
          }).join('; ');
          toast.error(`Validation error: ${errorMessages}`);
        } else {
          toast.error(message || "Invalid place data provided.");
        }
      } else if (statusCode === 500) {
        // AI enrichment failed
        toast.error(message || "Failed to enrich property data. Please try again.");
      } else {
        // Generic error
        toast.error(message || "Unable to process this location. Please try again.");
      }

      console.error("Place API error:", err?.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mt-6 rounded-2xl border border-[#99A1AF] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">
          Select Property Address
        </h2>
        <p className="mt-1 text-sm text-[#4A5565]">
          Search for the property address or click the map to pin the location. 
          We&apos;ll automatically fetch up to 6 property images from Google Maps.
        </p>

        <GMAP 
          onPlaceSelect={(place) => {
            console.log("Details from map:", place);
            handlePlaceSelection(place);
          }} 
          onLocationSelect={() => setIsFetchingPlace(true)}
        />

        {isFetchingPlace && !selectedPlace && (
          <div className="mt-5 rounded-xl border border-[#DDE3EA] bg-[#F8FAFC] p-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <p className="text-sm text-[#4A5565]">
                Fetching location details and images...
              </p>
            </div>
          </div>
        )}

        {selectedPlace ? (
          <div className="mt-5 rounded-xl border border-[#DDE3EA] bg-[#F8FAFC] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6A7282]">
              Selected address
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {selectedPlace.name || "Unnamed place"}
            </p>
            <p className="mt-1 text-sm text-[#4A5565]">
              {selectedPlace.address || "No address available"}
            </p>
            <p className="mt-2 text-xs text-[#6A7282]">
              {selectedPlace.lat.toFixed(6)}, {selectedPlace.lng.toFixed(6)}
            </p>
            
            {selectedPlace.photos && selectedPlace.photos.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6A7282] mb-2">
                  Fetched Images ({selectedPlace.photos.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedPlace.photos.slice(0, 6).map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F9FAFB]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={`${selectedPlace.name} - Photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end border-t border-[#E5E7EB] pt-5">
          <Button
            text={isSubmitting ? "Processing with AI..." : "Continue & Enrich Data"}
            onClick={handleContinue}
            isDisabled={isSubmitting || !selectedPlace}
            arrow={!isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default PickPropertyLocation;

