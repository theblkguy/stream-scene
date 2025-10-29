// client/components/CalendarWidget.tsx

import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';

interface CalendarWidgetProps {
  selectedDate?: string;
  selectedTime?: string;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onClose?: () => void;
  isOpen: boolean;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  selectedDate = '',
  selectedTime = '',
  onDateSelect,
  onTimeSelect,
  onClose,
  isOpen
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempTime, setTempTime] = useState(selectedTime || '12:00');

  const today = new Date();
  const currentYear = currentMonth.getFullYear();
  const currentMonthNum = currentMonth.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonthNum, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonthNum + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Create array of days
  const days = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDateClick = (day: number) => {
    const selectedDateObj = new Date(currentYear, currentMonthNum, day);
    const dateString = selectedDateObj.toISOString().split('T')[0];
    onDateSelect(dateString);
  };

  const handleTimeChange = (time: string) => {
    setTempTime(time);
    onTimeSelect(time);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isToday = (day: number) => {
    return today.getDate() === day &&
           today.getMonth() === currentMonthNum &&
           today.getFullYear() === currentYear;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return selected.getDate() === day &&
           selected.getMonth() === currentMonthNum &&
           selected.getFullYear() === currentYear;
  };

  const isPastDate = (day: number) => {
    const dayDate = new Date(currentYear, currentMonthNum, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dayDate < todayStart;
  };

  // Quick time presets
  const timePresets = [
    { label: 'Now', value: new Date().toTimeString().slice(0, 5) },
    { label: '9:00 AM', value: '09:00' },
    { label: '12:00 PM', value: '12:00' },
    { label: '3:00 PM', value: '15:00' },
    { label: '6:00 PM', value: '18:00' },
    { label: '9:00 PM', value: '21:00' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-slate-800 to-gray-900 border border-purple-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Schedule Post</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Calendar */}
          <div className="mb-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h4 className="text-lg font-semibold text-white">
                {monthNames[currentMonthNum]} {currentYear}
              </h4>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <button
                  key={index}
                  onClick={() => day && !isPastDate(day) && handleDateClick(day)}
                  disabled={!day || isPastDate(day)}
                  className={`
                    h-10 text-sm rounded-lg transition-all duration-200
                    ${!day ? 'invisible' : ''}
                    ${isPastDate(day as number) ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:bg-slate-700'}
                    ${isToday(day as number) ? 'bg-blue-600 text-white' : ''}
                    ${isSelected(day as number) ? 'bg-purple-600 text-white' : ''}
                    ${!isPastDate(day as number) && !isToday(day as number) && !isSelected(day as number) ? 'hover:bg-slate-600' : ''}
                  `}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Time
            </label>
            
            {/* Time Presets */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {timePresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleTimeChange(preset.value)}
                  className={`
                    px-3 py-2 text-xs rounded-lg transition-all duration-200
                    ${tempTime === preset.value 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }
                  `}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Time Input */}
            <input
              type="time"
              value={tempTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                onDateSelect('');
                onTimeSelect('');
              }}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CalendarWidget;