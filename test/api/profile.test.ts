// test/api/profile.test.ts
// Profile API endpoint tests

import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import { User } from '../../server/models/User.js';
import { createTestUser, createTestProfile, cleanupTestData } from '../helpers/testHelpers.js';
import { createAuthenticatedRequest } from '../helpers/authHelpers.js';

// Import app (you may need to adjust this based on your app structure)
// For now, we'll create a minimal test app
let app: express.Application;

describe('Profile API', () => {
  let testUser: User;
  let authenticatedAgent: request.SuperAgentTest;

  before(async () => {
    // Ensure test database is initialized
    const { ensureTestDatabase } = await import('../setup.js');
    await ensureTestDatabase();
    
    // Setup test app - in a real scenario, you'd import your actual app
    app = express();
    app.use(express.json());
    
    // Add test authentication middleware that sets req.user from headers
    app.use((req, res, next) => {
      const userId = req.headers['x-test-user-id'];
      if (userId) {
        User.findByPk(parseInt(userId as string, 10))
          .then(user => {
            if (user) {
              (req as any).user = {
                id: user.id,
                email: user.email,
                name: user.name,
                google_id: user.google_id,
                username: (user as any).username,
              };
            }
            next();
          })
          .catch(() => next());
      } else {
        next();
      }
    });
    
    // Import and mount profile routes
    const profileRoutes = (await import('../../server/routes/profile.js')).default;
    app.use('/api/profile', profileRoutes);
    
    // Create test user
    testUser = await createTestUser({
      email: 'profile-test@example.com',
      name: 'Profile Test User',
    });
  });

  beforeEach(async () => {
    // Create authenticated request for each test
    // The agent will use x-test-user-id header set by middleware
    authenticatedAgent = request.agent(app);
    (authenticatedAgent as any).set('x-test-user-id', testUser.id.toString());
  });

  after(async () => {
    await cleanupTestData();
  });

  describe('GET /api/profile', () => {
    it('should return current user profile when authenticated', async () => {
      const response = await authenticatedAgent
        .get('/api/profile')
        .expect(200);

      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('email');
      expect(response.body).to.have.property('name');
      expect(response.body).to.have.property('username');
      expect(response.body).to.have.property('bio');
      expect(response.body).to.have.property('profilePicture');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/profile')
        .expect(401);
    });
  });

  describe('GET /api/profile/:userId', () => {
    it('should return public profile for valid user ID', async () => {
      const user = await createTestUser({
        email: 'public-user@example.com',
        name: 'Public User',
        username: 'publicuser',
      });

      const response = await request(app)
        .get(`/api/profile/${user.id}`)
        .expect(200);

      expect(response.body).to.have.property('id', user.id);
      expect(response.body).to.have.property('name', 'Public User');
      expect(response.body).to.have.property('username', 'publicuser');
      // Should not include email (sensitive)
      expect(response.body).to.not.have.property('email');
    });

    it('should return 404 for invalid user ID', async () => {
      await request(app)
        .get('/api/profile/99999')
        .expect(404);
    });
  });

  describe('GET /api/profile/username/:username', () => {
    it('should return profile for valid username', async () => {
      const user = await createTestProfile({
        username: 'testuser123',
        name: 'Test User',
      });

      const response = await request(app)
        .get('/api/profile/username/testuser123')
        .expect(200);

      expect(response.body).to.have.property('username', 'testuser123');
    });

    it('should return 404 for invalid username', async () => {
      await request(app)
        .get('/api/profile/username/nonexistent')
        .expect(404);
    });

    it('should be case-insensitive', async () => {
      const user = await createTestProfile({
        username: 'caseuser',
        name: 'Case User',
      });

      await request(app)
        .get('/api/profile/username/CASEUSER')
        .expect(200);
    });
  });

  describe('GET /api/profile/username/check/:username', () => {
    it('should return available: true for available username', async () => {
      const response = await request(app)
        .get('/api/profile/username/check/availableuser')
        .expect(200);

      expect(response.body).to.have.property('available', true);
    });

    it('should return available: false for taken username', async () => {
      await createTestProfile({
        username: 'takenuser',
      });

      const response = await request(app)
        .get('/api/profile/username/check/takenuser')
        .expect(200);

      expect(response.body).to.have.property('available', false);
    });

    it('should be case-insensitive', async () => {
      await createTestProfile({
        username: 'casecheck',
      });

      const response = await request(app)
        .get('/api/profile/username/check/CASECHECK')
        .expect(200);

      expect(response.body).to.have.property('available', false);
    });
  });

  describe('PUT /api/profile', () => {
    it('should update profile when authenticated', async () => {
      const updateData = {
        username: 'updateduser',
        bio: 'Updated bio',
        contactEmail: 'contact@example.com',
        phone: '+1234567890',
        socialLinks: {
          twitter: 'https://twitter.com/user',
          instagram: 'https://instagram.com/user',
        },
      };

      const response = await authenticatedAgent
        .put('/api/profile')
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('username', 'updateduser');
      expect(response.body).to.have.property('bio', 'Updated bio');
      expect(response.body).to.have.property('contactEmail', 'contact@example.com');
    });

    it('should validate username format', async () => {
      const response = await authenticatedAgent
        .put('/api/profile')
        .send({ username: 'ab' }) // Too short
        .expect(400);

      expect(response.body).to.have.property('error');
    });

    it('should enforce username uniqueness', async () => {
      const otherUser = await createTestProfile({
        username: 'uniqueuser',
      });

      const response = await authenticatedAgent
        .put('/api/profile')
        .send({ username: 'uniqueuser' })
        .expect(400);

      expect(response.body).to.have.property('error');
    });

    it('should validate bio length', async () => {
      const longBio = 'a'.repeat(501); // Too long

      const response = await authenticatedAgent
        .put('/api/profile')
        .send({ bio: longBio })
        .expect(400);

      expect(response.body).to.have.property('error');
    });

    it('should validate email format', async () => {
      const response = await authenticatedAgent
        .put('/api/profile')
        .send({ contactEmail: 'invalid-email' })
        .expect(400);

      expect(response.body).to.have.property('error');
    });

    it('should validate social links URLs', async () => {
      const response = await authenticatedAgent
        .put('/api/profile')
        .send({
          socialLinks: {
            twitter: 'not-a-valid-url',
          },
        })
        .expect(400);

      expect(response.body).to.have.property('error');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .put('/api/profile')
        .send({ bio: 'Test bio' })
        .expect(401);
    });
  });

  describe('POST /api/profile/picture', () => {
    it('should upload profile picture when authenticated', async () => {
      // Create a mock image file
      const imageBuffer = Buffer.from('fake-image-data');
      
      const response = await authenticatedAgent
        .post('/api/profile/picture')
        .attach('picture', imageBuffer, 'test.jpg')
        .expect(200);

      expect(response.body).to.have.property('profilePicture');
    });

    it('should validate file type', async () => {
      const textBuffer = Buffer.from('not-an-image');
      
      await authenticatedAgent
        .post('/api/profile/picture')
        .attach('picture', textBuffer, 'test.txt')
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .post('/api/profile/picture')
        .expect(401);
    });
  });

  describe('DELETE /api/profile/picture', () => {
    it('should delete profile picture when authenticated', async () => {
      // First set a profile picture
      (testUser as any).profile_picture_url = '/api/s3/proxy/test-key';
      await testUser.save();

      await authenticatedAgent
        .delete('/api/profile/picture')
        .expect(200);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .delete('/api/profile/picture')
        .expect(401);
    });
  });
});
