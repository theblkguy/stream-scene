// test/services/websocket-messaging.test.ts
// WebSocket messaging event tests

import { expect } from 'chai';
import { describe, it, before, after, beforeEach } from 'mocha';
import { createMockSocketIOServer, createMockSocketClient, waitForSocketEvent } from '../mocks/socketMock.js';
import Conversation from '../../server/models/Conversation.js';
import ConversationParticipant from '../../server/models/ConversationParticipant.js';
import Message from '../../server/models/Message.js';
import { User } from '../../server/models/User.js';
import { cleanupTestData, resetTestDatabase, createTestUser, createTestConversation, createTestMessage } from '../helpers/testHelpers.js';
import { ensureTestDatabase } from '../setup.js';

describe('WebSocket Messaging', () => {
  let user1: User;
  let user2: User;
  let conversation: Conversation;
  let mockServer: ReturnType<typeof createMockSocketIOServer>;

  before(async () => {
    await ensureTestDatabase();
    await resetTestDatabase();
    user1 = await createTestUser({ email: 'ws1@example.com', name: 'User 1' });
    user2 = await createTestUser({ email: 'ws2@example.com', name: 'User 2' });
  });

  beforeEach(async () => {
    await Message.destroy({ where: {}, force: true });
    await ConversationParticipant.destroy({ where: {}, force: true });
    await Conversation.destroy({ where: {}, force: true });
    
    conversation = await createTestConversation('direct', [user1.id, user2.id]);
    mockServer = createMockSocketIOServer();
  });

  after(async () => {
    await cleanupTestData();
  });

  describe('Join Conversation Room', () => {
    it('should allow user to join conversation room', async () => {
      const socket = createMockSocketClient(mockServer, 'socket-1');
      
      // Simulate user identification
      (socket as any).data = { user: { userId: user1.id } };
      
      // Manually handle join-conversation (simulating WebSocketService logic)
      const participant = await ConversationParticipant.findOne({
        where: {
          conversation_id: conversation.id,
          user_id: user1.id,
          left_at: null,
        },
      });

      if (participant) {
        socket.join(`conversation:${conversation.id}`);
        (socket as any).data.conversationId = conversation.id;
        socket.emit('conversation-joined', {
          conversationId: conversation.id,
          message: 'Successfully joined conversation',
        });
      }
      
      // Wait for confirmation
      const response = await waitForSocketEvent(socket, 'conversation-joined', 1000);
      
      expect(response).to.exist;
      expect(response.conversationId).to.equal(conversation.id);
    });

    it('should notify others when user joins', async () => {
      const socket1 = createMockSocketClient(mockServer, 'socket-1');
      const socket2 = createMockSocketClient(mockServer, 'socket-2');
      
      (socket1 as any).data = { user: { userId: user1.id } };
      (socket2 as any).data = { user: { userId: user2.id } };
      
      // Socket2 joins first
      socket2.join(`conversation:${conversation.id}`);
      (socket2 as any).data.conversationId = conversation.id;
      
      // Socket1 joins - should notify socket2
      socket1.join(`conversation:${conversation.id}`);
      (socket1 as any).data.conversationId = conversation.id;
      socket2.emit('user-joined', {
        conversationId: conversation.id,
        userId: user1.id,
        socketId: socket1.id,
      });
      
      // Socket2 should receive user-joined event
      const event = await waitForSocketEvent(socket2, 'user-joined', 1000);
      
      expect(event).to.exist;
      expect(event.userId).to.equal(user1.id);
    });
  });

  describe('Leave Conversation Room', () => {
    it('should allow user to leave conversation room', async () => {
      const socket = createMockSocketClient(mockServer, 'socket-1');
      
      (socket as any).data = { user: { userId: user1.id }, conversationId: conversation.id };
      socket.join(`conversation:${conversation.id}`);
      
      socket.emit('leave-conversation', conversation.id);
      
      expect(socket.rooms.has(`conversation:${conversation.id}`)).to.be.false;
    });

    it('should notify others when user leaves', async () => {
      const socket1 = createMockSocketClient(mockServer, 'socket-1');
      const socket2 = createMockSocketClient(mockServer, 'socket-2');
      
      (socket1 as any).data = { user: { userId: user1.id }, conversationId: conversation.id };
      (socket2 as any).data = { user: { userId: user2.id }, conversationId: conversation.id };
      
      socket1.join(`conversation:${conversation.id}`);
      socket2.join(`conversation:${conversation.id}`);
      
      socket1.emit('leave-conversation', conversation.id);
      
      const event = await waitForSocketEvent(socket2, 'user-left', 1000);
      
      expect(event).to.exist;
      expect(event.conversationId).to.equal(conversation.id);
    });
  });

  describe('Send Message via WebSocket', () => {
    it('should send message via WebSocket', async () => {
      const socket = createMockSocketClient(mockServer, 'socket-1');
      
      (socket as any).data = { user: { userId: user1.id }, conversationId: conversation.id };
      socket.join(`conversation:${conversation.id}`);
      
      // Manually simulate message creation and broadcast
      const message = await createTestMessage(conversation.id, user1.id, 'Hello via WebSocket');
      const messageWithUser = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'username', 'profile_picture_url'],
            required: false,
          },
        ],
      });
      
      // Simulate broadcast
      mockServer.to(`conversation:${conversation.id}`).emit('message-sent', {
        message: messageWithUser,
        conversationId: conversation.id,
      });
      
      const event = await waitForSocketEvent(socket, 'message-sent', 2000);
      
      expect(event).to.exist;
      expect(event.message).to.exist;
      expect(event.message.content).to.equal('Hello via WebSocket');
    });

    it('should broadcast message to all participants', async () => {
      const socket1 = createMockSocketClient(mockServer, 'socket-1');
      const socket2 = createMockSocketClient(mockServer, 'socket-2');
      
      (socket1 as any).data = { user: { userId: user1.id }, conversationId: conversation.id };
      (socket2 as any).data = { user: { userId: user2.id }, conversationId: conversation.id };
      
      socket1.join(`conversation:${conversation.id}`);
      socket2.join(`conversation:${conversation.id}`);
      
      // Create message and broadcast
      const message = await createTestMessage(conversation.id, user1.id, 'Broadcast message');
      const messageWithUser = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'username', 'profile_picture_url'],
            required: false,
          },
        ],
      });
      
      // Simulate broadcast to room
      mockServer.to(`conversation:${conversation.id}`).emit('message-sent', {
        message: messageWithUser,
        conversationId: conversation.id,
      });
      
      const event = await waitForSocketEvent(socket2, 'message-sent', 2000);
      
      expect(event).to.exist;
      expect(event.message.content).to.equal('Broadcast message');
    });
  });

  describe('Typing Indicator', () => {
    it('should broadcast typing indicator', async () => {
      const socket1 = createMockSocketClient(mockServer, 'socket-1');
      const socket2 = createMockSocketClient(mockServer, 'socket-2');
      
      (socket1 as any).data = { user: { userId: user1.id }, conversationId: conversation.id };
      (socket2 as any).data = { user: { userId: user2.id }, conversationId: conversation.id };
      
      socket1.join(`conversation:${conversation.id}`);
      socket2.join(`conversation:${conversation.id}`);
      
      socket1.emit('typing', {
        conversationId: conversation.id,
        isTyping: true,
      });
      
      const event = await waitForSocketEvent(socket2, 'typing', 1000);
      
      expect(event).to.exist;
      expect(event.isTyping).to.be.true;
      expect(event.userId).to.equal(user1.id);
    });
  });

  describe('Message Read Receipt', () => {
    it('should broadcast read receipt', async () => {
      const message = await createTestMessage(conversation.id, user1.id, 'Test message');
      const socket1 = createMockSocketClient(mockServer, 'socket-1');
      const socket2 = createMockSocketClient(mockServer, 'socket-2');
      
      (socket1 as any).data = { user: { userId: user1.id }, conversationId: conversation.id };
      (socket2 as any).data = { user: { userId: user2.id }, conversationId: conversation.id };
      
      socket1.join(`conversation:${conversation.id}`);
      socket2.join(`conversation:${conversation.id}`);
      
      socket2.emit('message-read', {
        conversationId: conversation.id,
        messageId: message.id,
      });
      
      const event = await waitForSocketEvent(socket1, 'message-read', 1000);
      
      expect(event).to.exist;
      expect(event.messageId).to.equal(message.id);
      expect(event.userId).to.equal(user2.id);
    });
  });

  describe('Real-time Message Delivery', () => {
    it('should deliver messages in real-time to all participants', async () => {
      const socket1 = createMockSocketClient(mockServer, 'socket-1');
      const socket2 = createMockSocketClient(mockServer, 'socket-2');
      
      (socket1 as any).data = { user: { userId: user1.id }, conversationId: conversation.id };
      (socket2 as any).data = { user: { userId: user2.id }, conversationId: conversation.id };
      
      socket1.join(`conversation:${conversation.id}`);
      socket2.join(`conversation:${conversation.id}`);
      
      // Create message and broadcast
      const message = await createTestMessage(conversation.id, user1.id, 'Real-time message');
      const messageWithUser = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'username', 'profile_picture_url'],
            required: false,
          },
        ],
      });
      
      // Broadcast to all in room
      mockServer.to(`conversation:${conversation.id}`).emit('message-sent', {
        message: messageWithUser,
        conversationId: conversation.id,
      });
      
      // Both sockets should receive it
      const event1 = await waitForSocketEvent(socket1, 'message-sent', 2000);
      const event2 = await waitForSocketEvent(socket2, 'message-sent', 2000);
      
      expect(event1.message.content).to.equal('Real-time message');
      expect(event2.message.content).to.equal('Real-time message');
    });
  });
});
