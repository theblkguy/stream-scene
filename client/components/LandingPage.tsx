import React from 'react';
<<<<<<< HEAD
<<<<<<< HEAD
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from './GoogleLoginButton';
=======
import { Link } from 'react-router-dom';
<<<<<<< HEAD
>>>>>>> af4fd1d5 (Add/ React router route to Project Hub)
=======
import GoogleLoginButton from './GoogleLoginButton';
>>>>>>> 741fab68 (fixed google OAuth authentication -Fixed Express Version Conflict, Changed GoogleLoginButton with styling, set up different routes for auth/google in cloud console, cleaned up conflicting server files, updated landing page to use new button)

// Define the CurrentView type to match App.tsx
type CurrentView = 'landing' | 'planner' | 'project-center' | 'budget-tracker' | 'demos-trailers' | 'content-scheduler';

interface LandingPageProps {
  onNavigate?: (destination: CurrentView) => void;
}

// Professional Film Reel Component with Static Text
const AnimatedFilmReel = () => {
  return (
<<<<<<< HEAD
    <div className="inline-block group">
      {/* Professional CSS animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes cosmicFloat {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-8px) scale(1.02); }
          }
          
          @keyframes starTwinkle {
            0%, 100% { opacity: 0.4; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          
          @keyframes reelSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes filmPerforationFlow {
            0% { transform: translateY(-8px); opacity: 0.3; }
            50% { opacity: 1; }
            100% { transform: translateY(8px); opacity: 0.3; }
          }
          
          @keyframes nebulaGlow {
            0%, 100% { filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.6)); }
            50% { filter: drop-shadow(0 0 40px rgba(236, 72, 153, 0.8)); }
          }
          
          @keyframes holoShimmer {
            0% { background-position: -200px 0; }
            100% { background-position: 200px 0; }
          }
          
          @keyframes filmStripGlow {
            0%, 100% { box-shadow: inset 0 0 20px rgba(139, 92, 246, 0.2); }
            50% { box-shadow: inset 0 0 30px rgba(236, 72, 153, 0.3); }
          }
          
          @keyframes filmEdgeFlow {
            0% { opacity: 0.6; transform: scaleY(0.9); }
            50% { opacity: 1; transform: scaleY(1.1); }
            100% { opacity: 0.6; transform: scaleY(0.9); }
          }
          
          .cosmic-reel {
            animation: cosmicFloat 4s ease-in-out infinite;
            filter: drop-shadow(0 10px 30px rgba(139, 92, 246, 0.3));
          }
          
          .star-field {
            animation: starTwinkle 2s ease-in-out infinite;
          }
          
          .spinning-reel {
            animation: reelSpin 8s linear infinite;
            transform-origin: center;
          }
          
          .film-perforation-flowing {
            animation: filmPerforationFlow 2.5s ease-in-out infinite;
          }
          
          .film-strip-glow {
            animation: filmStripGlow 4s ease-in-out infinite;
          }
          
          .film-edge-flow {
            animation: filmEdgeFlow 3s ease-in-out infinite;
          }
          
          .nebula-glow {
            animation: nebulaGlow 6s ease-in-out infinite;
          }
          
          .holo-surface {
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.2),
              transparent
            );
            background-size: 200px 100%;
            animation: holoShimmer 3s ease-in-out infinite;
          }
          
          .cosmic-reel:hover .spinning-reel {
            animation-duration: 2s !important;
          }
          
          .cosmic-reel:hover .film-perforation-flowing {
            animation-duration: 1s !important;
          }
          
          .cosmic-reel:hover {
            transform: scale(1.05);
            filter: drop-shadow(0 15px 40px rgba(139, 92, 246, 0.5));
          }
          
          .static-text {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
            font-weight: 700;
          }
        `
      }} />
      
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 320 380" 
        width="260" 
        height="320" 
        className="cosmic-reel"
      >
        {/* Professional gradients and filters */}
        <defs>
          {/* Cosmic gradients */}
          <radialGradient id="cosmicCore" cx="50%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="20%" stopColor="#e2e8f0" />
            <stop offset="60%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </radialGradient>

          <radialGradient id="nebulaGradient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="30%" stopColor="#312e81" />
            <stop offset="70%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          <linearGradient id="holographicSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#e2e8f0" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.5" />
            <stop offset="75%" stopColor="#94a3b8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="filmSurface" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="10%" stopColor="#1e293b" />
            <stop offset="90%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          {/* Professional filters */}
          <filter id="cosmicGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="professionalShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="rgba(139, 92, 246, 0.25)"/>
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0, 0, 0, 0.3)"/>
          </filter>

          <filter id="insetShadow">
            <feOffset dx="0" dy="2"/>
            <feGaussianBlur stdDeviation="2" result="offset-blur"/>
            <feFlood floodColor="rgba(0,0,0,0.3)"/>
            <feComposite in2="offset-blur" operator="in"/>
            <feComposite in2="SourceGraphic" operator="over"/>
          </filter>

          <filter id="textGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Star field background */}
        <g className="star-field">
          <circle cx="80" cy="40" r="1.5" fill="#e2e8f0" opacity="0.8" />
          <circle cx="240" cy="60" r="1" fill="#f8fafc" opacity="0.6" />
          <circle cx="50" cy="100" r="0.8" fill="#cbd5e1" opacity="0.7" />
          <circle cx="270" cy="120" r="1.2" fill="#e2e8f0" opacity="0.9" />
          <circle cx="30" cy="200" r="1" fill="#f1f5f9" opacity="0.5" />
          <circle cx="290" cy="250" r="0.9" fill="#e2e8f0" opacity="0.8" />
          <circle cx="70" cy="300" r="1.3" fill="#f8fafc" opacity="0.6" />
          <circle cx="250" cy="320" r="1.1" fill="#cbd5e1" opacity="0.7" />
        </g>

        {/* Top Film Reel - Premium Design */}
        <g transform="translate(160, 55)" className="spinning-reel">
          {/* Outer ring with professional finish */}
          <circle cx="0" cy="0" r="38" fill="url(#cosmicCore)" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1" filter="url(#professionalShadow)" />
          <circle cx="0" cy="0" r="35" fill="url(#holographicSheen)" stroke="none" />
          
          {/* Inner mechanical details */}
          <g stroke="rgba(100, 116, 139, 0.8)" strokeWidth="1.5" opacity="0.9">
            <circle cx="0" cy="0" r="28" fill="none" strokeDasharray="2,2" />
            <circle cx="0" cy="0" r="22" fill="none" />
            <line x1="-20" y1="0" x2="20" y2="0" />
            <line x1="0" y1="-20" x2="0" y2="20" />
            <line x1="-14" y1="-14" x2="14" y2="14" />
            <line x1="-14" y1="14" x2="14" y2="-14" />
          </g>
          
          {/* Center hub */}
          <circle cx="0" cy="0" r="12" fill="url(#nebulaGradient)" stroke="rgba(148, 163, 184, 0.6)" strokeWidth="1" filter="url(#insetShadow)" />
          <circle cx="0" cy="0" r="4" fill="#0f172a" />
          
          {/* Holographic accent */}
          <circle cx="0" cy="0" r="30" fill="none" stroke="url(#holographicSheen)" strokeWidth="0.5" opacity="0.7" className="holo-surface" />
        </g>

        {/* Bottom Film Reel - Premium Design */}
        <g transform="translate(160, 325)" className="spinning-reel" style={{animationDirection: 'reverse', animationDuration: '6s'}}>
          {/* Outer ring with professional finish */}
          <circle cx="0" cy="0" r="38" fill="url(#cosmicCore)" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1" filter="url(#professionalShadow)" />
          <circle cx="0" cy="0" r="35" fill="url(#holographicSheen)" stroke="none" />
          
          {/* Inner mechanical details */}
          <g stroke="rgba(100, 116, 139, 0.8)" strokeWidth="1.5" opacity="0.9">
            <circle cx="0" cy="0" r="28" fill="none" strokeDasharray="2,2" />
            <circle cx="0" cy="0" r="22" fill="none" />
            <line x1="-20" y1="0" x2="20" y2="0" />
            <line x1="0" y1="-20" x2="0" y2="20" />
            <line x1="-14" y1="-14" x2="14" y2="14" />
            <line x1="-14" y1="14" x2="14" y2="-14" />
          </g>
          
          {/* Center hub */}
          <circle cx="0" cy="0" r="12" fill="url(#nebulaGradient)" stroke="rgba(148, 163, 184, 0.6)" strokeWidth="1" filter="url(#insetShadow)" />
          <circle cx="0" cy="0" r="4" fill="#0f172a" />
          
          {/* Holographic accent */}
          <circle cx="0" cy="0" r="30" fill="none" stroke="url(#holographicSheen)" strokeWidth="0.5" opacity="0.7" className="holo-surface" />
        </g>

        {/* Professional Film Strip with animated elements but static text */}
        <g className="nebula-glow">
          {/* Main film body with premium finish */}
          <rect x="50" y="93" width="220" height="194" rx="12" fill="url(#filmSurface)" filter="url(#professionalShadow)" className="film-strip-glow" />
          
          {/* Holographic overlay */}
          <rect x="50" y="93" width="220" height="194" rx="12" fill="none" stroke="url(#holographicSheen)" strokeWidth="0.5" opacity="0.4" className="holo-surface" />
          
          {/* Professional frame areas */}
          <rect x="75" y="115" width="170" height="65" rx="8" fill="url(#nebulaGradient)" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1" />
          <rect x="75" y="200" width="170" height="65" rx="8" fill="url(#nebulaGradient)" stroke="rgba(236, 72, 153, 0.3)" strokeWidth="1" />
          
          {/* Animated perforations - these move but text doesn't */}
          {Array.from({ length: 10 }).map((_, i) => (
            <g key={`perf-set-${i}`}>
              <rect 
                x="55" 
                y={100 + i * 18} 
                width="12" 
                height="8" 
                rx="6"
                fill="rgba(248, 250, 252, 0.9)" 
                stroke="rgba(203, 213, 225, 0.5)"
                strokeWidth="0.5"
                className="film-perforation-flowing"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
              <rect 
                x="253" 
                y={100 + i * 18} 
                width="12" 
                height="8" 
                rx="6"
                fill="rgba(248, 250, 252, 0.9)" 
                stroke="rgba(203, 213, 225, 0.5)"
                strokeWidth="0.5"
                className="film-perforation-flowing"
                style={{ animationDelay: `${i * 0.15 + 0.5}s` }}
              />
            </g>
          ))}
          
          {/* Animated film edges */}
          <rect x="50" y="93" width="2" height="194" rx="1" fill="rgba(248, 250, 252, 0.2)" className="film-edge-flow" />
          <rect x="268" y="93" width="2" height="194" rx="1" fill="rgba(15, 23, 42, 0.6)" className="film-edge-flow" style={{animationDelay: '1s'}} />
          <rect x="50" y="93" width="220" height="2" rx="1" fill="rgba(248, 250, 252, 0.15)" className="film-edge-flow" style={{animationDelay: '0.5s'}} />
          <rect x="50" y="285" width="220" height="2" rx="1" fill="rgba(15, 23, 42, 0.6)" className="film-edge-flow" style={{animationDelay: '1.5s'}} />
          
          {/* COMPLETELY STATIC TEXT - Absolutely no animations */}
          <g>
            {/* Modern typography that is completely stationary */}
            <text 
              x="160" 
              y="155" 
              fill="url(#textGradient)" 
              fontSize="22" 
              fontWeight="700" 
              textAnchor="middle"
              filter="url(#textGlow)"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
              }}
            >
              Stream
            </text>
            <text 
              x="160" 
              y="240" 
              fill="url(#textGradient)" 
              fontSize="22" 
              fontWeight="700" 
              textAnchor="middle"
              filter="url(#textGlow)"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
              }}
            >
              Scene
            </text>
            
            {/* Professional frame markers - also completely static */}
            <text x="60" y="125" fill="rgba(203, 213, 225, 0.7)" fontSize="7" fontFamily="SF Mono, Monaco, monospace" textAnchor="middle" transform="rotate(-90 60 125)">01</text>
            <text x="260" y="125" fill="rgba(203, 213, 225, 0.7)" fontSize="7" fontFamily="SF Mono, Monaco, monospace" textAnchor="middle" transform="rotate(90 260 125)">01</text>
            <text x="60" y="210" fill="rgba(203, 213, 225, 0.7)" fontSize="7" fontFamily="SF Mono, Monaco, monospace" textAnchor="middle" transform="rotate(-90 60 210)">02</text>
            <text x="260" y="210" fill="rgba(203, 213, 225, 0.7)" fontSize="7" fontFamily="SF Mono, Monaco, monospace" textAnchor="middle" transform="rotate(90 260 210)">02</text>
          </g>
          
          {/* Subtle static accent elements around text */}
          <circle cx="160" cy="175" r="1.5" fill="rgba(139, 92, 246, 0.8)" />
          <circle cx="160" cy="182" r="1" fill="rgba(236, 72, 153, 0.6)" />
          <circle cx="160" cy="188" r="1.2" fill="rgba(139, 92, 246, 0.7)" />
        </g>

        {/* Connecting film strips with subtle animation */}
        <rect x="145" y="93" width="30" height="8" rx="4" fill="rgba(30, 41, 59, 0.8)" className="film-edge-flow" />
        <rect x="145" y="279" width="30" height="8" rx="4" fill="rgba(30, 41, 59, 0.8)" className="film-edge-flow" style={{animationDelay: '2s'}} />
        
        {/* Subtle cosmic aura */}
        <ellipse cx="160" cy="190" rx="110" ry="95" fill="none" stroke="rgba(139, 92, 246, 0.1)" strokeWidth="1" opacity="0.6" className="nebula-glow" />
      </svg>
    </div>
  );
};

