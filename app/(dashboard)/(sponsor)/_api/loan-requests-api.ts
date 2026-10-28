/**
 * Loan Requests API Client
 * 
 * This module provides typed API functions for interacting with the Loan Requests endpoints.
 * All endpoints follow a standardized response format with success/error handling.
 * 
 * API Documentation: See loan-requests-api-docs.md for detailed endpoint specifications
 * 
 * Base Endpoints:
 * - GET/POST /api/loans/requests/ - List/Create loan requests
 * - GET/PATCH/DELETE /api/loans/requests/<id>/ - Retrieve/Update/Delete specific request
 * - GET /api/loans/requests/<id>/quotes/ - Get quotes for a request
 * - GET /api/loans/quotes/<id>/ - Get quote details
 * - POST /api/loans/quotes/<id>/accept/ - Accept a quote
 * - POST /api/loans/quotes/<id>/decline/ - Decline a quote
 * - GET /api/loans/dashboard/sponsor/ - Get sponsor dashboard data
 * 
 * Authentication: All endpoints require JWT Bearer token
 * 
 * @module loan-requests-api
 */

import api from "@/lib/apiClient";
import type {
  LoanQuote,
  LoanComparisonSummary,
  LoanQuoteDetail,
} from "../loan/_components/loan-types";

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Standard API Response Envelope
 * All API responses follow this structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: T | null;
  errors: Record<string, string[]> | null;
}

/**
 * Paginated API Response
 */
export interface PaginatedApiResponse<T = any> {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  page_size: number;
  results: T[];
}

export interface SponsorLoanRequestItem {
  id: number;
  property: number;
  property_name: string;
  property_address: string;
  property_type: string;
  occupancy?: string;
  year_built?: number;
  property_image_url?: string | null;
  thumbnail_url?: string | null;
  property_images?: string[];
  requested_amount: string;
  loan_term: number;
  ltv: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  memorandum_links?: { id: number; title: string; url: string }[];
  document_links?: { id: number; url: string }[];
}

export interface CreateLoanRequestPayload {
  property: number;
  requested_amount: string | number;
  loan_term: number;
  ltv: string | number;
}

export interface UpdateLoanRequestPayload {
  requested_amount?: string | number;
  loan_term?: number;
  ltv?: string | number;
}

export interface SponsorDashboardHeaderStats {
  total_properties: number;
  total_loan_requests: number;
  quotes_received: number;
  accepted_quotes: number;
}

export interface SponsorLoanDashboardData {
  total_properties: number;
  total_loan_requests: number;
  quotes_received: number;
  accepted_quotes: number;
}

// ── API Methods ──────────────────────────────────────────────────────────────

/**
 * Fetch Sponsor Dashboard data
 * GET /api/loans/dashboard/sponsor/
 * 
 * Returns sponsor dashboard statistics including:
 * - total_properties: Total number of properties owned by the sponsor
 * - total_loan_requests: Total number of loan requests created
 * - quotes_received: Total number of loan quotes received
 * - accepted_quotes: Number of quotes that have been accepted
 * 
 * Authentication: Required (Bearer Token)
 * Permission: Sponsor Only
 */
export async function fetchSponsorDashboard(): Promise<SponsorLoanDashboardData> {
  try {
    const response = await api.get("/api/loans/dashboard/sponsor/");
    
    // Handle standard API response format
    const apiData = response?.data as ApiResponse<any>;
    const raw = apiData?.data ?? response?.data ?? {};

    return {
      total_properties: Number(raw.total_properties) || 0,
      total_loan_requests: Number(raw.total_loan_requests) || 0,
      quotes_received: Number(raw.quotes_received) || 0,
      accepted_quotes: Number(raw.accepted_quotes) || 0,
    };
  } catch (err: any) {
    console.error("Failed to fetch sponsor dashboard", err);
    
    // Return default values on error
    return {
      total_properties: 0,
      total_loan_requests: 0,
      quotes_received: 0,
      accepted_quotes: 0,
    };
  }
}

/**
 * Fetch All Loan Requests
 * GET /api/loans/requests/
 * 
 * Sponsors see their own loan requests
 * Lenders see all Active loan requests
 * 
 * Supports pagination via query params:
 * - page: Page number (default: 1)
 * - page_size: Items per page (default: 9)
 */
