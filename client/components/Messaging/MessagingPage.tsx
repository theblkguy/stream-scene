// client/components/Messaging/MessagingPage.tsx
// Main messaging page component

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserSearch from './UserSearch';
import messagingService, { Conversation, Message } from '../../services/messagingService.js';

const MessagingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/auth/user', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.user?.id) {
            setCurrentUserId(data.user.id);
            messagingService.connect(data.user.id);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await messagingService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    
    // Refresh conversations periodically
    const interval = setInterval(loadConversations, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Handle URL parameter for opening a specific conversation
  const conversationProcessedRef = useRef<string | null>(null);
  useEffect(() => {
    const conversationIdParam = searchParams.get('conversation');
    if (conversationIdParam && conversations.length > 0 && conversationProcessedRef.current !== conversationIdParam) {
      const conversationId = parseInt(conversationIdParam, 10);
      if (!isNaN(conversationId)) {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
          handleSelectConversation(conversationId);
          conversationProcessedRef.current = conversationIdParam;
          // Remove the parameter from URL after selecting
          setSearchParams({});
        }
      }
    }
  }, [searchParams, conversations, setSearchParams]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: number, offset = 0, append = false) => {
    try {
      setMessagesLoading(true);
      const data = await messagingService.getMessages(conversationId, offset, 50);
      
      if (append) {
        setMessages(prev => [...data.reverse(), ...prev]);
      } else {
        setMessages(data.reverse());
      }
      
      setHasMoreMessages(data.length === 50);
      setMessagesOffset(offset + data.length);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Handle conversation selection
  const handleSelectConversation = async (conversationId: number) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Leave previous conversation room
    if (selectedConversation) {
      messagingService.leaveConversation(selectedConversation.id);
    }

    setSelectedConversation(conversation);
    setMessages([]);
    setMessagesOffset(0);
    setHasMoreMessages(true);

    // Join new conversation room
    messagingService.joinConversation(conversationId);
    
    // Load messages
    await loadMessages(conversationId, 0, false);
  };

  // Handle send message
  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;

    try {
      await messagingService.sendMessage(selectedConversation.id, content);
      // Message will be added via WebSocket event
      await loadConversations(); // Refresh conversations to update last message
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  // Handle typing
  const handleTyping = (isTyping: boolean) => {
    if (!selectedConversation) return;
    messagingService.sendTyping(selectedConversation.id, isTyping);
  };

  // WebSocket event handlers
  useEffect(() => {
    if (!selectedConversation) return;

    const handleNewMessage = (message: Message) => {
      if (message.user?.id === currentUserId) {
        // Optimistically add our own messages
        setMessages(prev => [...prev, message]);
      } else {
        // Add messages from others
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }
      loadConversations(); // Update last message in conversation list
    };

    const handleMessageEdited = (message: Message) => {
      setMessages(prev =>
        prev.map(m => (m.id === message.id ? message : m))
      );
    };

    const handleMessageDeleted = (data: { id: number; conversation_id: number }) => {
      if (data.conversation_id === selectedConversation.id) {
        setMessages(prev => prev.filter(m => m.id !== data.id));
      }
    };

    const handleTypingEvent = (data: { conversationId: number; userId: number; isTyping: boolean }) => {
      if (data.conversationId === selectedConversation.id && data.userId !== currentUserId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    };

    messagingService.onMessage(handleNewMessage);
    messagingService.onMessageEdited(handleMessageEdited);
    messagingService.onMessageDeleted(handleMessageDeleted);
    messagingService.onTyping(handleTypingEvent);

    return () => {
      messagingService.offMessage(handleNewMessage);
      messagingService.offMessageEdited(handleMessageEdited);
      messagingService.offMessageDeleted(handleMessageDeleted);
      messagingService.offTyping(handleTypingEvent);
    };
  }, [selectedConversation, currentUserId, loadConversations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (selectedConversation) {
        messagingService.leaveConversation(selectedConversation.id);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-white">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Conversation List Sidebar */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-700">
        {/* User Search */}
        <div className="p-4 border-b border-slate-700">
          <UserSearch onUserSelected={loadConversations} />
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id || null}
            onSelectConversation={handleSelectConversation}
            currentUserId={currentUserId || 0}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-800">
              <h2 className="text-xl font-bold text-white">
                {selectedConversation.name ||
                  (selectedConversation.type === 'direct' && selectedConversation.participants[0]?.name) ||
                  'Conversation'}
              </h2>
              {typingUsers.size > 0 && (
                <p className="text-sm text-slate-400 mt-1">
                  {Array.from(typingUsers).length} user{typingUsers.size > 1 ? 's' : ''} typing...
                </p>
              )}
            </div>

            {/* Messages */}
            <MessageList
              messages={messages}
              currentUserId={currentUserId || 0}
              onLoadMore={() => {
                if (hasMoreMessages && !messagesLoading && selectedConversation) {
                  loadMessages(selectedConversation.id, messagesOffset, true);
                }
              }}
              hasMore={hasMoreMessages}
              loading={messagesLoading}
            />

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              disabled={!selectedConversation}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p>Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;

