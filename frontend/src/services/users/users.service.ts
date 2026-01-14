import apiClient from '@/lib/api-client';
import type { UserProfile, UpdateProfileDto } from '@/types/user';

/**
 * Users Service
 * Handles all user-related API calls
 */
export const usersService = {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/users/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileDto): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>('/users/profile', data);
    return response.data;
  },
};




