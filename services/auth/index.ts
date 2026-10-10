/**
 * Authentication Services Index
 * Central export point for all authentication-related services
 */

// Registration Service
export {
  registerUser,
  verifySignupOTP,
  resendSignupOTP,
  type SignupResponse,
  type VerifyOTPResponse,
  type ResendOTPResponse,
} from "./registrationService";

// Login Service
export {
  loginUser,
  verify2FALogin,
  resend2FALoginOTP,
  logoutUser,
  refreshAccessToken,
  type LoginRequest,
  type LoginResponse,
  type Verify2FARequest,
  type Verify2FAResponse,
  type Resend2FAOTPRequest,
  type Resend2FAOTPResponse,
  type LogoutRequest,
  type LogoutResponse,
  type RefreshTokenRequest,
  type RefreshTokenResponse,
} from "./loginService";

// Forgot Password Service
export {
  initiateForgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  resendForgotPasswordOTP,
  type ForgotPasswordRequest,
  type ForgotPasswordResponse,
  type VerifyForgotPasswordOTPRequest,
  type VerifyForgotPasswordOTPResponse,
  type ResetPasswordRequest,
  type ResetPasswordResponse,
  type ResendForgotPasswordOTPRequest,
  type ResendForgotPasswordOTPResponse,
} from "./forgotPasswordService";

// Profile Service
export {
  getUserProfile,
  updateUserProfile,
  changePassword,
  switchUserRole,
  type ProfileData,
  type GetProfileResponse,
  type UpdateProfileRequest,
  type UpdateProfileResponse,
  type ChangePasswordRequest,
  type ChangePasswordResponse,
  type SwitchRoleRequest,
  type SwitchRoleResponse,
} from "./profileService";
