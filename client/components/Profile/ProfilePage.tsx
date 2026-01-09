// client/components/Profile/ProfilePage.tsx
// Profile page component

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiChatBubbleLeftRight } from 'react-icons/hi2';
import { User } from '../../types/auth';
import { getProfile, getProfileById, getProfileByUsername } from '../../services/profileService';
import ProfileEditor from './ProfileEditor';
import useAuth from '../../hooks/useAuth';
import messagingService from '../../services/messagingService';

const ProfilePage: React.FC = () => {
  const { userId, username } = useParams<{ userId?: string; username?: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId, username]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      let profileData: User;
      if (username) {
        profileData = await getProfileByUsername(username);
      } else if (userId) {
        profileData = await getProfileById(parseInt(userId, 10));
      } else {
        profileData = await getProfile();
      }

      setProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    loadProfile();
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleMessage = async () => {
    if (!profile || !currentUser || currentUser.id === profile.id) return;

    try {
      // Create or get existing direct conversation
      const conversation = await messagingService.createConversation('direct', [profile.id]);
      // Navigate to messages page with the conversation
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      // If conversation already exists, just navigate to messages
      navigate('/messages');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Profile not found</div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  if (isEditing && isOwnProfile) {
    return (
      <ProfileEditor
        profile={profile}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            {/* Profile Picture */}
            <div className="relative">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-purple-500"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                {profile.username && (
                  <span className="text-gray-400">@{profile.username}</span>
                )}
              </div>
              {profile.bio && (
                <p className="text-gray-300 mb-4">{profile.bio}</p>
              )}
              <div className="flex items-center gap-3">
                {isOwnProfile ? (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-medium"
                  >
                    Edit Profile
                  </button>
                ) : currentUser ? (
                  <button
                    onClick={handleMessage}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                  >
                    <HiChatBubbleLeftRight className="w-5 h-5" />
                    Message
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {(profile.contactEmail || profile.phone || profile.socialLinks) && (
            <div className="border-t border-gray-700 pt-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-2">
                {profile.contactEmail && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Email:</span>
                    <a
                      href={`mailto:${profile.contactEmail}`}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {profile.contactEmail}
                    </a>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Phone:</span>
                    <a
                      href={`tel:${profile.phone}`}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {profile.phone}
                    </a>
                  </div>
                )}
                {profile.socialLinks && (
                  <div className="flex items-center gap-4 mt-4">
                    {profile.socialLinks.twitter && (
                      <a
                        href={profile.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Twitter
                      </a>
                    )}
                    {profile.socialLinks.instagram && (
                      <a
                        href={profile.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-400 hover:text-pink-300"
                      >
                        Instagram
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;


