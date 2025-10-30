import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import CollaborativeCanvas from '../CollaborativeCanvas';
import FileUpload from './FileUpload';
import LoginPromptPopup from '../LoginPromptPopup';

// Custom SVG Icon Components (matching your navbar and landing page)
const ProjectIcon = () => (
  <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
  </svg>
);

const FolderIcon = () => (
  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
);

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const ProjectCenterTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('canvas');
  const [canvasId, setCanvasId] = useState<string>('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { user, loading } = useAuth();

  // Check authentication and show login prompt if needed
  useEffect(() => {
    if (!loading && !user) {
      setShowLoginPrompt(true);
    }
  }, [user, loading]);

  // Generate unique canvas ID for authenticated users only
  useEffect(() => {
    if (user?.id) {
      // Use user ID + timestamp for unique canvas per user session
      const uniqueId = `user-${user.id}-canvas-${Date.now()}`;
      setCanvasId(uniqueId);
    }
  }, [user]);

  const handleCollaboratorChange = (collaboratorId: string, action: string) => {
    console.log(`Collaborator ${collaboratorId} ${action} the canvas`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // Don't render until we have a canvas ID (for authenticated users)
  if (user && !canvasId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Initializing canvas...</div>
      </div>
    );
  }

  const tabs: Tab[] = [
    {
      id: 'canvas',
      label: 'Canvas',
      icon: <ProjectIcon />,
      component: (
        <CollaborativeCanvas 
          canvasId={canvasId}
          isOwner={true}
          allowAnonymousEdit={true}
          onCollaboratorChange={handleCollaboratorChange}
          initialBackgroundColor="#1F2937"
        />
      )
    },
    {
      id: 'files',
      label: 'Files',
      icon: <FolderIcon />,
      component: <FileUpload />
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
      {/* Tab Navigation */}
      <div className="mb-8 w-full flex justify-center">
        <div className="flex flex-wrap justify-center gap-2 p-2 bg-slate-800/50 rounded-xl backdrop-blur-sm border border-purple-500/20">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="min-h-[400px] w-full flex justify-center"
      >
        {activeTabData?.component}
      </motion.div>

      {/* Login Prompt Popup */}
      <LoginPromptPopup 
        isVisible={showLoginPrompt} 
        onClose={() => setShowLoginPrompt(false)} 
      />
    </div>
  );
};

export default ProjectCenterTabs;