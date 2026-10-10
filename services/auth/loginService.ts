/**
 * Login Service
 * Handles all login-related API calls including 2FA
 */

import api from "@/lib/apiClient";
import type { User } from "@/types/auth";

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    requires_2fa?: boolean;
    email?: string;
    access?: string;
    refresh?: string;
    user?: User;
  };
}

export interface Verify2FARequest {
  email: string;
  otp_code: string;
}

export interface Verify2FAResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    access: string;
    refresh: string;
    user: User;
  };
}

export interface Resend2FAOTPRequest {
  email: string;
}

export interface Resend2FAOTPResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface LogoutResponse {
  success: boolean;
  statusCode: number;
  message: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    access?: string;
    access_token?: string;
  };
}

/**
 * Login user
 * Endpoint: POST /api/accounts/login/
 * Returns tokens if 2FA disabled, or requires_2fa flag if enabled
 */
export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post("/api/accounts/login/", {
    email: credentials.email.trim(),
    password: credentials.password,
    remember_me: !!credentials.remember_me,
  });
  return response.data;
};

/**
 * Verify 2FA OTP during login
 * Endpoint: POST /api/accounts/login/verify-2fa/
 */
export const verify2FALogin = async (request: Verify2FARequest): Promise<Verify2FAResponse> => {
  const response = await api.post("/api/accounts/login/verify-2fa/", {
    email: request.email.trim(),
    otp_code: request.otp_code.trim(),
  });
  return response.data;
};

/**
 * Resend 2FA OTP during login
 * Endpoint: POST /api/accounts/login/resend-2fa-otp/
 */
export const resend2FALoginOTP = async (
  request: Resend2FAOTPRequest
): Promise<Resend2FAOTPResponse> => {
  const response = await api.post("/api/accounts/login/resend-2fa-otp/", {
    email: request.email.trim(),
  });
  return response.data;
};

/**
 * Logout user
 * Endpoint: POST /api/accounts/logout/
 * Blacklists the refresh token
 */
export const logoutUser = async (refreshToken: string): Promise<LogoutResponse> => {
  const response = await api.post("/api/accounts/logout/", {
    refresh_token: refreshToken,
  });
  return response.data;
};

/**
 * Refresh access token
 * Endpoint: POST /api/accounts/token/refresh/
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<RefreshTokenResponse> => {
  const response = await api.post("/api/accounts/token/refresh/", {
    refresh_token: refreshToken,
  });
  return response.data;
};
