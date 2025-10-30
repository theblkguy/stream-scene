import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import CollaborativeCanvas from './CollaborativeCanvas';

const SharedCanvas: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(!user);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Canvas Link</h1>
          <p className="text-gray-400 mb-6">This shared canvas link is invalid or expired.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Go to StreamScene
          </button>
        </div>
      </div>
    );
  }

  // Welcome modal for visitors
  const WelcomeModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Welcome to Shared Canvas</h2>
          <p className="text-gray-400 text-sm mb-4">
            You've been invited to collaborate on this canvas. As a visitor, you can draw and change pen colors/sizes.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setShowWelcome(false)}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            Continue as Visitor
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Join StreamScene (Full Access)
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            Join StreamScene for full canvas features like saving, loading, and sharing your own canvases.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Minimal visitor header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
            {user ? (
              <div>
                <h1 className="text-sm font-medium">Canvas</h1>
                <p className="text-xs text-gray-400">ID: {token}</p>
              </div>
            ) : (
              <h1 className="text-sm font-medium">Canvas</h1>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs">
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span className="text-gray-300">Live</span>
            </div>
            
            {!user && (
              <button
                onClick={() => navigate('/')}
                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Join
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Canvas container */}
      <div className="h-[calc(100vh-64px)]">
        <CollaborativeCanvas 
          canvasId={token} 
          shareToken={token}
          isOwner={false}
          allowAnonymousEdit={true}
        />
      </div>

      {/* Welcome modal for first-time visitors */}
      {showWelcome && <WelcomeModal />}
    </div>
  );
};

export default SharedCanvas;