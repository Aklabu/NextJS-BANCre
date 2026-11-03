import api from "@/lib/apiClient";

// ============================================
// Types
// ============================================

export type PropertyMapItem = {
  id: number;
  place_id: string;
  property_name: string;
  property_address: string;
  property_type: string;
  latitude: string;
  longitude: string;
  property_image_url: string;
};

export type LoanRequestItem = {
  id: number;
  property: number;
  property_name: string;
  property_address: string;
  property_type: string;
  occupancy: string;
  year_built: number;
  property_image_url: string;
  requested_amount: string;
  loan_term: number;
  ltv: string;
  status: string;
  created_at: string;
};

export type LoanRequestsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  page_size: number;
  results: LoanRequestItem[];
};

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: T;
  errors: null | any;
};

// ============================================
// API Functions
// ============================================

/**
 * Fetch all properties with map data
 * GET /api/properties/map/
 */
export const fetchPropertiesMap = async (): Promise<PropertyMapItem[]> => {
  try {
    const response = await api.get<ApiResponse<PropertyMapItem[]>>(
      "/api/properties/map/"
    );
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch properties map:", error);
    throw error;
  }
};

/**
 * Fetch loan requests with pagination
 * GET /api/loans/requests/
 * @param page - Page number (default: 1)
 * @param pageSize - Number of items per page (default: 9)
 */
export const fetchLoanRequests = async (
  page: number = 1,
  pageSize: number = 9
): Promise<LoanRequestsResponse> => {
  try {
    const response = await api.get<ApiResponse<LoanRequestsResponse>>(
      `/api/loans/requests/`,
      {
        params: {
          page,
          page_size: pageSize,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch loan requests:", error);
    throw error;
  }
};

// ============================================
// Data Transformation Utilities
// ============================================

const FALLBACK_PROPERTY_IMAGE = "/images/SponsorDashboard.png";
const API_BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

/**
 * Normalize image URL
 */
export const normalizeImageUrl = (value?: string | null): string => {
  if (!value || value === "null" || value === "undefined") {
    return FALLBACK_PROPERTY_IMAGE;
  }

  const rawValue = String(value).trim();
  if (!rawValue) {
    return FALLBACK_PROPERTY_IMAGE;
  }

  // Handle full URLs
  if (/^https?:\/\//i.test(rawValue)) {
    if (!API_BASE_URL) return rawValue;
    // Replace localhost with actual base URL
    return rawValue.replace(
      /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i,
      API_BASE_URL
    );
  }

  // Handle relative paths
  const normalizedPath = rawValue.replace(/^\/+/, "");
  if (rawValue.startsWith("/") || normalizedPath.startsWith("media/")) {
    if (!API_BASE_URL) return `/${normalizedPath}`;
    return `${API_BASE_URL}/${normalizedPath}`;
  }

  return FALLBACK_PROPERTY_IMAGE;
};

/**
 * Format currency to display format
 * 5000000.00 -> "$5.0M"
 */
export const formatCurrency = (value: string | number): string => {
  const amount = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(amount)) return "$0";

  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  
  return `$${amount.toFixed(0)}`;
};

/**
 * Format loan term from months to years
 * 60 -> "5 yrs"
 */
export const formatLoanTerm = (months: number): string => {
  if (!months || months <= 0) return "0 yrs";
  
  const years = months / 12;
  
  if (years >= 1) {
    return `${Math.floor(years)} yrs`;
  }
  
  return `${months} mos`;
};

/**
 * Format LTV percentage
 * "75.00" -> "75%"
 */
export const formatLTV = (value: string | number): string => {
  const ltv = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(ltv)) return "0%";
  
  return `${ltv.toFixed(0)}%`;
};

/**
 * Format occupancy percentage
 * "85.50" -> "85.5%"
 */
export const formatOccupancy = (value: string | number): string => {
  const occupancy = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(occupancy)) return "0%";
  
  return `${occupancy.toFixed(1)}%`;
};

/**
 * Parse latitude/longitude to number
 */
export const parseCoordinate = (value: string): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};
