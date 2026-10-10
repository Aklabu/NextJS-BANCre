/**
 * Registration Service
 * Handles all registration-related API calls
 */

import api from "@/lib/apiClient";
import type { signup } from "@/types/auth";

export interface SignupResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    email?: string;
  };
}

export interface VerifyOTPResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
}

export interface ResendOTPResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
}

/**
 * Register a new user
 * Endpoint: POST /api/accounts/signup/
 */
export const registerUser = async (userData: signup): Promise<SignupResponse> => {
  const hasMediaFiles = userData.media_files && userData.media_files.length > 0;

  if (hasMediaFiles) {
    // Use FormData for multipart/form-data submission (with media files)
    const formData = new FormData();
    formData.append("customer_type", userData.customer_type || "Sponsor");
    formData.append("first_name", userData.first_name?.trim() || "");
    formData.append("last_name", userData.last_name?.trim() || "");
    formData.append("email", userData.email?.trim() || "");
    formData.append("phone", userData.phone?.trim() || "");
    formData.append("password", userData.password || "");
    formData.append("confirm_password", userData.confirm_password || "");

    // Add media files
    userData.media_files?.forEach((file) => {
      formData.append("media_files", file);
    });

    const response = await api.post("/api/accounts/signup/", formData);
    return response.data;
  } else {
    // Use JSON for regular signup (without media files)
    const payload = {
      customer_type: userData.customer_type || "Sponsor",
      first_name: userData.first_name?.trim(),
      last_name: userData.last_name?.trim(),
      email: userData.email?.trim(),
      phone: userData.phone?.trim(),
      password: userData.password,
      confirm_password: userData.confirm_password,
    };

    const response = await api.post("/api/accounts/signup/", payload);
    return response.data;
  }
};

/**
 * Verify OTP for signup
 * Endpoint: POST /api/accounts/verify-otp/
 */
export const verifySignupOTP = async (
  email: string,
  otpCode: string
): Promise<VerifyOTPResponse> => {
  const response = await api.post("/api/accounts/verify-otp/", {
    email: email.trim(),
    otp_code: otpCode.trim(),
  });
  return response.data;
};

/**
 * Resend OTP for signup
 * Endpoint: POST /api/accounts/resend-otp/
 */
export const resendSignupOTP = async (email: string): Promise<ResendOTPResponse> => {
  const response = await api.post("/api/accounts/resend-otp/", {
    email: email.trim(),
  });
  return response.data;
};