export async function fetchLoanRequests(
  page: number = 1,
  pageSize: number = 100
): Promise<SponsorLoanRequestItem[]> {
  let response;
  try {
    response = await api.get(`/api/loans/requests/?page=${page}&page_size=${pageSize}`);
  } catch (err: any) {
    console.error("Failed to fetch loan requests", err);
    return [];
  }

  console.log("Raw API Response:", response?.data);

  // Handle standard API response format
  const apiData = response?.data as ApiResponse<PaginatedApiResponse<any>>;
  
  // Extract data from standard envelope
  const paginatedData = apiData?.data;
  
  console.log("Paginated Data:", paginatedData);
  console.log("Results Array:", paginatedData?.results);
  
  // Try multiple possible response structures
  let raw = paginatedData?.results ?? [];
  
  // Fallback: Check if data is directly an array
  if (!Array.isArray(raw) && Array.isArray(apiData?.data)) {
    raw = apiData.data;
  }
  
  // Fallback: Check if response.data is directly an array
  if (!Array.isArray(raw) && Array.isArray(response?.data)) {
    raw = response.data;
  }
  
  // Fallback: Check if there's a results field at top level
  if (!Array.isArray(raw) && Array.isArray(response?.data?.results)) {
    raw = response.data.results;
  }

  console.log("Final Raw Array:", raw);
  console.log("Array Length:", Array.isArray(raw) ? raw.length : 0);

  if (!Array.isArray(raw)) {
    console.error("Could not find array in response. Response structure:", response?.data);
    return [];
  }

  return raw.map((item: any) => ({
    id: Number(item.id),
    property:
      typeof item.property === "object" && item.property !== null
        ? Number(item.property.id)
        : Number(item.property),
    property_name:
      item.property_name ||
      (typeof item.property === "object" ? item.property.property_name : "") ||
      `Property #${item.property}`,
    property_address:
      item.property_address ||
      (typeof item.property === "object" ? item.property.property_address : "") ||
      "",
    property_type:
      item.property_type ||
      (typeof item.property === "object" ? item.property.property_type : "") ||
      "Commercial",
    occupancy: item.occupancy,
    year_built: item.year_built ? Number(item.year_built) : undefined,
    property_image_url:
      item.thumbnail_url ||
      item.property_image_url ||
      (Array.isArray(item.property_images) ? item.property_images[0] : null) ||
      null,
    thumbnail_url: item.thumbnail_url || item.property_image_url || null,
    property_images: Array.isArray(item.property_images) ? item.property_images : [],
    requested_amount: String(item.requested_amount || "0"),
    loan_term: Number(item.loan_term || 0),
    ltv: String(item.ltv || "0"),
    status: item.status || "Pending",
    created_at: item.created_at,
    updated_at: item.updated_at,
    memorandum_links: Array.isArray(item.memorandum_links) ? item.memorandum_links : [],
    document_links: Array.isArray(item.document_links) ? item.document_links : [],
  }));
}

/**
 * Fetch Details of a Loan Request
 * GET /api/loans/requests/<id>/
 * 
 * Returns detailed information about a specific loan request
 * Lenders can only view Active requests
 */
export async function fetchLoanRequestDetail(
  id: number,
): Promise<SponsorLoanRequestItem | null> {
  let response;
  try {
    response = await api.get(`/api/loans/requests/${id}/`);
  } catch (err) {
    console.error(`Failed to fetch loan request #${id}`, err);
    return null;
  }

  // Handle standard API response format
  const apiData = response?.data as ApiResponse<any>;
  const raw = apiData?.data ?? response?.data;
  
  if (!raw) return null;

  return {
    id: Number(raw.id),
    property:
      typeof raw.property === "object" && raw.property !== null
        ? Number(raw.property.id)
        : Number(raw.property),
    property_name:
      raw.property_name ||
      (typeof raw.property === "object" ? raw.property.property_name : "") ||
      `Property #${raw.property}`,
    property_address:
      raw.property_address ||
      (typeof raw.property === "object" ? raw.property.property_address : "") ||
      "",
    property_type:
      raw.property_type ||
      (typeof raw.property === "object" ? raw.property.property_type : "") ||
      "Commercial",
    occupancy: raw.occupancy,
    year_built: raw.year_built ? Number(raw.year_built) : undefined,
    property_image_url:
      raw.thumbnail_url ||
      raw.property_image_url ||
      (Array.isArray(raw.property_images) ? raw.property_images[0] : null) ||
      null,
    thumbnail_url: raw.thumbnail_url || raw.property_image_url || null,
    property_images: Array.isArray(raw.property_images) ? raw.property_images : [],
    requested_amount: String(raw.requested_amount || "0"),
    loan_term: Number(raw.loan_term || 0),
    ltv: String(raw.ltv || "0"),
    status: raw.status || "Pending",
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    memorandum_links: Array.isArray(raw.memorandum_links) ? raw.memorandum_links : [],
    document_links: Array.isArray(raw.document_links) ? raw.document_links : [],
  };
}

