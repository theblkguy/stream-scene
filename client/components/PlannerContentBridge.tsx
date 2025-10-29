// client/components/PlannerContentBridge.tsx

import { motion } from 'framer-motion';
import React from 'react';

interface PlannerContentBridgeProps {
  content: string;
  scheduledDate?: string;
  scheduledTime?: string;
  onSendToScheduler: () => void;
  onCancel: () => void;
  isVisible: boolean;
}

const PlannerContentBridge: React.FC<PlannerContentBridgeProps> = ({
  content,
  scheduledDate,
  scheduledTime,
  onSendToScheduler,
  onCancel,
  isVisible
}) => {
  if (!isVisible) return null;

  const formatDateTime = () => {
    if (!scheduledDate) return 'No specific time';
    
    const date = new Date(scheduledDate);
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    if (scheduledTime) {
      const time = new Date(`2000-01-01T${scheduledTime}`);
      const timeStr = time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${dateStr} at ${timeStr}`;
    }
    
    return dateStr;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 shadow-2xl max-w-sm z-50 border border-purple-400/30"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-white font-semibold mb-1">Ready to Schedule</h4>
          <p className="text-purple-100 text-sm mb-2">Send this content to Content Scheduler?</p>
        </div>
        <button
          onClick={onCancel}
          className="text-purple-200 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="bg-white bg-opacity-10 rounded-lg p-3 mb-4">
        <p className="text-white text-sm line-clamp-3 mb-2">{content}</p>
        <p className="text-purple-200 text-xs">
          📅 Scheduled for: {formatDateTime()}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onSendToScheduler}
          className="flex-1 px-4 py-2 bg-white hover:bg-opacity-90 text-purple-600 rounded-lg transition-colors text-sm font-medium"
        >
          Send to Scheduler
        </button>
      </div>
    </motion.div>
  );
};

export default PlannerContentBridge;