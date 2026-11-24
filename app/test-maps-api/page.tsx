"use client";

/**
 * Google Maps API Diagnostic Page
 * Visit: http://localhost:3000/test-maps-api
 * 
 * This page tests if your Google Maps API key has:
 * 1. Maps JavaScript API enabled
 * 2. Places API enabled
 * 3. Proper billing setup
 */

import { useEffect, useState } from "react";

export default function TestMapsAPI() {
  const [status, setStatus] = useState<{
    apiKey: string;
    mapsApiLoaded: boolean;
    placesApiLoaded: boolean;
    error: string | null;
    testResult: string | null;
  }>({
    apiKey: "",
    mapsApiLoaded: false,
    placesApiLoaded: false,
    error: null,
    testResult: null,
  });

  useEffect(() => {
    const apiKey =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_MAP_API_KEY ||
      "";

    setStatus((prev) => ({ ...prev, apiKey }));

    if (!apiKey) {
      setStatus((prev) => ({
        ...prev,
        error: "No API key found in environment variables",
      }));
      return;
    }

    // Load Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setStatus((prev) => ({ ...prev, mapsApiLoaded: true }));

      // Test Places API
      if (window.google && window.google.maps && window.google.maps.places) {
        setStatus((prev) => ({ ...prev, placesApiLoaded: true }));

        // Try to create an AutocompleteService
        try {
          const service = new google.maps.places.AutocompleteService();
          
          service.getPlacePredictions(
            {
              input: "New York",
              types: ["geocode"],
            },
            (predictions, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK) {
                setStatus((prev) => ({
                  ...prev,
                  testResult: `✅ Places API working! Found ${predictions?.length || 0} predictions for "New York"`,
                }));
              } else {
                setStatus((prev) => ({
                  ...prev,
                  error: `Places API test failed with status: ${status}`,
                  testResult: null,
                }));
              }
            }
          );
        } catch (error) {
          setStatus((prev) => ({
            ...prev,
            error: `Places API error: ${error instanceof Error ? error.message : String(error)}`,
          }));
        }
      } else {
        setStatus((prev) => ({
          ...prev,
          error: "Places library not loaded properly",
        }));
      }
    };

    script.onerror = () => {
      setStatus((prev) => ({
        ...prev,
        error: "Failed to load Google Maps script",
      }));
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Google Maps API Diagnostic</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          {/* API Key */}
          <div>
            <h2 className="text-lg font-semibold mb-2">API Key Status</h2>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
              {status.apiKey ? (
                <>
                  <span className="text-green-600">✓</span> Found:{" "}
                  {status.apiKey.slice(0, 20)}...
                </>
              ) : (
                <span className="text-red-600">✗ No API key found</span>
              )}
            </div>
          </div>

          {/* Maps API Status */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Maps JavaScript API</h2>
            <div
              className={`p-3 rounded ${
                status.mapsApiLoaded
                  ? "bg-green-50 text-green-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {status.mapsApiLoaded ? (
                <><span className="font-bold">✓</span> Loaded successfully</>
              ) : (
                <><span className="font-bold">⏳</span> Loading...</>
              )}
            </div>
          </div>

          {/* Places API Status */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Places API</h2>
            <div
              className={`p-3 rounded ${
                status.placesApiLoaded
                  ? "bg-green-50 text-green-700"
                  : status.mapsApiLoaded
                  ? "bg-red-50 text-red-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {status.placesApiLoaded ? (
                <><span className="font-bold">✓</span> Loaded successfully</>
              ) : status.mapsApiLoaded ? (
                <><span className="font-bold">✗</span> Not loaded</>
              ) : (
                <><span className="font-bold">⏳</span> Waiting for Maps API...</>
              )}
            </div>
          </div>

          {/* Test Result */}
          {status.testResult && (
            <div>
              <h2 className="text-lg font-semibold mb-2">API Test Result</h2>
              <div className="bg-green-50 text-green-700 p-3 rounded">
                {status.testResult}
              </div>
            </div>
          )}

          {/* Error */}
          {status.error && (
            <div>
              <h2 className="text-lg font-semibold mb-2 text-red-600">Error</h2>
              <div className="bg-red-50 text-red-700 p-3 rounded">
                <p className="font-semibold mb-2">{status.error}</p>
                <div className="text-sm mt-3 space-y-1">
                  <p className="font-semibold">Common fixes:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Enable Places API in Google Cloud Console</li>
                    <li>Enable billing for your project</li>
                    <li>Add localhost:3000 to API key restrictions</li>
                    <li>Check API key has both Maps JavaScript API and Places API enabled</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Help Links */}
          <div className="border-t pt-4 mt-4">
            <h2 className="text-lg font-semibold mb-2">Helpful Links</h2>
            <ul className="space-y-2 text-sm text-blue-600">
              <li>
                <a
                  href="https://console.cloud.google.com/google/maps-apis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800"
                >
                  → Google Cloud Console - Maps APIs
                </a>
              </li>
              <li>
                <a
                  href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800"
                >
                  → Enable Places API
                </a>
              </li>
              <li>
                <a
                  href="https://console.cloud.google.com/billing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800"
                >
                  → Enable Billing
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