/**
 * Create a new Loan Request
 * POST /api/loans/requests/
 * 
 * Sponsors only - Creates a new loan request for a property they own
 * 
 * Requirements:
 * - Must own the property
 * - Property must have a published memorandum
 * 
 * Possible Errors:
 * - 400: Property not owned or no published memorandum
 * - 403: Lender attempting to create (Sponsors only)
 */
export async function createLoanRequest(
  payload: CreateLoanRequestPayload,
): Promise<SponsorLoanRequestItem> {
  const formattedBody = {
    property: Number(payload.property),
    requested_amount:
      typeof payload.requested_amount === "number"
        ? payload.requested_amount.toFixed(2)
        : String(payload.requested_amount),
    loan_term: Number(payload.loan_term),
    ltv:
      typeof payload.ltv === "number"
        ? payload.ltv.toFixed(2)
        : String(payload.ltv),
  };

  let response;
  try {
    response = await api.post("/api/loans/requests/", formattedBody);
  } catch (err: any) {
    // Re-throw to preserve error details for UI handling
    throw err;
  }

  // Handle standard API response format
  const apiData = response?.data as ApiResponse<SponsorLoanRequestItem>;
  return apiData?.data ?? response?.data;
}

/**
 * Update an existing Loan Request
 * PATCH /api/loans/requests/<id>/
 * 
 * Sponsors only - Update loan request details
 * 
 * Restrictions:
 * - Cannot update closed loan requests
 * - Must be the owner of the loan request
 * 
 * Possible Errors:
 * - 400: Attempting to update closed request
 * - 403: Not the owner of the loan request
 */
export async function updateLoanRequest(
  id: number,
  payload: UpdateLoanRequestPayload,
): Promise<SponsorLoanRequestItem> {
  const formattedBody: Record<string, any> = {};

  if (payload.requested_amount !== undefined) {
    formattedBody.requested_amount =
      typeof payload.requested_amount === "number"
        ? payload.requested_amount.toFixed(2)
        : String(payload.requested_amount);
  }

  if (payload.ltv !== undefined) {
    formattedBody.ltv =
      typeof payload.ltv === "number"
        ? payload.ltv.toFixed(2)
        : String(payload.ltv);
  }

  if (payload.loan_term !== undefined) {
    formattedBody.loan_term = Number(payload.loan_term);
  }

  let response;
  try {
    response = await api.patch(`/api/loans/requests/${id}/`, formattedBody);
  } catch (err: any) {
    // Re-throw to preserve error details for UI handling
    throw err;
  }

  // Handle standard API response format
  const apiData = response?.data as ApiResponse<SponsorLoanRequestItem>;
  return apiData?.data ?? response?.data;
}

/**
 * Delete an existing Loan Request
 * DELETE /api/loans/requests/<id>/
 * 
 * Sponsors only - Permanently delete a loan request
 * 
 * Possible Errors:
 * - 403: Not the owner of the loan request
 */
export async function deleteLoanRequest(id: number): Promise<void> {
  try {
    const response = await api.delete(`/api/loans/requests/${id}/`);
    // Standard API response with success message
    const apiData = response?.data as ApiResponse<null>;
    if (!apiData?.success) {
      throw new Error(apiData?.message || "Failed to delete loan request");
    }
  } catch (err: any) {
    // Re-throw to preserve error details for UI handling
    throw err;
  }
}

/**
 * Fetch all quotes for a specific Loan Request ID
 * Postman: GET /api/loans/requests/{{id}}/quotes/
 */
/**
 * Fetch all quotes for a specific Loan Request ID
 * GET /api/loans/requests/{id}/quotes/
 * 
 * Returns all quotes submitted for a specific loan request.
 * Uses the standard API response format with pagination support.
 */
