/**
 * Profile Service
 * Handles user profile and role management API calls
 */

import api from "@/lib/apiClient";
import type { User } from "@/types/auth";

export interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_photo: string | null;
  company_information: {
    company_name: string | null;
    position: string | null;
    street_address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
  };
}

export interface GetProfileResponse {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: ProfileData;
  errors: null;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_photo?: File;
  company_name?: string;
  position?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: {
    profile: ProfileData;
  };
  errors: null;
}

export interface SwitchRoleRequest {
  role: "Sponsor" | "Lender";
}

export interface SwitchRoleResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    active_role: string;
    roles: string[];
  };
}

/**
 * Get user profile
 * Endpoint: GET /api/accounts/profile/
 * Requires authentication
 */
export const getUserProfile = async (): Promise<GetProfileResponse> => {
  const response = await api.get("/api/accounts/profile/");
  return response.data;
};

/**
 * Update user profile
 * Endpoint: PATCH /api/accounts/profile/
 * Requires authentication
 * 
 * Note: Email and customer_type cannot be changed
 * Supports both JSON and multipart/form-data (for profile photo)
 */
export const updateUserProfile = async (
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  // Check if we have a file upload
  const hasFile = data.profile_photo instanceof File;

  if (hasFile) {
    // Use FormData for file upload
    const formData = new FormData();
    
    // Append all fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await api.patch("/api/accounts/profile/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } else {
    // Use JSON for regular updates
    const response = await api.patch("/api/accounts/profile/", data);
    return response.data;
  }
};

/**
 * Change password (while logged in)
 * Endpoint: POST /api/accounts/change-password/
 * Requires authentication
 * 
 * Note: User must provide current password for verification
 * After success, user session remains valid (tokens not invalidated)
 */
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: null;
  errors: null | {
    current_password?: string[];
    new_password?: string[];
    confirm_password?: string[];
  };
}

export const changePassword = async (
  request: ChangePasswordRequest
): Promise<ChangePasswordResponse> => {
  const response = await api.post("/api/accounts/change-password/", request);
  return response.data;
};

/**
 * Toggle two-factor authentication
 * Endpoint: PATCH /api/accounts/two-factor/toggle/
 * Requires authentication
 * 
 * Note: When enabled, login will require 2FA verification
 */
export interface Toggle2FARequest {
  enable_2fa: boolean;
}

export interface Toggle2FAResponse {
  success: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: {
    two_factor_enabled: boolean;
  };
  errors: null | {
    enable_2fa?: string[];
  };
}

export const toggle2FA = async (
  request: Toggle2FARequest
): Promise<Toggle2FAResponse> => {
  const response = await api.patch("/api/accounts/two-factor/toggle/", request);
  return response.data;
};

/**
 * Switch user role (Sponsor/Lender)
 * Endpoint: PATCH /api/auth/role/
 * Requires authentication
 */
export const switchUserRole = async (
  request: SwitchRoleRequest
): Promise<SwitchRoleResponse> => {
  const response = await api.patch("/api/auth/role/", {
    role: request.role,
  });
  return response.data;
};
