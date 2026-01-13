'use client';

import { useEffect } from 'react';

/**
 * SuppressConsoleErrors Component
 * Prevents unhandled promise rejections from showing error icons to users
 * All errors are already converted to user-friendly messages in the API client
 */
export function SuppressConsoleErrors() {
  useEffect(() => {
    // Handle unhandled promise rejections to prevent browser error icons
    // All errors from our API client are already converted to user-friendly messages
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      // Check if this is a user-friendly error from our API client
      if (error instanceof Error) {
        // If marked as user-friendly, prevent browser error icon
        // The error is already displayed user-friendly in the UI
        if ((error as any).__isUserFriendly) {
          event.preventDefault();
          return;
        }
        
        // Also check if message looks user-friendly (contains common user-friendly phrases)
        const message = error.message.toLowerCase();
        const isUserFriendlyMessage = 
          message.includes('please') ||
          message.includes('unable to connect') ||
          message.includes('check your') ||
          message.includes('try again') ||
          message.includes('incorrect') ||
          message.includes('invalid');
        
        if (isUserFriendlyMessage) {
          // Prevent browser error icon - error is already shown user-friendly in UI
          event.preventDefault();
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}

