//========== Authentication Type Definitions ===========

export type UserType = "Lender" | "Sponsor";

export interface CompanyInformation {
  company_name: string | null;
  position: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

export interface User {
  id?: string | number;
  email?: string;
  customer_type?: string;
  profile_photo?: string | null;
  first_name?: string;
  last_name?: string;
  role?: UserType;
  roles?: string[];
  active_role?: string;
  phone?: string;
  company_information?: CompanyInformation;
  // Legacy fields for backwards compatibility (deprecated)
  company_name?: string | null;
  position?: string | null;
  street_address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  phoneNumber?: string;
  profileImage?: string;
}

export interface signup {
  customer_type?: UserType;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirm_password?: string;
  media_files?: File[];
  agreedToTerms?: boolean;
}

export interface AuthState {
  email: string | null;
  isAuthenticated: boolean;
  from?: string;
}

export interface AuthContextType {
  user: User | null;
  signUpData: signup | null;
  loading: boolean;
  authState: AuthState;
  setSignupData: (data: signup) => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  verify2FALogin: (otp: string) => Promise<void>;
  resend2FALoginOtp: () => Promise<void>;
  signup: (formData: signup) => Promise<void>;
  verifyOTP: (otp: string, from: string) => Promise<void>;
  resendOtp: (email: string, from?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string, confirmNewPassword: string) => Promise<void>;
  toggleRole: () => Promise<void>;
  switchRole: (role: "Sponsor" | "Lender") => Promise<void>;
  logout: () => void;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
