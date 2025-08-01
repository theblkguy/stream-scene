<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './LandingPage';
import AIWeeklyPlanner from './AIWeeklyPlanner';
import ProjectCenter from './ProjectCenter/ProjectCenter';
import SharedFileViewer from './SharedFileViewer';
import Navbar from './NavBar';
import ContentScheduler from '../ContentScheduler/ContentScheduler';
import DemosTrailers from './DemosTrailers';
import BudgetTracker from './BudgetTracker';

export type CurrentView = 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'demos-trailers' | 'content-scheduler';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<CurrentView>('landing');

  useEffect(() => {
    const routeToViewMap: Record<string, CurrentView> = {
      '/': 'landing',
      '/planner': 'planner',
      '/project-center': 'project-center',
      '/budget-tracker': 'budget-tracker',
      '/demos-trailers': 'demos-trailers',
      '/content-scheduler': 'content-scheduler'
    };

    const currentRoute = location.pathname;
    const matchedView = routeToViewMap[currentRoute];
    if (matchedView) {
      setCurrentView(matchedView);
    }
  }, [location.pathname]);

  const handleNavigation = (view: CurrentView) => {
    const viewToRouteMap: Record<CurrentView, string> = {
      'landing': '/',
      'planner': '/planner',
      'project-center': '/project-center',
      'budget-tracker': '/budget-tracker',
      'demos-trailers': '/demos-trailers',
      'content-scheduler': '/content-scheduler'
    };

    const route = viewToRouteMap[view];
    if (route) {
      navigate(route);
      setCurrentView(view);
    }
  };

  const showNavbar = !location.pathname.startsWith('/shared/') && location.pathname !== '/';

  return (
    <div className="min-h-screen">
      {showNavbar && (
        <Navbar
          currentComponent={currentView}
          onNavigate={handleNavigation}
        />
      )}
      <div className={showNavbar ? '' : 'min-h-screen'}>
        <Routes>
          <Route path="/" element={<LandingPage onNavigate={handleNavigation} />} />
          <Route path="/planner" element={<AIWeeklyPlanner />} />
          <Route path="/project-center" element={<ProjectCenter />} />
          <Route path="/budget-tracker" element={<BudgetTracker />} />
          <Route path="/demos-trailers" element={<DemosTrailers />} />
          <Route path="/content-scheduler" element={<ContentScheduler />} />
          <Route path="/shared/:token" element={<SharedFileViewer />} />
        </Routes>
      </div>
=======
=======
>>>>>>> 4ac8bb35 (cleaned up structure)
=======
>>>>>>> af4fd1d5 (Add/ React router route to Project Hub)
import React, { useState } from 'react';
import GoogleLoginButton from './GoogleLoginButton';
import StreamSceneTodoList from './StreamSceneTodoList';

const App: React.FC = () => {
  const [showTasks, setShowTasks] = useState(false);

  return (
    <div className="App text-white bg-black min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-2">Stream Scene</h1>
      <p className="text-lg">Lights Camera Action!!</p>
      <p className="mb-4">By: Jasmine and Bradley</p>

      <button
        onClick={() => setShowTasks(!showTasks)}
        className="bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded mb-6"
      >
        {showTasks ? 'Back to Login' : 'Show Task Form'}
      </button>

<<<<<<< HEAD
      {showTasks ? <StreamSceneTodoList /> : <GoogleLoginButton />}
>>>>>>> a3169de1 (fixed server issue, made task form on front end)
=======
      {<GoogleLoginButton />}
=======
=======

>>>>>>> fc277cd1 (Add/ React router route to Project Hub)
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import StreamSceneLandingPage from './LandingPage';
import ProjectHub from './ProjectHub/ProjectHub';



const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
<<<<<<< HEAD
      <StreamSceneLandingPage />
>>>>>>> 9f419906 (cleaned up structure)
<<<<<<< HEAD
>>>>>>> 4ac8bb35 (cleaned up structure)
=======
=======
      <Routes>
        <Route path="/" element={<StreamSceneLandingPage />} />
        <Route path="/project-hub" element={<ProjectHub />} />
      </Routes>
>>>>>>> fc277cd1 (Add/ React router route to Project Hub)
>>>>>>> af4fd1d5 (Add/ React router route to Project Hub)
    </div>
  );
};

export default App;
