// test/helpers/appTestHelper.ts
// Helper to create test app instances with mocked authentication

import express, { Request, Response, NextFunction } from 'express';
import { User } from '../../server/models/User.js';

/**
 * Create a middleware that injects a user into req.user for testing
 */
export const createTestAuthMiddleware = (user: User) => {
  return (req: Request, res: Response, next: NextFunction) => {
    (req as any).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      google_id: user.google_id,
      username: (user as any).username,
      bio: (user as any).bio,
      profile_picture_url: (user as any).profile_picture_url,
    };
    (req as any).isAuthenticated = () => true;
    next();
  };
};

/**
 * Patch req.user on a request object (for direct route testing)
 */
export const injectUserIntoRequest = (req: any, user: User): void => {
  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    google_id: user.google_id,
    username: (user as any).username,
    bio: (user as any).bio,
    profile_picture_url: (user as any).profile_picture_url,
  };
  req.isAuthenticated = () => true;
};

