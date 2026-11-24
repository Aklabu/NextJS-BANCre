"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type PlacePrediction = {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
};

type PlacesAutocompleteProps = {
  apiKey: string;
  onPlaceSelect: (placeId: string, description: string) => void;
  placeholder?: string;
  className?: string;
};

/**
 * Custom Places Autocomplete using the new Places API
 * https://developers.google.com/maps/documentation/places/web-service/autocomplete
 */
export default function PlacesAutocomplete({
  apiKey,
  onPlaceSelect,
  placeholder = "Search for property address...",
  className = "",
}: PlacesAutocompleteProps) {
  const [input, setInput] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const sessionTokenRef = useRef<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate a new session token (for billing optimization)
  useEffect(() => {
    sessionTokenRef.current = generateUUID();
  }, []);

  // Fetch predictions from new Places API
  const fetchPredictions = useCallback(
    async (inputText: string) => {
      if (!inputText.trim()) {
        setPredictions([]);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setIsLoading(true);

        const response = await fetch(
          `https://places.googleapis.com/v1/places:autocomplete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
            },
            body: JSON.stringify({
              input: inputText,
              sessionToken: sessionTokenRef.current,
              languageCode: "en",
            }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Places API autocomplete error:", response.status, response.statusText, errorText);
          setPredictions([]);
          return;
        }

        const data = await response.json();

        // Map new API response to prediction format
        const suggestions: PlacePrediction[] = (data.suggestions || []).map(
          (suggestion: any) => ({
            place_id: suggestion.placePrediction?.placeId || "",
            description:
              suggestion.placePrediction?.text?.text ||
              suggestion.placePrediction?.structuredFormat?.mainText?.text ||
              "",
            structured_formatting: {
              main_text:
                suggestion.placePrediction?.structuredFormat?.mainText?.text ||
                "",
              secondary_text:
                suggestion.placePrediction?.structuredFormat?.secondaryText
                  ?.text || "",
            },
          })
        );

        setPredictions(suggestions);
        setShowDropdown(suggestions.length > 0);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch predictions:", error);
        }
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey]
  );

  // Debounced input handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim()) {
        fetchPredictions(input);
      } else {
        setPredictions([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [input, fetchPredictions]);

  // Handle place selection
  const handleSelectPlace = useCallback(
    (prediction: PlacePrediction) => {
      setInput(prediction.description);
      setShowDropdown(false);
      setPredictions([]);
      setSelectedIndex(-1);

      // Generate new session token after selection
      sessionTokenRef.current = generateUUID();

      onPlaceSelect(prediction.place_id, prediction.description);
    },
    [onPlaceSelect]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && predictions[selectedIndex]) {
          handleSelectPlace(predictions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (predictions.length > 0) setShowDropdown(true);
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {/* Predictions dropdown */}
      {showDropdown && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto"
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelectPlace(prediction)}
              className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? "bg-blue-50" : ""
              } ${index !== predictions.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {prediction.structured_formatting.main_text}
                  </div>
                  {prediction.structured_formatting.secondary_text && (
                    <div className="text-xs text-gray-500 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to generate UUID for session token
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
