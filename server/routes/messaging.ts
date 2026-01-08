// server/routes/messaging.ts
// Messaging routes for conversations and messages

import express, { Request, Response } from 'express';
import { Op } from 'sequelize';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import ConversationParticipant from '../models/ConversationParticipant.js';
import { User } from '../models/User.js';
import { getWebSocketService } from '../services/WebSocketService.js';

const router = express.Router();

// Get WebSocket service instance (may be null in tests)
let webSocketService: ReturnType<typeof getWebSocketService> | null = null;
try {
  webSocketService = getWebSocketService();
} catch (error) {
  // WebSocket service may not be initialized in tests - that's okay
  webSocketService = null;
}

// Middleware to ensure user is authenticated
const requireAuth = (req: Request, res: Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Helper to check if user is participant in conversation
const checkParticipant = async (userId: number, conversationId: number): Promise<boolean> => {
  const participant = await ConversationParticipant.findOne({
    where: {
      conversation_id: conversationId,
      user_id: userId,
      left_at: { [Op.is]: null } as any,
    } as any,
  });
  return !!participant;
};

// Helper to check if user is admin/creator
const checkIsAdmin = async (userId: number, conversationId: number): Promise<boolean> => {
  const participant: ConversationParticipant | null = await ConversationParticipant.findOne({
    where: {
      conversation_id: conversationId,
      user_id: userId,
      role: 'admin',
      left_at: { [Op.is]: null } as any,
    } as any,
  });
  return !!participant;
};

// GET /api/conversations - List user's conversations
router.get('/conversations', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;

    // Get all conversations where user is a participant
    const participants: ConversationParticipant[] = await ConversationParticipant.findAll({
      where: {
        user_id: userId,
        left_at: { [Op.is]: null } as any,
      } as any,
      include: [{
        model: Conversation,
        as: 'conversation',
        include: [{
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'username', 'profile_picture_url'],
          }],
        }],
      }],
      order: [[{ model: Conversation, as: 'conversation' }, 'updated_at', 'DESC']],
    });

    // Format response with last message preview
    const conversations = await Promise.all(participants.map(async (participant: ConversationParticipant) => {
      const conversation = (participant as any).conversation;
      const lastMessage = conversation?.messages?.[0];

      // Get other participants for direct conversations
      const otherParticipants: ConversationParticipant[] = await ConversationParticipant.findAll({
        where: {
          conversation_id: conversation.id,
          user_id: { [Op.ne]: userId },
          left_at: { [Op.is]: null } as any,
        } as any,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'username', 'profile_picture_url'],
        }],
      });

      return {
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          message_type: lastMessage.message_type,
          created_at: lastMessage.created_at,
          user: lastMessage.user ? {
            id: lastMessage.user.id,
            name: lastMessage.user.name,
            username: lastMessage.user.username,
          } : null,
        } : null,
        participants: otherParticipants.map((p: any) => ({
          id: p.user.id,
          name: p.user.name,
          username: p.user.username,
          profilePicture: p.user.profile_picture_url,
        })),
        updated_at: conversation.updated_at,
      };
    }));

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// POST /api/conversations - Create new conversation
router.post('/conversations', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { type, participantIds, name } = req.body;

    if (!type || !['direct', 'group'].includes(type)) {
      return res.status(400).json({ error: 'Invalid conversation type' });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ error: 'participantIds is required and must be an array' });
    }

    // For direct conversations, ensure exactly 2 participants
    if (type === 'direct' && participantIds.length !== 1) {
      return res.status(400).json({ error: 'Direct conversations must have exactly 2 participants' });
    }

    // Validate that all participant IDs exist
    const allParticipantIds = [...new Set([userId, ...participantIds])];
    const users = await User.findAll({
      where: { id: { [Op.in]: allParticipantIds } },
    });

    if (users.length !== allParticipantIds.length) {
      return res.status(400).json({ error: 'One or more participant IDs are invalid' });
    }

    // Check if direct conversation already exists
    if (type === 'direct') {
      const existingConversation = await Conversation.findOne({
        where: { type: 'direct' },
        include: [{
          model: ConversationParticipant,
          as: 'participants',
          where: {
            user_id: { [Op.in]: [userId, participantIds[0]] },
            left_at: { [Op.is]: null } as any,
          } as any,
        }],
      });

      // Check if this conversation has exactly these two participants
      if (existingConversation) {
        const participants: ConversationParticipant[] = await ConversationParticipant.findAll({
          where: {
            conversation_id: existingConversation.id,
            left_at: { [Op.is]: null } as any,
          } as any,
        });

        if (participants.length === 2) {
          const participantUserIds = participants.map(p => p.user_id).sort();
          const requestedUserIds = [userId, participantIds[0]].sort();
          
          if (participantUserIds[0] === requestedUserIds[0] && 
              participantUserIds[1] === requestedUserIds[1]) {
            // Return existing conversation
            return res.json({
              id: existingConversation.id,
              type: existingConversation.type,
              message: 'Conversation already exists',
            });
          }
        }
      }
    }

    // Create conversation
    const conversation = await Conversation.create({
      type,
      name: type === 'group' ? name : undefined,
    });

    // Add creator as admin for groups, member for direct
    await ConversationParticipant.create({
      conversation_id: conversation.id,
      user_id: userId,
      role: type === 'group' ? 'admin' : 'member',
    });

    // Add other participants
    for (const participantId of participantIds) {
      await ConversationParticipant.create({
        conversation_id: conversation.id,
        user_id: participantId,
        role: 'member',
      });
    }

    // Emit WebSocket event
    if (webSocketService) {
      for (const participantId of allParticipantIds) {
        (webSocketService as any).io.to(`user:${participantId}`).emit('conversation-created', {
          conversation: {
            id: conversation.id,
            type: conversation.type,
            name: conversation.name,
          },
        });
      }
    }

    res.status(201).json({
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// GET /api/conversations/:id - Get conversation details
router.get('/conversations/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const conversationId = parseInt(req.params.id, 10);

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    // Check if user is participant
    const isParticipant = await checkParticipant(userId, conversationId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const conversation = await Conversation.findByPk(conversationId, {
      include: [{
        model: ConversationParticipant,
        as: 'participants',
        where: { left_at: { [Op.is]: null } as any } as any,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'username', 'profile_picture_url'],
        }],
      }],
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      participants: (conversation as any).participants.map((p: any) => ({
        id: p.user.id,
        name: p.user.name,
        username: p.user.username,
        profilePicture: p.user.profile_picture_url,
        role: p.role,
      })),
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// GET /api/conversations/:id/messages - Get messages in conversation (paginated)
router.get('/conversations/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const conversationId = parseInt(req.params.id, 10);
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    // Check if user is participant
    const isParticipant = await checkParticipant(userId, conversationId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.findAll({
      where: {
        conversation_id: conversationId,
        deleted_at: { [Op.is]: null } as any,
      } as any,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'username', 'profile_picture_url'],
      }],
      order: [['created_at', 'ASC']],
      limit,
      offset,
    });

    res.json({
      messages: messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        message_type: msg.message_type,
        file_url: msg.file_url,
        user: msg.user ? {
          id: msg.user.id,
          name: msg.user.name,
          username: msg.user.username,
          profilePicture: msg.user.profile_picture_url,
        } : null,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        edited_at: msg.edited_at,
      })),
      offset,
      limit,
      total: messages.length,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/conversations/:id/messages - Send message
router.post('/conversations/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const conversationId = parseInt(req.params.id, 10);
    const { content, message_type = 'text', file_url } = req.body;

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Check if user is participant
    const isParticipant = await checkParticipant(userId, conversationId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = await Message.create({
      conversation_id: conversationId,
      user_id: userId,
      content: content.trim(),
      message_type,
      file_url,
    });

    // Update conversation updated_at
    await Conversation.update(
      { updated_at: new Date() },
      { where: { id: conversationId } }
    );

    // Load user data for response
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'username', 'profile_picture_url'],
    });

    const messageResponse = {
      id: message.id,
      content: message.content,
      message_type: message.message_type,
      file_url: message.file_url,
      user: user ? {
        id: user.id,
        name: user.name,
        username: (user as any).username,
        profilePicture: (user as any).profile_picture_url,
      } : null,
      created_at: message.created_at,
      updated_at: message.updated_at,
    };

    // Emit WebSocket event
    if (webSocketService) {
      (webSocketService as any).io.to(`conversation:${conversationId}`).emit('message-sent', messageResponse);
    }

    res.status(201).json(messageResponse);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// PUT /api/messages/:id - Edit message
