import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/services/auth/auth.service';
import { useToast } from '@/components/ui/ToastProvider';
import type {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '@/types/auth';

/**
 * Authentication Hook
 * Provides authentication mutations and queries
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth, logout: logoutStore } = useAuthStore();
  const { showToast } = useToast();

  /**
   * Login mutation
   */
  const loginMutation = useMutation({
    mutationFn: (data: LoginDto) => authService.login(data),
    onSuccess: (response) => {
      setAuth(response.user, response.accessToken, response.refreshToken);
      queryClient.setQueryData(['user'], response.user);
      showToast('Welcome back! You have been signed in successfully.', 'success');
      router.push('/dashboard');
    },
    // Reset error on new mutation attempt
    onMutate: () => {
      // Error will be automatically cleared by React Query on new mutation
    },
  });

  /**
   * Register mutation
   */
  const registerMutation = useMutation({
    mutationFn: (data: RegisterDto) => authService.register(data),
    onSuccess: (response) => {
      setAuth(response.user, response.accessToken, response.refreshToken);
      queryClient.setQueryData(['user'], response.user);
      showToast(`Welcome, ${response.user.name}! Your account has been created successfully.`, 'success');
      router.push('/dashboard');
    },
  });

  /**
   * Forgot password mutation
   */
  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordDto) => authService.forgotPassword(data),
  });

  /**
   * Reset password mutation
   */
  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordDto) => authService.resetPassword(data),
    onSuccess: () => {
      showToast('Your password has been reset successfully. You can now sign in.', 'success');
      router.push('/login');
    },
  });

  /**
   * Logout function
   */
  const logout = () => {
    logoutStore();
    queryClient.clear();
    router.push('/login');
  };

  return {
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    resetLoginError: () => loginMutation.reset(),

    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    resetRegisterError: () => registerMutation.reset(),

    forgotPassword: forgotPasswordMutation.mutate,
    forgotPasswordAsync: forgotPasswordMutation.mutateAsync,
    isForgotPasswordLoading: forgotPasswordMutation.isPending,
    forgotPasswordError: forgotPasswordMutation.error,
    forgotPasswordSuccess: forgotPasswordMutation.isSuccess,

    resetPassword: resetPasswordMutation.mutate,
    resetPasswordAsync: resetPasswordMutation.mutateAsync,
    isResettingPassword: resetPasswordMutation.isPending,
    resetPasswordError: resetPasswordMutation.error,
    resetPasswordSuccess: resetPasswordMutation.isSuccess,

    logout,
  };
}

/**
 * Get current user profile
 */
export function useUser() {
  const { user, isAuthenticated } = useAuthStore();

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user'],
    queryFn: () => authService.getProfile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: user || profile,
    isLoading,
    error,
    refetch,
  };
}



