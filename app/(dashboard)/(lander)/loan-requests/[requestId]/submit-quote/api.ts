import api from "@/lib/apiClient";

// ============================================
// Types
// ============================================

export type MemorandumLink = {
  id: number;
  title: string;
  url: string;
};

export type DocumentLink = {
  id: number;
  url: string;
};

export type LoanRequestDetail = {
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
  updated_at: string;
  memorandum_links: MemorandumLink[];
  document_links: DocumentLink[];
};

export type QuoteSubmissionPayload = {
  lender_name: string;
  guarantor: string;
  expires_at: string;
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
};

export type QuoteSubmissionResponse = {
  id: number;
  loan_request: number;
  lender: number;
  lender_name: string;
  guarantor: string;
  status: string;
  expires_at: string;
  submitted_at: string;
  updated_at: string;
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
};

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: T | null;
  errors: Record<string, string[]> | null;
};

type ApiEnvelope<T> = {
  data?: T;
};

// ============================================
// API Functions
// ============================================

/**
 * Fetch loan request details
 * GET /api/loans/requests/{requestId}/
 * @param requestId - The loan request ID
 */
export const fetchLoanRequestDetail = async (
  requestId: number
): Promise<LoanRequestDetail | null> => {
  try {
    const response = await api.get<ApiEnvelope<LoanRequestDetail>>(
      `/api/loans/requests/${requestId}/`
    );
    return response.data?.data ?? null;
  } catch (error) {
    console.error("Failed to fetch loan request detail:", error);
    throw error;
  }
};

/**
 * Submit a loan quote
 * POST /api/loans/requests/{requestId}/quotes/
 * @param requestId - The loan request ID
 * @param payload - The quote submission data
 */
export const submitLoanQuote = async (
  requestId: number,
  payload: QuoteSubmissionPayload
): Promise<ApiResponse<QuoteSubmissionResponse>> => {
  try {
    const response = await api.post<ApiResponse<QuoteSubmissionResponse>>(
      `/api/loans/requests/${requestId}/quotes/`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to submit loan quote:", error);
    throw error;
  }
};

// ============================================
// Utility Functions
// ============================================

/**
 * Format currency value for display
 */
export const formatCurrency = (value: string | number | undefined): string => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(parsed);
};

/**
 * Convert datetime-local value to ISO 8601 format
 */
export const toISODateTime = (datetimeLocal: string): string => {
  const parsed = new Date(datetimeLocal);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
};

/**
 * Convert date to datetime-local format
 */
export const toDateTimeLocalValue = (value?: string | Date): string => {
  let date: Date;

  if (!value) {
    date = new Date();
    date.setDate(date.getDate() + 30); // Default 30 days from now
  } else if (typeof value === "string") {
    date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      date = new Date();
      date.setDate(date.getDate() + 30);
    }
  } else {
    date = value;
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

/**
 * Calculate initial funding (84% of loan amount)
 */
export const calculateInitialFunding = (loanAmount: number): string => {
  return (loanAmount * 0.84).toFixed(2);
};

/**
 * Calculate future funding
 */
export const calculateFutureFunding = (
  loanAmount: number,
  initialFunding: number
): string => {
  return (loanAmount - initialFunding).toFixed(2);
};

/**
 * Calculate sponsor equity (25% of loan amount)
 */
export const calculateSponsorEquity = (loanAmount: number): string => {
  return (loanAmount * 0.25).toFixed(2);
};

// ============================================
// Error Handling Types
// ============================================

export type QuoteSubmissionError = {
  type:
    | "validation"
    | "permission"
    | "business_rule"
    | "not_found"
    | "network"
    | "unknown";
  message: string;
  fieldErrors?: Record<string, string[]>;
  statusCode?: number;
};

/**
 * Parse API error response into structured error
 */
export const parseQuoteSubmissionError = (error: any): QuoteSubmissionError => {
  const errorResponse = error?.response?.data;

  if (!errorResponse) {
    return {
      type: "network",
      message:
        "Unable to submit quote. Please check your connection and try again.",
    };
  }

  // Case 1: Validation errors (400) with field-specific errors
  if (errorResponse.errors && typeof errorResponse.errors === "object") {
    return {
      type: "validation",
      message: errorResponse.message || "Validation errors occurred.",
      fieldErrors: errorResponse.errors,
      statusCode: errorResponse.statusCode || 400,
    };
  }

  // Case 2: Permission error (403)
  if (errorResponse.statusCode === 403) {
    return {
      type: "permission",
      message: errorResponse.message || "Permission denied.",
      statusCode: 403,
    };
  }

  // Case 3: Business rule error (400)
  if (errorResponse.statusCode === 400 && errorResponse.message) {
    return {
      type: "business_rule",
      message: errorResponse.message,
      statusCode: 400,
    };
  }

  // Case 4: Not found (404)
  if (error?.response?.status === 404) {
    return {
      type: "not_found",
      message: errorResponse.detail || "Loan request not found. It may have been deleted.",
      statusCode: 404,
    };
  }

  // Case 5: Generic error with detail
  if (errorResponse.detail) {
    return {
      type: "unknown",
      message: errorResponse.detail,
      statusCode: error?.response?.status,
    };
  }

  // Case 6: Generic error with message
  if (errorResponse.message) {
    return {
      type: "unknown",
      message: errorResponse.message,
      statusCode: errorResponse.statusCode,
    };
  }

  // Fallback
  return {
    type: "unknown",
    message: "Failed to submit quote. Please try again.",
    statusCode: error?.response?.status,
  };
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (
  fieldErrors: Record<string, string[]>,
  maxDisplay: number = 3
): { messages: string[]; totalCount: number } => {
  const messages: string[] = [];

  Object.keys(fieldErrors).forEach((field) => {
    const errors = fieldErrors[field];
    if (Array.isArray(errors)) {
      errors.forEach((errorMsg) => {
        messages.push(`${field}: ${errorMsg}`);
      });
    }
  });

  return {
    messages: messages.slice(0, maxDisplay),
    totalCount: messages.length,
  };
};
