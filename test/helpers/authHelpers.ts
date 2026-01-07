// test/helpers/authHelpers.ts
// Authentication helper utilities for tests

import { Request } from 'express';
import request from 'supertest';
import { User } from '../../server/models/User.js';
import { createAuthenticatedUser } from './testHelpers.js';

/**
 * Create a mock Express session
 */
export const createMockSession = (user: User): any => {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      google_id: user.google_id,
    },
    cookie: {
      originalMaxAge: 86400000,
      expires: new Date(Date.now() + 86400000),
      secure: false,
      httpOnly: true,
      path: '/',
    },
  };
};

/**
 * Create a mock user object for request testing
 */
export const createMockUser = (overrides?: {
  id?: number;
  email?: string;
  name?: string;
  google_id?: string;
}): any => {
  return {
    id: overrides?.id || 1,
    email: overrides?.email || 'test@example.com',
    name: overrides?.name || 'Test User',
    google_id: overrides?.google_id || 'google-123',
  };
};

/**
 * Authenticate a supertest request with a user
 */
export const authenticateRequest = (
  req: request.Test,
  user: User
): request.Test => {
  // Set the user in session/cookie for the request
  // This simulates an authenticated session
  return req.set('Cookie', [`user=${user.id}`]);
};

/**
 * Create an authenticated supertest agent
 * This helper can use an existing user or create a new one
 */
export const createAuthenticatedRequest = async (
  app: any,
  overrides?: {
    user?: User;
    id?: number;
    email?: string;
    name?: string;
    username?: string;
  }
): Promise<{ agent: request.SuperTest<request.Test>; user: User; userId: number }> => {
  let user: User;
  let userId: number;
  
  if (overrides?.user) {
    // Use existing user
    user = overrides.user;
    userId = user.id;
  } else if (overrides?.id) {
    // Find existing user by ID
    user = await User.findByPk(overrides.id) as User;
    if (!user) {
      throw new Error(`User with id ${overrides.id} not found`);
    }
    userId = user.id;
  } else {
    // Create new user
    const result = await createAuthenticatedUser(overrides);
    user = result.user;
    userId = result.userId;
  }
  
  const agent = request.agent(app);
  
  // For testing, we'll use a middleware that checks for user ID in headers
  // or we can mock the authentication middleware
  // The actual implementation will depend on how routes handle auth
  
  return { agent, user, userId };
};

/**
 * Helper to manually set authentication on a request
 * This bypasses actual authentication for testing purposes
 */
export const setAuthOnRequest = (req: any, user: User): void => {
  (req as any).user = {
    id: user.id,
    email: user.email,
    name: user.name,
    google_id: user.google_id,
  };
  (req as any).session = createMockSession(user);
  (req as any).isAuthenticated = () => true;
};

/**
 * Helper to create a request with authentication middleware
 */
export const createAuthenticatedReq = (user: User): Partial<Request> => {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      google_id: user.google_id,
    } as any,
    session: createMockSession(user),
    isAuthenticated: () => true,
  } as Partial<Request>;
};
