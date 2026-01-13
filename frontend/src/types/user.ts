// User Types

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
}