// Define a proper type for features
type Feature = {
  readonly icon: string;
  readonly title: string;
  readonly desc: string;
  readonly destination: CurrentView;
  readonly available: boolean;
};

// Feature data for better maintainability
const FEATURES: Feature[] = [
  { 
    icon: '📁', 
    title: 'Project Center', 
    desc: 'Organize all your creative projects in one place', 
    destination: 'project-center' as CurrentView,
    available: true 
  },
  { 
    icon: '💰', 
    title: 'Budget Tracker', 
    desc: 'Keep your finances on track with smart tools',
    destination: 'budget-tracker' as CurrentView,
    available: true 
  },
  { 
    icon: '▶️', 
    title: 'Demos & Trailers', 
    desc: 'Showcase your best work professionally',
    destination: 'demos-trailers' as CurrentView,
    available: true 
  },
  { 
    icon: '📅', 
    title: 'Content Scheduler', 
    desc: 'Plan and schedule your content across platforms',
    destination: 'content-scheduler' as CurrentView,
    available: true 
  },
  { 
    icon: '🤖', 
    title: 'AI Weekly Planner', 
    desc: 'Smart task scheduling with AI assistance', 
    destination: 'planner' as CurrentView,
    available: true 
  }
] as const satisfies Feature[];

// Feature Card Component - Using React Router navigation
const FeatureCard: React.FC<{
  feature: Feature;
  onNavigate?: (destination: CurrentView) => void;
}> = ({ feature, onNavigate }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    console.log('🎯 NAVIGATING TO:', feature.destination);
    
    // Use React Router navigation
    const routeMap: Record<CurrentView, string> = {
      'landing': '/',
      'planner': '/planner',
      'project-center': '/project-center',
      'budget-tracker': '/budget-tracker',
      'demos-trailers': '/demos-trailers',
      'content-scheduler': '/content-scheduler'
    };

    const route = routeMap[feature.destination];
    if (route) {
      navigate(route);
    }

    // Also call the prop function for state management
    if (onNavigate) {
      onNavigate(feature.destination);
    }
  };

  return (
    <div 
      className="flex-shrink-0 w-48 sm:w-52 group p-3 sm:p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm hover:border-purple-400/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 cursor-pointer select-none"
      onClick={handleClick}
      style={{ 
        opacity: feature.available ? 1 : 0.75,
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <div className="text-xl sm:text-2xl mb-2" style={{ pointerEvents: 'none' }}>{feature.icon}</div>
      <h3 className="text-sm sm:text-base font-semibold text-purple-300 mb-2" style={{ pointerEvents: 'none' }}>
        {feature.title}
      </h3>
      <p className="text-gray-400 text-xs leading-relaxed" style={{ pointerEvents: 'none' }}>
        {feature.desc}
      </p>
      <div 
        className={`mt-2 text-xs font-medium transition-colors ${
          feature.available 
            ? 'text-purple-400 group-hover:text-purple-300' 
            : 'text-gray-500'
        }`}
        style={{ pointerEvents: 'none' }}
      >
        {feature.available ? 'Click to explore →' : 'Coming soon...'}
      </div>
    </div>
  );
};

const StreamSceneLandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const navigate = useNavigate();

  return (
=======
>>>>>>> 0938b3b4 (Fix/ Change componenents to be more mobile friendly)
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20"></div>
      <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      
      {/* Floating Animation Elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400/40 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400/40 rounded-full animate-bounce"></div>
      <div className="absolute bottom-32 left-20 w-3 h-3 bg-purple-300/50 rounded-full animate-ping"></div>
      <div className="absolute bottom-20 right-10 w-5 h-5 bg-pink-300/50 rounded-full animate-pulse"></div>

      {/* Simple Navbar */}
      <nav className="relative z-20 p-4 sm:p-6">
        <div className="flex justify-between items-center">
<<<<<<< HEAD
          {/* Rocket Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative group cursor-pointer hover:scale-110 transition-all duration-300">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                <span className="text-xl" role="img" aria-label="rocket">🚀</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
=======
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">S</span>
>>>>>>> 0938b3b4 (Fix/ Change componenents to be more mobile friendly)
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              StreamScene
            </span>
          </div>

<<<<<<< HEAD
<<<<<<< HEAD
          {/* Google Login in Right Upper Corner */}
          <GoogleLoginButton />
=======
          {/* Google Login in Corner */}
          <button className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-gray-300 text-sm">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="hidden sm:inline">Sign In</span>
            <span className="sm:hidden">Login</span>
          </button>
>>>>>>> 0938b3b4 (Fix/ Change componenents to be more mobile friendly)
=======
          {/* Google Login in Right Upper Corner */}
         <GoogleLoginButton/>
>>>>>>> 741fab68 (fixed google OAuth authentication -Fixed Express Version Conflict, Changed GoogleLoginButton with styling, set up different routes for auth/google in cloud console, cleaned up conflicting server files, updated landing page to use new button)
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-4 sm:px-0">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-16">
<<<<<<< HEAD
          <div className="mb-6 sm:mb-8">
            <AnimatedFilmReel />
          </div>

          {/* Brand Name */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4">
=======
import Taskbar from './Taskbar';

const StreamSceneLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      {/* Taskbar */}
      <Taskbar />

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8">
          {/* Auth Section */}
          <div className="w-full max-w-md mb-8">
            <div className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-center text-gray-200 mb-4">
                Welcome to StreamScene
              </h2>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] border border-gray-300">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-400">
                  Secure authentication powered by Google
                </p>
              </div>
            </div>
          </div>

          {/* Logo Placeholder */}
          <div className="mb-8 text-center">
            <div className="inline-block p-8 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 backdrop-blur-sm shadow-2xl">
              <div className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30">
                <div className="text-center">
                  <div className="text-6xl sm:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
=======
          {/* Logo Placeholder */}
          <div className="mb-6 sm:mb-8">
            <div className="inline-block p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 backdrop-blur-sm shadow-2xl">
              <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30">
                <div className="text-center">
                  <div className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-1">
>>>>>>> 0938b3b4 (Fix/ Change componenents to be more mobile friendly)
                    S
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400 font-medium">
                    LOGO HERE
                  </div>
                </div>
              </div>
            </div>
          </div>
<<<<<<< HEAD
          
                    {/* Brand Name */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-center mb-6">
>>>>>>> 4ac8bb35 (cleaned up structure)
=======

          {/* Brand Name */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4">
>>>>>>> 0938b3b4 (Fix/ Change componenents to be more mobile friendly)
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              StreamScene
            </span>
          </h1>

          {/* Tagline */}
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 0938b3b4 (Fix/ Change componenents to be more mobile friendly)
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-4xl px-4 mx-auto mb-8 font-light leading-relaxed">
            Your complete creative production platform for streamlined workflows
          </p>
        </div>

<<<<<<< HEAD
        {/* Feature Cards - True Side by Side Layout */}
        <div className="flex justify-center items-start gap-3 sm:gap-4 w-full max-w-none px-4 mb-8 sm:mb-12 overflow-x-auto">
          {FEATURES.map((feature, index) => (
            <FeatureCard 
              key={`feature-${index}`}
              feature={feature} 
              onNavigate={onNavigate} 
            />
=======
        {/* Feature Cards */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full max-w-6xl px-4 mb-8 sm:mb-12">
          {[
            { icon: '📁', title: 'Project Hub', desc: 'Organize all your creative projects in one place', link: '/project-hub' },
            { icon: '💰', title: 'Budget Tracker', desc: 'Keep your finances on track with smart tools' },
            { icon: '▶️', title: 'Demos & Trailers', desc: 'Showcase your best work professionally' },
            { icon: '🤖', title: 'AI Weekly Planner', desc: 'Smart task scheduling with AI assistance', link: '/ai-planner' }
          ].map((feature, index) => (
            feature.link ? (
              <Link
                key={index}
                to={feature.link}
                className="flex-1 min-w-[280px] max-w-[320px] sm:min-w-[250px] sm:max-w-[300px] group p-4 sm:p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm hover:border-purple-400/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 cursor-pointer"
                style={{ textDecoration: 'none' }}
              >
                <div className="text-2xl sm:text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-base sm:text-lg font-semibold text-purple-300 mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
                <div className="mt-3 text-purple-400 text-xs font-medium group-hover:text-purple-300 transition-colors">
                  Click to explore →
                </div>
              </Link>
            ) : (
              <div key={index} className="flex-1 min-w-[280px] max-w-[320px] sm:min-w-[250px] sm:max-w-[300px] group p-4 sm:p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm hover:border-purple-400/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 opacity-75">
                <div className="text-2xl sm:text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-base sm:text-lg font-semibold text-purple-300 mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
                <div className="mt-3 text-gray-500 text-xs font-medium">
                  Coming soon...
                </div>
              </div>
            )
>>>>>>> af4fd1d5 (Add/ React router route to Project Hub)
          ))}
        </div>

<<<<<<< HEAD
        {/* CTA Section - REMOVED */}
=======
          <p className="text-xl sm:text-2xl lg:text-3xl text-gray-300 text-center max-w-4xl mb-12 font-light leading-relaxed">
            Your complete creative production platform
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mb-12">
            {[
              { icon: '📁', title: 'Project Hub', desc: 'Organize all your creative projects' },
              { icon: '💰', title: 'Budget Tracker', desc: 'Keep your finances on track' },
              { icon: '▶️', title: 'Demos & Trailers', desc: 'Showcase your best work' },
              { icon: '📅', title: 'AI Weekly Planner', desc: 'Smart scheduling assistance' }
            ].map((feature, index) => (
              <div key={index} className="group p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-gray-900/50 border border-purple-500/20 backdrop-blur-sm hover:border-purple-400/40 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-purple-300 mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">
              Ready to streamline your creative workflow?
            </p>
            <button className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 transform">
              <span className="flex items-center">
                Explore Features
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
            </button>
          </div>
=======
        {/* CTA Section */}
        <div className="text-center px-4">
          <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">
            Ready to streamline your creative workflow?
          </p>
          <Link 
            to="/ai-planner"
            className="group inline-block px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 transform text-sm sm:text-base"
          >
            <span className="flex items-center justify-center">
              Start with AI Planner
              <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">🤖</span>
            </span>
<<<<<<< HEAD
          </button>
>>>>>>> 0938b3b4 (Fix/ Change componenents to be more mobile friendly)
=======
          </Link>
>>>>>>> f858fd26 (built AIWeeklyPlanner component, made click function on landing page, created routes to create tasks, tasklist)
        </div>
        
        {/* Floating Animation Elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400/40 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400/40 rounded-full animate-bounce"></div>
        <div className="absolute bottom-32 left-20 w-3 h-3 bg-purple-300/50 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-10 w-5 h-5 bg-pink-300/50 rounded-full animate-pulse"></div>
>>>>>>> 4ac8bb35 (cleaned up structure)
      </main>
    </div>
  );
};

export default StreamSceneLandingPage;