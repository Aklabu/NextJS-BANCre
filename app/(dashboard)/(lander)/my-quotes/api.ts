import api from "@/lib/apiClient";

// ============================================
// Types
// ============================================

/**
 * Standard API Response Wrapper
 */
type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: T | null;
  errors: Record<string, any> | null;
};

/**
 * Quote Statistics Data
 */
export type QuoteStatsData = {
  total_quotes: number;
  under_review_quotes: number;
  accepted_quotes: number;
  declined_quotes: number;
};

/**
 * Single Quote Item (now includes property details)
 */
export type QuoteItem = {
  id: number;
  loan_request: number;
  lender: number;
  lender_name: string;
  guarantor: string;
  status: string;
  expires_at: string;
  submitted_at: string;
  updated_at: string;
  loan_amount: number;
  initial_funding: number;
  future_funding: number;
  sponsor_equity: number;
  max_as_is_ltv: number;
  max_ltc: number;
  max_as_stabilized_ltv: number;
  min_as_is_dy: number;
  min_stabilized_dy: number;
  term: number;
  interest_rate: number;
  amortization: string;
  prepayment: string;
  origination_fee: number;
  capex_reserve: number;
  ff_and_e_reserve: number;
  interest_carry_reserve: number;
  extension_conditions: string;
  collateral: string;
  recourse: string;
  dscr: number;
  // Property details (newly added)
  property_id: number;
  property_name: string;
  property_address: string;
  property_type: string;
  property_image_url: string;
};

/**
 * Paginated Quotes Response
 */
export type QuotesListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: QuoteItem[];
};

/**
 * Quote Update Payload (all fields optional)
 */
export type QuoteUpdatePayload = {
  lender_name?: string;
  guarantor?: string;
  expires_at?: string;
  loan_amount?: number | string;
  initial_funding?: number | string;
  future_funding?: number | string;
  sponsor_equity?: number | string;
  max_as_is_ltv?: number | string;
  max_ltc?: number | string;
  max_as_stabilized_ltv?: number | string;
  min_as_is_dy?: number | string;
  min_stabilized_dy?: number | string;
  term?: number | string;
  interest_rate?: number | string;
  amortization?: string;
  prepayment?: string;
  origination_fee?: number | string;
  capex_reserve?: number | string;
  ff_and_e_reserve?: number | string;
  interest_carry_reserve?: number | string;
  extension_conditions?: string;
  collateral?: string;
  recourse?: string;
};

/**
 * Property Document
 */
export type PropertyDocument = {
  id: number;
  file_url: string;
  uploaded_at: string;
};

/**
 * Active Loan Request
 */
export type ActiveLoanRequest = {
  id: number;
  requested_amount: number;
  loan_term: number;
  ltv: number;
  created_at: string;
};

/**
 * Property Memorandum
 */
export type PropertyMemorandum = {
  id: number;
  title: string;
  url: string;
  created_at: string;
  updated_at: string;
};

/**
 * Lender Property Detail
 */
export type LenderPropertyDetail = {
  id: number;
  place_id: string;
  latitude: number;
  longitude: number;
  property_name: string;
  property_address: string;
  property_type: string;
  number_of_units: number;
  rentable_area: number;
  year_built: number;
  year_renovated: number | null;
  occupancy: number;
  parking_spaces: number;
  property_image_url: string;
  property_photos_urls: string[];
  documents: PropertyDocument[];
  active_loan_requests: ActiveLoanRequest[];
  memorandums: PropertyMemorandum[];
  created_at: string;
  updated_at: string;
};

// ============================================
// API Functions
// ============================================

/**
 * Fetch lender quote statistics
 * GET /api/dashboard/lender/quote-stats/
 * 
 * @returns Promise<QuoteStatsData> - Quote statistics including totals, counts, and value
 * @throws Error if request fails or user lacks permission
 */
export const fetchLenderQuoteStats = async (): Promise<QuoteStatsData> => {
  try {
    const response = await api.get<ApiResponse<QuoteStatsData>>(
      "/api/dashboard/lender/quote-stats/"
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || "Failed to fetch quote statistics");
  } catch (error: any) {
    console.error("Failed to fetch lender quote statistics:", error);

    // Handle specific error cases
    if (error?.response?.data) {
      const errorData = error.response.data;
      
      if (errorData.statusCode === 401) {
        throw new Error(errorData.message || "Authentication required.");
      }
      
      if (errorData.statusCode === 403) {
        throw new Error(errorData.message || "You do not have permission to access this resource.");
      }
      
      throw new Error(errorData.message || "Failed to fetch quote statistics");
    }

    throw error;
  }
};

/**
 * Fetch all lender's submitted quotes with pagination
 * GET /api/loans/quotes/
 * 
 * @param page - Page number (default: 1)
 * @param pageSize - Number of items per page (default: 10)
 * @returns Promise<QuotesListResponse> - Paginated list of quotes
 * @throws Error if request fails or user lacks permission
 */
