// Profile-related TypeScript types for frontend

import { User } from './auth.js';

/**
 * Profile data returned from API
 */
export interface Profile extends Omit<User, 'google_id' | 'email'> {
  email?: string; // Only included for own profile
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Public profile (excludes sensitive information)
 */
export interface PublicProfile {
  id: number;
  name: string;
  username?: string;
  bio?: string;
  profilePicture?: string;
  contactEmail?: string;
  phone?: string;
  socialLinks?: { twitter?: string; instagram?: string; [key: string]: string };
  createdAt?: string;
}

/**
 * Profile update request payload
 */
export interface UpdateProfileRequest {
  username?: string;
  bio?: string;
  contactEmail?: string;
  phone?: string;
  socialLinks?: { twitter?: string; instagram?: string; [key: string]: string };
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

