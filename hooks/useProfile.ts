"use client";

import { useState, useCallback } from "react";
import { getUserProfile, updateUserProfile, type UpdateProfileRequest } from "@/services/auth/profileService";
import type { ProfileData } from "@/services/auth/profileService";
import { toast } from "sonner";

interface UseProfileReturn {
  profile: ProfileData | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

/**
 * Custom hook for profile management
 * 
 * Provides easy access to profile fetch and update operations
 * with built-in loading states and error handling
 * 
 * @example
 * ```tsx
 * const ProfileComponent = () => {
 *   const { profile, loading, updateProfile } = useProfile();
 *   
 *   const handleUpdate = async () => {
 *     const success = await updateProfile({
 *       first_name: "John",
 *       last_name: "Doe"
 *     });
 *     
 *     if (success) {
 *       console.log("Profile updated!");
 *     }
 *   };
 *   
 *   return <div>{profile?.first_name}</div>;
 * };
 * ```
 */
export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user profile from API
   */
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getUserProfile();
      
      if (response.success) {
        setProfile(response.data);
      } else {
        const errorMsg = "Failed to fetch profile";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to fetch profile";
      setError(errorMsg);
      console.error("Profile fetch error:", err);
      
      // Only show toast for non-401 errors (401 is handled by apiClient)
      if (err?.response?.status !== 401) {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user profile
   * 
   * @param data - Profile update data (all fields optional)
   * @returns Promise<boolean> - true if update successful, false otherwise
   */
  const updateProfile = useCallback(async (data: UpdateProfileRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await updateUserProfile(data);
      
      if (response.success) {
        // Update local state with new profile data
        setProfile(response.data.profile);
        toast.success(response.message || "Profile updated successfully");
        return true;
      } else {
        const errorMsg = "Failed to update profile";
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }
    } catch (err: any) {
      console.error("Profile update error:", err);
      
      // Handle specific error cases
      if (err?.response?.status === 400) {
        const errorData = err.response.data;
        
        if (errorData?.errors) {
          // Display validation errors
          const errorMessages = Object.entries(errorData.errors)
            .map(([field, messages]) => {
              const msgArray = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${msgArray.join(", ")}`;
            })
            .join(" | ");
          
          setError(errorMessages);
          toast.error(errorMessages);
        } else {
          const errorMsg = errorData?.message || "Invalid data provided";
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } else if (err?.response?.status === 401) {
        const errorMsg = "Session expired. Please login again";
        setError(errorMsg);
        // Don't show toast - apiClient handles redirect
      } else {
        const errorMsg = err?.response?.data?.message || "Failed to update profile";
        setError(errorMsg);
        toast.error(errorMsg);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh profile data (alias for fetchProfile)
   */
  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    refreshProfile,
  };
}
