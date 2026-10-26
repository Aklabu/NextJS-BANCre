/**
 * Sponsor Quotes API Client
 * 
 * This module provides typed API functions for sponsor-specific loan quotes endpoints.
 * 
 * Endpoint: GET /api/loans/sponsor/quotes/
 * Authentication: Bearer Token (Required)
 * Permission: Sponsor Only
 * 
 * @module sponsor-quotes-api
 */

import api from "@/lib/apiClient";

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Standard API Response Envelope
 */
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: T | null;
  errors: Record<string, any> | null;
}

/**
 * Paginated API Response
 */
export interface PaginatedApiResponse<T = any> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Quote Status Type
 */
export type QuoteStatus = "Submitted" | "Accepted" | "Declined" | "Under Review" | "Expired";

/**
 * Sponsor Quote Item from API
 */
export interface SponsorQuoteItem {
  id: number;
  loan_request: number;
  lender: number;
  lender_name: string;
  guarantor: string;
  status: QuoteStatus;
  expires_at: string;
  submitted_at: string;
  updated_at: string;
  property_id: number;
  property_name: string;
  loan_amount: string;
  initial_funding: string;
  future_funding: string;
  sponsor_equity: string;
  max_as_is_ltv: string;
  max_ltc: string;
  max_as_stabilized_ltv: string;
  min_as_is_dy: string;
  min_stabilized_dy: string;
  term: number;
  interest_rate: string;
  amortization: string;
  prepayment: string;
  origination_fee: string;
  capex_reserve: string;
  ff_and_e_reserve: string;
  interest_carry_reserve: string;
  extension_conditions: string;
  collateral: string;
  recourse: string;
  dscr: number;
}

/**
 * Query Parameters for fetching sponsor quotes
 */
export interface FetchSponsorQuotesParams {
  page?: number;
  page_size?: number;
}

// ── API Methods ──────────────────────────────────────────────────────────────

/**
 * Fetch All Sponsor Quotes
 * GET /api/loans/sponsor/quotes/
 * 
 * Retrieves all loan quotes submitted to the authenticated sponsor.
 * Supports pagination via query parameters.
 * 
 * @param params - Query parameters for pagination
 * @returns Promise<SponsorQuoteItem[]> - Array of sponsor quotes
 * 
 * @throws {Error} 401 - Authentication credentials not provided
 * @throws {Error} 403 - User is not a sponsor (permission denied)
 * @throws {Error} 404 - Invalid pagination page
 * @throws {Error} 500 - Internal server error
 * 
 * @example
 * ```typescript
 * // Fetch first page with default page size
 * const quotes = await fetchSponsorQuotes();
 * 
 * // Fetch specific page with custom page size
 * const quotes = await fetchSponsorQuotes({ page: 2, page_size: 20 });
 * ```
 */
export async function fetchSponsorQuotes(
  params: FetchSponsorQuotesParams = {}
): Promise<SponsorQuoteItem[]> {
  const { page = 1, page_size = 10 } = params;

  try {
    const response = await api.get("/api/loans/sponsor/quotes/", {
      params: {
        page,
        page_size,
      },
    });

    console.log("Sponsor Quotes API Response:", response?.data);

    // Handle standard API response format
    const apiData = response?.data as ApiResponse<PaginatedApiResponse<SponsorQuoteItem>>;

    // Extract data from standard envelope
    const paginatedData = apiData?.data;

    if (!paginatedData) {
      console.warn("No data in API response");
      return [];
    }

    const results = paginatedData.results;

    if (!Array.isArray(results)) {
      console.error("Results is not an array:", results);
      return [];
    }

    console.log(`Fetched ${results.length} sponsor quotes (page ${page})`);

    return results;
  } catch (error: any) {
    console.error("Failed to fetch sponsor quotes:", error);

    // Handle specific error cases
    if (error?.response?.status === 401) {
      throw new Error("Authentication required. Please log in.");
    }

    if (error?.response?.status === 403) {
      throw new Error("Access denied. Only sponsor accounts can view this resource.");
    }

    if (error?.response?.status === 404) {
      throw new Error("Invalid page number.");
    }

    if (error?.response?.status === 500) {
      throw new Error("Server error. Please try again later.");
    }

    throw error;
  }
}

/**
 * Fetch All Sponsor Quotes with Full Pagination Data
 * GET /api/loans/sponsor/quotes/
 * 
 * Returns complete pagination response including count, next/previous links
 * 
 * @param params - Query parameters for pagination
 * @returns Promise with full paginated response
 */
