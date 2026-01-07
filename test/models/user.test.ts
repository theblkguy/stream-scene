// test/models/user.test.ts
// User model tests

import { expect } from 'chai';
import { describe, it, before, after, beforeEach } from 'mocha';
import { User } from '../../server/models/User.js';
import { cleanupTestData, resetTestDatabase, createTestUser } from '../helpers/testHelpers.js';
import { ensureTestDatabase } from '../setup.js';
import { SequelizeUniqueConstraintError } from 'sequelize';

describe('User Model', () => {
  before(async () => {
    await ensureTestDatabase();
    await resetTestDatabase();
  });

  after(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Clean up users before each test
    await User.destroy({ where: {}, force: true });
  });

  describe('Basic User Creation', () => {
    it('should create a user with required fields', async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(user).to.exist;
      expect(user.id).to.be.a('number');
      expect(user.email).to.equal('test@example.com');
      expect(user.name).to.equal('Test User');
      expect(user.created_at).to.be.instanceOf(Date);
      expect(user.updated_at).to.be.instanceOf(Date);
    });

    it('should create user with optional google_id', async () => {
      const user = await User.create({
        email: 'google@example.com',
        name: 'Google User',
        google_id: 'google-123',
      });

      expect(user.google_id).to.equal('google-123');
    });

    it('should require email', async () => {
      try {
        await User.create({
          name: 'No Email User',
        } as any);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.name).to.be.oneOf(['SequelizeValidationError', 'SequelizeDatabaseError']);
      }
    });

    it('should require name', async () => {
      try {
        await User.create({
          email: 'no-name@example.com',
        } as any);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.name).to.be.oneOf(['SequelizeValidationError', 'SequelizeDatabaseError']);
      }
    });
  });

  describe('Profile Fields', () => {
    it('should allow setting username', async () => {
      const user = await User.create({
        email: 'username@example.com',
        name: 'Username User',
        username: 'testuser',
      } as any);

      expect((user as any).username).to.equal('testuser');
    });

    it('should validate username format (alphanumeric + underscore)', async () => {
      try {
        await User.create({
          email: 'invalid-username@example.com',
          name: 'Invalid User',
          username: 'invalid-username!',
        } as any);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.name).to.be.oneOf(['SequelizeValidationError', 'SequelizeDatabaseError']);
      }
    });

    it('should validate username length (3-20 characters)', async () => {
      // Too short
      try {
        await User.create({
          email: 'short@example.com',
          name: 'Short User',
          username: 'ab',
        } as any);
        expect.fail('Should have thrown validation error for short username');
      } catch (error: any) {
        expect(error.name).to.be.oneOf(['SequelizeValidationError', 'SequelizeDatabaseError']);
      }

      // Too long
      try {
        await User.create({
          email: 'long@example.com',
          name: 'Long User',
          username: 'a'.repeat(21),
        } as any);
        expect.fail('Should have thrown validation error for long username');
      } catch (error: any) {
        expect(error.name).to.be.oneOf(['SequelizeValidationError', 'SequelizeDatabaseError']);
      }
    });

    it('should enforce username uniqueness', async () => {
      await User.create({
        email: 'user1@example.com',
        name: 'User One',
        username: 'uniqueuser',
      } as any);

      try {
        await User.create({
          email: 'user2@example.com',
          name: 'User Two',
          username: 'uniqueuser',
        } as any);
        expect.fail('Should have thrown unique constraint error');
      } catch (error: any) {
        expect(error.name).to.be.oneOf(['SequelizeUniqueConstraintError', 'SequelizeDatabaseError']);
      }
    });

    it('should allow null username (optional)', async () => {
      const user = await User.create({
        email: 'no-username@example.com',
        name: 'No Username User',
        username: null,
      } as any);

      expect((user as any).username).to.be.null;
    });

    it('should allow setting bio', async () => {
      const bio = 'This is a test bio';
      const user = await User.create({
        email: 'bio@example.com',
        name: 'Bio User',
        bio: bio,
      } as any);

      expect((user as any).bio).to.equal(bio);
    });

    it('should validate bio length (max 500 characters)', async () => {
      const longBio = 'a'.repeat(501);
      try {
        await User.create({
          email: 'long-bio@example.com',
          name: 'Long Bio User',
          bio: longBio,
        } as any);
        expect.fail('Should have thrown validation error for long bio');
      } catch (error: any) {
        expect(error.name).to.be.oneOf(['SequelizeValidationError', 'SequelizeDatabaseError']);
      }
    });

    it('should allow setting profile_picture_url', async () => {
      const url = '/api/s3/proxy/profile-pictures/1.jpg';
      const user = await User.create({
        email: 'pic@example.com',
        name: 'Pic User',
        profile_picture_url: url,
      } as any);

      expect((user as any).profile_picture_url).to.equal(url);
    });

    it('should allow setting contact_email', async () => {
      const contactEmail = 'contact@example.com';
      const user = await User.create({
        email: 'user@example.com',
        name: 'Contact User',
        contact_email: contactEmail,
      } as any);

      expect((user as any).contact_email).to.equal(contactEmail);
    });

    it('should validate contact_email format', async () => {
      try {
        await User.create({
          email: 'user@example.com',
          name: 'Invalid Contact User',
          contact_email: 'not-an-email',
        } as any);
        expect.fail('Should have thrown validation error for invalid email');
      } catch (error: any) {
        expect(error.name).to.be.oneOf(['SequelizeValidationError', 'SequelizeDatabaseError']);
      }
    });

    it('should allow setting phone', async () => {
      const phone = '+1234567890';
      const user = await User.create({
        email: 'phone@example.com',
        name: 'Phone User',
        phone: phone,
      } as any);

      expect((user as any).phone).to.equal(phone);
    });

    it('should allow setting social_links as JSON string', async () => {
      const socialLinks = {
        twitter: 'https://twitter.com/user',
        instagram: 'https://instagram.com/user',
      };
      const socialLinksJson = JSON.stringify(socialLinks);
      
      const user = await User.create({
        email: 'social@example.com',
        name: 'Social User',
        social_links: socialLinksJson,
      } as any);

      expect((user as any).social_links).to.equal(socialLinksJson);
    });
  });

  describe('User Getters', () => {
    it('should return googleId from google_id', async () => {
      const user = await User.create({
        email: 'getter@example.com',
        name: 'Getter User',
        google_id: 'google-456',
      });

      expect(user.googleId).to.equal('google-456');
    });

    it('should return firstName from name', async () => {
      const user = await User.create({
        email: 'firstname@example.com',
        name: 'John Doe',
      });

      expect(user.firstName).to.equal('John');
    });

    it('should return lastName from name', async () => {
      const user = await User.create({
        email: 'lastname@example.com',
        name: 'John Doe',
      });

      expect(user.lastName).to.equal('Doe');
    });

    it('should return profilePic from profile_picture_url', async () => {
      const url = '/api/s3/proxy/profile.jpg';
      const user = await User.create({
        email: 'profilepic@example.com',
        name: 'Profile Pic User',
        profile_picture_url: url,
      } as any);

      expect(user.profilePic).to.equal(url);
    });

    it('should parse socialLinks from JSON string', async () => {
      const socialLinks = {
        twitter: 'https://twitter.com/user',
        instagram: 'https://instagram.com/user',
      };
      const user = await User.create({
        email: 'socialgetter@example.com',
        name: 'Social Getter User',
        social_links: JSON.stringify(socialLinks),
      } as any);

      expect(user.socialLinks).to.deep.equal(socialLinks);
    });

    it('should return undefined for invalid socialLinks JSON', async () => {
      const user = await User.create({
        email: 'invalidjson@example.com',
        name: 'Invalid JSON User',
        social_links: 'not-valid-json',
      } as any);

      expect(user.socialLinks).to.be.undefined;
    });

    it('should allow setting socialLinks as object', async () => {
      const socialLinks = {
        twitter: 'https://twitter.com/user',
      };
      const user = await User.create({
        email: 'setsocial@example.com',
        name: 'Set Social User',
      } as any);

      user.socialLinks = socialLinks;
      await user.save();

      expect(user.socialLinks).to.deep.equal(socialLinks);
      expect((user as any).social_links).to.equal(JSON.stringify(socialLinks));
    });
  });

  describe('Email Uniqueness', () => {
    it('should enforce email uniqueness', async () => {
      await User.create({
        email: 'unique@example.com',
        name: 'First User',
      });

      try {
        await User.create({
          email: 'unique@example.com',
          name: 'Second User',
        });
        expect.fail('Should have thrown unique constraint error');
      } catch (error: any) {
        expect(error.name).to.be.oneOf(['SequelizeUniqueConstraintError', 'SequelizeDatabaseError']);
      }
    });
  });

  describe('Google ID Uniqueness', () => {
    it('should enforce google_id uniqueness', async () => {
      await User.create({
        email: 'google1@example.com',
        name: 'Google User One',
        google_id: 'google-unique',
      });

      try {
        await User.create({
          email: 'google2@example.com',
          name: 'Google User Two',
          google_id: 'google-unique',
        });
        expect.fail('Should have thrown unique constraint error');
      } catch (error: any) {
        expect(error.name).to.be.oneOf(['SequelizeUniqueConstraintError', 'SequelizeDatabaseError']);
      }
    });
  });

  describe('Model Associations', () => {
    it('should have timestamps', async () => {
      const user = await User.create({
        email: 'timestamps@example.com',
        name: 'Timestamps User',
      });

      expect(user.created_at).to.be.instanceOf(Date);
      expect(user.updated_at).to.be.instanceOf(Date);
      expect(user.updated_at.getTime()).to.be.at.least(user.created_at.getTime());
    });

    it('should update updated_at on save', async () => {
      const user = await User.create({
        email: 'update@example.com',
        name: 'Update User',
      });

      const originalUpdatedAt = user.updated_at;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      user.name = 'Updated Name';
      await user.save();

      expect(user.updated_at.getTime()).to.be.greaterThan(originalUpdatedAt.getTime());
    });
  });
});
