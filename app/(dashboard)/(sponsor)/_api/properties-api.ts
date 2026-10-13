import api from "@/lib/apiClient";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PropertyDocument {
  id: number;
  file_url: string;
  uploaded_at: string;
  name?: string;
  size?: number;
}

export interface CreatePropertyPayload {
  // Required fields
  property_name: string;
  property_address: string;
  latitude: number;
  longitude: number;
  files: File[]; // At least 1 file required, max 20

  // Optional fields
  place_id?: string;
  property_type?: string;
  number_of_units?: number;
  rentable_area?: string | number;
  year_built?: number;
  year_renovated?: number;
  occupancy?: string | number;
  parking_spaces?: number;
  property_photos?: string[]; // URLs from Google Maps
}

export interface PropertyResponse {
  id: number;
  place_id?: string;
  latitude: string;
  longitude: string;
  property_name: string;
  property_address: string;
  property_type: string;
  number_of_units: number;
  rentable_area: string;
  year_built?: number;
  year_renovated?: number;
  occupancy: string;
  parking_spaces: number;
  property_image?: string | null;
  property_image_url?: string | null;
  property_photos: string[];
  property_image_urls: string[];
  photos: string[];
  sponsor: string;
  created_at: string;
  updated_at: string;
  documents: PropertyDocument[];
}

export interface PropertyAPIError {
  success: false;
  statusCode: number;
  message: string;
  timestamp: string;
  data: null;
  errors: string[] | Record<string, string[] | string> | null;
}

// ── API Methods ──────────────────────────────────────────────────────────────

/**
 * Create a new Property with documents
 * POST /api/properties/
 * 
 * Requirements:
 * - At least 1 file required
 * - Maximum 20 files allowed
 * - Max size per file: 10 MB
 * - Allowed types: pdf, png, jpg, jpeg, xlsx, xls, csv, pptx, ppt, docx, doc
 * 
 * @param payload - Property data and files
 * @returns Created property with documents
 * @throws Error with validation details
 */
export async function createProperty(
  payload: CreatePropertyPayload
): Promise<PropertyResponse> {
  // Validate file count
  if (!payload.files || payload.files.length === 0) {
    throw new Error("At least one document is required.");
  }

  if (payload.files.length > 20) {
    throw new Error(
      `Too many files. Maximum 20 files allowed, but ${payload.files.length} files were provided.`
    );
  }

  // Build FormData
  const formData = new FormData();

  // Required fields
  formData.append("property_name", payload.property_name.trim());
  formData.append("property_address", payload.property_address.trim());
  formData.append("latitude", payload.latitude.toFixed(6));
  formData.append("longitude", payload.longitude.toFixed(6));

  // Optional fields
  if (payload.place_id) {
    formData.append("place_id", payload.place_id);
  }

  if (payload.property_type) {
    formData.append("property_type", payload.property_type);
  }

  if (
    payload.number_of_units !== undefined &&
    payload.number_of_units !== null &&
    !isNaN(payload.number_of_units) &&
    payload.number_of_units > 0
  ) {
    formData.append("number_of_units", String(payload.number_of_units));
  }

  if (payload.rentable_area) {
    const area = String(payload.rentable_area).trim();
    if (area !== "" && area !== "0") {
      formData.append("rentable_area", area);
    }
  }

  if (
    payload.year_built !== undefined &&
    payload.year_built !== null &&
    !isNaN(payload.year_built) &&
    payload.year_built >= 1800
  ) {
    formData.append("year_built", String(payload.year_built));
  }

  if (payload.occupancy) {
    const occ = String(payload.occupancy).trim();
    if (occ !== "" && occ !== "0") {
      formData.append("occupancy", occ);
    }
  }

  if (
    payload.year_renovated !== undefined &&
    payload.year_renovated !== null &&
    !isNaN(payload.year_renovated) &&
    payload.year_renovated >= 1800
  ) {
    formData.append("year_renovated", String(payload.year_renovated));
  }

  if (
    payload.parking_spaces !== undefined &&
    payload.parking_spaces !== null &&
    !isNaN(payload.parking_spaces) &&
    payload.parking_spaces >= 0
  ) {
    formData.append("parking_spaces", String(payload.parking_spaces));
  }

  // Property photo URLs (from Google Maps)
  if (payload.property_photos && payload.property_photos.length > 0) {
    payload.property_photos.forEach((url) => {
      formData.append("property_photos", url);
    });
  }

  // Files - all documents/images go under "files" key
  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const response = await api.post("/api/properties/", formData);
    const data = response?.data?.data ?? response?.data;

    return {
      id: data.id,
      place_id: data.place_id,
      latitude: data.latitude,
      longitude: data.longitude,
      property_name: data.property_name,
      property_address: data.property_address,
      property_type: data.property_type || "Commercial",
      number_of_units: data.number_of_units || 0,
      rentable_area: data.rentable_area || "0.00",
      year_built: data.year_built,
      year_renovated: data.year_renovated,
      occupancy: data.occupancy || "0.00",
      parking_spaces: data.parking_spaces || 0,
      property_image: data.property_image,
      property_image_url: data.property_image_url,
      property_photos: data.property_photos || [],
      property_image_urls: data.property_image_urls || [],
      photos: data.photos || [],
      sponsor: data.sponsor,
      created_at: data.created_at,
      updated_at: data.updated_at,
      documents: data.documents || [],
    };
  } catch (error: any) {
    // Re-throw with better error message
    const errorData = error?.response?.data;
    
    if (errorData) {
      const err = new Error(errorData.message || "Failed to create property");
      (err as any).errors = errorData.errors;
      (err as any).statusCode = errorData.statusCode || error?.response?.status;
      throw err;
    }
    
    throw error;
  }
}

