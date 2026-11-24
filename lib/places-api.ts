/**
 * New Places API Helper Functions
 * https://developers.google.com/maps/documentation/places/web-service/place-details
 */

export type PlaceDetails = {
  place_id: string;
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
  types: string[];
  rating: number | null;
  photos: string[];
};

/**
 * Fetch place details using the new Places API
 */
export async function fetchPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<PlaceDetails | null> {
  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "id,displayName,formattedAddress,location,types,rating,photos",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Places API fetch details error:",
        response.status,
        response.statusText,
        errorText
      );
      return null;
    }

    const data = await response.json();

    // Extract photo URLs (max 6)
    const photos: string[] = [];
    if (data.photos && Array.isArray(data.photos)) {
      for (const photo of data.photos.slice(0, 6)) {
        if (photo.name) {
          // Construct photo URL using the new API format
          const photoUrl = `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxHeightPx=1200&maxWidthPx=1200`;
          photos.push(photoUrl);
        }
      }
    }

    return {
      place_id: data.id || placeId,
      name: data.displayName?.text || "",
      formatted_address: data.formattedAddress || "",
      lat: data.location?.latitude || 0,
      lng: data.location?.longitude || 0,
      types: data.types || [],
      rating: data.rating || null,
      photos,
    };
  } catch (error) {
    console.error("Failed to fetch place details:", error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get place details
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  apiKey: string
): Promise<PlaceDetails | null> {
  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places:searchNearby`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.photos",
        },
        body: JSON.stringify({
          locationRestriction: {
            circle: {
              center: {
                latitude: lat,
                longitude: lng,
              },
              radius: 50.0, // 50 meters
            },
          },
          maxResultCount: 1,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Places API reverse geocode error:",
        response.status,
        response.statusText,
        errorText
      );
      return null;
    }

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      return {
        place_id: "",
        name: "",
        formatted_address: "",
        lat,
        lng,
        types: [],
        rating: null,
        photos: [],
      };
    }

    const place = data.places[0];

    // Extract photo URLs
    const photos: string[] = [];
    if (place.photos && Array.isArray(place.photos)) {
      for (const photo of place.photos.slice(0, 6)) {
        if (photo.name) {
          const photoUrl = `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxHeightPx=1200&maxWidthPx=1200`;
          photos.push(photoUrl);
        }
      }
    }

    return {
      place_id: place.id || "",
      name: place.displayName?.text || "",
      formatted_address: place.formattedAddress || "",
      lat: place.location?.latitude || lat,
      lng: place.location?.longitude || lng,
      types: place.types || [],
      rating: place.rating || null,
      photos,
    };
  } catch (error) {
    console.error("Failed to reverse geocode:", error);
    return null;
  }
}
