'use client'
import { memo, useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, Autocomplete, StreetViewPanorama } from '@react-google-maps/api';
import type { PlaceData } from "@/app/(dashboard)/(sponsor)/processing/_components/place-types";

const LIBRARIES: ("places" | "geometry" | "drawing")[] = ['places', 'geometry', 'drawing'];
type MapViewMode = "roadmap" | "satellite" | "streetview";

type Marker = {
    id: number | string;
    position: { lat: number; lng: number };
    title: string;
    color: string;
    icon?: string;
};

type GMAPProps = {
    markersList?: Marker[];
    // Callback to send coordinates to the parent/backend
    onLocationSelect?: (coords: { lat: number; lng: number }) => void;
    onPlaceSelect?: (place: PlaceData) => void;
}

const GMAP = ({ markersList, onLocationSelect, onPlaceSelect }: GMAPProps) => {
    const apiKey =
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
        process.env.NEXT_PUBLIC_MAP_API_KEY;

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey || "",
        libraries: LIBRARIES,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const streetViewRef = useRef<HTMLDivElement | null>(null);
    const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);

    // State to show a "temporary" pin when the user clicks
    const [tempMarker, setTempMarker] = useState<google.maps.LatLngLiteral | null>(null);
    const [mapViewMode, setMapViewMode] = useState<MapViewMode>("satellite");
    const [streetViewAvailable, setStreetViewAvailable] = useState<boolean>(true);

    const [center, setCenter] = useState<google.maps.LatLngLiteral>({
        lat: 40.7128, // Default to New York
        lng: -74.0060
    });

    const mapOptions = useMemo<google.maps.MapOptions>(() => ({
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        rotateControl: false,
        zoomControl: false,
        gestureHandling: 'greedy'
    }), []);

    const extractLocationData = useCallback((place: google.maps.places.PlaceResult): PlaceData | null => {
        const location = place.geometry?.location;

        if (!location) {
            return null;
        }

        return {
            place_id: place.place_id || "",
            name: place.name || "",
            address: place.formatted_address || place.vicinity || "",
            lat: location.lat(),
            lng: location.lng(),
            types: place.types || [],
            rating: place.rating ?? null,
            photos: place.photos?.slice(0, 6).map((photo) => photo.getUrl({ maxWidth: 1200, maxHeight: 1200 })) || []
        };
    }, []);

    const handlePlaceData = useCallback((label: string, place: google.maps.places.PlaceResult) => {
        const extractedLocation = extractLocationData(place);

        if (extractedLocation) {
            console.log(label, extractedLocation);
            onPlaceSelect?.(extractedLocation);
        }
    }, [extractLocationData, onPlaceSelect]);

    const fetchPinnedPlaceDetails = useCallback((coords: google.maps.LatLngLiteral) => {
        if (!map || !window.google?.maps) {
            return;
        }

        const geocoder = new window.google.maps.Geocoder();

        geocoder.geocode({ location: coords }, (results, status) => {
            const firstResult = results?.[0];

            if (status !== "OK" || !firstResult?.place_id) {
                console.log("Pinned location data", {
                    place_id: "",
                    name: "",
                    address: "",
                    lat: coords.lat,
                    lng: coords.lng,
                    types: [],
                    rating: null,
                    photos: []
                });
                onPlaceSelect?.({
                    place_id: "",
                    name: "",
                    address: "",
                    lat: coords.lat,
                    lng: coords.lng,
                    types: [],
                    rating: null,
                    photos: []
                });
                return;
            }

            const placesService = new window.google.maps.places.PlacesService(map);

            placesService.getDetails(
                {
                    placeId: firstResult.place_id,
                    fields: ["place_id", "name", "formatted_address", "geometry", "types", "rating", "photos"]
                },
                (place, detailsStatus) => {
                    if (detailsStatus === window.google.maps.places.PlacesServiceStatus.OK && place) {
                        handlePlaceData("Pinned location data", place);
                        return;
                    }

                    const fallbackPlace = {
                        place_id: firstResult.place_id,
                        name: firstResult.formatted_address || "",
                        address: firstResult.formatted_address || "",
                        lat: coords.lat,
                        lng: coords.lng,
                        types: firstResult.types || [],
                        rating: null,
                        photos: []
                    };

                    console.log("Pinned location data", fallbackPlace);
                    onPlaceSelect?.(fallbackPlace);
                }
            );
        });
    }, [handlePlaceData, map, onPlaceSelect]);

    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            const coords = { lat, lng };

            setTempMarker(coords); // Show visual feedback
            fetchPinnedPlaceDetails(coords);

            if (onLocationSelect) {
                onLocationSelect(coords); // Send to backend/parent
            }
        }
    }, [fetchPinnedPlaceDetails, onLocationSelect]);

    const onPlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            const location = place.geometry?.location;

            if (location) {
                const newPos = { lat: location.lat(), lng: location.lng() };
                setCenter(newPos);
                setTempMarker(newPos); // Pin the searched location too
                map?.panTo(newPos);
                map?.setZoom(17);

                if (onLocationSelect) onLocationSelect(newPos);

                handlePlaceData("Searched location data", place);
            }
        }
    };

    // Initialize Street View when needed
    useEffect(() => {
        if (mapViewMode === 'streetview' && streetViewRef.current && isLoaded && window.google) {
            const position = tempMarker || center;
            
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                if (!streetViewRef.current) return;
                
                // Check if Street View is available at this location
                const streetViewService = new window.google.maps.StreetViewService();
                streetViewService.getPanorama(
                    { location: position, radius: 100 },
                    (data, status) => {
                        if (status === window.google.maps.StreetViewStatus.OK && data?.location?.latLng) {
                            setStreetViewAvailable(true);
                            
                            // Always create a new panorama instance
                            if (streetViewRef.current) {
                                const panorama = new window.google.maps.StreetViewPanorama(
                                    streetViewRef.current,
                                    {
                                        position: data.location.latLng,
                                        pov: { heading: 0, pitch: 0 },
                                        zoom: 1,
                                        addressControl: true,
                                        linksControl: true,
                                        panControl: true,
                                        enableCloseButton: false,
                                        fullscreenControl: true,
                                        motionTracking: true,
                                        motionTrackingControl: true,
                                    }
                                );
                                panoramaRef.current = panorama;
                            }
                        } else {
                            setStreetViewAvailable(false);
                        }
                    }
                );
            }, 100);
            
            return () => clearTimeout(timer);
        }
        
        // Cleanup when switching away from street view
        if (mapViewMode !== 'streetview' && panoramaRef.current) {
            panoramaRef.current = null;
        }
    }, [mapViewMode, tempMarker, center, isLoaded]);

    if (loadError) {
        return (
            <div className="my-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                Failed to load Google Maps. Please check your API key or network connection.
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="my-5 flex items-center gap-3 rounded-xl border border-[#DDE3EA] bg-[#F8FAFC] p-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <p className="text-sm text-[#4A5565]">Loading map...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="my-5 w-full max-w-md">
                <Autocomplete
                    onLoad={(auto) => {
                        auto.setFields(["place_id", "name", "formatted_address", "geometry", "types", "rating", "photos"]);
                        autocompleteRef.current = auto;
                    }}
                    onPlaceChanged={onPlaceChanged}
                >
                    <input
                        type="text"
                        placeholder="Search for property address..."
                        className="w-full h-12 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black shadow-sm"
                    />
                </Autocomplete>
            </div>

            <div className="relative w-full">
                <div className="absolute right-3 top-3 z-10 flex overflow-hidden rounded-lg border border-white/70 bg-white shadow-sm">
                    {[
                        { label: "2D Map", value: "roadmap" as const },
                        { label: "Satellite", value: "satellite" as const },
                        { label: "Street View (360°)", value: "streetview" as const },
                    ].map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setMapViewMode(option.value)}
                            className={`px-3 py-2 text-xs font-semibold transition-colors ${
                                mapViewMode === option.value
                                    ? "bg-primary text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Street View Container */}
                {mapViewMode === 'streetview' && (
                    <div className="relative">
                        <div 
                            ref={streetViewRef}
                            className="h-[400px] xl:h-[600px] rounded-xl shadow-inner bg-gray-900"
                            style={{ width: '100%', overflow: 'hidden' }}
                        />
                        {!streetViewAvailable && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl z-10">
                                <div className="text-center p-6">
                                    <svg 
                                        className="mx-auto h-12 w-12 text-gray-400 mb-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path 
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <p className="text-gray-600 font-medium">Street View not available</p>
                                    <p className="text-gray-500 text-sm mt-1">Try selecting a different location on the map</p>
                                    <button
                                        onClick={() => setMapViewMode('satellite')}
                                        className="mt-4 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        Return to Map View
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Map Container */}
                {mapViewMode !== 'streetview' && (
                    <GoogleMap
                        mapContainerStyle={{ width: "100%" }}
                        mapContainerClassName='h-[400px] xl:h-[600px] rounded-xl shadow-inner'
                        center={center}
                        zoom={12}
                        mapTypeId={mapViewMode}
                        options={mapOptions}
                        onLoad={(inst) => setMap(inst)}
                        onClick={onMapClick}
                    >
                        {/* Render existing markers from backend */}
                        {markersList?.map((marker) => (
                            <OverlayView
                                key={marker.id}
                                position={marker.position}
                                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                            >
                                <div style={{ backgroundColor: marker.color, width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                </div>
                            </OverlayView>
                        ))}

                        {/* Render the temporary pin */}
                        {tempMarker && (
                            <OverlayView
                                position={tempMarker}
                                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                            >
                                <div style={{
                                    position: 'relative',
                                    width: '30px',
                                    height: '30px',
                                    backgroundColor: '#EF4444',
                                    borderRadius: '50% 50% 50% 0',
                                    transform: 'translate(-50%, -100%) rotate(-45deg)',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                    border: '2px solid white',
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        width: '12px',
                                        height: '12px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                    }} />
                                </div>
                            </OverlayView>
                        )}
                    </GoogleMap>
                )}
            </div>
        </div>
    );
};

export default memo(GMAP);
