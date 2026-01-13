import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users/users.service';
import type { UpdateProfileDto } from '@/types/user';

/**
 * Get current user profile
 */
export function useUserProfile() {
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => usersService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    profile,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Update user profile mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: UpdateProfileDto) => usersService.updateProfile(data),
    onSuccess: (data) => {
      // Update user profile cache
      queryClient.setQueryData(['user-profile'], data);
      // Also update user query cache (used in auth)
      queryClient.setQueryData(['user'], data);
    },
  });

  return {
    updateProfile: mutation.mutate,
    updateProfileAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
  };
}



