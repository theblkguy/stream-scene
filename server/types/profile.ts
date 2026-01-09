// Profile-related TypeScript types for backend

/**
 * Profile data structure for API responses
 */
export interface ProfileResponse {
  id: number;
  email?: string; // Only for own profile
  name: string;
  username?: string;
  bio?: string;
  profilePicture?: string;
  contactEmail?: string;
  phone?: string;
  socialLinks?: { twitter?: string; instagram?: string; [key: string]: string | undefined };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Public profile (excludes sensitive information)
 */
export interface PublicProfileResponse {
  id: number;
  name: string;
  username?: string;
  bio?: string;
  profilePicture?: string;
  contactEmail?: string;
  phone?: string;
  socialLinks?: { twitter?: string; instagram?: string; [key: string]: string | undefined };
  createdAt?: string;
}

/**
 * Profile update request body
 */
export interface UpdateProfileRequest {
  username?: string;
  bio?: string;
  contactEmail?: string;
  phone?: string;
  socialLinks?: { twitter?: string; instagram?: string; [key: string]: string | undefined };
}

/**
 * Username availability check response
 */
export interface UsernameAvailabilityResponse {
  available: boolean;
  error?: string;
}

/**
 * Profile picture upload response
 */
export interface ProfilePictureUploadResponse {
  profilePicture: string;
  message: string;
}

