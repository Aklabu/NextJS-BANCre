/**
 * Loan Request Detail API Client
 * 
 * This module provides typed API functions for fetching loan request details and managing quotes.
 * 
 * API Endpoints:
 * - GET /api/loans/requests/<id>/ - Get loan request details
 * - GET /api/loans/requests/<id>/quotes/ - Get all quotes for a request
 * - POST /api/loans/quotes/<id>/accept/ - Accept a quote
 * - POST /api/loans/quotes/<id>/decline/ - Decline a quote
 * 
 * @module loan-request-detail-api
 */

import api from "@/lib/apiClient";

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Standard API Response Envelope
 */
export interface ApiResponse<T = any> {
  status: "success" | "error";
  message: string | null;
  data: T | null;
  errors: Record<string, string[]> | null;
  status_code: number;
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
 * Loan Request Detail
 */
export interface LoanRequestDetail {
  id: number;
  property: number;
  property_name: string;
  property_address: string;
  property_type: string;
  occupancy?: string;
  year_built?: number;
  property_image_url?: string | null;
  requested_amount: string;
  loan_term: number;
  ltv: string;
  status: string;
  created_at: string;
  updated_at: string;
  memorandum_links?: Array<{
    id: number;
    title: string;
    url: string;
  }>;
  document_links?: Array<{
    id: number;
    url: string;
  }>;
}

/**
 * Quote Detail
 */
export interface QuoteDetail {
  id: number;
  loan_request: number;
  lender: number;
  lender_name: string;
  guarantor?: string;
  status: string;
  expires_at?: string | null;
  submitted_at?: string;
  updated_at?: string;
  loan_amount: string;
  initial_funding?: string;
  future_funding?: string;
  sponsor_equity?: string;
  max_as_is_ltv?: string;
  max_ltc?: string;
  max_as_stabilized_ltv?: string;
  min_as_is_dy?: string;
  min_stabilized_dy?: string;
  term: number;
  interest_rate: string;
  amortization?: string;
  prepayment?: string;
  origination_fee: string;
  capex_reserve?: string;
  ff_and_e_reserve?: string;
  interest_carry_reserve?: string;
  extension_conditions?: string;
  collateral?: string;
  recourse?: string;
  dscr?: number;
}

// ── API Methods ──────────────────────────────────────────────────────────────

/**
 * Fetch Loan Request Detail
 * GET /api/loans/requests/<id>/
 * 
 * Retrieves detailed information about a specific loan request
 * Sponsor only - must own the loan request
 * 
 * @param id - Loan request ID
 * @returns LoanRequestDetail object
 */
export async function fetchLoanRequestDetail(
  id: number
): Promise<LoanRequestDetail> {
  try {
    const response = await api.get(`/api/loans/requests/${id}/`);
    const apiData = response?.data as ApiResponse<LoanRequestDetail>;
    
    console.log("Loan Request Detail Response:", apiData);
    
    if (!apiData.data) {
      throw new Error(apiData.message || "Failed to fetch loan request details");
    }
    
    return apiData.data;
  } catch (error: any) {
    console.error(`Failed to fetch loan request #${id}`, error);
    throw error;
  }
}

/**
 * Fetch Quotes for Loan Request
 * GET /api/loans/requests/<id>/quotes/
 * 
 * Get all quotes submitted for a specific loan request
 * Sponsor only - must own the loan request
 * Supports pagination
 * 
 * @param loanRequestId - Loan request ID
 * @param page - Page number (default: 1)
 * @param pageSize - Items per page (default: 100)
 * @returns Array of QuoteDetail objects
 */
export async function fetchQuotesForLoanRequest(
  loanRequestId: number,
  page: number = 1,
  pageSize: number = 100
): Promise<QuoteDetail[]> {
  try {
    const response = await api.get(
      `/api/loans/requests/${loanRequestId}/quotes/?page=${page}&page_size=${pageSize}`
    );
    
    const apiData = response?.data as ApiResponse<PaginatedApiResponse<QuoteDetail>>;
    
    console.log("Quotes Response:", apiData);
    
    // Extract data from response
    const paginatedData = apiData?.data;
    const quotes = paginatedData?.results ?? [];
    
    if (!Array.isArray(quotes)) {
      console.error("Expected quotes array, got:", quotes);
      return [];
    }
    
    return quotes;
  } catch (error: any) {
    console.error(`Failed to fetch quotes for loan request #${loanRequestId}`, error);
    
    // If 403, user doesn't own the request
    if (error?.response?.status === 403) {
      throw new Error("You do not have permission to view these quotes");
    }
    
    return [];
  }
}

/**
 * Fetch Quote Detail
 * GET /api/loans/quotes/<id>/
 * 
 * Retrieves detailed information about a specific quote
 * 
 * @param quoteId - Quote ID
 * @returns QuoteDetail object
 */
export async function fetchQuoteDetail(quoteId: number): Promise<QuoteDetail> {
  try {
    const response = await api.get(`/api/loans/quotes/${quoteId}/`);
    const apiData = response?.data as ApiResponse<QuoteDetail>;
    
    console.log("Quote Detail Response:", apiData);
    
    if (!apiData.data) {
      throw new Error(apiData.message || "Failed to fetch quote details");
    }
    
    return apiData.data;
  } catch (error: any) {
    console.error(`Failed to fetch quote #${quoteId}`, error);
    
    // Extract error message from response
    const errorMessage = extractApiErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Accept a Quote
 * POST /api/loans/quotes/<id>/accept/
 * 
 * Accept a specific quote. This will:
 * - Set the quote status to "Accepted"
 * - Decline all other quotes on the same loan request
 * - Close the loan request
 * - Send notifications to all lenders
 * 
 * Sponsor only - must own the associated loan request
 * 
 * @param quoteId - Quote ID to accept
 * @returns Updated QuoteDetail object
 */
export async function acceptQuote(quoteId: number): Promise<QuoteDetail> {
  try {
    const response = await api.post(`/api/loans/quotes/${quoteId}/accept/`);
    const apiData = response?.data as ApiResponse<QuoteDetail>;
    
    console.log("Accept Quote Response:", apiData);
    
    if (!apiData.data) {
      throw new Error(apiData.message || "Failed to accept quote");
    }
    
    return apiData.data;
  } catch (error: any) {
    console.error(`Failed to accept quote #${quoteId}`, error);
    
    // Extract error message from response
    const errorMessage = extractApiErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Decline a Quote
 * POST /api/loans/quotes/<id>/decline/
 * 
 * Decline a specific quote. This will:
 * - Set the quote status to "Declined"
 * - NOT affect other quotes or the loan request status
 * - Send notification to the lender
 * 
 * Sponsor only - must own the associated loan request
 * 
 * @param quoteId - Quote ID to decline
 * @returns Updated QuoteDetail object
 */
export async function declineQuote(quoteId: number): Promise<QuoteDetail> {
  try {
    const response = await api.post(`/api/loans/quotes/${quoteId}/decline/`);
    const apiData = response?.data as ApiResponse<QuoteDetail>;
    
    console.log("Decline Quote Response:", apiData);
    
    if (!apiData.data) {
      throw new Error(apiData.message || "Failed to decline quote");
    }
    
    return apiData.data;
  } catch (error: any) {
    console.error(`Failed to decline quote #${quoteId}`, error);
    
    // Extract error message from response
    const errorMessage = extractApiErrorMessage(error);
    throw new Error(errorMessage);
  }
}

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Extract error messages from API error response
 * Handles the custom response format with status, message, and errors
 */
export function extractApiErrorMessage(error: any): string {
  if (!error?.response?.data) {
    return error?.message || "An unexpected error occurred";
  }

  const apiResponse = error.response.data as ApiResponse<any>;

  // Check for specific error message
  if (apiResponse.message) {
    return apiResponse.message;
  }

  // Check for field-specific errors
  if (apiResponse.errors) {
    const errorMessages = Object.entries(apiResponse.errors)
      .map(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          return `${field}: ${messages.join(", ")}`;
        }
        return null;
      })
      .filter(Boolean);

    if (errorMessages.length > 0) {
      return errorMessages.join("; ");
    }
  }

  // Check for detail field (DRF standard)
  if (error.response.data.detail) {
    return error.response.data.detail;
  }

  // Fallback
  return "Request failed";
}

/**
 * Check if error is a specific status code
 */
export function isApiError(error: any, statusCode: number): boolean {
  return error?.response?.status === statusCode || 
         error?.response?.data?.status_code === statusCode;
}

/**
 * Check if user lacks permission (403)
 */
export function isForbiddenError(error: any): boolean {
  return isApiError(error, 403);
}

/**
 * Check if request is invalid (400)
 */
export function isBadRequestError(error: any): boolean {
  return isApiError(error, 400);
}

/**
 * Check if resource not found (404)
 */
export function isNotFoundError(error: any): boolean {
  return isApiError(error, 404);
}

/**
 * Check if unauthorized (401)
 */
export function isUnauthorizedError(error: any): boolean {
  return isApiError(error, 401);
}
