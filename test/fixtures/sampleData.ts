// test/fixtures/sampleData.ts
// Sample data fixtures for tests

/**
 * Sample user profile data
 */
export const sampleUserProfile = {
  email: 'john.doe@example.com',
  name: 'John Doe',
  username: 'johndoe',
  bio: 'Creative content creator and streamer',
  profile_picture_url: '/api/s3/proxy/profile-pictures/1-1234567890-profile.jpg',
  contact_email: 'john@example.com',
  phone: '+1234567890',
  social_links: JSON.stringify({
    twitter: 'https://twitter.com/johndoe',
    instagram: 'https://instagram.com/johndoe',
    youtube: 'https://youtube.com/@johndoe',
  }),
};

/**
 * Sample user without profile
 */
export const sampleBasicUser = {
  email: 'jane.smith@example.com',
  name: 'Jane Smith',
};

/**
 * Sample social links
 */
export const sampleSocialLinks = {
  twitter: 'https://twitter.com/username',
  instagram: 'https://instagram.com/username',
  youtube: 'https://youtube.com/@username',
  twitch: 'https://twitch.tv/username',
};

/**
 * Sample conversation data (when Conversation model exists)
 */
export const sampleConversation = {
  type: 'direct' as const,
  participantIds: [1, 2],
};

/**
 * Sample group conversation
 */
export const sampleGroupConversation = {
  type: 'group' as const,
  name: 'Team Chat',
  participantIds: [1, 2, 3, 4],
};

/**
 * Sample message data (when Message model exists)
 */
export const sampleMessage = {
  content: 'Hello, this is a test message!',
  message_type: 'text' as const,
};

/**
 * Sample message with file
 */
export const sampleFileMessage = {
  content: 'Check out this file',
  message_type: 'file' as const,
  file_url: '/api/s3/proxy/files/message-123-file.pdf',
};

/**
 * Generate random test data
 */
export const generateTestUser = (index: number = 0) => ({
  email: `testuser${index}@example.com`,
  name: `Test User ${index}`,
  username: `testuser${index}`,
  bio: `This is a test bio for user ${index}`,
});

/**
 * Generate random username
 */
export const generateRandomUsername = (): string => {
  return `user_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Generate random email
 */
export const generateRandomEmail = (): string => {
  return `test_${Math.random().toString(36).substring(2, 11)}@example.com`;
};

