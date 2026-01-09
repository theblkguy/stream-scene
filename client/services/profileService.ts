// client/services/profileService.ts
// Profile service for API calls

import { User } from '../types/auth';

export interface ProfileUpdateData {
  username?: string;
  bio?: string;
  contactEmail?: string;
  phone?: string;
  socialLinks?: { twitter?: string; instagram?: string; [key: string]: string };
}

export interface UsernameCheckResponse {
  available: boolean;
  error?: string;
}

/**
 * Get current user's profile
 */
export async function getProfile(): Promise<User> {
  const response = await fetch('/api/profile', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}

/**
 * Get profile by user ID
 */
export async function getProfileById(userId: number): Promise<User> {
  const response = await fetch(`/api/profile/${userId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found');
    }
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}

/**
 * Get profile by username
 */
export async function getProfileByUsername(username: string): Promise<User> {
  const response = await fetch(`/api/profile/username/${encodeURIComponent(username)}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found');
    }
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}

/**
 * Update current user's profile
 */
export async function updateProfile(data: ProfileUpdateData): Promise<User> {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }

  return response.json();
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(file: File): Promise<{ profilePicture: string; message: string }> {
  const formData = new FormData();
  formData.append('picture', file);

  const response = await fetch('/api/profile/picture', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload profile picture');
  }

  return response.json();
}

/**
 * Delete profile picture
 */
export async function deleteProfilePicture(): Promise<void> {
  const response = await fetch('/api/profile/picture', {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete profile picture');
  }
}

/**
 * Check username availability
 */
export async function checkUsernameAvailability(username: string): Promise<UsernameCheckResponse> {
  const response = await fetch(`/api/profile/username/check/${encodeURIComponent(username)}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    return { available: false, error: 'Failed to check username' };
  }

  return response.json();
}

/**
 * Search users by username or name
 */
export async function searchUsers(query: string, limit = 20): Promise<User[]> {
  const response = await fetch(`/api/profile/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to search users');
  }

  const data = await response.json();
  return data.users;
}


