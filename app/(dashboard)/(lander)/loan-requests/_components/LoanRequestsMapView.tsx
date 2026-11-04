"use client";

import { useState } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import Image from "next/image";
import { GoogleMapsProvider } from "@/lib/googleMapsLoader";
import { LoanRequest } from "./types";

type LoanRequestsMapViewProps = {
  requests: LoanRequest[];
  onViewRequest: (id: number) => void;
  loading?: boolean;
};

const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

const defaultCenter = {
  lat: 34.0522,
  lng: -118.2437,
};

const mapOptions = {
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: false,
  fullscreenControl: true,
};

const MapContent = ({
  requests,
  onViewRequest,
}: {
  requests: LoanRequest[];
  onViewRequest: (id: number) => void;
}) => {
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");

  return (
    <>
      {/* Map Type Toggle - Overlaid on Map */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={() => setMapType("roadmap")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-md ${
            mapType === "roadmap"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          2D
        </button>
        <button
          onClick={() => setMapType("satellite")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-md ${
            mapType === "satellite"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Satellite
        </button>
        <button
          className="px-4 py-2 text-sm font-medium bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-md"
        >
          Street view
        </button>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={11}
        options={{
          ...mapOptions,
          mapTypeId: mapType,
        }}
      >
        {requests.map((request) => (
          <Marker
            key={request.id}
            position={request.location}
            onClick={() => setSelectedRequest(request)}
          />
        ))}

        {selectedRequest && (
          <InfoWindow
            position={selectedRequest.location}
            onCloseClick={() => setSelectedRequest(null)}
          >
            <div className="p-2 max-w-xs">
              {/* Property Photo */}
              <div className="relative h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  Property photo
                </div>
                {selectedRequest.propertyImage && (
                  <Image
                    src={selectedRequest.propertyImage}
                    alt={selectedRequest.propertyName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>

              <h3 className="font-semibold text-gray-900 mb-1">
                {selectedRequest.propertyName}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {selectedRequest.address}
              </p>
              <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded mb-3">
                {selectedRequest.propertyType}
              </span>

              <button
                onClick={() => onViewRequest(selectedRequest.id)}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View loan request
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </>
  );
};

const LoanRequestsMapView = ({
  requests,
  onViewRequest,
  loading = false,
}: LoanRequestsMapViewProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Map view (shown when the Map toggle is selected)
        </p>
      </div>

      {/* Map Container */}
      <div className="relative">
        {loading ? (
          <div
            className="flex items-center justify-center bg-gray-100 animate-pulse"
            style={{ height: "600px" }}
          >
            <div className="text-center">
              <p className="text-lg text-gray-500">Loading map...</p>
            </div>
          </div>
        ) : (
          <GoogleMapsProvider>
            {(isLoaded) => isLoaded && <MapContent requests={requests} onViewRequest={onViewRequest} />}
          </GoogleMapsProvider>
        )}
      </div>
    </div>
  );
};

export default LoanRequestsMapView;
