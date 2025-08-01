import React, { useState } from 'react';

<<<<<<< HEAD
<<<<<<< HEAD
interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  task_type: 'creative' | 'admin';
  deadline: string;
  estimated_hours: number | '';
}

interface TaskFormProps {
  onSubmit: (taskData: TaskFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    task_type: 'creative',
    deadline: '',
    estimated_hours: ''
  });

  const [errors, setErrors] = useState<Partial<TaskFormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimated_hours' ? (value === '' ? '' : parseInt(value)) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof TaskFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TaskFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate < today) {
        newErrors.deadline = 'Deadline cannot be in the past';
      }
    }

    if (formData.estimated_hours !== '' && (formData.estimated_hours < 1 || formData.estimated_hours > 168)) {
      newErrors.estimated_hours = 'Hours must be between 1 and 168' as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      task_type: 'creative',
      deadline: '',
      estimated_hours: ''
    });
    setErrors({});
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'creative': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'admin': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black mb-2">Create New Task</h2>
        <p className="text-black">Add a new task to your project schedule</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-black mb-2">
            Task Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            style={{ backgroundColor: 'white', color: 'black' }}
            placeholder="Enter task title..."
            disabled={isLoading}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-black mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
            style={{ backgroundColor: 'white', color: 'black' }}
            placeholder="Describe the task details..."
            disabled={isLoading}
          />
        </div>

        {/* Priority and Task Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-black mb-2">
              Priority *
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white ${getPriorityColor(formData.priority)}`}
              style={{ backgroundColor: 'white', color: 'black' }}
              disabled={isLoading}
            >
              <option value="low">🟢 Low Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="high">🔴 High Priority</option>
            </select>
          </div>

          {/* Task Type */}
          <div>
            <label htmlFor="task_type" className="block text-sm font-medium text-black mb-2">
              Task Type *
            </label>
            <select
              id="task_type"
              name="task_type"
              value={formData.task_type}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white ${getTaskTypeColor(formData.task_type)}`}
              style={{ backgroundColor: 'white', color: 'black' }}
              disabled={isLoading}
            >
              <option value="creative">🎨 Creative Work</option>
              <option value="admin">📋 Admin Work</option>
            </select>
          </div>
        </div>

        {/* Deadline and Estimated Hours Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Deadline */}
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-black mb-2">
              Deadline *
            </label>
            <input
              type="datetime-local"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white ${
                errors.deadline ? 'border-red-300' : 'border-gray-300'
              }`}
              style={{ backgroundColor: 'white', color: 'black' }}
              disabled={isLoading}
            />
            {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
          </div>

          {/* Estimated Hours */}
          <div>
            <label htmlFor="estimated_hours" className="block text-sm font-medium text-black mb-2">
              Estimated Hours
            </label>
            <input
              type="number"
              id="estimated_hours"
              name="estimated_hours"
              value={formData.estimated_hours}
              onChange={handleChange}
              min="1"
              max="168"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white ${
                errors.estimated_hours ? 'border-red-300' : 'border-gray-300'
              }`}
              style={{ backgroundColor: 'white', color: 'black' }}
              placeholder="Hours needed"
              disabled={isLoading}
            />
            {errors.estimated_hours && <p className="mt-1 text-sm text-red-600">{errors.estimated_hours}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Task...
              </span>
            ) : (
              '✅ Create Task'
            )}
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={isLoading}
            className="flex-1 sm:flex-none bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🔄 Reset
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 sm:flex-none bg-red-300 text-black py-2 px-4 rounded-md hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ❌ Cancel
            </button>
          )}
        </div>
      </form>
=======
=======
interface Task {
  id: number;
  title: string;
  description: string;
  type: 'creative' | 'admin';
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  estimatedHours: number;
  status: 'pending' | 'completed';
  createdAt: string;
}

>>>>>>> 0938b3b4 (Fix/ Change componenents to be more mobile friendly)
const StreamSceneTodoList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'status' | 'createdAt'>>({
    title: '',
    description: '',
    type: 'creative', 
    priority: 'medium',
    deadline: '',
    estimatedHours: 1
  });
  const [showForm, setShowForm] = useState(false);

  const addTask = () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Date.now(),
      ...newTask,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      description: '',
      type: 'creative',
      priority: 'medium',
      deadline: '',
      estimatedHours: 1
    });
    setShowForm(false);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id 
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'low': return 'text-green-400 border-green-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getTypeColor = (type) => {
    return type === 'creative' ? 'bg-purple-900/30 text-purple-300' : 'bg-blue-900/30 text-blue-300';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-900 min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">StreamScene Tasks</h1>
        <p className="text-gray-400 text-sm sm:text-base">Manage your creative and admin work</p>
      </div>

      {/* Add Task Button */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors border border-gray-700 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
        >
          <span className={`text-lg sm:text-xl transition-transform ${showForm ? 'rotate-45' : ''}`}>+</span>
          {showForm ? 'Close Form' : 'Add New Task'}
        </button>
      </div>

      {/* Task Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-700">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                  placeholder="Enter task title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({...newTask, type: e.target.value as 'creative' | 'admin'})}
                  className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                >
                  <option value="creative">Creative Work</option>
                  <option value="admin">Admin Work</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 h-20 resize-none text-sm sm:text-base"
                placeholder="Task description (optional)..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'low' | 'medium' | 'high'})}
                  className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({...newTask, estimatedHours: parseFloat(e.target.value)})}
                  className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={addTask}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                Add Task
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4 opacity-50">⏰</div>
            <p>No tasks yet. Add your first task to get started!</p>
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className={`bg-gray-800 rounded-lg p-4 border border-gray-700 transition-all ${
                task.status === 'completed' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-colors ${
                        task.status === 'completed'
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-gray-500 hover:border-green-500'
                      }`}
                    >
                      {task.status === 'completed' && <span className="text-sm">✓</span>}
                    </button>
                    
                    <h3 className={`text-lg font-medium ${
                      task.status === 'completed' ? 'line-through text-gray-500' : 'text-white'
                    }`}>
                      {task.title}
                    </h3>
                  </div>

                  {task.description && (
                    <p className="text-gray-400 mb-3 ml-9">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 ml-9">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(task.type)}`}>
                      {task.type === 'creative' ? 'Creative' : 'Admin'}
                    </span>
                    
                    <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${getPriorityColor(task.priority)}`}>
                      <span className="text-xs">🚩</span>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>

                    {task.deadline && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <span>⏰</span>
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}

                    <span className="text-xs text-gray-400">
                      {task.estimatedHours}h estimated
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1 text-lg"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      {tasks.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
            <div className="text-2xl font-bold text-white">
              {tasks.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-gray-400 text-sm">Pending Tasks</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
            <div className="text-2xl font-bold text-green-400">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-gray-400 text-sm">Completed</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
            <div className="text-2xl font-bold text-purple-400">
              {tasks.reduce((acc, task) => acc + task.estimatedHours, 0)}h
            </div>
            <div className="text-gray-400 text-sm">Total Hours</div>
          </div>
        </div>
      )}
>>>>>>> a3169de1 (fixed server issue, made task form on front end)
    </div>
  );
};

<<<<<<< HEAD
export default TaskForm;
=======
export default StreamSceneTodoList;
>>>>>>> a3169de1 (fixed server issue, made task form on front end)
