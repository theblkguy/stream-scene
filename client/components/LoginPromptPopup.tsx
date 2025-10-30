import React from 'react';

interface LoginPromptPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

const LoginPromptPopup: React.FC<LoginPromptPopupProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-800 to-gray-900 border border-purple-500/30 rounded-xl p-6 max-w-sm w-full shadow-2xl shadow-purple-500/20">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-10 h-10 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-purple-300 mb-2">
            Sign In Required
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            Please sign in with Google to access StreamScene features and start managing your creative projects.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptPopup;