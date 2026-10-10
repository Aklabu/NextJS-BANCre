/**
 * Profile Service
 * Handles user profile and role management API calls
 */

import api from "@/lib/apiClient";
import type { User } from "@/types/auth";

export interface GetProfileResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: User;
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
 * Endpoint: GET /api/auth/profile/
 * Requires authentication
 */
export const getUserProfile = async (): Promise<GetProfileResponse> => {
  const response = await api.get("/api/auth/profile/");
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
