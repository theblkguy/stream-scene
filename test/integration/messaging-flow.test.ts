// test/integration/messaging-flow.test.ts
// End-to-end messaging flow tests

import { expect } from 'chai';
import { describe, it, before, after, beforeEach } from 'mocha';
import { Op } from 'sequelize';
import Conversation from '../../server/models/Conversation.js';
import ConversationParticipant from '../../server/models/ConversationParticipant.js';
import Message from '../../server/models/Message.js';
import { User } from '../../server/models/User.js';
import { cleanupTestData, resetTestDatabase, createTestUser, createTestConversation, createTestMessage } from '../helpers/testHelpers.js';
import { ensureTestDatabase } from '../setup.js';

describe('Messaging Flow Integration', () => {
  let user1: User;
  let user2: User;
  let user3: User;

  before(async () => {
    await ensureTestDatabase();
    await resetTestDatabase();
    user1 = await createTestUser({ email: 'flow1@example.com', name: 'User 1' });
    user2 = await createTestUser({ email: 'flow2@example.com', name: 'User 2' });
    user3 = await createTestUser({ email: 'flow3@example.com', name: 'User 3' });
  });

  beforeEach(async () => {
    await Message.destroy({ where: {}, force: true });
    await ConversationParticipant.destroy({ where: {}, force: true });
    await Conversation.destroy({ where: {}, force: true });
  });

  after(async () => {
    await cleanupTestData();
  });

  describe('Complete Messaging Flow', () => {
    it('should complete full messaging flow: create conversation → send messages → edit → delete', async () => {
      // Step 1: Create conversation
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      expect(conversation).to.exist;

      // Step 2: Send messages
      const message1 = await createTestMessage(conversation.id, user1.id, 'Hello!');
      const message2 = await createTestMessage(conversation.id, user2.id, 'Hi there!');
      
      expect(message1.content).to.equal('Hello!');
      expect(message2.content).to.equal('Hi there!');

      // Step 3: Edit message
      await message1.update({
        content: 'Hello, edited!',
        edited_at: new Date(),
      });

      const edited = await Message.findByPk(message1.id);
      expect(edited?.content).to.equal('Hello, edited!');
      expect(edited?.edited_at).to.not.be.null;

      // Step 4: Delete message
      await message2.update({
        deleted_at: new Date(),
      });

      const deleted = await Message.findByPk(message2.id);
      expect(deleted?.deleted_at).to.not.be.null;

      // Verify only non-deleted messages are returned
      const activeMessages = await Message.findAll({
        where: {
          conversation_id: conversation.id,
          deleted_at: null,
        },
      });

      expect(activeMessages).to.have.length(1);
      expect(activeMessages[0].id).to.equal(message1.id);
    });
  });

  describe('Group Conversation Flow', () => {
    it('should handle group conversation: add participants → send messages → remove participant', async () => {
      // Step 1: Create group conversation
      const conversation = await createTestConversation('group', [user1.id, user2.id], {
        name: 'Test Group',
      });

      // Make user1 admin
      const adminParticipant = await ConversationParticipant.findOne({
        where: {
          conversation_id: conversation.id,
          user_id: user1.id,
        },
      });
      await adminParticipant?.update({ role: 'admin' });

      // Step 2: Add participant
      await ConversationParticipant.create({
        conversation_id: conversation.id,
        user_id: user3.id,
        role: 'member',
      });

      const participants = await ConversationParticipant.findAll({
        where: {
          conversation_id: conversation.id,
          left_at: null,
        },
      });
      expect(participants).to.have.length(3);

      // Step 3: Send messages from different users
      await createTestMessage(conversation.id, user1.id, 'Message from admin');
      await createTestMessage(conversation.id, user2.id, 'Message from member');
      await createTestMessage(conversation.id, user3.id, 'Message from new member');

      const messages = await Message.findAll({
        where: {
          conversation_id: conversation.id,
          deleted_at: null,
        },
      });
      expect(messages).to.have.length(3);

      // Step 4: Remove participant
      const participantToRemove = await ConversationParticipant.findOne({
        where: {
          conversation_id: conversation.id,
          user_id: user3.id,
          left_at: null,
        },
      });
      await participantToRemove?.update({
        left_at: new Date(),
      });

      const activeParticipants = await ConversationParticipant.findAll({
        where: {
          conversation_id: conversation.id,
          left_at: null,
        },
      });
      expect(activeParticipants).to.have.length(2);
    });
  });

  describe('Message Pagination', () => {
    it('should handle message pagination correctly', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);

      // Create 15 messages
      for (let i = 0; i < 15; i++) {
        await createTestMessage(conversation.id, user1.id, `Message ${i}`);
      }

      // Get first page (10 messages)
      const page1 = await Message.findAll({
        where: {
          conversation_id: conversation.id,
          deleted_at: null,
        },
        order: [['created_at', 'DESC']],
        limit: 10,
        offset: 0,
      });

      expect(page1).to.have.length(10);

      // Get second page (5 messages)
      const page2 = await Message.findAll({
        where: {
          conversation_id: conversation.id,
          deleted_at: null,
        },
        order: [['created_at', 'DESC']],
        limit: 10,
        offset: 10,
      });

      expect(page2).to.have.length(5);
    });
  });

  describe('Unread Message Tracking', () => {
    it('should track unread messages', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);

      // User1 sends messages
      await createTestMessage(conversation.id, user1.id, 'Message 1');
      await createTestMessage(conversation.id, user1.id, 'Message 2');
      await createTestMessage(conversation.id, user1.id, 'Message 3');

      // Get all messages for user2 (they haven't read them)
      const unreadMessages = await Message.findAll({
        where: {
          conversation_id: conversation.id,
          deleted_at: null,
          user_id: { [Op.ne]: user2.id }, // Messages not from user2
        },
        order: [['created_at', 'DESC']],
      });

      expect(unreadMessages).to.have.length(3);
    });
  });
});

