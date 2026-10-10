/**
 * Forgot Password Service
 * Handles all password reset-related API calls
 */

import api from "@/lib/apiClient";

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
}

export interface VerifyForgotPasswordOTPRequest {
  email: string;
  otp_code: string;
}

export interface VerifyForgotPasswordOTPResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
}

export interface ResetPasswordRequest {
  email: string;
  new_password: string;
  confirm_new_password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
}

export interface ResendForgotPasswordOTPRequest {
  email: string;
}

export interface ResendForgotPasswordOTPResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
}

/**
 * Initiate forgot password flow
 * Endpoint: POST /api/accounts/forgot-password/
 * Sends OTP to user's email
 */
export const initiateForgotPassword = async (
  request: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> => {
  const response = await api.post("/api/accounts/forgot-password/", {
    email: request.email.trim(),
  });
  return response.data;
};

/**
 * Verify OTP for forgot password
 * Endpoint: POST /api/accounts/forgot-password/verify-otp/
 * Creates password reset session (valid for 15 minutes)
 */
export const verifyForgotPasswordOTP = async (
  request: VerifyForgotPasswordOTPRequest
): Promise<VerifyForgotPasswordOTPResponse> => {
  const response = await api.post("/api/accounts/forgot-password/verify-otp/", {
    email: request.email.trim(),
    otp_code: request.otp_code.trim(),
  });
  return response.data;
};

/**
 * Reset password
 * Endpoint: POST /api/accounts/reset-password/
 * Must be called within 15 minutes of OTP verification
 */
export const resetPassword = async (
  request: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  const response = await api.post("/api/accounts/reset-password/", {
    email: request.email.trim(),
    new_password: request.new_password,
    confirm_new_password: request.confirm_new_password,
  });
  return response.data;
};

/**
 * Resend OTP for forgot password
 * Endpoint: POST /api/accounts/forgot-password/resend/
 */
export const resendForgotPasswordOTP = async (
  request: ResendForgotPasswordOTPRequest
): Promise<ResendForgotPasswordOTPResponse> => {
  const response = await api.post("/api/accounts/forgot-password/resend/", {
    email: request.email.trim(),
  });
  return response.data;
};
