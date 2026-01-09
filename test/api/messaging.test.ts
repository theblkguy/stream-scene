// test/api/messaging.test.ts
// Messaging API endpoint tests

import { expect } from 'chai';
import { describe, it, before, after, beforeEach } from 'mocha';
import request from 'supertest';
import express from 'express';
import { User } from '../../server/models/User.js';
import Conversation from '../../server/models/Conversation.js';
import ConversationParticipant from '../../server/models/ConversationParticipant.js';
import Message from '../../server/models/Message.js';
import { cleanupTestData, resetTestDatabase, createTestUser, createTestConversation, createTestMessage } from '../helpers/testHelpers.js';
import { createAuthenticatedRequest, setAuthOnRequest } from '../helpers/authHelpers.js';

// Import app (you may need to adjust this based on your app structure)
let app: express.Application;

describe('Messaging API', () => {
  let user1: User;
  let user2: User;
  let user3: User;
  let agent1: request.SuperTest<request.Test>;
  let agent2: request.SuperTest<request.Test>;

  before(async () => {
    // Ensure test database is initialized
    const { ensureTestDatabase } = await import('../setup.js');
    await ensureTestDatabase();
    
    await resetTestDatabase();
    
    // Setup test app with authentication middleware mock
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware - check for user in headers
    app.use((req, res, next) => {
      const userId = req.headers['x-test-user-id'];
      if (userId) {
        // Find user and set on request
        User.findByPk(parseInt(userId as string, 10)).then(user => {
          if (user) {
            (req as any).user = {
              id: user.id,
              email: user.email,
              name: user.name,
              google_id: user.google_id,
            };
          }
          next();
        }).catch(() => next());
      } else {
        next();
      }
    });
    
    // Import and mount messaging routes
    const messagingRoutes = (await import('../../server/routes/messaging.js')).default;
    app.use('/api', messagingRoutes);
    
    // Create test users
    user1 = await createTestUser({
      email: 'user1@example.com',
      name: 'User One',
    });
    
    user2 = await createTestUser({
      email: 'user2@example.com',
      name: 'User Two',
    });
    
    user3 = await createTestUser({
      email: 'user3@example.com',
      name: 'User Three',
    });
  });

  beforeEach(async () => {
    // Create authenticated agents for each test
    // Use header-based authentication for testing
    agent1 = request.agent(app);
    (agent1 as any).set('x-test-user-id', user1.id.toString());
    
    agent2 = request.agent(app);
    (agent2 as any).set('x-test-user-id', user2.id.toString());
  });

  after(async () => {
    await cleanupTestData();
  });

  describe('GET /api/conversations', () => {
    it('should return user conversations when authenticated', async () => {
      // Create a conversation
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      
      const response = await agent1
        .get('/api/conversations')
        .set('x-test-user-id', user1.id.toString())
        .expect(200);

      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.at.least(1);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/conversations')
        .expect(401);
    });

    it('should include last message preview', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      await createTestMessage(conversation.id, user1.id, 'Test message');
      
      const response = await agent1
        .get('/api/conversations')
        .set('x-test-user-id', user1.id.toString())
        .expect(200);

      expect(response.body[0]).to.have.property('lastMessage');
      expect(response.body[0].lastMessage).to.have.property('content', 'Test message');
    });

    it('should be sorted by updated_at desc', async () => {
      const conv1 = await createTestConversation('direct', [user1.id, user2.id]);
      await new Promise(resolve => setTimeout(resolve, 10));
      const conv2 = await createTestConversation('direct', [user1.id, user3.id]);
      
      const response = await agent1
        .get('/api/conversations')
        .set('x-test-user-id', user1.id.toString())
        .expect(200);

      expect(response.body.length).to.be.at.least(2);
      // Most recent should be first
      expect(response.body[0].id).to.equal(conv2.id);
    });
  });

  describe('POST /api/conversations', () => {
    it('should create direct conversation between two users', async () => {
      const response = await agent1
        .post('/api/conversations')
        .set('x-test-user-id', user1.id.toString())
        .send({
          type: 'direct',
          participantIds: [user2.id],
        })
        .expect(201);

      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('type', 'direct');
      expect(response.body.participants).to.have.length(2);
    });

    it('should create group conversation with multiple users', async () => {
      const response = await agent1
        .post('/api/conversations')
        .set('x-test-user-id', user1.id.toString())
        .send({
          type: 'group',
          participantIds: [user2.id, user3.id],
          name: 'Test Group',
        })
        .expect(201);

      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('type', 'group');
      expect(response.body).to.have.property('name', 'Test Group');
      expect(response.body.participants).to.have.length(3);
    });

    it('should return existing direct conversation if it exists', async () => {
      const conv1 = await createTestConversation('direct', [user1.id, user2.id]);
      
      const response = await agent1
        .post('/api/conversations')
        .set('x-test-user-id', user1.id.toString())
        .send({
          type: 'direct',
          participantIds: [user2.id],
        })
        .expect(200);

      expect(response.body).to.have.property('id');
    });

    it('should validate participant IDs', async () => {
      await agent1
        .post('/api/conversations')
        .set('x-test-user-id', user1.id.toString())
        .send({
          type: 'direct',
          participantIds: [],
        })
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .post('/api/conversations')
        .send({
          type: 'direct',
          participantIds: [user2.id],
        })
        .expect(401);
    });
  });

  describe('GET /api/conversations/:id', () => {
    it('should return conversation details when user is participant', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      
      const response = await agent1
        .get(`/api/conversations/${conversation.id}`)
        .set('x-test-user-id', user1.id.toString())
        .expect(200);

      expect(response.body).to.have.property('id', conversation.id);
      expect(response.body).to.have.property('participants');
      expect(response.body.participants).to.have.length(2);
    });

    it('should return 403 when user is not participant', async () => {
      const conversation = await createTestConversation('direct', [user2.id, user3.id]);
      
      await agent1
        .get(`/api/conversations/${conversation.id}`)
        .set('x-test-user-id', user1.id.toString())
        .expect(403);
    });

    it('should return 404 for invalid conversation ID', async () => {
      await agent1
        .get('/api/conversations/99999')
        .set('x-test-user-id', user1.id.toString())
        .expect(404);
    });
  });

  describe('GET /api/conversations/:id/messages', () => {
    it('should return paginated messages (50 per page)', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      
      // Create multiple messages
      for (let i = 0; i < 5; i++) {
        await createTestMessage(conversation.id, user1.id, `Message ${i}`);
      }
      
      const response = await agent1
        .get(`/api/conversations/${conversation.id}/messages`)
        .set('x-test-user-id', user1.id.toString())
        .expect(200);

      expect(response.body).to.have.property('messages');
      expect(response.body).to.have.property('total', 5);
      expect(response.body).to.have.property('offset', 0);
      expect(response.body).to.have.property('limit', 50);
      expect(response.body.messages).to.have.length(5);
    });

    it('should support pagination with offset/limit', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      
      for (let i = 0; i < 10; i++) {
        await createTestMessage(conversation.id, user1.id, `Message ${i}`);
      }
      
      const response = await agent1
        .get(`/api/conversations/${conversation.id}/messages?offset=5&limit=3`)
        .expect(200);

      expect(response.body.messages).to.have.length(3);
      expect(response.body.offset).to.equal(5);
      expect(response.body.limit).to.equal(3);
    });

    it('should return messages in chronological order', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      
      await createTestMessage(conversation.id, user1.id, 'First');
      await new Promise(resolve => setTimeout(resolve, 10));
      await createTestMessage(conversation.id, user2.id, 'Second');
      
      const response = await agent1
        .get(`/api/conversations/${conversation.id}/messages`)
        .set('x-test-user-id', user1.id.toString())
        .expect(200);

      expect(response.body.messages[0].content).to.equal('First');
      expect(response.body.messages[1].content).to.equal('Second');
    });

    it('should return 403 when user is not participant', async () => {
      const conversation = await createTestConversation('direct', [user2.id, user3.id]);
      
      await agent1
        .get(`/api/conversations/${conversation.id}/messages`)
        .expect(403);
    });
  });

  describe('POST /api/conversations/:id/messages', () => {
    it('should send text message', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      
      const response = await agent1
        .post(`/api/conversations/${conversation.id}/messages`)
        .set('x-test-user-id', user1.id.toString())
        .send({
          content: 'Hello, world!',
        })
        .expect(201);

      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('content', 'Hello, world!');
      expect(response.body).to.have.property('message_type', 'text');
    });

    it('should send message with file attachment', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      
      const response = await agent1
        .post(`/api/conversations/${conversation.id}/messages`)
        .set('x-test-user-id', user1.id.toString())
        .send({
          content: 'Check out this file',
          messageType: 'file',
          fileUrl: '/api/s3/proxy/file.pdf',
        })
        .expect(201);

      expect(response.body).to.have.property('message_type', 'file');
      expect(response.body).to.have.property('file_url', '/api/s3/proxy/file.pdf');
    });

    it('should validate message content (not empty)', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      
      await agent1
        .post(`/api/conversations/${conversation.id}/messages`)
        .set('x-test-user-id', user1.id.toString())
        .send({
          content: '',
        })
        .expect(400);
    });

    it('should return 403 when user is not participant', async () => {
      const conversation = await createTestConversation('direct', [user2.id, user3.id]);
      
      await agent1
        .post(`/api/conversations/${conversation.id}/messages`)
        .set('x-test-user-id', user1.id.toString())
        .send({
          content: 'Test message',
        })
        .expect(403);
    });
  });

  describe('PUT /api/messages/:id', () => {
    it('should update own message', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      const message = await createTestMessage(conversation.id, user1.id, 'Original message');
      
      const response = await agent1
        .put(`/api/messages/${message.id}`)
        .set('x-test-user-id', user1.id.toString())
        .send({
          content: 'Updated message',
        })
        .expect(200);

      expect(response.body).to.have.property('content', 'Updated message');
      expect(response.body).to.have.property('edited_at');
    });

    it('should return 403 when trying to update other message', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      const message = await createTestMessage(conversation.id, user2.id, 'Other user message');
      
      await agent1
        .put(`/api/messages/${message.id}`)
        .set('x-test-user-id', user1.id.toString())
        .send({
          content: 'Trying to edit',
        })
        .expect(403);
    });

    it('should return 404 for invalid message ID', async () => {
      await agent1
        .put('/api/messages/99999')
        .send({
          content: 'Updated',
        })
        .expect(404);
    });

    it('should update edited_at timestamp', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      const message = await createTestMessage(conversation.id, user1.id, 'Original');
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const response = await agent1
        .put(`/api/messages/${message.id}`)
        .set('x-test-user-id', user1.id.toString())
        .send({
          content: 'Updated',
        })
        .expect(200);

      expect(response.body.edited_at).to.not.be.null;
    });
  });

  describe('DELETE /api/messages/:id', () => {
    it('should soft delete own message', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      const message = await createTestMessage(conversation.id, user1.id, 'To delete');
      
      await agent1
        .delete(`/api/messages/${message.id}`)
        .set('x-test-user-id', user1.id.toString())
        .expect(200);

      const deletedMessage = await Message.findByPk(message.id);
      expect(deletedMessage?.deleted_at).to.not.be.null;
    });

    it('should return 403 when trying to delete other message', async () => {
      const conversation = await createTestConversation('direct', [user1.id, user2.id]);
      const message = await createTestMessage(conversation.id, user2.id, 'Other message');
      
      await agent1
        .delete(`/api/messages/${message.id}`)
        .expect(403);
    });
  });

  describe('POST /api/conversations/:id/participants', () => {
    it('should add participant to group conversation', async () => {
      const conversation = await createTestConversation('group', [user1.id, user2.id], { name: 'Test Group' });
      
      // Make user1 admin
      const participant = await ConversationParticipant.findOne({
        where: {
          conversation_id: conversation.id,
          user_id: user1.id,
        },
      });
      await participant?.update({ role: 'admin' });
      
      const response = await agent1
        .post(`/api/conversations/${conversation.id}/participants`)
        .send({
          participantId: user3.id,
        })
        .expect(201);

      expect(response.body).to.have.property('message', 'Participant added successfully');
    });

    it('should return 403 when not admin/creator', async () => {
      const conversation = await createTestConversation('group', [user1.id, user2.id]);
      
      await agent2
        .post(`/api/conversations/${conversation.id}/participants`)
        .send({
          participantId: user3.id,
        })
        .expect(403);
    });

    it('should return 400 when user already participant', async () => {
      const conversation = await createTestConversation('group', [user1.id, user2.id]);
      
      const participant = await ConversationParticipant.findOne({
        where: {
          conversation_id: conversation.id,
          user_id: user1.id,
        },
      });
      await participant?.update({ role: 'admin' });
      
      await agent1
        .post(`/api/conversations/${conversation.id}/participants`)
        .set('x-test-user-id', user1.id.toString())
        .send({
          participantId: user2.id,
        })
        .expect(400);
    });
  });

  describe('DELETE /api/conversations/:id/participants/:participantId', () => {
    it('should remove participant from group', async () => {
      const conversation = await createTestConversation('group', [user1.id, user2.id, user3.id]);
      
      const participant = await ConversationParticipant.findOne({
        where: {
          conversation_id: conversation.id,
          user_id: user1.id,
        },
      });
      await participant?.update({ role: 'admin' });
      
      await agent1
        .delete(`/api/conversations/${conversation.id}/participants/${user3.id}`)
        .set('x-test-user-id', user1.id.toString())
        .expect(200);

      const removed = await ConversationParticipant.findOne({
        where: {
          conversation_id: conversation.id,
          user_id: user3.id,
          left_at: null,
        },
      });
      expect(removed).to.be.null;
    });

    it('should return 403 when not admin/creator', async () => {
      const conversation = await createTestConversation('group', [user1.id, user2.id]);
      
      await agent2
        .delete(`/api/conversations/${conversation.id}/participants/${user1.id}`)
        .expect(403);
    });
  });
});
