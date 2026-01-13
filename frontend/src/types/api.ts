// API Response Types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
  statusCode?: number;
  timestamp?: string;
}

export interface ValidationError {
  property: string;
  constraints: {
    [key: string]: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


