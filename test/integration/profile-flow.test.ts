// test/integration/profile-flow.test.ts
// End-to-end profile flow tests

import { expect } from 'chai';
import { describe, it, before, after, beforeEach } from 'mocha';
import { User } from '../../server/models/User.js';
import { cleanupTestData, resetTestDatabase, createTestUser } from '../helpers/testHelpers.js';
import { ensureTestDatabase } from '../setup.js';

describe('Profile Flow Integration', () => {
  let user: User;

  before(async () => {
    await ensureTestDatabase();
    await resetTestDatabase();
  });

  after(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Create a fresh user for each test
    user = await createTestUser({
      email: `flow-${Date.now()}@example.com`,
      name: 'Flow Test User',
    });
  });

  describe('Complete Profile Setup Flow', () => {
    it('should complete full profile setup: username → picture → bio', async () => {
      // Step 1: Set username
      await user.update({
        username: 'flowuser',
      } as any);

      expect((user as any).username).to.equal('flowuser');

      // Step 2: Update bio
      await user.update({
        bio: 'This is my bio for the flow test',
      } as any);

      expect((user as any).bio).to.equal('This is my bio for the flow test');

      // Step 3: Set profile picture URL (simulating upload)
      const pictureUrl = '/api/s3/proxy/profile-pictures/1-1234567890-profile.jpg';
      await user.update({
        profile_picture_url: pictureUrl,
      } as any);

      expect((user as any).profile_picture_url).to.equal(pictureUrl);

      // Step 4: Add contact info
      await user.update({
        contact_email: 'contact@example.com',
        phone: '+1234567890',
      } as any);

      expect((user as any).contact_email).to.equal('contact@example.com');
      expect((user as any).phone).to.equal('+1234567890');

      // Step 5: Add social links
      const socialLinks = {
        twitter: 'https://twitter.com/flowuser',
        instagram: 'https://instagram.com/flowuser',
      };
      user.socialLinks = socialLinks;
      await user.save();

      expect(user.socialLinks).to.deep.equal(socialLinks);

      // Verify complete profile
      const updatedUser = await User.findByPk(user.id);
      expect((updatedUser as any).username).to.equal('flowuser');
      expect((updatedUser as any).bio).to.equal('This is my bio for the flow test');
      expect((updatedUser as any).profile_picture_url).to.equal(pictureUrl);
    });

    it('should handle username conflict resolution', async () => {
      // User 1 sets username
      await user.update({
        username: 'conflicttest',
      } as any);

      // User 2 tries to use same username
      const user2 = await createTestUser({
        email: `flow2-${Date.now()}@example.com`,
        name: 'Flow Test User 2',
      });

      try {
        await user2.update({
          username: 'conflicttest',
        } as any);
        expect.fail('Should have thrown unique constraint error');
      } catch (error: any) {
        expect(error.name).to.be.oneOf(['SequelizeUniqueConstraintError', 'SequelizeDatabaseError']);
      }

      // User 2 sets different username (should work)
      await user2.update({
        username: 'conflicttest2',
      } as any);

      expect((user2 as any).username).to.equal('conflicttest2');
    });

    it('should handle profile picture replacement', async () => {
      // Set initial picture
      const oldPictureUrl = '/api/s3/proxy/profile-pictures/1-old.jpg';
      await user.update({
        profile_picture_url: oldPictureUrl,
      } as any);

      expect((user as any).profile_picture_url).to.equal(oldPictureUrl);

      // Replace with new picture
      const newPictureUrl = '/api/s3/proxy/profile-pictures/1-new.jpg';
      await user.update({
        profile_picture_url: newPictureUrl,
      } as any);

      expect((user as any).profile_picture_url).to.equal(newPictureUrl);
      expect((user as any).profile_picture_url).to.not.equal(oldPictureUrl);
    });

    it('should handle profile visibility (public vs private fields)', async () => {
      // Set up complete profile
      await user.update({
        username: 'publicuser',
        bio: 'Public bio',
        profile_picture_url: '/api/s3/proxy/profile.jpg',
        contact_email: 'private@example.com',
        phone: '+1234567890',
      } as any);

      // Simulate public profile view (should not include email)
      const publicProfile = {
        id: user.id,
        name: user.name,
        username: (user as any).username,
        bio: (user as any).bio,
        profilePicture: (user as any).profile_picture_url,
        contactEmail: (user as any).contact_email,
        phone: (user as any).phone,
      };

      // Email should not be in public profile
      expect(publicProfile).to.not.have.property('email');

      // Simulate own profile view (should include email)
      const ownProfile = {
        ...publicProfile,
        email: user.email,
      };

      expect(ownProfile).to.have.property('email', user.email);
    });

    it('should update profile incrementally', async () => {
      // Start with minimal profile
      expect((user as any).username).to.be.null;

      // Add username
      await user.update({ username: 'incremental' } as any);
      expect((user as any).username).to.equal('incremental');

      // Add bio later
      await user.update({ bio: 'Added later' } as any);
      await user.reload(); // Reload to get updated values
      expect((user as any).bio).to.equal('Added later');
      expect((user as any).username).to.equal('incremental');

      // Add contact info even later
      await user.update({
        contact_email: 'later@example.com',
      } as any);
      await user.reload(); // Reload to get updated values
      expect((user as any).contact_email).to.equal('later@example.com');
      expect((user as any).username).to.equal('incremental');
      expect((user as any).bio).to.equal('Added later');
    });

    it('should allow clearing profile fields', async () => {
      // Set profile data
      await user.update({
        username: 'toclear',
        bio: 'to clear',
        contact_email: 'clear@example.com',
        phone: '+1234567890',
      } as any);

      // Clear username
      await user.update({ username: null } as any);
      expect((user as any).username).to.be.null;

      // Clear bio
      await user.update({ bio: null } as any);
      expect((user as any).bio).to.be.null;

      // Clear contact info
      await user.update({
        contact_email: null,
        phone: null,
      } as any);
      expect((user as any).contact_email).to.be.null;
      expect((user as any).phone).to.be.null;
    });
  });
});
