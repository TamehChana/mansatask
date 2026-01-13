'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navigation } from '@/components/dashboard/Navigation';
import {
  useUserProfile,
  useUpdateProfile,
} from '@/hooks/users/useUsers';
import { ProfileForm } from '@/components/users/ProfileForm';
import { getUserFriendlyErrorMessage } from '@/utils/error-messages';

export default function ProfilePage() {
  const { profile, isLoading, error } = useUserProfile();
  const {
    updateProfileAsync,
    isUpdating,
    error: updateError,
  } = useUpdateProfile();

  const handleSubmit = async (data: { name?: string; email?: string }) => {
    try {
      await updateProfileAsync(data);
      // Profile updated successfully - the mutation will handle cache updates
    } catch (error) {
      // Error is handled by the mutation and displayed in the form
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col lg:flex-row">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <Navigation />
        </aside>
        {/* Mobile Navigation */}
        <Navigation />

        {/* Main Content */}
        <main className="flex-1 overflow-auto lg:ml-0">
          {/* Header */}
          <header className="bg-surface border-b border-gray-200">
            <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              <h1 className="text-2xl sm:text-h1 text-text-primary">Profile</h1>
              <p className="text-text-secondary mt-2 text-sm sm:text-body">Manage your account information</p>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="bg-surface rounded-card shadow-soft p-4 sm:p-6 lg:p-8 border border-gray-100">
              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                  <p className="text-text-secondary">Loading profile...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-12">
                  <div className="rounded-md bg-error-red/10 border border-error-red/20 p-4 text-error-red">
                    <h3 className="text-h3 font-medium mb-2">
                      Error Loading Profile
                    </h3>
                    <p className="text-small">
                      {getUserFriendlyErrorMessage(error)}
                    </p>
                  </div>
                </div>
              )}

              {/* Profile Content */}
              {profile && !isLoading && !error && (
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="border-b border-gray-200 pb-6">
                    <h2 className="text-h2 text-text-primary mb-2">
                      Account Information
                    </h2>
                    <p className="text-small text-text-secondary">
                      Manage your account information and preferences
                    </p>
                  </div>

                  {/* Profile Form */}
                  <div>
                    <ProfileForm
                      profile={profile}
                      onSubmit={handleSubmit}
                      isLoading={isUpdating}
                      error={updateError}
                    />
                  </div>

                  {/* Account Details (Read-only) */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-h3 text-text-primary mb-4">
                      Account Details
                    </h3>
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-small font-medium text-text-secondary">
                          User ID
                        </dt>
                        <dd className="mt-1 text-small text-text-primary font-mono">
                          {profile.id}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-small font-medium text-text-secondary">
                          Role
                        </dt>
                        <dd className="mt-1 text-small text-text-primary">
                          {profile.role}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-small font-medium text-text-secondary">
                          Member Since
                        </dt>
                        <dd className="mt-1 text-small text-text-primary">
                          {new Date(profile.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            },
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-small font-medium text-text-secondary">
                          Last Updated
                        </dt>
                        <dd className="mt-1 text-small text-text-primary">
                          {new Date(profile.updatedAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            },
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