export async function fetchSponsorQuotesPaginated(
  params: FetchSponsorQuotesParams = {}
): Promise<PaginatedApiResponse<SponsorQuoteItem>> {
  const { page = 1, page_size = 10 } = params;

  try {
    const response = await api.get("/api/loans/sponsor/quotes/", {
      params: {
        page,
        page_size,
      },
    });

    // Handle standard API response format
    const apiData = response?.data as ApiResponse<PaginatedApiResponse<SponsorQuoteItem>>;

    // Extract data from standard envelope
    const paginatedData = apiData?.data;

    if (!paginatedData) {
      return {
        count: 0,
        next: null,
        previous: null,
        results: [],
      };
    }

    return paginatedData;
  } catch (error: any) {
    console.error("Failed to fetch sponsor quotes (paginated):", error);

    // Handle specific error cases
    if (error?.response?.status === 401) {
      throw new Error("Authentication required. Please log in.");
    }

    if (error?.response?.status === 403) {
      throw new Error("Access denied. Only sponsor accounts can view this resource.");
    }

    if (error?.response?.status === 404) {
      throw new Error("Invalid page number.");
    }

    if (error?.response?.status === 500) {
      throw new Error("Server error. Please try again later.");
    }

    throw error;
  }
}

/**
 * Fetch All Sponsor Quotes (All Pages)
 * Recursively fetches all pages until no more results
 * 
 * @param page_size - Items per page (default: 100)
 * @returns Promise<SponsorQuoteItem[]> - All quotes across all pages
 * 
 * @example
 * ```typescript
 * // Fetch all quotes across all pages
 * const allQuotes = await fetchAllSponsorQuotes();
 * ```
 */
export async function fetchAllSponsorQuotes(
  page_size: number = 100
): Promise<SponsorQuoteItem[]> {
  const allQuotes: SponsorQuoteItem[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const paginatedResponse = await fetchSponsorQuotesPaginated({
        page: currentPage,
        page_size,
      });

      allQuotes.push(...paginatedResponse.results);

      // Check if there are more pages
      hasMore = paginatedResponse.next !== null;
      currentPage++;
    } catch (error) {
      console.error(`Failed to fetch page ${currentPage}:`, error);
      break;
    }
  }

  console.log(`Fetched total of ${allQuotes.length} sponsor quotes`);
  return allQuotes;
}

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Filter quotes by status
 * 
 * @param quotes - Array of sponsor quotes
 * @param status - Status to filter by
 * @returns Filtered array of quotes
 */
export function filterQuotesByStatus(
  quotes: SponsorQuoteItem[],
  status: QuoteStatus
): SponsorQuoteItem[] {
  return quotes.filter((quote) => quote.status === status);
}

/**
 * Sort quotes by interest rate (ascending)
 * 
 * @param quotes - Array of sponsor quotes
 * @returns Sorted array of quotes
 */
export function sortQuotesByInterestRate(
  quotes: SponsorQuoteItem[]
): SponsorQuoteItem[] {
  return [...quotes].sort(
    (a, b) => parseFloat(a.interest_rate) - parseFloat(b.interest_rate)
  );
}

/**
 * Sort quotes by loan amount (descending)
 * 
 * @param quotes - Array of sponsor quotes
 * @returns Sorted array of quotes
 */
export function sortQuotesByLoanAmount(
  quotes: SponsorQuoteItem[]
): SponsorQuoteItem[] {
  return [...quotes].sort(
    (a, b) => parseFloat(b.loan_amount) - parseFloat(a.loan_amount)
  );
}

/**
 * Sort quotes by expiration date (soonest first)
 * 
 * @param quotes - Array of sponsor quotes
 * @returns Sorted array of quotes
 */
