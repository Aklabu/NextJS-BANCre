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

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: T | null;
  errors: null | any;
};

// ============================================
// API Functions
// ============================================

/**
 * Fetch loan request detail
 * GET /api/loans/requests/{id}/
 * @param requestId - The loan request ID
 */
export const fetchLoanRequestDetail = async (
  requestId: number
): Promise<LoanRequestDetail> => {
  try {
    const response = await api.get<ApiResponse<LoanRequestDetail>>(
      `/api/loans/requests/${requestId}/`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || "Failed to fetch loan request detail");
  } catch (error: any) {
    console.error("Failed to fetch loan request detail:", error);
    
    // Handle specific error cases
    if (error?.response?.data) {
      const errorData = error.response.data;
      if (errorData.statusCode === 404) {
        throw new Error(errorData.message || "Loan request not found.");
      }
      throw new Error(errorData.message || "Failed to fetch loan request detail");
    }
    
    throw error;
  }
};

// ============================================
// Utility Functions
// ============================================

const FALLBACK_PROPERTY_IMAGE = "/images/SponsorDashboard.png";
const API_BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

/**
 * Normalize image URL to absolute path
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
 * Format loan term from months to display format
 */
export const formatLoanTerm = (months: number | string | undefined): string => {
  const parsed = Number(months);
  if (!Number.isFinite(parsed) || parsed <= 0) return "-";
  return `${parsed} months`;
};

/**
 * Format percentage for display
 */
export const formatPercent = (value: string | number | undefined): string => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return `${parsed.toFixed(2)}%`;
};

/**
 * Format datetime to readable format
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
 * Get file name from URL
 */
export const getFileNameFromUrl = (url: string): string => {
  const safeUrl = url.split("?")[0];
  return decodeURIComponent(safeUrl.substring(safeUrl.lastIndexOf("/") + 1));
};

/**
 * Check if URL is a PDF
 */
export const isPdfUrl = (url: string): boolean => {
  return /\.pdf$/i.test(url);
};

/**
 * Check if URL is an image
 */
export const isImageUrl = (url: string): boolean => {
  return /\.(png|jpg|jpeg|gif|webp|svg|bmp|avif)$/i.test(url);
};

/**
 * Extract memorandum ID from link
 */
export const getMemorandumIdFromLink = (memorandum: MemorandumLink): number | null => {
  if (Number.isFinite(memorandum.id) && memorandum.id > 0) {
    return memorandum.id;
  }

  const match = String(memorandum.url || "").match(
    /\/api\/memorandums\/(\d+)\/?/i
  );
  const parsed = Number(match?.[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Download document from URL
 */
export const downloadDocument = async (url: string): Promise<Blob> => {
  try {
    const response = await api.get(url, {
      responseType: "blob",
    });
    return response.data as Blob;
  } catch (error) {
    console.error("Failed to download document:", error);
    throw new Error("Unable to download document");
  }
};