export async function fetchQuotesForLoanRequest(
  loanRequestId: number,
): Promise<LoanQuoteDetail[]> {
  try {
    const response = await api.get(`/api/loans/requests/${loanRequestId}/quotes/`);
    
    console.log("Quotes for Request API Response:", response?.data);
    
    // Handle standard API response format
    const apiData = response?.data as ApiResponse<PaginatedApiResponse<any>>;
    
    // Try to extract from paginated response
    let raw = apiData?.data?.results;
    
    // Fallback: Try direct data array (if data is an array itself)
    if (!Array.isArray(raw) && Array.isArray(apiData?.data)) {
      raw = apiData?.data;
    }
    
    // Fallback: Try response.data.results
    if (!Array.isArray(raw) && Array.isArray(response?.data?.results)) {
      raw = response.data.results;
    }
    
    // Fallback: Try response.data directly
    if (!Array.isArray(raw) && Array.isArray(response?.data)) {
      raw = response.data;
    }
    
    if (!Array.isArray(raw)) {
      console.error("Expected quotes array, got:", raw);
      return [];
    }

    return raw.map((item: any) => ({
      id: Number(item.id),
      loan_request: Number(item.loan_request ?? loanRequestId),
      lender: Number(item.lender),
      lender_name: item.lender_name || "Commercial Lender",
      guarantor: item.guarantor || "",
      status: item.status || "Pending",
      expires_at: item.expires_at || null,
      submitted_at: item.submitted_at || item.created_at || "",
      updated_at: item.updated_at || "",
      loan_amount: String(item.loan_amount || "0"),
      initial_funding: String(item.initial_funding || "0"),
      future_funding: String(item.future_funding || "0"),
      sponsor_equity: String(item.sponsor_equity || "0"),
      max_as_is_ltv: String(item.max_as_is_ltv || "0"),
      max_ltc: String(item.max_ltc || "0"),
      max_as_stabilized_ltv: String(item.max_as_stabilized_ltv || "0"),
      min_as_is_dy: String(item.min_as_is_dy || "0"),
      min_stabilized_dy: String(item.min_stabilized_dy || "0"),
      term: item.term || 0,
      interest_rate: String(item.interest_rate || "0"),
      amortization: item.amortization || "",
      prepayment: item.prepayment || "",
      origination_fee: String(item.origination_fee || "0"),
      capex_reserve: String(item.capex_reserve || "0"),
      ff_and_e_reserve: String(item.ff_and_e_reserve || "0"),
      interest_carry_reserve: String(item.interest_carry_reserve || "0"),
      extension_conditions: item.extension_conditions || "",
      collateral: item.collateral || "",
      recourse: item.recourse || "",
      dscr: Number(item.dscr) || 0,
    }));
  } catch (err) {
    console.error(`Failed to fetch quotes for loan request #${loanRequestId}`, err);
    return [];
  }
}

/**
 * Fetch Details of a Single Loan Quote
 * GET /api/loans/quotes/{id}/
 * 
 * Returns detailed information about a specific quote.
 */
export async function fetchLoanQuoteDetail(
  quoteId: number,
): Promise<LoanQuoteDetail | null> {
  try {
    const response = await api.get(`/api/loans/quotes/${quoteId}/`);
    
    console.log("Loan Quote Detail API Response:", response?.data);
    
    // Handle standard API response format
    const apiData = response?.data as ApiResponse<any>;
    const raw = apiData?.data ?? response?.data;
    
    if (!raw) return null;

    return {
      id: Number(raw.id),
      loan_request: Number(raw.loan_request),
      lender: Number(raw.lender),
      lender_name: raw.lender_name || "Commercial Lender",
      guarantor: raw.guarantor || "",
      status: raw.status || "Pending",
      expires_at: raw.expires_at || null,
      submitted_at: raw.submitted_at || raw.created_at || "",
      updated_at: raw.updated_at || "",
      loan_amount: String(raw.loan_amount || "0"),
      initial_funding: String(raw.initial_funding || "0"),
      future_funding: String(raw.future_funding || "0"),
      sponsor_equity: String(raw.sponsor_equity || "0"),
      max_as_is_ltv: String(raw.max_as_is_ltv || "0"),
      max_ltc: String(raw.max_ltc || "0"),
      max_as_stabilized_ltv: String(raw.max_as_stabilized_ltv || "0"),
      min_as_is_dy: String(raw.min_as_is_dy || "0"),
      min_stabilized_dy: String(raw.min_stabilized_dy || "0"),
      term: raw.term || 0,
      interest_rate: String(raw.interest_rate || "0"),
      amortization: raw.amortization || "",
      prepayment: raw.prepayment || "",
      origination_fee: String(raw.origination_fee || "0"),
      capex_reserve: String(raw.capex_reserve || "0"),
      ff_and_e_reserve: String(raw.ff_and_e_reserve || "0"),
      interest_carry_reserve: String(raw.interest_carry_reserve || "0"),
      extension_conditions: raw.extension_conditions || "",
      collateral: raw.collateral || "",
      recourse: raw.recourse || "",
      dscr: Number(raw.dscr) || 0,
    };
  } catch (err) {
    console.error(`Failed to fetch loan quote #${quoteId}`, err);
    return null;
  }
}

