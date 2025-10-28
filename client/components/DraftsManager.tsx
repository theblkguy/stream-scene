// client/components/DraftsManager.tsx

import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Draft {
  id: number;
  content: string;
  media_urls?: string[];
  media_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  scheduled_time?: string;
  timezone?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  created_at: string;
  updated_at: string;
}

interface DraftsManagerProps {
  onLoadDraft?: (draft: Draft) => void;
  onClose?: () => void;
  isOpen: boolean;
}

const DraftsManager: React.FC<DraftsManagerProps> = ({ onLoadDraft, onClose, isOpen }) => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'DRAFT' | 'SCHEDULED' | 'FAILED'>('ALL');

  // Load drafts when component opens
  useEffect(() => {
    if (isOpen) {
      loadDrafts();
    }
  }, [isOpen]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/threads/drafts', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load drafts');
      }
      
      const data = await response.json();
      setDrafts(data.drafts || []);
    } catch (error) {
      console.error('Error loading drafts:', error);
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async (draftId: number) => {
    try {
      const response = await fetch(`/api/threads/drafts/${draftId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete draft');
      }
      
      setDrafts(drafts.filter(draft => draft.id !== draftId));
      toast.success('Draft deleted');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Failed to delete draft');
    }
  };

  const publishDraft = async (draft: Draft) => {
    try {
      toast.loading('Publishing draft...');
      
      // Determine the endpoint based on media type
      let endpoint = '/api/threads/posts/text';
      let body: { text: string; media_url?: string; media_type?: string; media_urls?: string[] } = { text: draft.content };
      
      if (draft.media_urls && draft.media_urls.length > 0) {
        if (draft.media_urls.length === 1) {
          endpoint = '/api/threads/posts/media';
          body = {
            text: draft.content,
            media_url: draft.media_urls[0],
            media_type: draft.media_type
          };
        } else {
          endpoint = '/api/threads/posts/carousel';
          body = {
            text: draft.content,
            media_urls: draft.media_urls
          };
        }
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error('Failed to publish draft');
      }
      
      // Update draft status to published
      await fetch(`/api/threads/drafts/${draft.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'PUBLISHED'
        })
      });
      
      toast.success('Draft published successfully!');
      loadDrafts(); // Refresh the list
    } catch (error) {
      console.error('Error publishing draft:', error);
      toast.error('Failed to publish draft');
    }
  };

  // Future: Schedule draft functionality
  // const scheduleDraft = async (draft: Draft, scheduledDate: string, scheduledTime: string) => {
  //   try {
  //     const response = await fetch(`/api/threads/drafts/${draft.id}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       credentials: 'include',
  //       body: JSON.stringify({
  //         scheduled_time: `${scheduledDate}T${scheduledTime}`,
  //         status: 'SCHEDULED'
  //       })
  //     });
      
  //     if (!response.ok) {
  //       throw new Error('Failed to schedule draft');
  //     }
      
  //     toast.success('Draft scheduled successfully!');
  //     loadDrafts(); // Refresh the list
  //   } catch (error) {
  //     console.error('Error scheduling draft:', error);
  //     toast.error('Failed to schedule draft');
  //   }
  // };

  // Filter drafts based on search and status
  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = draft.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || draft.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Draft Management</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Search and Filter */}
            <div className="mt-4 flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search drafts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-md text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'DRAFT' | 'SCHEDULED' | 'FAILED')}
                className="px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              >
                <option value="ALL" className="text-gray-900">All Drafts</option>
                <option value="DRAFT" className="text-gray-900">Drafts</option>
                <option value="SCHEDULED" className="text-gray-900">Scheduled</option>
                <option value="FAILED" className="text-gray-900">Failed</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-600">Loading drafts...</span>
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">No drafts found</p>
                <p className="text-sm">Start creating content to see your drafts here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDrafts.map((draft) => (
                  <motion.div
                    key={draft.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(draft.status)}`}>
                            {draft.status}
                          </span>
                          {draft.media_type !== 'TEXT' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {draft.media_type}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-800 mb-2 line-clamp-3">{draft.content}</p>
                        
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Created: {formatDate(draft.created_at)}</p>
                          {draft.scheduled_time && (
                            <p>Scheduled: {formatDate(draft.scheduled_time)}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {/* Load Draft Button */}
                        <button
                          onClick={() => onLoadDraft?.(draft)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Load draft"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        {/* Publish Now Button */}
                        {draft.status === 'DRAFT' && (
                          <button
                            onClick={() => publishDraft(draft)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="Publish now"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                        )}
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => setShowDeleteConfirm(draft.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete draft"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{filteredDrafts.length} draft(s) found</span>
              <button
                onClick={loadDrafts}
                className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-semibold mb-2">Delete Draft?</h3>
              <p className="text-gray-600 mb-4">
                This action cannot be undone. Are you sure you want to delete this draft?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteDraft(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default DraftsManager;