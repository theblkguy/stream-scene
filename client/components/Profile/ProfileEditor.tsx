// client/components/Profile/ProfileEditor.tsx
// Profile editor component

import React, { useState, useEffect } from 'react';
import { User } from '../../types/auth';
import { updateProfile, uploadProfilePicture, deleteProfilePicture, checkUsernameAvailability } from '../../services/profileService';
import toast from 'react-hot-toast';

interface ProfileEditorProps {
  profile: User;
  onSave: () => void;
  onCancel: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: profile.username || '',
    bio: profile.bio || '',
    contactEmail: profile.contactEmail || '',
    phone: profile.phone || '',
    twitter: profile.socialLinks?.twitter || '',
    instagram: profile.socialLinks?.instagram || '',
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(profile.profilePicture || null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Check username availability when it changes
    if (formData.username && formData.username !== profile.username) {
      const timeoutId = setTimeout(() => {
        checkUsername();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setUsernameAvailable(null);
    }
  }, [formData.username]);

  const checkUsername = async () => {
    if (!formData.username || formData.username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      const result = await checkUsernameAvailability(formData.username);
      setUsernameAvailable(result.available);
    } catch (error) {
      setUsernameAvailable(false);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        toast.error('Please select a JPG, PNG, or WebP image');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = async () => {
    try {
      await deleteProfilePicture();
      setProfilePicture(null);
      setProfilePicturePreview(null);
      toast.success('Profile picture removed');
    } catch (error) {
      toast.error('Failed to remove profile picture');
    }
  };

  const validateUsername = (username: string): boolean => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate username
    if (formData.username && !validateUsername(formData.username)) {
      toast.error('Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    if (formData.username && usernameAvailable === false) {
      toast.error('Username is already taken');
      return;
    }

    // Validate bio length
    if (formData.bio && formData.bio.length > 500) {
      toast.error('Bio must be 500 characters or less');
      return;
    }

    setSaving(true);
    try {
      // Upload profile picture if changed
      if (profilePicture) {
        await uploadProfilePicture(profilePicture);
      }

      // Update profile
      const socialLinks: Record<string, string> = {};
      if (formData.twitter) socialLinks.twitter = formData.twitter;
      if (formData.instagram) socialLinks.instagram = formData.instagram;

      await updateProfile({
        username: formData.username || undefined,
        bio: formData.bio || undefined,
        contactEmail: formData.contactEmail || undefined,
        phone: formData.phone || undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      });

      toast.success('Profile updated successfully');
      onSave();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm">
          <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium mb-2">Profile Picture</label>
              <div className="flex items-center gap-4">
                {profilePicturePreview ? (
                  <img
                    src={profilePicturePreview}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                    No image
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer text-center">
                    Upload
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {profilePicturePreview && (
                    <button
                      type="button"
                      onClick={handleRemovePicture}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="username"
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
              />
              {usernameChecking && (
                <p className="text-sm text-gray-400 mt-1">Checking availability...</p>
              )}
              {!usernameChecking && usernameAvailable === true && (
                <p className="text-sm text-green-400 mt-1">Username available</p>
              )}
              {!usernameChecking && usernameAvailable === false && (
                <p className="text-sm text-red-400 mt-1">Username already taken</p>
              )}
              {formData.username && !validateUsername(formData.username) && (
                <p className="text-sm text-red-400 mt-1">
                  Username must be 3-20 characters and contain only letters, numbers, and underscores
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={500}
              />
              <p className="text-sm text-gray-400 mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium mb-2">
                Contact Email
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="contact@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-sm font-medium mb-2">Social Links</label>
              <div className="space-y-2">
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Twitter URL"
                />
                <input
                  type="url"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Instagram URL"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;


