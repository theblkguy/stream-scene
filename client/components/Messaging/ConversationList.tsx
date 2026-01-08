// client/components/Messaging/ConversationList.tsx
// Conversation list component

import React from 'react';
import { Conversation } from '../../services/messagingService';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: number | null;
  onSelectConversation: (conversationId: number) => void;
  currentUserId: number;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentUserId,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) {
      return conversation.name;
    }
    if (conversation.type === 'direct' && conversation.participants.length > 0) {
      return conversation.participants[0].name;
    }
    return 'Unnamed Conversation';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'direct' && conversation.participants.length > 0) {
      return conversation.participants[0].profilePicture;
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-800 border-r border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white">Messages</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-slate-400">
            <p>No conversations yet</p>
            <p className="text-sm mt-2">Start a new conversation to get started!</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`p-4 cursor-pointer hover:bg-slate-700 transition-colors ${
                selectedConversationId === conversation.id ? 'bg-slate-700 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                  {getConversationAvatar(conversation) ? (
                    <img
                      src={getConversationAvatar(conversation)}
                      alt={getConversationName(conversation)}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold">
                      {getConversationName(conversation).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-semibold truncate">
                      {getConversationName(conversation)}
                    </h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                        {formatTime(conversation.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  
                  {conversation.lastMessage ? (
                    <p className="text-slate-400 text-sm truncate">
                      {conversation.lastMessage.user?.id === currentUserId ? 'You: ' : ''}
                      {conversation.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-slate-500 text-sm italic">No messages yet</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;