/**
 * Accept a Loan Quote
 * POST /api/loans/quotes/{id}/accept/
 * 
 * Accepts a specific loan quote and declines all other quotes for the same loan request.
 */
export async function acceptLoanQuote(quoteId: number): Promise<any> {
  try {
    const response = await api.post(`/api/loans/quotes/${quoteId}/accept/`);
    return response?.data;
  } catch (err: any) {
    console.error(`Failed to accept loan quote #${quoteId}`, err);
    throw err;
  }
}

/**
 * Decline a Loan Quote
 * Postman: POST /api/v1/loans/quotes/{{id}}/decline/
 */
export async function declineLoanQuote(quoteId: number): Promise<any> {
  let response;
  try {
    response = await api.post(`/api/loans/quotes/${quoteId}/decline/`);
  } catch (err: any) {
    throw err;
  }
  return response?.data;
}




/**
 * Fetch All Sponsor Quotes
 * GET /api/loans/sponsor/quotes/
 * 
 * Returns all quotes for the authenticated sponsor across all their properties.
 * Includes property names and full quote details.
 * 
 * Authentication: Required (Bearer Token)
 * Permission: Sponsor Only
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - page_size: Items per page (default: 10)
 * 
 * @param page - Page number for pagination
 * @param pageSize - Number of items per page
 * @returns Array of LoanQuote objects with property names
 */
export async function fetchAllSponsorQuotes(
  page: number = 1,
  pageSize: number = 100
): Promise<LoanQuote[]> {
  try {
    const response = await api.get(
      `/api/loans/sponsor/quotes/?page=${page}&page_size=${pageSize}`
    );
    
    console.log("Sponsor Quotes API Response:", response?.data);
    
    const apiData = response?.data as ApiResponse<PaginatedApiResponse<any>>;
    
    // Extract results from paginated response
    const quotes = apiData?.data?.results ?? [];
    
    if (!Array.isArray(quotes)) {
      console.error("Expected quotes array, got:", quotes);
      return [];
    }
    
    // Map API response to LoanQuote interface
    return quotes.map((item: any) => ({
      id: Number(item.id),
      lender_name: item.lender_name || "Unknown Lender",
      property_name: item.property_name || "N/A",
      loan_amount: String(item.loan_amount || "0"),
      max_as_is_ltv: item.max_as_is_ltv || "0",
      interest_rate: item.interest_rate || "0",
      term: item.term || 0,
      origination_fee: item.origination_fee || "0",
      dscr: item.dscr || 0,
      expires_at: item.expires_at,
      status: item.status || "Submitted",
      loan_request: Number(item.loan_request),
    }));
  } catch (error: any) {
    console.error("Failed to fetch sponsor quotes", error);
    
    // If 403, user doesn't have permission
    if (error?.response?.status === 403) {
      throw new Error("You do not have permission to view these quotes");
    }
    
    return [];
  }
}

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Extract error messages from API error response
 * Handles both field-specific errors and general error messages
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

/**
 * Check if error is a specific type
 */
export function isApiError(error: any, statusCode: number): boolean {
  return error?.response?.data?.statusCode === statusCode;
}

/**
 * Check if user lacks permission for the action
 */
export function isForbiddenError(error: any): boolean {
  return isApiError(error, 403);
}

/**
 * Check if request is invalid (validation errors)
 */
export function isBadRequestError(error: any): boolean {
  return isApiError(error, 400);
}
