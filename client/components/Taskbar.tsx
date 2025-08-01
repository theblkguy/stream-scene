
import React, { useState } from 'react';

interface TaskbarProps {
  className?: string;
}

const Taskbar: React.FC<TaskbarProps> = ({ className = '' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
<<<<<<< HEAD
  const [activeItem, setActiveItem] = useState('project-center');

  const navigationItems = [
    {
      id: 'project-center',
      label: 'Project Center',
      icon: '📁',
      href: '#project-center'
=======
  const [activeItem, setActiveItem] = useState('project-hub');

  const navigationItems = [
    {
      id: 'project-hub',
      label: 'Project Hub',
      icon: '📁',
      href: '#project-hub'
>>>>>>> 4ac8bb35 (cleaned up structure)
    },
    {
      id: 'budget-tracker',
      label: 'Budget Tracker',
      icon: '💰',
      href: '#budget-tracker'
    },
    {
      id: 'demos-trailers',
      label: 'Demos & Trailers',
      icon: '▶️',
      href: '#demos-trailers'
    },
    {
      id: 'ai-planner',
      label: 'AI Weekly Planner',
      icon: '📅',
      href: '#ai-planner'
    }
  ];

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className={`bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-lg border-b border-purple-500/20 ${className}`}>
<<<<<<< HEAD
<<<<<<< HEAD
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <div className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
=======
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
>>>>>>> 4ac8bb35 (cleaned up structure)
=======
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <div className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
>>>>>>> 0938b3b4 (Fix/ Change componenents to be more mobile friendly)
              StreamScene
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
<<<<<<< HEAD
<<<<<<< HEAD
            <div className="ml-6 lg:ml-10 flex items-baseline space-x-2 lg:space-x-4">
=======
            <div className="ml-10 flex items-baseline space-x-4">
>>>>>>> 4ac8bb35 (cleaned up structure)
=======
            <div className="ml-6 lg:ml-10 flex items-baseline space-x-2 lg:space-x-4">
>>>>>>> 0938b3b4 (Fix/ Change componenents to be more mobile friendly)
              {navigationItems.map((item) => {
                const isActive = activeItem === item.id;
                
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleItemClick(item.id);
                    }}
<<<<<<< HEAD
<<<<<<< HEAD
                    className={`group flex items-center px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-300 hover:scale-105 ${
=======
                    className={`group flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
>>>>>>> 4ac8bb35 (cleaned up structure)
=======
                    className={`group flex items-center px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-300 hover:scale-105 ${
>>>>>>> 0938b3b4 (Fix/ Change componenents to be more mobile friendly)
                      isActive
                        ? 'bg-purple-600/20 text-purple-300 shadow-lg shadow-purple-500/25'
                        : 'text-gray-300 hover:bg-purple-600/10 hover:text-purple-200'
                    }`}
                  >
<<<<<<< HEAD
<<<<<<< HEAD
                    <span className="text-sm lg:text-lg mr-1 lg:mr-2">{item.icon}</span>
                    <span className="hidden lg:inline">{item.label}</span>
                    <span className="lg:hidden">{item.label.split(' ')[0]}</span>
=======
                    <span className="text-lg mr-2">{item.icon}</span>
                    {item.label}
>>>>>>> 4ac8bb35 (cleaned up structure)
=======
                    <span className="text-sm lg:text-lg mr-1 lg:mr-2">{item.icon}</span>
                    <span className="hidden lg:inline">{item.label}</span>
                    <span className="lg:hidden">{item.label.split(' ')[0]}</span>
>>>>>>> 0938b3b4 (Fix/ Change componenents to be more mobile friendly)
                  </a>
                );
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-purple-300 hover:bg-purple-600/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-colors"
            >
              {isMobileMenuOpen ? (
                <span className="block text-xl">✕</span>
              ) : (
                <span className="block text-xl">☰</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-800/50 backdrop-blur-sm border-t border-purple-500/20">
            {navigationItems.map((item) => {
              const isActive = activeItem === item.id;
              
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleItemClick(item.id);
                  }}
                  className={`group flex items-center px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300'
                      : 'text-gray-300 hover:bg-purple-600/10 hover:text-purple-200'
                  }`}
                >
                  <span className="text-xl mr-3">{item.icon}</span>
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
<<<<<<< HEAD
};

export default Taskbar;
=======
};
>>>>>>> 4ac8bb35 (cleaned up structure)
