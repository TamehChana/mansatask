/**
 * Error Message Utilities
 * Converts technical error messages to user-friendly messages
 */

interface ApiError {
  message?: string;
  errors?: Array<{
    property?: string;
    constraints?: Record<string, string>;
  }>;
  statusCode?: number;
}

/**
 * Converts technical error messages to user-friendly messages
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  // Handle string errors
  if (typeof error === 'string') {
    return getUserFriendlyMessage(error);
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Check if it's an Axios error with response
    const axiosError = error as any;
    if (axiosError.response?.data) {
      return formatApiError(axiosError.response.data);
    }

    // Check if it's a network error
    if (error.message.includes('Network Error') || error.message.includes('timeout')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    // Check for common error patterns
    return getUserFriendlyMessage(error.message);
  }

  // Handle API error responses
  if (error && typeof error === 'object' && 'message' in error) {
    return formatApiError(error as ApiError);
  }

  // Default fallback
  return 'Something went wrong. Please try again.';
}

/**
 * Formats API error responses into user-friendly messages
 */
function formatApiError(error: ApiError): string {
  // If there are validation errors, format them nicely
  if (error.errors && error.errors.length > 0) {
    const firstError = error.errors[0];
    if (firstError.constraints) {
      const constraintMessage = Object.values(firstError.constraints)[0];
      return getUserFriendlyMessage(constraintMessage);
    }
  }

  // Use the error message if available
  if (error.message) {
    return getUserFriendlyMessage(error.message);
  }

  // Handle status codes
  if (error.statusCode) {
    switch (error.statusCode) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'You need to sign in to continue.';
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists. Please use a different value.';
      case 422:
        return 'The information you provided is invalid. Please check and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
        return 'Our servers are experiencing issues. Please try again in a few moments.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  return 'Something went wrong. Please try again.';
}

/**
 * Converts technical error messages to user-friendly ones
 */
function getUserFriendlyMessage(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Authentication errors
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('invalid token')) {
    return 'Your session has expired. Please sign in again.';
  }

  if (lowerMessage.includes('invalid email or password') || lowerMessage.includes('invalid email') && lowerMessage.includes('password')) {
    return 'The email or password you entered is incorrect. Please try again.';
  }

  if (lowerMessage.includes('email already exists') || lowerMessage.includes('email is already taken')) {
    return 'This email address is already registered. Please use a different email or sign in.';
  }

  // Validation errors
  if (lowerMessage.includes('required')) {
    return 'Please fill in all required fields.';
  }

  if (lowerMessage.includes('must be at least')) {
    const match = message.match(/must be at least (\d+)/);
    if (match) {
      return `Please enter at least ${match[1]} characters.`;
    }
    return 'The value you entered is too short. Please check and try again.';
  }

  if (lowerMessage.includes('must be a valid email')) {
    return 'Please enter a valid email address.';
  }

  if (lowerMessage.includes('password')) {
    if (lowerMessage.includes('too short')) {
      return 'Password must be at least 8 characters long.';
    }
    if (lowerMessage.includes("don't match")) {
      return "The passwords you entered don't match. Please try again.";
    }
  }

  // Network errors
  if (lowerMessage.includes('network error') || lowerMessage.includes('failed to fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  if (lowerMessage.includes('timeout')) {
    return 'The request took too long. Please check your connection and try again.';
  }

  // Payment errors
  if (lowerMessage.includes('payment') || lowerMessage.includes('transaction')) {
    if (lowerMessage.includes('failed')) {
      return 'The payment could not be processed. Please check your payment details and try again.';
    }
    if (lowerMessage.includes('insufficient')) {
      return 'Insufficient funds. Please check your account balance.';
    }
  }

  // Not found errors
  if (lowerMessage.includes('not found')) {
    return 'The item you are looking for could not be found.';
  }

  // Generic database errors
  if (lowerMessage.includes('unique constraint') || lowerMessage.includes('duplicate')) {
    return 'This value already exists. Please use a different value.';
  }

  // Return original message if no match found, but capitalize first letter
  return message.charAt(0).toUpperCase() + message.slice(1);
}

/**
 * Formats validation errors from the API into a user-friendly string
 */
export function formatValidationErrors(errors: Array<{ property?: string; constraints?: Record<string, string> }>): string {
  if (!errors || errors.length === 0) {
    return 'Please check your input and try again.';
  }

  const messages = errors
    .map((error) => {
      if (error.constraints) {
        const constraintMessage = Object.values(error.constraints)[0];
        const fieldName = error.property ? formatFieldName(error.property) : 'This field';
        return `${fieldName}: ${getUserFriendlyMessage(constraintMessage)}`;
      }
      return null;
    })
    .filter((msg): msg is string => msg !== null);

  if (messages.length === 1) {
    return messages[0];
  }

  return messages.join('\n');
}

/**
 * Formats field names to be more readable
 */
function formatFieldName(field: string): string {
  const fieldMap: Record<string, string> = {
    email: 'Email address',
    password: 'Password',
    confirmPassword: 'Confirm password',
    customerName: 'Name',
    customerPhone: 'Phone number',
    customerEmail: 'Email address',
    paymentProvider: 'Payment provider',
    title: 'Title',
    amount: 'Amount',
    price: 'Price',
    name: 'Name',
    description: 'Description',
  };

  return fieldMap[field] || field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
}