export function sortQuotesByExpiration(
  quotes: SponsorQuoteItem[]
): SponsorQuoteItem[] {
  return [...quotes].sort(
    (a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
  );
}

/**
 * Get quotes expiring within specified days
 * 
 * @param quotes - Array of sponsor quotes
 * @param days - Number of days to check
 * @returns Quotes expiring within the specified timeframe
 */
export function getQuotesExpiringWithin(
  quotes: SponsorQuoteItem[],
  days: number
): SponsorQuoteItem[] {
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return quotes.filter((quote) => {
    const expiresAt = new Date(quote.expires_at);
    return expiresAt <= threshold && expiresAt > now;
  });
}

/**
 * Group quotes by property
 * 
 * @param quotes - Array of sponsor quotes
 * @returns Object with property_id as key and array of quotes as value
 */
export function groupQuotesByProperty(
  quotes: SponsorQuoteItem[]
): Record<number, SponsorQuoteItem[]> {
  return quotes.reduce((acc, quote) => {
    const propertyId = quote.property_id;
    if (!acc[propertyId]) {
      acc[propertyId] = [];
    }
    acc[propertyId].push(quote);
    return acc;
  }, {} as Record<number, SponsorQuoteItem[]>);
}

/**
 * Group quotes by loan request
 * 
 * @param quotes - Array of sponsor quotes
 * @returns Object with loan_request as key and array of quotes as value
 */
export function groupQuotesByLoanRequest(
  quotes: SponsorQuoteItem[]
): Record<number, SponsorQuoteItem[]> {
  return quotes.reduce((acc, quote) => {
    const loanRequestId = quote.loan_request;
    if (!acc[loanRequestId]) {
      acc[loanRequestId] = [];
    }
    acc[loanRequestId].push(quote);
    return acc;
  }, {} as Record<number, SponsorQuoteItem[]>);
}

/**
 * Get best quote (lowest interest rate) for each property
 * 
 * @param quotes - Array of sponsor quotes
 * @returns Array of best quotes per property
 */
export function getBestQuotePerProperty(
  quotes: SponsorQuoteItem[]
): SponsorQuoteItem[] {
  const grouped = groupQuotesByProperty(quotes);
  
  return Object.values(grouped).map((propertyQuotes) => {
    return propertyQuotes.reduce((best, current) => {
      return parseFloat(current.interest_rate) < parseFloat(best.interest_rate)
        ? current
        : best;
    });
  });
}

/**
 * Calculate quote statistics
 * 
 * @param quotes - Array of sponsor quotes
 * @returns Statistics object
 */
export function calculateQuoteStats(quotes: SponsorQuoteItem[]) {
  if (quotes.length === 0) {
    return {
      total: 0,
      submitted: 0,
      accepted: 0,
      declined: 0,
      underReview: 0,
      avgInterestRate: 0,
      avgLoanAmount: 0,
      avgLTV: 0,
      avgDSCR: 0,
      totalProperties: 0,
    };
  }

  const submitted = filterQuotesByStatus(quotes, "Submitted").length;
  const accepted = filterQuotesByStatus(quotes, "Accepted").length;
  const declined = filterQuotesByStatus(quotes, "Declined").length;
  const underReview = filterQuotesByStatus(quotes, "Under Review").length;

  const avgInterestRate =
    quotes.reduce((sum, q) => sum + parseFloat(q.interest_rate), 0) / quotes.length;

  const avgLoanAmount =
    quotes.reduce((sum, q) => sum + parseFloat(q.loan_amount), 0) / quotes.length;

  const avgLTV =
    quotes.reduce((sum, q) => sum + parseFloat(q.max_as_is_ltv), 0) / quotes.length;

  const quotesWithDSCR = quotes.filter((q) => q.dscr);
  const avgDSCR =
    quotesWithDSCR.length > 0
      ? quotesWithDSCR.reduce((sum, q) => sum + q.dscr, 0) / quotesWithDSCR.length
      : 0;

  // Count unique properties
  const uniqueProperties = new Set(quotes.map((q) => q.property_id));
  const totalProperties = uniqueProperties.size;

  return {
    total: quotes.length,
    submitted,
    accepted,
    declined,
    underReview,
    avgInterestRate,
    avgLoanAmount,
    avgLTV,
    avgDSCR,
    totalProperties,
  };
}

/**
 * Extract error message from API error response
 * 
 * @param error - Error object from API
 * @returns User-friendly error message
 */
export function extractApiErrorMessage(error: any): string {
  if (!error?.response?.data) {
    return error?.message || "An unexpected error occurred";
  }

  const apiResponse = error.response.data as ApiResponse<any>;

  // Check for field-specific errors
  if (apiResponse.errors) {
    const errorMessages = Object.entries(apiResponse.errors)
      .map(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          return `${field}: ${messages.join(", ")}`;
        }
        if (typeof messages === "string") {
          return `${field}: ${messages}`;
        }
        return null;
      })
      .filter(Boolean);

    if (errorMessages.length > 0) {
      return errorMessages.join("; ");
    }
  }

  // Return general message
  return apiResponse.message || "Request failed";
}
