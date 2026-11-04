"use client";

import { useState, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { MapPin, Building2, Navigation } from "lucide-react";
import { GoogleMapsProvider } from "@/lib/googleMapsLoader";
import type { PropertyMapItem } from "../api";

type PropertiesMapProps = {
  properties: PropertyMapItem[];
  loading?: boolean;
};

const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

const defaultCenter = {
  lat: 36.7783,
  lng: -119.4179, // California center
};

const mapOptions = {
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

type PropertyMarker = {
  id: number;
  position: { lat: number; lng: number };
  property: PropertyMapItem;
};

const MapContent = ({ properties }: { properties: PropertyMapItem[] }) => {
  const [selectedProperty, setSelectedProperty] = useState<PropertyMapItem | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(6);

  // Convert properties to markers
  const markers: PropertyMarker[] = properties
    .map((property) => {
      const lat = parseFloat(property.latitude);
      const lng = parseFloat(property.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return null;
      }

      return {
        id: property.id,
        position: { lat, lng },
        property,
      };
    })
    .filter((marker): marker is PropertyMarker => marker !== null);

  // Calculate map center based on properties
  const calculateCenter = () => {
    if (markers.length === 0) return defaultCenter;

    const avgLat = markers.reduce((sum, m) => sum + m.position.lat, 0) / markers.length;
    const avgLng = markers.reduce((sum, m) => sum + m.position.lng, 0) / markers.length;

    return { lat: avgLat, lng: avgLng };
  };

  const handleRecenter = () => {
    const center = calculateCenter();
    setMapCenter(center);
    setMapZoom(markers.length === 1 ? 12 : 8);
  };

  // Set initial center when markers change
  useEffect(() => {
    if (markers.length > 0) {
      const avgLat = markers.reduce((sum, m) => sum + m.position.lat, 0) / markers.length;
      const avgLng = markers.reduce((sum, m) => sum + m.position.lng, 0) / markers.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
      setMapZoom(markers.length === 1 ? 12 : 8);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers.length]);

  if (markers.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50"
        style={{ height: "600px" }}
      >
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Properties Available
          </h3>
          <p className="text-sm text-gray-600">
            Properties with active loan requests will appear on this map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Map Type Toggle - Overlaid on Map */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 shadow-lg">
        <button
          onClick={() => setMapType("roadmap")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            mapType === "roadmap"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Map View
        </button>
        <button
          onClick={() => setMapType("satellite")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            mapType === "satellite"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Satellite
        </button>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={mapZoom}
        options={{
          ...mapOptions,
          mapTypeId: mapType,
        }}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            onClick={() => setSelectedProperty(marker.property)}
            icon={{
              path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
              scale: 10,
              fillColor: "#2563eb",
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }}
          />
        ))}

        {selectedProperty && (
          <InfoWindow
            position={{
              lat: parseFloat(selectedProperty.latitude),
              lng: parseFloat(selectedProperty.longitude),
            }}
            onCloseClick={() => setSelectedProperty(null)}
          >
            <div className="p-3 max-w-xs">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {selectedProperty.property_name}
                  </h3>
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    {selectedProperty.property_type}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="line-clamp-2">{selectedProperty.property_address}</p>
              </div>

              <button
                onClick={() => {
                  window.location.href = `/loan-requests?property=${selectedProperty.id}`;
                }}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </>
  );
};

const PropertiesMap = ({ properties, loading }: PropertiesMapProps) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div
          className="flex items-center justify-center bg-gray-100 animate-pulse"
          style={{ height: "600px" }}
        >
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-lg text-gray-500">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Properties Map
            </h2>
            <p className="text-sm text-gray-600">
              {properties.length} {properties.length === 1 ? "property" : "properties"} with active loan requests
            </p>
          </div>

          <button
            onClick={() => {
              // Trigger recenter through a custom event or ref
              window.dispatchEvent(new CustomEvent('recenter-map'));
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Re-center Map
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <GoogleMapsProvider>
          {(isLoaded) => isLoaded && <MapContent properties={properties} />}
        </GoogleMapsProvider>
      </div>
    </div>
  );
};

export default PropertiesMap;
