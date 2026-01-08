// client/components/Messaging/UserSearch.tsx
// User search component for finding users to message

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiMagnifyingGlass, HiUser } from 'react-icons/hi2';
import { searchUsers } from '../../services/profileService';
import { User } from '../../types/auth';
import messagingService from '../../services/messagingService';
import useAuth from '../../hooks/useAuth';

interface UserSearchProps {
  onUserSelected?: () => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onUserSelected }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const users = await searchUsers(query.trim(), 10);
        // Filter out current user
        const filteredUsers = users.filter(user => user.id !== currentUser?.id);
        setResults(filteredUsers);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching users:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [query, currentUser?.id]);

  const handleUserClick = async (user: User) => {
    try {
      // Create or get existing direct conversation
      const conversation = await messagingService.createConversation('direct', [user.id]);
      // Navigate to messages page with the conversation
      navigate(`/messages?conversation=${conversation.id}`);
      setQuery('');
      setShowResults(false);
      if (onUserSelected) {
        onUserSelected();
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      // If conversation already exists, just navigate to messages
      navigate('/messages');
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setShowResults(true)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserClick(user)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 transition-colors text-left"
            >
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <HiUser className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user.name}</p>
                {user.username && (
                  <p className="text-gray-400 text-sm truncate">@{user.username}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && query.trim().length >= 2 && !loading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 p-4 text-center text-gray-400">
          No users found
        </div>
      )}
    </div>
  );
};

export default UserSearch;
