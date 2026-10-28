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
    const [mapViewMode, setMapViewMode] = useState<MapViewMode>("roadmap");
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
        if (mapViewMode === 'streetview' && isLoaded && window.google) {
            // Wait for the ref to be ready
            const initStreetView = () => {
                if (!streetViewRef.current) {
                    console.error('Street View container ref not ready');
                    return;
                }

                const position = tempMarker || center;
                console.log('Initializing Street View at position:', position);
                
                // Check if Street View is available at this location
                const streetViewService = new window.google.maps.StreetViewService();
                
                streetViewService.getPanorama(
                    { 
                        location: position, 
                        radius: 100,
                        source: window.google.maps.StreetViewSource.OUTDOOR
                    },
                    (data, status) => {
                        console.log('Street View status:', status, data);
                        
                        if (status === window.google.maps.StreetViewStatus.OK && data?.location?.latLng) {
                            setStreetViewAvailable(true);
                            
                            // Create panorama instance
                            if (streetViewRef.current) {
                                try {
                                    const panorama = new window.google.maps.StreetViewPanorama(
                                        streetViewRef.current,
                                        {
                                            position: data.location.latLng,
                                            pov: { 
                                                heading: 0, 
                                                pitch: 0 
                                            },
                                            zoom: 1,
                                            addressControl: true,
                                            linksControl: true,
                                            panControl: true,
                                            enableCloseButton: false,
                                            fullscreenControl: true,
                                            motionTracking: true,
                                            motionTrackingControl: true,
                                            showRoadLabels: true,
                                            visible: true,
                                        }
                                    );
                                    
                                    panoramaRef.current = panorama;
                                    console.log('Street View panorama created successfully');
                                    
                                    // Add error listener
                                    panorama.addListener('status_changed', () => {
                                        const currentStatus = panorama.getStatus();
                                        console.log('Panorama status changed:', currentStatus);
                                        if (currentStatus !== window.google.maps.StreetViewStatus.OK) {
                                            setStreetViewAvailable(false);
                                        }
                                    });
                                    
                                    // Force a position change to trigger rendering
                                    setTimeout(() => {
                                        if (panoramaRef.current && data.location?.latLng) {
                                            panoramaRef.current.setPosition(data.location.latLng);
                                        }
                                    }, 100);
                                    
                                } catch (error) {
                                    console.error('Error creating Street View panorama:', error);
                                    setStreetViewAvailable(false);
                                }
                            }
                        } else {
                            console.warn('Street View not available at this location:', status);
                            setStreetViewAvailable(false);
                        }
                    }
                );
            };

            // Small delay to ensure DOM is ready
            const timer = setTimeout(initStreetView, 50);
            
            return () => {
                clearTimeout(timer);
                // Cleanup panorama instance
                if (panoramaRef.current) {
                    console.log('Cleaning up Street View panorama');
                    panoramaRef.current = null;
                }
            };
        }
        
        // Reset availability when switching away from street view
        if (mapViewMode !== 'streetview') {
            setStreetViewAvailable(true);
            if (panoramaRef.current) {
                panoramaRef.current = null;
            }
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
        <div className="my-5">
            <div className="relative w-full">
                {/* Search box overlay - positioned at top left */}
                <div className="absolute left-3 top-3 z-10 w-full max-w-xs">
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
                            className="w-full h-9 px-3 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black shadow-lg"
                        />
                    </Autocomplete>
                </div>

                {/* Map view mode toggle - positioned at top right */}
                <div className="absolute right-3 top-3 z-10 flex overflow-hidden rounded-md border border-white/70 bg-white shadow-sm">
                    {[
                        { label: "2D Map", value: "roadmap" as const },
                        { label: "Satellite", value: "satellite" as const },
                        { label: "Street View (360°)", value: "streetview" as const },
                    ].map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setMapViewMode(option.value)}
                            className={`px-2 py-1.5 text-[11px] font-semibold transition-colors ${
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
                    <div className="relative h-[400px] xl:h-[600px] rounded-xl overflow-hidden shadow-inner">
                        <div 
                            ref={streetViewRef}
                            className="w-full h-full bg-gray-900"
                            style={{ 
                                minHeight: '400px',
                                position: 'relative',
                                zIndex: 0
                            }}
                        />
                        {!streetViewAvailable && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                                <div className="text-center p-6 max-w-md">
                                    <svg 
                                        className="mx-auto h-16 w-16 text-gray-400 mb-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path 
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Street View Not Available
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-1">
                                        360° imagery is not available for this location.
                                    </p>
                                    <p className="text-gray-500 text-xs mb-4">
                                        Try selecting a different location or switch to map view.
                                    </p>
                                    <button
                                        onClick={() => setMapViewMode('roadmap')}
                                        className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
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
