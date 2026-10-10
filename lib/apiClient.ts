import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// Declaration section
let isRefreshing = false;
let waitingQueue: ((token: string) => void)[] = [];
// Endpoints that must never send bearer tokens and must not trigger refresh logic.
const authBootstrapEndpoints = [
  "/api/accounts/login/",
  "/api/accounts/login/verify-2fa/",
  "/api/accounts/login/resend-2fa-otp/",
  "/api/accounts/signup/",
  "/api/accounts/resend-otp/",
  "/api/accounts/verify-otp/",
  "/api/accounts/forgot-password/",
  "/api/accounts/forgot-password/verify-otp/",
  "/api/accounts/forgot-password/resend/",
  "/api/accounts/reset-password/",
  "/api/auth/token/refresh/",
];

const isPublicEndpoint = (url?: string) =>
  authBootstrapEndpoints.some((endpoint) => url?.includes(endpoint));

// Function to get tokens from localStorage
const getTokensFromLocalStorage = () => {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null };
  }
  try {
    const userCredentials = localStorage.getItem("userCredentials");
    if (userCredentials) {
      const { access_token, refresh_token } = JSON.parse(userCredentials);
      return { accessToken: access_token, refreshToken: refresh_token };
    }
    return { accessToken: null, refreshToken: null };
  } catch (error) {
    console.error("Failed to read tokens from localStorage", error);
    return { accessToken: null, refreshToken: null };
  }
};

const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://charissa-intuitable-corroboratorily.ngrok-free.dev/";
const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl : `${rawBaseUrl}/`;

console.log("🔧 API Configuration:");
console.log("  Raw Base URL:", rawBaseUrl);
console.log("  Final Base URL:", baseUrl);
console.log("  From .env:", process.env.NEXT_PUBLIC_BASE_URL);

// Check if using ngrok
const isNgrok = baseUrl.includes('ngrok');

// Creating axios instance
const api: AxiosInstance = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    ...(isNgrok && { "ngrok-skip-browser-warning": "true" }), // Only add for ngrok
  },
});

// Function to queue failed route callbacks
const queuingFailedRoute = (callback: (token: string) => void) => {
  waitingQueue.push(callback);
};

// Function to execute queued routes
const executingRoutes = (token: string) => {
  waitingQueue.forEach((callback) => callback(token));
  waitingQueue = [];
};

// Attaching token in request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Only set Accept header if not sending FormData
    if (!(config.data instanceof FormData)) {
      config.headers.Accept = "application/json";
    }
    
    // Only add ngrok header if using ngrok URL
    if (isNgrok) {
      config.headers["ngrok-skip-browser-warning"] = "true";
    }
    
    const { accessToken } = getTokensFromLocalStorage();

    if (isPublicEndpoint(config.url)) {
      delete config.headers.Authorization;
      return config;
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(`Error in request: ${error}`),
);

// Handle token expiration automatically
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry: boolean;
    };

    // Wait until original request completes
    if (error?.response?.status === 401 && !originalRequest._retry) {
      if (isPublicEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queuingFailedRoute((token) => {
            if (!token) return reject("Refresh failed");
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = getTokensFromLocalStorage();
        if (!refreshToken) {
          executingRoutes("");
          if (typeof window !== "undefined" && !window.location.pathname.startsWith("/signin")) {
            window.location.replace("/signin");
          }
          return Promise.reject("No refresh token");
        }

        const { data } = await api.post<{ access_token?: string; access?: string; data?: { access?: string } }>(
          "/api/auth/token/refresh/",
          { refresh_token: refreshToken },
        );
        const newToken = data?.data?.access || data?.access || data?.access_token;
        if (!newToken) {
          throw new Error("No access token in refresh response");
        }

        // Update localStorage with new access token
        const userData = JSON.parse(localStorage.getItem("userCredentials") || "{}");
        localStorage.setItem(
          "userCredentials",
          JSON.stringify({ ...userData, access_token: newToken }),
        );
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        executingRoutes(newToken);
        return api(originalRequest);
      } catch (refreshError) {
        executingRoutes("");
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/signin")) {
          window.location.replace("/signin");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Function to set access token in localStorage
export const setAccessToken = (token: string | null): void => {
  if (token) {
    const userData = JSON.parse(localStorage.getItem("userCredentials") || "{}");
    localStorage.setItem(
      "userCredentials",
      JSON.stringify({ ...userData, access_token: token }),
    );
  }
};

// Optionally expose getter for debugging
export const getAccessToken = (): string | null => {
  const { accessToken } = getTokensFromLocalStorage();
  return accessToken;
};

export default api;
