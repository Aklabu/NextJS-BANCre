"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { AuthContextType, User, AuthState, signup } from "@/types/auth";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

// Import authentication services
import {
  // Registration
  registerUser,
  verifySignupOTP,
  resendSignupOTP,
  // Login
  loginUser,
  verify2FALogin as verify2FALoginService,
  resend2FALoginOTP as resend2FALoginOTPService,
  logoutUser,
  // Forgot Password
  initiateForgotPassword,
  verifyForgotPasswordOTP,
  resetPassword as resetPasswordService,
  resendForgotPasswordOTP,
  // Profile
  getUserProfile,
  switchUserRole,
} from "@/services/auth";

// Public routes that don't need profile fetch
const PUBLIC_ROUTES = [
  "/register",
  "/signin",
  "/register/upload",
  "/verify_otp",
  "/reset_pass_one",
  "/reset_pass_one/reset_pass_two",
  "/reset_pass_one/reset_pass_two/reset_pass_three",
  "/reset_pass_one/reset_pass_two/reset_pass_three/reset_pass_four",
];

const normalizeRole = (value?: string): "Sponsor" | "Lender" => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "sponsor") return "Sponsor";
  if (normalized === "lender" || normalized === "lander") return "Lender";
  return "Sponsor";
};

const formatErrorMessage = (error: any, fallback: string): string => {
  if (error?.response?.data) {
    const data = error.response.data;
    if (data.message && typeof data.message === "string") {
      if (data.errors && typeof data.errors === "object") {
        const errorList = Object.entries(data.errors)
          .map(([key, msgs]) => `${key}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join(" | ");
        return `${data.message} (${errorList})`;
      }
      return data.message;
    }
    if (data.detail && typeof data.detail === "string") return data.detail;
    if (data.errors && typeof data.errors === "object") {
      return Object.entries(data.errors)
        .map(([key, msgs]) => `${key}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
        .join(" | ");
    }
  }
  return fallback;
};

//------------ Auth Context ------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

//------------ Auth Provider Component ------------
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    email: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [signUpData, setSignupData] = useState<signup | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Hydrate pending Authstate from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAuth = localStorage.getItem("Authstate");
      if (savedAuth) {
        try {
          const parsed = JSON.parse(savedAuth);
          if (parsed?.email) {
            setAuthState(parsed);
          }
        } catch (e) {
          console.error("Failed to parse Authstate from storage", e);
        }
      }
    }
  }, []);

  /*----------------------------------------
            Signup Function 
  ----------------------------------------------*/
  const signup = async (userData: signup) => {
    setSignupData(userData);

    // Check if customer type requires media files but they're not provided
    const requiresMediaFiles = userData.customer_type === 'Lender';
    if (requiresMediaFiles && (!userData.media_files || userData.media_files.length === 0)) {
      // Redirect to upload page for Lender
      router.push("/register/upload");
      return;
    }

    try {
      setLoading(true);
      
      console.log("Starting signup with data:", {
        customer_type: userData.customer_type,
        email: userData.email,
        has_files: !!(userData.media_files && userData.media_files.length > 0)
      });

      const response = await registerUser(userData);
      
      console.log("Signup response:", response);
      if (response.success) {
        const email = response.data?.email || userData.email || null;
        const newAuthState = {
          email,
          isAuthenticated: false,
          from: "signup",
        };
        setAuthState(newAuthState);
        localStorage.setItem("Authstate", JSON.stringify(newAuthState));
        toast.success(response.message || "OTP sent to your email");
        router.push("/verify_otp?from=signup");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(formatErrorMessage(error, "Signup failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  /*----------------------------------------
            Resend OTP Function 
  ----------------------------------------------*/
  const resendOtp = async (email: string, from?: string) => {
    try {
      setLoading(true);
      if (!email?.trim()) {
        toast.error("Email is required to resend OTP.");
        return;
      }

      const isForgot = from === "forgotPassword";
      
      let response;
      if (isForgot) {
        response = await resendForgotPasswordOTP({ email: email.trim() });
      } else {
        response = await resendSignupOTP(email.trim());
      }

      if (response.success) {
        const newAuthState = {
          email: email.trim(),
          isAuthenticated: false,
          from: from || "signup",
        };
        setAuthState(newAuthState);
        localStorage.setItem("Authstate", JSON.stringify(newAuthState));
        toast.success(response.message || "A new OTP has been sent");
      }
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      
      if (error?.response?.status === 404) {
        toast.error(error.response.data?.message || "User with this email does not exist");
      } else if (error?.response?.status === 400) {
        const errorMessage = formatErrorMessage(error, "Invalid email address");
        toast.error(errorMessage);
      } else {
        toast.error(formatErrorMessage(error, "Failed to resend OTP. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  /*----------------------------------------
            Forgot Password Function 
  ----------------------------------------------*/
  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      if (!email?.trim()) {
        toast.error("Email is required.");
        return;
      }

      const response = await initiateForgotPassword({ email: email.trim() });

      if (response.success) {
        const newAuthState = {
          email: email.trim(),
          isAuthenticated: false,
          from: "forgotPassword",
        };
        localStorage.setItem("Authstate", JSON.stringify(newAuthState));
        setAuthState(newAuthState);
        toast.success(response.message || "OTP sent to your email");
        router.push("/reset_pass_one/reset_pass_two?from=forgotPassword");
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      
      if (error?.response?.status === 404) {
        toast.error(error.response.data?.message || "User with this email does not exist");
      } else if (error?.response?.status === 400) {
        toast.error(formatErrorMessage(error, "Invalid email address"));
      } else {
        toast.error(formatErrorMessage(error, "Failed to process forgot password. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  /*----------------------------------------
          Verify OTP Function 
  ----------------------------------------------*/
  const verifyOTP = async (otp: string, from: string) => {
    const savedState = localStorage.getItem("Authstate");
    const parsedState = savedState ? JSON.parse(savedState) : null;
    const email = authState?.email || parsedState?.email;

    if (!email) {
      toast.error("Session expired or missing email. Please start again.");
      router.push(from === "forgotPassword" ? "/reset_pass_one" : "/register");
      return;
    }

    if (!otp?.trim()) {
      toast.error("Please enter the 6-digit OTP code.");
      return;
    }

    if (from === "forgotPassword") {
      try {
        setLoading(true);
        const response = await verifyForgotPasswordOTP({
          email: email.trim(),
          otp_code: otp.trim(),
        });

        if (response.success) {
          const updatedState = {
            email: email.trim(),
            isAuthenticated: false,
            from: "forgotPassword",
          };
          setAuthState(updatedState);
          localStorage.setItem("Authstate", JSON.stringify(updatedState));
          toast.success(response.message || "OTP verified. You may now reset your password.");
          router.push("/reset_pass_one/reset_pass_two/reset_pass_three");
        }
      } catch (error: any) {
        console.error("Forgot password OTP verification error:", error);
        
        if (error?.response?.status === 400) {
          toast.error(error.response.data?.message || "Invalid or expired OTP");
        } else if (error?.response?.status === 404) {
          toast.error(error.response.data?.message || "User not found");
        } else {
          toast.error(formatErrorMessage(error, "OTP verification failed. Please try again."));
        }
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setLoading(true);
        const response = await verifySignupOTP(email.trim(), otp.trim());

        if (response.success) {
          localStorage.removeItem("Authstate");
          setAuthState({ email: null, isAuthenticated: false });
          toast.success(response.message || "Verification successful. Registration completed.");
          router.push("/signin");
        }
      } catch (error: any) {
        console.error("Verify email error:", error);
        
        if (error?.response?.status === 400) {
          const errorMessage = error.response.data?.message || "Invalid or expired OTP";
          toast.error(errorMessage);
        } else if (error?.response?.status === 404) {
          toast.error(error.response.data?.message || "User not found");
        } else {
          toast.error(formatErrorMessage(error, "Email verification failed. Please try again."));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  /*----------------------------------------
          Reset Password Function 
  ----------------------------------------------*/
  const resetPassword = async (
    email: string,
    newPassword: string,
    confirmNewPassword: string,
  ) => {
    try {
      setLoading(true);
      const response = await resetPasswordService({
        email: email.trim(),
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });

      if (response.success) {
        localStorage.removeItem("Authstate");
        setAuthState({ email: null, isAuthenticated: false });
        toast.success(response.message || "Password reset successfully.");
        router.push(
          "/reset_pass_one/reset_pass_two/reset_pass_three/reset_pass_four",
        );
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      
      if (error?.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData?.message?.includes("session has expired")) {
          toast.error("Password reset session has expired. Please request a new OTP.");
          router.push("/reset_pass_one");
        } else if (errorData?.message?.includes("verify OTP first")) {
          toast.error("Please verify OTP first");
          router.push("/reset_pass_one/reset_pass_two?from=forgotPassword");
        } else {
          toast.error(formatErrorMessage(error, "Invalid password. Please check requirements."));
        }
      } else if (error?.response?.status === 404) {
        toast.error(error.response.data?.message || "User not found");
      } else {
        toast.error(formatErrorMessage(error, "Failed to reset password. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  /*----------------------------------------
            Login Function 
  ----------------------------------------------*/
  const login = async (
    email: string,
    password: string,
    remember_me?: boolean,
  ) => {
    try {
      console.log("Attempting login for email:", email);
      setLoading(true);

      const response = await loginUser({
        email: email.trim(),
        password,
        remember_me: !!remember_me,
      });

      console.log("Login response:", response);
      if (response.success) {
        const responseData = response.data;
        
        // Check if 2FA is required
        if (responseData?.requires_2fa) {
          const newAuthState = {
            email: responseData.email || email.trim(),
            isAuthenticated: false,
            from: "login2fa",
          };
          setAuthState(newAuthState);
          localStorage.setItem("Authstate", JSON.stringify(newAuthState));
          toast.success(response.message || "OTP sent to your email for two-factor authentication");
          router.push("/verify_otp?from=login2fa");
          return;
        }

        // No 2FA - process tokens
        const { user: rawUser, access, refresh } = responseData;
        const activeRole =
          rawUser?.active_role ||
          (rawUser?.roles && rawUser.roles[0]) ||
          rawUser?.role ||
          "Sponsor";
        const normalizedRole = normalizeRole(activeRole);
        const normalizedUser: User = {
          ...rawUser,
          role: normalizedRole,
          customer_type: normalizedRole,
          active_role: activeRole,
          roles: rawUser?.roles || ["Sponsor", "Lender"],
        };

        localStorage.setItem(
          "userCredentials",
          JSON.stringify({
            access_token: access,
            refresh_token: refresh,
            user: normalizedUser,
          }),
        );
        setUser(normalizedUser);
        toast.success(response.message || "Logged in successfully!");

        if (normalizedRole === "Sponsor") {
          console.log("Redirecting to sponsor dashboard for user:", normalizedUser);
          router.push("/sponsor");
        } else {
          console.log("Redirecting to lender dashboard for user:", normalizedUser);
          router.push("/lender");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error?.response?.status === 401) {
        toast.error(error.response.data?.message || "Invalid email or password");
      } else if (error?.response?.status === 403) {
        toast.error(error.response.data?.message || "Please verify your email before logging in");
      } else {
        toast.error(formatErrorMessage(error, "Login failed. Please check your credentials and try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  /*----------------------------------------
            Verify 2FA Login Function 
  ----------------------------------------------*/
  const verify2FALogin = async (otp: string) => {
    const savedState = localStorage.getItem("Authstate");
    const parsedState = savedState ? JSON.parse(savedState) : null;
    const email = authState?.email || parsedState?.email;

    if (!email) {
      toast.error("Session expired or missing email. Please login again.");
      router.push("/signin");
      return;
    }

    if (!otp?.trim() || otp.trim().length !== 6) {
      toast.error("Please enter the complete 6-digit OTP code.");
      return;
    }

    try {
      setLoading(true);
      const response = await verify2FALoginService({
        email: email.trim(),
        otp_code: otp.trim(),
      });

      if (response.success) {
        const { user: rawUser, access, refresh } = response.data;
        const activeRole =
          rawUser?.active_role ||
          (rawUser?.roles && rawUser.roles[0]) ||
          rawUser?.role ||
          "Sponsor";
        const normalizedRole = normalizeRole(activeRole);
        const normalizedUser: User = {
          ...rawUser,
          role: normalizedRole,
          customer_type: normalizedRole,
          active_role: activeRole,
          roles: rawUser?.roles || ["Sponsor", "Lender"],
        };

        localStorage.setItem(
          "userCredentials",
          JSON.stringify({
            access_token: access,
            refresh_token: refresh,
            user: normalizedUser,
          }),
        );
        localStorage.removeItem("Authstate");
        setAuthState({ email: null, isAuthenticated: false });
        setUser(normalizedUser);
        toast.success(response.message || "Two-factor authentication successful");

        if (normalizedRole === "Sponsor") {
          router.push("/sponsor");
        } else {
          router.push("/lender");
        }
      }
    } catch (error: any) {
      console.error("2FA Login verification error:", error);
      
      if (error?.response?.status === 400) {
        toast.error(error.response.data?.message || "Invalid or expired OTP");
      } else if (error?.response?.status === 404) {
        toast.error(error.response.data?.message || "User not found");
      } else {
        toast.error(formatErrorMessage(error, "2FA verification failed. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  /*----------------------------------------
            Resend 2FA Login OTP Function 
  ----------------------------------------------*/
  const resend2FALoginOtp = async () => {
    const savedState = localStorage.getItem("Authstate");
    const parsedState = savedState ? JSON.parse(savedState) : null;
    const email = authState?.email || parsedState?.email;

    if (!email) {
      toast.error("Session expired or missing email. Please login again.");
      router.push("/signin");
      return;
    }

    try {
      setLoading(true);
      const response = await resend2FALoginOTPService({
        email: email.trim(),
      });

      if (response.success) {
        toast.success(response.message || "A new 2FA OTP has been sent");
      }
    } catch (error: any) {
      console.error("Resend 2FA Login OTP error:", error);
      
      if (error?.response?.status === 400) {
        toast.error(error.response.data?.message || "Two-factor authentication is not enabled for this account");
      } else if (error?.response?.status === 404) {
        toast.error(error.response.data?.message || "User not found");
      } else {
        toast.error(formatErrorMessage(error, "Failed to resend OTP. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  /*----------------------------------------
            Role Switching / Toggle Function 
  ----------------------------------------------*/
  const switchRole = async (targetRole: "Sponsor" | "Lender") => {
    try {
      setLoading(true);
      const response = await switchUserRole({ role: targetRole });

      if (response.success) {
        const newActiveRole = response.data?.active_role || targetRole;
        const updatedRoles = response.data?.roles || user?.roles || ["Sponsor", "Lender"];
        const normalized = normalizeRole(newActiveRole);

        const updatedUser: User = {
          ...(user || {}),
          active_role: newActiveRole,
          role: normalized,
          customer_type: normalized,
          roles: updatedRoles,
        };

        const userCredentials = localStorage.getItem("userCredentials");
        if (userCredentials) {
          const parsed = JSON.parse(userCredentials);
          localStorage.setItem(
            "userCredentials",
            JSON.stringify({
              ...parsed,
              user: updatedUser,
            }),
          );
        }

        setUser(updatedUser);
        toast.success(`Switched to ${newActiveRole} mode`);

        if (normalized === "Sponsor") {
          router.push("/sponsor");
        } else {
          router.push("/lender");
        }
      }
    } catch (error: any) {
      console.error("Role switch error:", error);
      toast.error(formatErrorMessage(error, "Failed to switch role. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async () => {
    const currentRole = normalizeRole(user?.active_role || user?.role || user?.customer_type);
    const targetRole = currentRole === "Lender" ? "Sponsor" : "Lender";
    await switchRole(targetRole);
  };

  /*----------------------------------------
            Logout Function 
  ----------------------------------------------*/
  const logout = async () => {
    try {
      const userCredentials = localStorage.getItem("userCredentials");
      if (userCredentials) {
        const { refresh_token } = JSON.parse(userCredentials);
        if (refresh_token) {
          await logoutUser(refresh_token);
        }
      }
    } catch (error) {
      console.error("Logout api error:", error);
    } finally {
      localStorage.removeItem("userCredentials");
      setUser(null);
      toast.success("Logged out successfully!");
      router.push("/signin");
    }
  };

  /*----------------------------------------
            Getting user data 
  ----------------------------------------------*/
  useEffect(() => {
    const fetchUserProfile = async () => {
      const isPublicRoute = PUBLIC_ROUTES.some((route) =>
        pathname?.startsWith(route),
      );
      if (isPublicRoute) return;

      try {
        const userCredentials = localStorage.getItem("userCredentials");
        if (!userCredentials) return;

        const parsedCredentials = JSON.parse(userCredentials);
        const storedUser: User | null = parsedCredentials?.user ?? null;

        if (storedUser) {
          setUser((prev) => prev ?? storedUser);
        }

        const response = await getUserProfile();
        if (response.success) {
          const profileUser: User = response.data;
          const activeRole =
            profileUser?.active_role ||
            (profileUser?.roles && profileUser.roles[0]) ||
            profileUser?.role ||
            storedUser?.role ||
            "Sponsor";
          const normalizedRole = normalizeRole(activeRole);
          const mergedUser: User = {
            ...(storedUser || {}),
            ...profileUser,
            role: normalizedRole,
            customer_type: normalizedRole,
            active_role: activeRole,
            roles: profileUser?.roles || storedUser?.roles || ["Sponsor", "Lender"],
          };

          setUser(mergedUser);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };
    fetchUserProfile();
  }, [pathname]);

  return (
    <AuthContext.Provider
      value={{
        user,
        authState,
        signUpData,
        loading,
        setSignupData,
        signup,
        verifyOTP,
        resendOtp,
        login,
        verify2FALogin,
        resend2FALoginOtp,
        resetPassword,
        switchRole,
        toggleRole,
        logout,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/*-----------------------------------------------
            exporting hook
  ----------------------------------------------*/
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
