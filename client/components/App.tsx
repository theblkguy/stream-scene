<<<<<<< HEAD
<<<<<<< HEAD
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
=======
>>>>>>> f858fd26 (built AIWeeklyPlanner component, made click function on landing page, created routes to create tasks, tasklist)
=======
>>>>>>> 6ea7dd1f (Save local changes before merging upstream)
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
=======
>>>>>>> dedc015f (Save local changes before merging upstream)
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StreamSceneLandingPage from './LandingPage';
<<<<<<< HEAD
import ProjectHub from './ProjectHub/ProjectHub';
<<<<<<< HEAD

=======
import ProjectCenter from './ProjectCenter/ProjectCenter';
>>>>>>> c92301a0 (Fix/ All references to the "Project Hub" have been changed to "Project Center")


const App: React.FC = () => {
  const location = useLocation();

  const pageVariants = {
=======
const pageVariants = {
>>>>>>> eee7efea (built AIWeeklyPlanner component, made click function on landing page, created routes to create tasks, tasklist)
=======
import AIWeeklyPlanner from './AIWeeklyPlanner';


const App: React.FC = () => {
  const location = useLocation();
  
  const pageVariants = {
>>>>>>> dedc015f (Save local changes before merging upstream)
    initial: {
      x: "100%",
      opacity: 0,
      scale: 0.8
    },
    in: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    out: {
      x: "-100%",
      opacity: 0,
      scale: 1.2
    }
  };
  
  const pageTransition = {
    type: "tween" as const,
    ease: "anticipate" as const,
    duration: 0.6
  };

  return (
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
<<<<<<< HEAD
      <StreamSceneLandingPage />
>>>>>>> 9f419906 (cleaned up structure)
<<<<<<< HEAD
>>>>>>> 4ac8bb35 (cleaned up structure)
=======
=======
=======
    <div className="min-h-screen bg-gray-900 text-white">
>>>>>>> b9aacaf1 (Fix/ Change componenents to be more mobile friendly)
      <Routes>
        <Route path="/" element={<StreamSceneLandingPage />} />
        <Route path="/project-hub" element={<ProjectHub />} />
      </Routes>
>>>>>>> fc277cd1 (Add/ React router route to Project Hub)
<<<<<<< HEAD
>>>>>>> af4fd1d5 (Add/ React router route to Project Hub)
=======
=======
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
=======
    <div className="min-h-screen bg-gray-900 text-black overflow-hidden">
>>>>>>> 08de5005 (redid the task form to make text show up, built out the ai routes on the backend)
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route 
            path="/" 
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="absolute inset-0"
              >
                <StreamSceneLandingPage />
              </motion.div>
            } 
          />
          <Route 
            path="/project-center" 
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="absolute inset-0"
              >
                <ProjectCenter />
              </motion.div>
            } 
          />
          <Route 
            path="/ai-planner" 
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="absolute inset-0"
              >
                <AIWeeklyPlanner />
              </motion.div>
            } 
          />
        </Routes>
      </AnimatePresence>
>>>>>>> 9d52cad8 (Add/ Slide page transitions)
>>>>>>> 78f04578 (Add/ Slide page transitions)
    </div>
  );
};

<<<<<<< HEAD
export default App;
=======
export default App;
>>>>>>> eee7efea (built AIWeeklyPlanner component, made click function on landing page, created routes to create tasks, tasklist)
