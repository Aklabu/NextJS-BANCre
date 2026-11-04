"use client";

import { useLoadScript } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import { type ReactNode } from "react";

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

type GoogleMapsProviderProps = {
  children: (isLoaded: boolean) => ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
};

/**
 * Google Maps Provider Component
 * 
 * Handles loading the Google Maps API once and provides loading state to children.
 * This prevents multiple LoadScript instances and fixes timing issues.
 */
export const GoogleMapsProvider = ({
  children,
  loadingFallback,
  errorFallback,
}: GoogleMapsProviderProps) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey,
    preventGoogleFontsLoading: false,
  });

  // Show error if API key is missing
  if (!googleMapsApiKey) {
    return (
      <>
        {errorFallback || (
          <div
            className="flex items-center justify-center bg-gray-50"
            style={{ height: "600px" }}
          >
            <div className="text-center max-w-md px-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Google Maps API Key Required
              </h3>
              <p className="text-sm text-gray-600">
                Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables to display the map.
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Show error if API loading failed
  if (loadError) {
    return (
      <>
        {errorFallback || (
          <div
            className="flex items-center justify-center bg-gray-50"
            style={{ height: "600px" }}
          >
            <div className="text-center max-w-md px-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to Load Map
              </h3>
              <p className="text-sm text-gray-600">
                Unable to load Google Maps. Please check your API key and try again.
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Show loading state
  if (!isLoaded) {
    return (
      <>
        {loadingFallback || (
          <div
            className="flex items-center justify-center bg-gray-100 animate-pulse"
            style={{ height: "600px" }}
          >
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-bounce" />
              <p className="text-lg text-gray-500">Loading map...</p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Map is loaded, render children
  return <>{children(isLoaded)}</>;
};

/**
 * Hook to check if Google Maps is available
 */
export const useGoogleMapsLoaded = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey,
    preventGoogleFontsLoading: false,
  });

  return {
    isLoaded,
    loadError,
    hasApiKey: !!googleMapsApiKey,
  };
};
