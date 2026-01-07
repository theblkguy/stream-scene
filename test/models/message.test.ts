// test/models/message.test.ts
// Message model tests

import { expect } from 'chai';
import { describe, it, before, after, beforeEach } from 'mocha';
import Message from '../../server/models/Message.js';
import Conversation from '../../server/models/Conversation.js';
import { User } from '../../server/models/User.js';
import { cleanupTestData, resetTestDatabase, createTestUser, createTestConversation, createTestMessage } from '../helpers/testHelpers.js';
import { ensureTestDatabase } from '../setup.js';

describe('Message Model', () => {
  let user1: User;
  let user2: User;
  let conversation: Conversation;

  before(async () => {
    await ensureTestDatabase();
    await resetTestDatabase();
    user1 = await createTestUser({ email: 'msg1@example.com', name: 'User 1' });
    user2 = await createTestUser({ email: 'msg2@example.com', name: 'User 2' });
  });

  beforeEach(async () => {
    await Message.destroy({ where: {}, force: true });
    conversation = await createTestConversation('direct', [user1.id, user2.id]);
  });

  after(async () => {
    await cleanupTestData();
  });

  describe('Message Creation', () => {
    it('should create message with content', async () => {
      const message = await Message.create({
        conversation_id: conversation.id,
        user_id: user1.id,
        content: 'Test message',
        message_type: 'text',
      });

      expect(message).to.exist;
      expect(message.content).to.equal('Test message');
      expect(message.message_type).to.equal('text');
      expect(message.user_id).to.equal(user1.id);
    });

    it('should create message with file attachment', async () => {
      const message = await Message.create({
        conversation_id: conversation.id,
        user_id: user1.id,
        content: 'Check this out',
        message_type: 'file',
        file_url: '/api/s3/proxy/file.pdf',
      });

      expect(message.message_type).to.equal('file');
      expect(message.file_url).to.equal('/api/s3/proxy/file.pdf');
    });

    it('should require content', async () => {
      try {
        await Message.create({
          conversation_id: conversation.id,
          user_id: user1.id,
          content: '',
          message_type: 'text',
        });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.name).to.be.oneOf(['SequelizeValidationError', 'SequelizeDatabaseError']);
      }
    });
  });

  describe('Message Soft Delete', () => {
    it('should soft delete message (set deleted_at)', async () => {
      const message = await createTestMessage(conversation.id, user1.id, 'To delete');

      await message.update({
        deleted_at: new Date(),
      });

      const deletedMessage = await Message.findByPk(message.id);
      expect(deletedMessage?.deleted_at).to.not.be.null;
    });

    it('should not return deleted messages in queries', async () => {
      const message1 = await createTestMessage(conversation.id, user1.id, 'Message 1');
      const message2 = await createTestMessage(conversation.id, user1.id, 'Message 2');

      await message1.update({ deleted_at: new Date() });

      const messages = await Message.findAll({
        where: {
          conversation_id: conversation.id,
          deleted_at: null,
        },
      });

      expect(messages).to.have.length(1);
      expect(messages[0].id).to.equal(message2.id);
    });
  });

  describe('Message Edit Tracking', () => {
    it('should track when message is edited', async () => {
      const message = await createTestMessage(conversation.id, user1.id, 'Original');

      expect(message.edited_at).to.be.null;

      await new Promise(resolve => setTimeout(resolve, 10));

      await message.update({
        content: 'Edited',
        edited_at: new Date(),
      });

      const updated = await Message.findByPk(message.id);
      expect(updated?.edited_at).to.not.be.null;
      expect(updated?.content).to.equal('Edited');
    });
  });

  describe('Message Associations', () => {
    it('should belong to conversation', async () => {
      const message = await createTestMessage(conversation.id, user1.id, 'Test');

      const messageWithConv = await Message.findByPk(message.id, {
        include: [
          {
            model: Conversation,
            as: 'conversation',
          },
        ],
      });

      expect((messageWithConv as any).conversation).to.exist;
      expect((messageWithConv as any).conversation.id).to.equal(conversation.id);
    });

    it('should belong to user', async () => {
      const message = await createTestMessage(conversation.id, user1.id, 'Test');

      const messageWithUser = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'user',
          },
        ],
      });

      expect((messageWithUser as any).user).to.exist;
      expect((messageWithUser as any).user.id).to.equal(user1.id);
    });
  });

  describe('Message Type Validation', () => {
    it('should only allow text, image, or file types', async () => {
      try {
        await Message.create({
          conversation_id: conversation.id,
          user_id: user1.id,
          content: 'Test',
          message_type: 'invalid' as any,
        });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.name).to.be.oneOf(['SequelizeValidationError', 'SequelizeDatabaseError']);
      }
    });
  });
});