router.put('/messages/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const messageId = parseInt(req.params.id, 10);
    const { content } = req.body;

    if (isNaN(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user owns the message
    if (message.user_id !== userId) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    message.content = content.trim();
    message.edited_at = new Date();
    await message.save();

    const messageResponse = {
      id: message.id,
      content: message.content,
      message_type: message.message_type,
      file_url: message.file_url,
      created_at: message.created_at,
      updated_at: message.updated_at,
      edited_at: message.edited_at,
    };

    // Emit WebSocket event
    if (webSocketService) {
      (webSocketService as any).io.to(`conversation:${message.conversation_id}`).emit('message-edited', messageResponse);
    }

    res.json(messageResponse);
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// DELETE /api/messages/:id - Delete message (soft delete)
router.delete('/messages/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const messageId = parseInt(req.params.id, 10);

    if (isNaN(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user owns the message
    if (message.user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    message.deleted_at = new Date();
    await message.save();

    // Emit WebSocket event
    if (webSocketService) {
      (webSocketService as any).io.to(`conversation:${message.conversation_id}`).emit('message-deleted', {
        id: message.id,
        conversation_id: message.conversation_id,
      });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// POST /api/conversations/:id/participants - Add participant to group
router.post('/conversations/:id/participants', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const conversationId = parseInt(req.params.id, 10);
    const { participantId } = req.body;

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    if (!participantId) {
      return res.status(400).json({ error: 'participantId is required' });
    }

    // Check if conversation exists and is a group
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.type !== 'group') {
      return res.status(400).json({ error: 'Can only add participants to group conversations' });
    }

    // Check if user is admin/creator
    const isAdmin = await checkIsAdmin(userId, conversationId);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins can add participants' });
    }

    // Check if participant exists
    const participantUser = await User.findByPk(participantId);
    if (!participantUser) {
      return res.status(400).json({ error: 'Invalid participant ID' });
    }

    // Check if already a participant
    const existingParticipant = await ConversationParticipant.findOne({
      where: {
        conversation_id: conversationId,
        user_id: participantId,
        left_at: { [Op.is]: null } as any,
      } as any,
    });

    if (existingParticipant) {
      return res.status(400).json({ error: 'User is already a participant' });
    }

    // Add participant
    await ConversationParticipant.create({
      conversation_id: conversationId,
      user_id: participantId,
      role: 'member',
    });

    // Emit WebSocket event
    if (webSocketService) {
      (webSocketService as any).io.to(`conversation:${conversationId}`).emit('user-joined', {
        conversation_id: conversationId,
        user: {
          id: participantUser.id,
          name: participantUser.name,
          username: (participantUser as any).username,
        },
      });
    }

    res.status(201).json({ message: 'Participant added successfully' });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Failed to add participant' });
  }
});

// DELETE /api/conversations/:id/participants/:userId - Remove participant
router.delete('/conversations/:id/participants/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const conversationId = parseInt(req.params.id, 10);
    const participantUserId = parseInt(req.params.userId, 10);

    if (isNaN(conversationId) || isNaN(participantUserId)) {
      return res.status(400).json({ error: 'Invalid conversation or user ID' });
    }

    // Check if conversation exists and is a group
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.type !== 'group') {
      return res.status(400).json({ error: 'Can only remove participants from group conversations' });
    }

    // Check if user is admin/creator
    const isAdmin = await checkIsAdmin(userId, conversationId);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Only admins can remove participants' });
    }

    // Find and remove participant
    const participant = await ConversationParticipant.findOne({
      where: {
        conversation_id: conversationId,
        user_id: participantUserId,
        left_at: { [Op.is]: null } as any,
      } as any,
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    participant.left_at = new Date();
    await participant.save();

    // Emit WebSocket event
    if (webSocketService) {
      (webSocketService as any).io.to(`conversation:${conversationId}`).emit('user-left', {
        conversation_id: conversationId,
        user_id: participantUserId,
      });
    }

    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

export default router;
