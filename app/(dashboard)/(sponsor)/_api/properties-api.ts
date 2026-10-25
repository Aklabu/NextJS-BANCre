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
  files: File[]; // At least 1 document required, max 20, max 50MB each

  // Optional fields
  place_id?: string;
  property_type?: string;
  number_of_units?: number;
  rentable_area?: string | number;
  year_built?: number;
  year_renovated?: number;
  occupancy?: string | number;
  parking_spaces?: number;
  gallery_photos?: File[]; // Max 10 images, 2MB each, JPG/PNG only
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
  property_image_url?: string | null; // Cover image URL
  property_photos_urls?: string[]; // Gallery photo URLs
  sponsor: string;
  created_at: string;
  updated_at: string;
  documents: PropertyDocument[];
  memorandum_id?: number | null; // ID of associated memorandum
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
 * Create a new Property with documents and images
 * POST /api/properties/
 * 
 * Requirements:
 * - At least 1 document file required
 * - Maximum 20 document files allowed
 * - Max size per document: 50 MB
 * - Document types: pdf, png, jpg, jpeg, xlsx, xls, csv, pptx, ppt, docx, doc
 * - Gallery photos: Max 10 images, 2MB each, JPG/PNG only
 * - Cover image: First gallery photo is used as cover
 * 
 * Response includes:
 * - Property details
 * - Array of uploaded documents with URLs
 * - Success message indicating number of documents uploaded
 * 
 * @param payload - Property data, files, and gallery photos
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

  // Validate gallery photos
  if (payload.gallery_photos && payload.gallery_photos.length > 10) {
    throw new Error(
      `Too many gallery photos. Maximum 10 photos allowed, but ${payload.gallery_photos.length} photos were provided.`
    );
  }

  // Build FormData
  const formData = new FormData();

  // Required fields with proper formatting
  formData.append("property_name", payload.property_name.trim());
  formData.append("property_address", payload.property_address.trim());
  
  // Latitude/Longitude: Limit to 10 total digits (including decimal point and minus sign)
  const formatCoordinate = (coord: number): string => {
    const coordStr = coord.toFixed(7); // Max 7 decimal places
    const parts = coordStr.split('.');
    const intPart = parts[0].replace('-', '');
    const decPart = parts[1] || '';
    
    const totalDigits = intPart.length + decPart.length;
    
    if (totalDigits <= 10) {
      return coordStr;
    }
    
    const maxDecimalPlaces = 10 - intPart.length;
    return coord.toFixed(Math.max(0, maxDecimalPlaces));
  };
  
  formData.append("latitude", formatCoordinate(payload.latitude));
  formData.append("longitude", formatCoordinate(payload.longitude));

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

  // Gallery photos (uploaded images) - Max 10, 2MB each, JPG/PNG only
  if (payload.gallery_photos && payload.gallery_photos.length > 0) {
    // Use first photo as cover_image
    formData.append("cover_image", payload.gallery_photos[0]);
    
    // Add all photos to gallery_photos
    payload.gallery_photos.forEach((photo) => {
      formData.append("gallery_photos", photo);
    });
  }

  // Document files - all documents go under "files" key
  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const response = await api.post("/api/properties/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
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
      property_image_url: data.property_image_url,
      property_photos_urls: data.property_photos_urls || [],
      sponsor: data.sponsor,
      created_at: data.created_at,
      updated_at: data.updated_at,
      documents: data.documents || [],
    };
  } catch (error: any) {
    // Handle API error response with structured error format
    const errorData = error?.response?.data;
    
    if (errorData) {
      const err = new Error(errorData.message || "Failed to create property");
      (err as any).errors = errorData.errors;
      (err as any).statusCode = errorData.statusCode || error?.response?.status;
      throw err;
    }
    
    throw new Error("Failed to create property. Please try again.");
  }
}

/**
 * Upload additional documents to an existing property
 * POST /api/properties/{id}/documents/
 * 
 * This endpoint is for uploading ADDITIONAL documents to an existing property
 * after the property has been created.
 * 
 * Requirements:
 * - Property must already exist (created via POST /api/properties/)
 * - Maximum 20 files per request
 * - Max size per file: 50 MB
 * - Allowed types: pdf, png, jpg, jpeg, xlsx, xls, csv, pptx, ppt, docx, doc
 * 
 * @param propertyId - Property ID
 * @param files - Files to upload
 * @returns Uploaded document details
 * @throws Error with validation details
 */
export async function uploadPropertyDocuments(
  propertyId: number,
  files: File[]
): Promise<PropertyDocument[]> {
  if (!files || files.length === 0) {
    throw new Error("At least one document is required.");
  }

  if (files.length > 20) {
    throw new Error(
      `Too many files. Maximum 20 files allowed, but ${files.length} files were provided.`
    );
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const response = await api.post(
      `/api/properties/${propertyId}/documents/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    
    const data = response?.data?.data ?? response?.data;
    return Array.isArray(data?.documents) ? data.documents : [];
  } catch (error: any) {
    // Handle API error response with structured error format
    const errorData = error?.response?.data;
    
    if (errorData) {
      const err = new Error(errorData.message || "Failed to upload documents");
      (err as any).errors = errorData.errors;
      (err as any).statusCode = errorData.statusCode || error?.response?.status;
      throw err;
    }
    
    throw new Error("Failed to upload documents. Please try again.");
  }
}

/**
 * Fetch property details
 * GET /api/properties/{id}/
 * 
 * Requirements:
 * - User must be authenticated
 * - User must be a Sponsor
 * - User must be the property owner
 * 
 * @param propertyId - Property ID
 * @returns Property details with documents and memorandum_id
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
      property_image_url: data.property_image_url,
      property_photos_urls: data.property_photos_urls || [],
      sponsor: data.sponsor,
      created_at: data.created_at,
      updated_at: data.updated_at,
      documents: data.documents || [],
      memorandum_id: data.memorandum_id,
    };
  } catch (error: any) {
    const errorData = error?.response?.data;
    const statusCode = error?.response?.status || errorData?.statusCode;
    
    // Handle different error types
    if (statusCode === 404) {
      throw new Error(errorData?.message || "Property not found.");
    } else if (statusCode === 403) {
      throw new Error(errorData?.message || "You do not have permission to access this property.");
    } else if (statusCode === 401) {
      throw new Error(errorData?.message || "Authentication required. Please log in.");
    }
    
    throw new Error(errorData?.message || "Failed to fetch property");
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
  payload: Partial<Omit<CreatePropertyPayload, "files" | "gallery_photos">>
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
      property_image_url: data.property_image_url,
      property_photos_urls: data.property_photos_urls || [],
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
      property_image_url: data.property_image_url,
      property_photos_urls: data.property_photos_urls || [],
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