/**
 * Upload additional documents to an existing property
 * POST /api/properties/{id}/documents/
 * 
 * @param propertyId - Property ID
 * @param files - Files to upload
 * @returns Uploaded document details
 */
export async function uploadPropertyDocuments(
  propertyId: number,
  files: File[]
): Promise<PropertyDocument[]> {
  if (!files || files.length === 0) {
    throw new Error("No files provided");
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const response = await api.post(
      `/api/properties/${propertyId}/documents/`,
      formData
    );
    
    const data = response?.data?.data ?? response?.data;
    return Array.isArray(data?.documents) ? data.documents : [];
  } catch (error: any) {
    const errorData = error?.response?.data;
    throw new Error(errorData?.message || "Failed to upload documents");
  }
}

/**
 * Fetch property details
 * GET /api/properties/{id}/
 * 
 * @param propertyId - Property ID
 * @returns Property details
 */
export async function fetchProperty(
  propertyId: number
): Promise<PropertyResponse> {
  try {
    const response = await api.get(`/api/properties/${propertyId}/`);
    const data = response?.data?.data ?? response?.data;
    
    return {
      id: data.id,
      place_id: data.place_id,
      latitude: data.latitude,
      longitude: data.longitude,
      property_name: data.property_name,
      property_address: data.property_address,
      property_type: data.property_type || "Commercial",
      number_of_units: data.number_of_units || 0,
      rentable_area: data.rentable_area || "0.00",
      year_built: data.year_built,
      year_renovated: data.year_renovated,
      occupancy: data.occupancy || "0.00",
      parking_spaces: data.parking_spaces || 0,
      property_image: data.property_image,
      property_image_url: data.property_image_url,
      property_photos: data.property_photos || [],
      property_image_urls: data.property_image_urls || [],
      photos: data.photos || [],
      sponsor: data.sponsor,
      created_at: data.created_at,
      updated_at: data.updated_at,
      documents: data.documents || [],
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Failed to fetch property");
  }
}

/**
 * Update property details
 * PATCH /api/properties/{id}/
 * 
 * @param propertyId - Property ID
 * @param payload - Fields to update
 * @returns Updated property
 */
export async function updateProperty(
  propertyId: number,
  payload: Partial<Omit<CreatePropertyPayload, "files">>
): Promise<PropertyResponse> {
  try {
    const response = await api.patch(`/api/properties/${propertyId}/`, payload);
    const data = response?.data?.data ?? response?.data;
    
    return {
      id: data.id,
      place_id: data.place_id,
      latitude: data.latitude,
      longitude: data.longitude,
      property_name: data.property_name,
      property_address: data.property_address,
      property_type: data.property_type || "Commercial",
      number_of_units: data.number_of_units || 0,
      rentable_area: data.rentable_area || "0.00",
      year_built: data.year_built,
      year_renovated: data.year_renovated,
      occupancy: data.occupancy || "0.00",
      parking_spaces: data.parking_spaces || 0,
      property_image: data.property_image,
      property_image_url: data.property_image_url,
      property_photos: data.property_photos || [],
      property_image_urls: data.property_image_urls || [],
      photos: data.photos || [],
      sponsor: data.sponsor,
      created_at: data.created_at,
      updated_at: data.updated_at,
      documents: data.documents || [],
    };
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Failed to update property");
  }
}

/**
 * Delete a property
 * DELETE /api/properties/{id}/
 * 
 * @param propertyId - Property ID
 */
export async function deleteProperty(propertyId: number): Promise<void> {
  try {
    await api.delete(`/api/properties/${propertyId}/`);
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Failed to delete property");
  }
}

/**
 * Fetch all properties for the authenticated sponsor
 * GET /api/properties/
 * 
 * @returns List of properties
 */
export async function fetchProperties(): Promise<PropertyResponse[]> {
  try {
    const response = await api.get("/api/properties/");
    const raw =
      response?.data?.data ??
      (Array.isArray(response?.data?.results)
        ? response.data.results
        : Array.isArray(response?.data)
          ? response.data
          : []);

    if (!Array.isArray(raw)) return [];

    return raw.map((data: any) => ({
      id: data.id,
      place_id: data.place_id,
      latitude: data.latitude,
      longitude: data.longitude,
      property_name: data.property_name,
      property_address: data.property_address,
      property_type: data.property_type || "Commercial",
      number_of_units: data.number_of_units || 0,
      rentable_area: data.rentable_area || "0.00",
      year_built: data.year_built,
      year_renovated: data.year_renovated,
      occupancy: data.occupancy || "0.00",
      parking_spaces: data.parking_spaces || 0,
      property_image: data.property_image,
      property_image_url: data.property_image_url,
      property_photos: data.property_photos || [],
      property_image_urls: data.property_image_urls || [],
      photos: data.photos || [],
      sponsor: data.sponsor,
      created_at: data.created_at,
      updated_at: data.updated_at,
      documents: data.documents || [],
    }));
  } catch (error: any) {
    console.error("Failed to fetch properties", error);
    return [];
  }
}
