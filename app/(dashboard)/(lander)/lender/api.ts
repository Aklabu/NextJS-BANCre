import api from "@/lib/apiClient";

// ==================== Types ====================

export type LenderDashboardStats = {
  active_requests: number;
  quotes_provided: number;
  pending_review: number;
  accepted_quotes: number;
};

export type AcceptedQuote = {
  id: number;
  loan_request: number;
  status: string;
  expires_at: string;
  submitted_at: string;
  updated_at: string;
  lender: number;
  lender_id: number;
  lender_name: string;
  lender_first_name: string;
  lender_last_name: string;
  lender_email: string;
  lender_company: string;
  sponsor_id: number;
  sponsor_first_name: string;
  sponsor_last_name: string;
  sponsor_email: string;
  sponsor_company: string;
  property_id: number;
  property_name: string;
  property_address: string;
  property_type: string;
  property_image_url: string | null;
  guarantor: string;
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

export type AcceptedQuotesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
  current_page: number;
  page_size: number;
  results: AcceptedQuote[];
};

export type PropertyMapItem = {
  id: number;
  property_name: string;
  property_address: string;
  property_type: string;
  latitude: string;
  longitude: string;
};

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: T;
  errors: null | unknown;
};

// ==================== API Functions ====================

/**
 * Fetch lender dashboard statistics
 * Returns active requests, quotes provided, pending review, and accepted quotes counts
 */
export const fetchLenderDashboardStats = async (): Promise<LenderDashboardStats> => {
  try {
    const response = await api.get<ApiResponse<LenderDashboardStats>>(
      "/api/dashboard/lender/"
    );
    
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch lender dashboard stats:", error);
    throw error;
  }
};

/**
 * Fetch accepted quotes for the lender
 * Supports pagination through page parameter
 */
export const fetchAcceptedQuotes = async (
  page: number = 1,
  pageSize: number = 9
): Promise<AcceptedQuotesResponse> => {
  try {
    const response = await api.get<ApiResponse<AcceptedQuotesResponse>>(
      "/api/loans/quotes/accepted/",
      {
        params: {
          page,
          page_size: pageSize,
        },
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch accepted quotes:", error);
    throw error;
  }
};

/**
 * Fetch properties with active loan requests for map display
 * Returns properties with latitude/longitude coordinates
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
 * Fetch all lender dashboard data in parallel
 * Returns stats, accepted quotes, and property map data
 */
export const fetchLenderDashboardData = async () => {
  try {
    const [stats, quotes, properties] = await Promise.all([
      fetchLenderDashboardStats(),
      fetchAcceptedQuotes(1, 9),
      fetchPropertiesMap(),
    ]);

    return {
      stats,
      quotes,
      properties,
    };
  } catch (error) {
    console.error("Failed to fetch lender dashboard data:", error);
    throw error;
  }
};