export const fetchLenderQuotes = async (
  page: number = 1,
  pageSize: number = 10
): Promise<QuotesListResponse> => {
  try {
    const response = await api.get<ApiResponse<QuotesListResponse>>(
      "/api/loans/quotes/",
      {
        params: {
          page,
          page_size: pageSize,
        },
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || "Failed to fetch quotes");
  } catch (error: any) {
    console.error("Failed to fetch lender quotes:", error);

    // Handle specific error cases
    if (error?.response?.data) {
      const errorData = error.response.data;
      
      if (errorData.statusCode === 401) {
        throw new Error(errorData.message || "Authentication required.");
      }
      
      if (errorData.statusCode === 403) {
        throw new Error(errorData.message || "You do not have permission to access this resource.");
      }
      
      throw new Error(errorData.message || "Failed to fetch quotes");
    }

    throw error;
  }
};

/**
 * Fetch all lender quotes without pagination (fetches all pages)
 * GET /api/loans/quotes/
 * 
 * @returns Promise<QuoteItem[]> - All quotes across all pages
 * @throws Error if request fails or user lacks permission
 */
export const fetchAllLenderQuotes = async (): Promise<QuoteItem[]> => {
  try {
    const allQuotes: QuoteItem[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetchLenderQuotes(currentPage, 100); // Fetch 100 per page
      allQuotes.push(...response.results);

      if (response.next) {
        currentPage++;
      } else {
        hasMore = false;
      }
    }

    return allQuotes;
  } catch (error) {
    console.error("Failed to fetch all lender quotes:", error);
    throw error;
  }
};

/**
 * Fetch single quote details by ID
 * GET /api/loans/quotes/{quoteId}/
 * 
 * @param quoteId - The quote ID
 * @returns Promise<QuoteItem> - Single quote details
 * @throws Error if request fails, quote not found, or user lacks permission
 */
export const fetchQuoteById = async (quoteId: number): Promise<QuoteItem> => {
  try {
    const response = await api.get<ApiResponse<QuoteItem>>(
      `/api/loans/quotes/${quoteId}/`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || "Failed to fetch quote details");
  } catch (error: any) {
    console.error(`Failed to fetch quote ${quoteId}:`, error);

    // Handle specific error cases
    if (error?.response?.data) {
      const errorData = error.response.data;
      
      if (errorData.statusCode === 401) {
        throw new Error(errorData.message || "Authentication required.");
      }
      
      if (errorData.statusCode === 403) {
        throw new Error(errorData.message || "You do not have permission to view this quote.");
      }
      
      if (errorData.statusCode === 404) {
        throw new Error(errorData.message || "Quote not found.");
      }
      
      throw new Error(errorData.message || "Failed to fetch quote details");
    }

    throw error;
  }
};

/**
 * Update quote fields (PATCH)
 * PATCH /api/loans/quotes/{quoteId}/
 * 
 * Note: Only quotes with status "Submitted" can be updated
 * 
 * @param quoteId - The quote ID
 * @param payload - Fields to update (all optional)
 * @returns Promise<QuoteItem> - Updated quote details
 * @throws Error if request fails, validation errors, permission denied, or quote cannot be updated
 */
export const updateQuote = async (
  quoteId: number,
  payload: QuoteUpdatePayload
): Promise<QuoteItem> => {
  try {
    const response = await api.patch<ApiResponse<QuoteItem>>(
      `/api/loans/quotes/${quoteId}/`,
      payload
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || "Failed to update quote");
  } catch (error: any) {
    console.error(`Failed to update quote ${quoteId}:`, error);

    // Handle specific error cases
    if (error?.response?.data) {
      const errorData = error.response.data;
      
      // Authentication error
      if (errorData.statusCode === 401) {
        throw new Error(errorData.message || "Authentication required.");
      }
      
      // Permission errors
      if (errorData.statusCode === 403) {
        throw new Error(errorData.message || "You do not have permission to update this quote.");
      }
      
      // Not found
      if (errorData.statusCode === 404) {
        throw new Error(errorData.message || "Quote not found.");
      }
      
      // Validation errors
      if (errorData.statusCode === 400 && errorData.errors) {
        // Check for non-field errors (like status validation)
        if (errorData.errors.non_field_errors) {
          throw new Error(errorData.errors.non_field_errors[0] || errorData.message);
        }
        
        // Field-specific validation errors
        const fieldErrors = Object.entries(errorData.errors)
          .map(([field, messages]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(", ")}`;
            }
            return `${field}: ${messages}`;
          })
          .join("; ");
        
        throw new Error(fieldErrors || errorData.message || "Validation failed");
      }
      
      throw new Error(errorData.message || "Failed to update quote");
    }

    throw error;
  }
};

/**
 * Fetch lender's property details
 * GET /api/properties/lender/{id}/
 * 
 * Note: Only accessible if property has at least one active loan request
 * 
 * @param propertyId - The property ID
 * @returns Promise<LenderPropertyDetail> - Property details with loan requests, documents, and memorandums
 * @throws Error if request fails, property not found, no active loan requests, or permission denied
 */
export const fetchLenderPropertyDetail = async (
  propertyId: number
): Promise<LenderPropertyDetail> => {
  try {
    const response = await api.get<ApiResponse<LenderPropertyDetail>>(
      `/api/properties/lender/${propertyId}/`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || "Failed to fetch property details");
  } catch (error: any) {
    console.error(`Failed to fetch property ${propertyId}:`, error);

    // Handle specific error cases
    if (error?.response?.data) {
      const errorData = error.response.data;
      
      // Authentication error
      if (errorData.statusCode === 401) {
        throw new Error(errorData.message || "Authentication required.");
      }
      
      // Permission errors
      if (errorData.statusCode === 403) {
        throw new Error(errorData.message || "You do not have permission to access this resource.");
      }
      
      // Not found errors (property not found or no active loan requests)
      if (errorData.statusCode === 404) {
        throw new Error(
          errorData.message || 
          "Property not found or does not have any active loan requests."
        );
      }
      
      throw new Error(errorData.message || "Failed to fetch property details");
    }

    throw error;
  }
};

// ============================================
// Utility Functions
// ============================================

/**
 * Format currency value for display
 */
export const formatCurrency = (value: number | string | undefined): string => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(parsed);
};

/**
 * Format large currency to abbreviated format
 * 5000000 -> "$5.0M"
 */
export const formatCurrencyAbbreviated = (value: number | string | undefined): string => {
  const amount = Number(value);
  
  if (!Number.isFinite(amount) || amount === 0) return "$0";

  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  } else if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  
  return `$${amount.toFixed(0)}`;
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): string => {
  if (!total || total === 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
};

/**
 * Format date to readable string
 */
export const formatDate = (value?: string): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format datetime to readable string with time
 */
export const formatDateTime = (value?: string): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Calculate days until a future date
 */
export const getDaysUntil = (value?: string): number => {
  if (!value) return 0;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 0;
  return Math.ceil((parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

/**
 * Format loan term from months to readable format
 */
export const formatLoanTerm = (months: number): string => {
  if (!months || months <= 0) return "-";
  
  const years = months / 12;
  
  if (years >= 1 && months % 12 === 0) {
    return `${Math.floor(years)} ${years === 1 ? "year" : "years"}`;
  }
  
  return `${months} months`;
};

/**
 * Format percentage value
 */
export const formatPercent = (value: number | string | undefined): string => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return `${parsed.toFixed(2)}%`;
};

/**
 * Normalize quote status to standard values
 */
export const normalizeQuoteStatus = (status?: string): "submitted" | "under_review" | "accepted" | "rejected" => {
  const normalized = String(status || "").toLowerCase();
  
  if (normalized.includes("accept")) return "accepted";
  if (normalized.includes("reject") || normalized.includes("declin") || normalized.includes("withdraw")) {
    return "rejected";
  }
  if (normalized.includes("review") || normalized.includes("pending")) {
    return "under_review";
  }
  
  return "submitted";
};

/**
 * Get status badge color classes
 */
export const getStatusColor = (status: string): string => {
  const normalized = normalizeQuoteStatus(status);
  
  switch (normalized) {
    case "accepted":
      return "bg-green-100 text-green-800 border-green-200";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "under_review":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "submitted":
    default:
      return "bg-blue-100 text-blue-800 border-blue-200";
  }
};

/**
 * Convert datetime-local input value to ISO string
 */
export const toDateTimeLocalValue = (value?: string): string => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

/**
 * Convert datetime-local input to server ISO format
 */
export const toServerIsoDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
};

/**
 * Normalize image URL to handle localhost and relative paths
 */
export const normalizeImageUrl = (url: string | null | undefined, baseUrl?: string): string => {
  if (!url) return "/images/SponsorDashboard.png";
  
  const urlStr = String(url).trim();
  if (!urlStr || urlStr === "null" || urlStr === "undefined") {
    return "/images/SponsorDashboard.png";
  }

  const apiBaseUrl = baseUrl || (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

  // Handle full URLs
  if (/^https?:\/\//i.test(urlStr)) {
    if (!apiBaseUrl) return urlStr;
    // Replace localhost with actual base URL
    return urlStr.replace(
      /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i,
      apiBaseUrl
    );
  }

  // Handle relative paths
  const normalizedPath = urlStr.replace(/^\/+/, "");
  if (urlStr.startsWith("/") || normalizedPath.startsWith("media/")) {
    if (!apiBaseUrl) return `/${normalizedPath}`;
    return `${apiBaseUrl}/${normalizedPath}`;
  }

  return "/images/SponsorDashboard.png";
};

/**
 * Get filename from URL
 */
export const getFileNameFromUrl = (url: string): string => {
  const safeUrl = url.split("?")[0];
  return decodeURIComponent(safeUrl.substring(safeUrl.lastIndexOf("/") + 1));
};

/**
 * Format number with comma separators
 */
export const formatNumber = (value: number | string | undefined): string => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.NumberFormat("en-US").format(parsed);
};

/**
 * Format square footage
 */
export const formatSquareFeet = (value: number | string | undefined): string => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return `${new Intl.NumberFormat("en-US").format(parsed)} sq ft`;
};
