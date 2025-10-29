// client/components/PlannerIntegration.tsx

import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Task } from '../types/task';

interface PlannerIntegrationProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTask: (task: Task) => void;
}

interface ImportableContent {
  id: number;
  title: string;
  description?: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  task_type: 'creative' | 'admin';
  tags?: string[];
}

const PlannerIntegration: React.FC<PlannerIntegrationProps> = ({
  isOpen,
  onClose,
  onImportTask
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'creative' | 'admin'>('all');

  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        // Filter for incomplete tasks that could be content ideas
        const contentTasks = data.filter((task: Task) => 
          task.status !== 'completed' && 
          (task.task_type === 'creative' || task.description?.toLowerCase().includes('content'))
        );
        setTasks(contentTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.task_type === filter;
  });

  const toggleTaskSelection = (taskId: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleImportSelected = () => {
    selectedTasks.forEach(taskId => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        onImportTask(task);
      }
    });
    setSelectedTasks(new Set());
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 rounded-lg p-6 max-w-4xl w-full m-4 max-h-[80vh] overflow-hidden"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Import from AI Weekly Planner
            </h3>
            <p className="text-gray-400">
              Select tasks from your planner to convert into content ideas
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('creative')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'creative'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Creative ({tasks.filter(t => t.task_type === 'creative').length})
          </button>
          <button
            onClick={() => setFilter('admin')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'admin'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            Admin ({tasks.filter(t => t.task_type === 'admin').length})
          </button>
        </div>

        {/* Task List */}
        <div className="overflow-y-auto max-h-96 mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">Loading tasks...</div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No tasks available to import
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <motion.div
                  key={task.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTasks.has(task.id)
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                  }`}
                  onClick={() => toggleTaskSelection(task.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => toggleTaskSelection(task.id)}
                          className="rounded bg-slate-700 border-slate-600 text-purple-600 focus:ring-purple-500"
                        />
                        <h4 className="text-white font-medium">{task.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400">
                          {task.task_type}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {task.deadline && (
                          <span>Due: {formatDeadline(task.deadline)}</span>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1">
                            {task.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="bg-slate-700 px-2 py-1 rounded">
                                #{tag}
                              </span>
                            ))}
                            {task.tags.length > 3 && (
                              <span className="text-gray-400">+{task.tags.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-gray-400 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImportSelected}
              disabled={selectedTasks.size === 0}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Import {selectedTasks.size > 0 ? `${selectedTasks.size} ` : ''}Task{selectedTasks.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PlannerIntegration;