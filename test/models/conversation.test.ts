// test/models/conversation.test.ts
// Conversation model tests

import { expect } from 'chai';
import { describe, it, before, after, beforeEach } from 'mocha';
import Conversation from '../../server/models/Conversation.js';
import ConversationParticipant from '../../server/models/ConversationParticipant.js';
import { User } from '../../server/models/User.js';
import { cleanupTestData, resetTestDatabase, createTestUser, createTestConversation } from '../helpers/testHelpers.js';
import { ensureTestDatabase } from '../setup.js';

describe('Conversation Model', () => {
  let user1: User;
  let user2: User;
  let user3: User;

  before(async () => {
    await ensureTestDatabase();
    await resetTestDatabase();
    user1 = await createTestUser({ email: 'conv1@example.com', name: 'User 1' });
    user2 = await createTestUser({ email: 'conv2@example.com', name: 'User 2' });
    user3 = await createTestUser({ email: 'conv3@example.com', name: 'User 3' });
  });

  beforeEach(async () => {
    await ConversationParticipant.destroy({ where: {}, force: true });
    await Conversation.destroy({ where: {}, force: true });
  });

  after(async () => {
    await cleanupTestData();
  });

  describe('Direct Conversation Creation', () => {
    it('should create a direct conversation', async () => {
      const conversation = await Conversation.create({
        type: 'direct',
      });

      expect(conversation).to.exist;
      expect(conversation.type).to.equal('direct');
      expect(conversation.name).to.be.undefined;
    });

    it('should create direct conversation with participants', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);

      expect(conversation).to.exist;
      expect(conversation.type).to.equal('direct');

      const participants = await ConversationParticipant.findAll({
        where: { conversation_id: conversation.id },
      });

      expect(participants).to.have.length(2);
    });
  });

  describe('Group Conversation Creation', () => {
    it('should create a group conversation', async () => {
      const conversation = await Conversation.create({
        type: 'group',
        name: 'Test Group',
      });

      expect(conversation).to.exist;
      expect(conversation.type).to.equal('group');
      expect(conversation.name).to.equal('Test Group');
    });

    it('should create group conversation with multiple participants', async () => {
      const conversation = await createTestConversation('group', [user1.id, user2.id, user3.id], {
        name: 'Group Chat',
      });

      expect(conversation).to.exist;
      expect(conversation.type).to.equal('group');
      expect(conversation.name).to.equal('Group Chat');

      const participants = await ConversationParticipant.findAll({
        where: { conversation_id: conversation.id },
      });

      expect(participants).to.have.length(3);
    });

    it('should assign admin role to first participant in group', async () => {
      const conversation = await createTestConversation('group', [user1.id, user2.id]);

      const adminParticipant = await ConversationParticipant.findOne({
        where: {
          conversation_id: conversation.id,
          user_id: user1.id,
        },
      });

      expect(adminParticipant?.role).to.equal('admin');
    });
  });

  describe('Participant Associations', () => {
    it('should have many participants', async () => {
      const conversation = await createTestConversation('group', [user1.id, user2.id, user3.id]);

      const participants = await ConversationParticipant.findAll({
        where: { conversation_id: conversation.id },
        include: [
          {
            model: User,
            as: 'user',
          },
        ],
      });

      expect(participants).to.have.length(3);
      expect(participants[0].user).to.exist;
    });

    it('should track participant join time', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);

      const participant = await ConversationParticipant.findOne({
        where: {
          conversation_id: conversation.id,
          user_id: user1.id,
        },
      });

      expect(participant?.joined_at).to.exist;
      expect(participant?.joined_at).to.be.instanceOf(Date);
    });

    it('should allow participant to leave (set left_at)', async () => {
      const conversation = await createTestConversation('group', [user1.id, user2.id]);

      const participant = await ConversationParticipant.findOne({
        where: {
          conversation_id: conversation.id,
          user_id: user2.id,
        },
      });

      await participant?.update({
        left_at: new Date(),
      });

      const leftParticipant = await ConversationParticipant.findOne({
        where: {
          conversation_id: conversation.id,
          user_id: user2.id,
          left_at: null,
        },
      });

      expect(leftParticipant).to.be.null;
    });
  });

  describe('Conversation Type Validation', () => {
    it('should only allow direct or group types', async () => {
      try {
        await Conversation.create({
          type: 'invalid' as any,
        });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.name).to.be.oneOf(['SequelizeValidationError', 'SequelizeDatabaseError']);
      }
    });
  });
});
