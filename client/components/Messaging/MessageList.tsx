// client/components/Messaging/MessageList.tsx
// Message list component with infinite scroll

import React, { useEffect, useRef } from 'react';
import { Message } from '../../services/messagingService';

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  onLoadMore,
  hasMore,
  loading,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      scrollToBottom();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle scroll for infinite loading
  const handleScroll = () => {
    if (!messagesContainerRef.current || !hasMore || loading) return;

    const container = messagesContainerRef.current;
    if (container.scrollTop === 0) {
      onLoadMore();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const isSameSender = (currentMessage: Message, previousMessage: Message | undefined) => {
    if (!previousMessage) return false;
    return currentMessage.user?.id === previousMessage.user?.id;
  };

  const shouldShowAvatar = (message: Message, index: number) => {
    if (message.user?.id === currentUserId) return false;
    const nextMessage = messages[index + 1];
    return !isSameSender(message, nextMessage);
  };

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-2"
    >
      {loading && hasMore && (
        <div className="text-center text-slate-400 py-2">Loading older messages...</div>
      )}
      
      {messages.map((message, index) => {
        const isOwnMessage = message.user?.id === currentUserId;
        const showAvatar = shouldShowAvatar(message, index);
        const previousMessage = messages[index - 1];
        const isGrouped = isSameSender(message, previousMessage);

        return (
          <div
            key={message.id}
            className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
              isGrouped ? 'mt-1' : 'mt-4'
            }`}
          >
            {!isOwnMessage && (
              <div className="flex-shrink-0">
                {showAvatar ? (
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                    {message.user?.profilePicture ? (
                      <img
                        src={message.user.profilePicture}
                        alt={message.user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-semibold">
                        {message.user?.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-8" />
                )}
              </div>
            )}

            <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
              {!isOwnMessage && showAvatar && (
                <span className="text-xs text-slate-400 mb-1 px-2">
                  {message.user?.name || 'Unknown User'}
                </span>
              )}

              <div
                className={`rounded-lg px-4 py-2 ${
                  isOwnMessage
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-100'
                }`}
              >
                {message.message_type === 'image' && message.file_url && (
                  <img
                    src={message.file_url}
                    alt="Shared image"
                    className="max-w-xs rounded mb-2"
                  />
                )}
                {message.message_type === 'file' && message.file_url && (
                  <a
                    href={message.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline mb-2 block"
                  >
                    📎 File attachment
                  </a>
                )}
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <div className={`flex items-center gap-2 mt-1 ${
                  isOwnMessage ? 'text-blue-200' : 'text-slate-400'
                } text-xs`}>
                  <span>{formatMessageTime(message.created_at)}</span>
                  {message.edited_at && <span>(edited)</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

