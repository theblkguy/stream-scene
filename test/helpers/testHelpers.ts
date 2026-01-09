// test/helpers/testHelpers.ts
// Test helper utilities for common test operations

import { Sequelize } from 'sequelize';
import { getSequelize } from '../../server/db/connection.js';
import { User } from '../../server/models/User.js';

let testSequelize: Sequelize | null = null;

/**
 * Get or create test database connection
 */
export const getTestSequelize = (): Sequelize => {
  if (!testSequelize) {
    testSequelize = getSequelize();
  }
  return testSequelize;
};

/**
 * Check if database connection is available
 */
const isDatabaseAvailable = async (): Promise<boolean> => {
  try {
    const sequelize = getTestSequelize();
    await sequelize.authenticate();
    return true;
  } catch (error: any) {
    if (error?.code === 'ER_ACCESS_DENIED_ERROR' || error?.name === 'SequelizeAccessDeniedError') {
      return false;
    }
    // For other errors, assume database might be available
    return true;
  }
};

/**
 * Create an authenticated user and return user object and session data
 */
export const createAuthenticatedUser = async (overrides?: {
  email?: string;
  name?: string;
  google_id?: string;
  username?: string;
  bio?: string;
  profile_picture_url?: string;
}): Promise<{ user: User; userId: number }> => {
  const user = await User.create({
    email: overrides?.email || `test-${Date.now()}@example.com`,
    name: overrides?.name || 'Test User',
    google_id: overrides?.google_id || `google-${Date.now()}`,
    // Include profile fields if they exist in the model
    ...(overrides?.username && { username: overrides.username }),
    ...(overrides?.bio && { bio: overrides.bio }),
    ...(overrides?.profile_picture_url && { profile_picture_url: overrides.profile_picture_url }),
  } as any);

  return { user, userId: user.id };
};

/**
 * Create a test user (factory function)
 */
export const createTestUser = async (overrides?: {
  email?: string;
  name?: string;
  google_id?: string;
  username?: string;
  bio?: string;
  profile_picture_url?: string;
  contact_email?: string;
  phone?: string;
  social_links?: string;
}): Promise<User> => {
  // Check database availability first
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    throw new Error('Database not available. Please configure test database in .env.test');
  }

  return await User.create({
    email: overrides?.email || `test-${Date.now()}@example.com`,
    name: overrides?.name || 'Test User',
    google_id: overrides?.google_id || `google-${Date.now()}`,
    // Include profile fields if they exist
    ...(overrides?.username && { username: overrides.username }),
    ...(overrides?.bio && { bio: overrides.bio }),
    ...(overrides?.profile_picture_url && { profile_picture_url: overrides.profile_picture_url }),
    ...(overrides?.contact_email && { contact_email: overrides.contact_email }),
    ...(overrides?.phone && { phone: overrides.phone }),
    ...(overrides?.social_links && { social_links: overrides.social_links }),
  } as any);
};

/**
 * Create a test user with profile data
 */
export const createTestProfile = async (overrides?: {
  email?: string;
  name?: string;
  username?: string;
  bio?: string;
  profile_picture_url?: string;
  contact_email?: string;
  phone?: string;
  social_links?: Record<string, string>;
}): Promise<User> => {
  const socialLinksJson = overrides?.social_links 
    ? JSON.stringify(overrides.social_links) 
    : undefined;

  return await createTestUser({
    ...overrides,
    social_links: socialLinksJson,
  });
};

/**
 * Clean up all test data
 * Note: In a real implementation, this should use transactions for better isolation
 */
