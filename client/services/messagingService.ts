// client/services/messagingService.ts
// Messaging service for API calls and WebSocket management

import io, { Socket } from 'socket.io-client';
import { User } from '../types/auth.js';

// Use relative URLs for API calls (works in both dev and production)
const API_BASE_URL = '';

// Get WebSocket server URL from current window location
const getWebSocketUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NODE_ENV === 'production' 
    ? 'https://streamscene.net' 
    : 'http://localhost:8000';
};

export interface Conversation {
  id: number;
  type: 'direct' | 'group';
  name?: string;
  lastMessage?: {
    id: number;
    content: string;
    message_type: 'text' | 'image' | 'file';
    created_at: string;
    user: {
      id: number;
      name: string;
      username?: string;
    } | null;
  } | null;
  participants: Array<{
    id: number;
    name: string;
    username?: string;
    profilePicture?: string;
  }>;
  updated_at: string;
}

export interface Message {
  id: number;
  content: string;
  message_type: 'text' | 'image' | 'file';
  file_url?: string;
  user: {
    id: number;
    name: string;
    username?: string;
    profilePicture?: string;
  } | null;
  created_at: string;
  updated_at: string;
  edited_at?: string;
}

class MessagingService {
  private socket: Socket | null = null;
  private currentUserId: number | null = null;

  // Initialize WebSocket connection
  connect(userId: number) {
    if (this.socket?.connected) {
      return;
    }

    this.currentUserId = userId;
    this.socket = io(getWebSocketUrl(), {
      transports: ['polling', 'websocket'],
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('Messaging WebSocket connected');
      this.socket?.emit('user-identify', { userId });
    });

    this.socket.on('disconnect', () => {
      console.log('Messaging WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join a conversation room
  joinConversation(conversationId: number) {
    if (this.socket?.connected) {
      this.socket.emit('join-conversation', conversationId);
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId: number) {
    if (this.socket?.connected) {
      this.socket.emit('leave-conversation', conversationId);
    }
  }

  // Send typing indicator
  sendTyping(conversationId: number, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('typing', { conversationId, isTyping });
    }
  }

  // Mark message as read
  markMessageRead(conversationId: number, messageId: number) {
    if (this.socket?.connected) {
      this.socket.emit('message-read', { conversationId, messageId });
    }
  }

  // WebSocket event listeners
  onMessage(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.on('message-sent', callback);
    }
  }

  offMessage(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.off('message-sent', callback);
    }
  }

  onMessageEdited(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.on('message-edited', callback);
    }
  }

  offMessageEdited(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.off('message-edited', callback);
    }
  }

  onMessageDeleted(callback: (data: { id: number; conversation_id: number }) => void) {
    if (this.socket) {
      this.socket.on('message-deleted', callback);
    }
  }

  offMessageDeleted(callback: (data: { id: number; conversation_id: number }) => void) {
    if (this.socket) {
      this.socket.off('message-deleted', callback);
    }
  }

  onTyping(callback: (data: { conversationId: number; userId: number; isTyping: boolean }) => void) {
    if (this.socket) {
      this.socket.on('typing', callback);
    }
  }

  offTyping(callback: (data: { conversationId: number; userId: number; isTyping: boolean }) => void) {
    if (this.socket) {
      this.socket.off('typing', callback);
    }
  }

  // API calls
  async getConversations(): Promise<Conversation[]> {
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }
    return response.json();
  }

  async getConversation(conversationId: number): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch conversation');
    }
    return response.json();
  }

  async createConversation(
    type: 'direct' | 'group',
    participantIds: number[],
    name?: string
  ): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ type, participantIds, name }),
    });
    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }
    return response.json();
  }

  async getMessages(conversationId: number, offset = 0, limit = 50): Promise<Message[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/${conversationId}/messages?offset=${offset}&limit=${limit}`,
      {
        credentials: 'include',
      }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    const data = await response.json();
    // API returns { messages: [...] } but we want just the array
    return data.messages || data;
  }

  async sendMessage(
    conversationId: number,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    fileUrl?: string
  ): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content, message_type: messageType, file_url: fileUrl }),
    });
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    return response.json();
  }

  async editMessage(messageId: number, content: string): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      throw new Error('Failed to edit message');
    }
    return response.json();
  }

  async deleteMessage(messageId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to delete message');
    }
  }

  async addParticipant(conversationId: number, participantId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/participants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ participantId }),
    });
    if (!response.ok) {
      throw new Error('Failed to add participant');
    }
  }

  async removeParticipant(conversationId: number, userId: number): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/conversations/${conversationId}/participants/${userId}`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    );
    if (!response.ok) {
      throw new Error('Failed to remove participant');
    }
  }
}

export const messagingService = new MessagingService();
export default messagingService;