export const cleanupTestData = async (): Promise<void> => {
  // Check if database is available before attempting cleanup
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    // Silently skip cleanup if database is not available
    return;
  }

  try {
    const sequelize = getTestSequelize();
    
    // Get all models
    const models = sequelize.models;
    
    // Delete in reverse order of dependencies
    // Try to delete in order, but handle cases where models might not be loaded
    const MessageModel = models.Message || (await import('../../server/models/Message.js')).default;
    const ConversationParticipantModel = models.ConversationParticipant || (await import('../../server/models/ConversationParticipant.js')).default;
    const ConversationModel = models.Conversation || (await import('../../server/models/Conversation.js')).default;
    
    // Use Promise.allSettled to handle errors gracefully
    await Promise.allSettled([
      MessageModel ? (MessageModel as any).destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {}) : Promise.resolve(),
      ConversationParticipantModel ? (ConversationParticipantModel as any).destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {}) : Promise.resolve(),
      ConversationModel ? (ConversationModel as any).destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {}) : Promise.resolve(),
    ]);
    
    // Clean up other related data
    await Promise.allSettled([
      models.Share ? (models.Share as any).destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {}) : Promise.resolve(),
      models.File ? (models.File as any).destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {}) : Promise.resolve(),
      models.Task ? (models.Task as any).destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {}) : Promise.resolve(),
    ]);
    
    // Finally, clean up users
    if (models.User) {
      await User.destroy({ where: {}, truncate: true, cascade: true, force: true }).catch(() => {});
    }
  } catch (error: any) {
    // Silently ignore cleanup errors - they're not critical for test execution
    // Only log if it's not a connection error
    if (error?.code !== 'ER_ACCESS_DENIED_ERROR' && error?.name !== 'SequelizeAccessDeniedError') {
      console.error('Error cleaning up test data:', error?.message || error);
    }
  }
};

/**
 * Mock S3 upload function for testing
 */
export const mockS3Upload = async (key: string, body: Buffer, contentType?: string): Promise<string> => {
  // In tests, we'll return a mock URL
  return `/api/s3/proxy/${key}`;
};

/**
 * Mock S3 delete function for testing
 */
export const mockS3Delete = async (key: string): Promise<void> => {
  // Mock implementation - in real tests, this would use sinon or similar
  return Promise.resolve();
};

/**
 * Mock profile picture upload
 */
export const mockS3ProfileUpload = async (
  userId: number,
  file: { buffer: Buffer; mimetype: string; originalname: string }
): Promise<string> => {
  const timestamp = Date.now();
  const key = `profile-pictures/${userId}-${timestamp}-${file.originalname}`;
  return mockS3Upload(key, file.buffer, file.mimetype);
};

/**
 * Reset test database (for use in before/after hooks)
 */
export const resetTestDatabase = async (): Promise<void> => {
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    // If database is not available, skip reset
    return;
  }
  await cleanupTestData();
};

/**
 * Helper to create a test conversation
 */
export const createTestConversation = async (
  type: 'direct' | 'group',
  participantIds: number[],
  overrides?: {
    name?: string;
  }
): Promise<import('../../server/models/Conversation.js').Conversation> => {
  const { Conversation } = await import('../../server/models/Conversation.js');
  const { ConversationParticipant } = await import('../../server/models/ConversationParticipant.js');
  
  const conversation = await Conversation.create({
    type,
    name: overrides?.name || undefined,
  });

  // Create participants
  for (const userId of participantIds) {
    await ConversationParticipant.create({
      conversation_id: conversation.id,
      user_id: userId,
      role: type === 'group' && participantIds.indexOf(userId) === 0 ? 'admin' : 'member',
    });
  }

  return conversation;
};

/**
 * Helper to create a test message
 */
export const createTestMessage = async (
  conversationId: number,
  userId: number,
  content: string,
  overrides?: {
    message_type?: 'text' | 'image' | 'file';
    file_url?: string;
  }
): Promise<import('../../server/models/Message.js').Message> => {
  const { Message } = await import('../../server/models/Message.js');
  
  return await Message.create({
    conversation_id: conversationId,
    user_id: userId,
    content,
    message_type: overrides?.message_type || 'text',
    file_url: overrides?.file_url || undefined,
  });
};

/**
 * Helper to create a video room (when video chat is implemented)
 */
export const createVideoRoom = async (
  userId: number,
  overrides?: {
    maxParticipants?: number;
  }
): Promise<any> => {
  // This will be implemented when video chat is implemented
  return {
    id: `room-${Date.now()}`,
    creatorId: userId,
    maxParticipants: overrides?.maxParticipants || 4,
  };
};
