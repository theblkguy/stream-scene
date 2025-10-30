# StreamScene Comprehensive TODO

## 🎯 IMMEDIATE PRIORITIES

### Canvas Mobile Enhancement (HIGH PRIORITY)
- [ ] **Implement pinch-to-zoom functionality**
  - Add multi-touch gesture detection for canvas scaling
  - Implement zoom state management (min/max zoom levels)
  - Add pan functionality when zoomed in
  - Ensure drawing coordinates scale properly with zoom level
  - Test on iOS Safari and Android Chrome

- [ ] **Enhanced mobile touch interactions**
  - Improve touch precision for drawing
  - Add touch pressure sensitivity (if available)
  - Implement palm rejection for stylus users
  - Add haptic feedback for tool changes (mobile devices)

### Shared Link System Overhaul (HIGH PRIORITY)
- [ ] **Simplify share token generation**
  - Change from long UUIDs to 6-character alphanumeric codes
  - Implement collision detection for short codes
  - Ensure codes are URL-safe and easy to copy/share
  - Update shareService.ts token generation logic

- [ ] **Implement visitor permission restrictions**
  - Create visitor permission system in CollaborativeCanvas.tsx
  - Restrict visitors from: clear canvas, load/save drawings, undo/redo, background color changes
  - Allow visitors: pen color, pen size, drawing, image export only
  - Add UI indicators showing visitor vs owner capabilities
  - Update canvas toolbar to hide restricted features for visitors

- [ ] **Visitor navigation restrictions**
  - Implement route protection for shared link users
  - Restrict visitors to canvas-only access (no NavBar, no other pages)
  - Create minimal visitor interface for shared canvas
  - Add "Join as registered user" option for visitors

## 🔧 TECHNICAL DEBT (SHOULD HAVE BEEN DONE)

### Code Quality & Architecture
- [ ] **TypeScript strict mode compliance**
  - Enable strict mode in tsconfig.json
  - Fix all type assertion issues across codebase
  - Add proper type definitions for socket events
  - Remove any `any` types from CollaborativeCanvas.tsx

- [ ] **Canvas performance optimization**
  - Implement canvas virtualization for large drawings
  - Add throttling to drawing events for better performance
  - Optimize stroke rendering with requestAnimationFrame
  - Implement drawing data compression for network efficiency

- [ ] **Error handling standardization**
  - Create centralized error handling utility
  - Standardize error messages across components
  - Add proper error boundaries in React components
  - Implement retry mechanisms for failed network operations

### Security & Authentication
- [ ] **Canvas access control hardening**
  - Implement proper JWT validation for canvas access
  - Add rate limiting to canvas WebSocket connections
  - Validate canvas permissions on every drawing event
  - Add canvas access logging and monitoring

- [ ] **Share link security improvements**
  - Add expiration dates to share links
  - Implement share link usage analytics
  - Add option to revoke/regenerate share links
  - Validate share tokens on server-side for all operations

### Database & Backend
- [ ] **Canvas data optimization**
  - Implement drawing data pagination for large canvases
  - Add canvas thumbnail generation for previews
  - Optimize database queries for canvas collaboration
  - Add proper indexing for canvas and share tables

- [ ] **WebSocket connection management**
  - Implement connection pooling for canvas sessions
  - Add heartbeat mechanism for connection health
  - Handle connection drops gracefully with auto-reconnect
  - Add proper cleanup for abandoned canvas sessions

## 🚀 FEATURE ENHANCEMENTS (SHOULD BE DONE)

### Canvas Collaboration Features
- [ ] **Enhanced collaboration tools**
  - Add voice chat integration for canvas sessions
  - Implement cursor names/labels for collaborators
  - Add drawing layers with individual permissions
  - Create collaborative drawing templates/presets

- [ ] **Canvas session management**
  - Add canvas version history with restore points
  - Implement canvas branching for different ideas
  - Add canvas merging capabilities
  - Create canvas session recordings/playback

### Mobile Experience
- [ ] **Progressive Web App (PWA) features**
  - Add service worker for offline canvas editing
  - Implement canvas caching for offline access
  - Add PWA manifest for mobile installation
  - Create splash screen and app icons

- [ ] **Mobile-specific UI improvements**
  - Design mobile-optimized toolbar (collapsible)
  - Add gesture shortcuts for common tools
  - Implement floating tool palette
  - Add quick color picker for mobile

### Export & Import Features
- [ ] **Enhanced export options**
  - Add PDF export with multiple pages/artboards
  - Implement SVG export for vector graphics
  - Add animated GIF export for drawing process
  - Create high-resolution export options

- [ ] **Import capabilities**
  - Add image import with automatic tracing
  - Implement PDF import as background layers
  - Add template import from external sources
  - Create drawing import from other formats

## 🌟 FUTURE ENHANCEMENTS (COULD BE DONE)

### AI Integration
- [ ] **AI-powered drawing assistance**
  - Add shape recognition and auto-correction
  - Implement smart line smoothing
  - Add AI-suggested color palettes
  - Create auto-completion for common drawings

- [ ] **AI collaboration features**
  - Add AI drawing companion/assistant
  - Implement style transfer for drawings
  - Add automatic drawing optimization suggestions
  - Create AI-powered drawing tutorials

### Advanced Canvas Features
- [ ] **Professional drawing tools**
  - Add vector drawing capabilities
  - Implement advanced brush engines
  - Add text formatting and typography tools
  - Create shape libraries and stamps

- [ ] **Canvas presentation mode**
  - Add slideshow functionality for canvas sequences
  - Implement presentation controls and navigation
  - Add annotation tools for presentations
  - Create audience interaction features

### Integration & API
- [ ] **External integrations**
  - Add Google Drive sync for canvas files
  - Implement Slack integration for sharing
  - Add webhook support for canvas events
  - Create public API for third-party integrations

- [ ] **Analytics & insights**
  - Add canvas usage analytics dashboard
  - Implement drawing time tracking
  - Add collaboration metrics and reports
  - Create user engagement insights

## 📱 MOBILE CANVAS IMPLEMENTATION PLAN

### Phase 1: Core Touch Support Enhancement
1. **Multi-touch gesture detection**
   ```typescript
   // Add to CollaborativeCanvas.tsx
   const [gestureState, setGestureState] = useState({
     scale: 1,
     offsetX: 0,
     offsetY: 0,
     isZooming: false,
     isPanning: false
   });
   ```

2. **Pinch-to-zoom implementation**
   - Detect two-finger gestures
   - Calculate distance between fingers for zoom
   - Update canvas transform matrix
   - Maintain drawing coordinate accuracy

3. **Pan functionality**
   - Enable panning when zoomed in
   - Add momentum scrolling for smooth UX
   - Implement boundaries to prevent over-panning
   - Add zoom-to-fit and reset zoom controls

### Phase 2: Visitor Permissions System
1. **Permission-based UI rendering**
   ```typescript
   interface CanvasPermissions {
     canClear: boolean;
     canSave: boolean;
     canLoad: boolean;
     canUndo: boolean;
     canChangeBackground: boolean;
     canExport: boolean;
   }
   ```

2. **Share link token simplification**
   - Generate 6-character alphanumeric codes (A-Z, 0-9)
   - Total possibilities: 36^6 = ~2.1 billion combinations
   - Add collision detection and retry logic
   - Update database schema for shorter tokens

### Phase 3: Mobile-Optimized Interface
1. **Responsive toolbar design**
   - Collapsible tool panels for small screens
   - Touch-friendly button sizing (44px minimum)
   - Gesture-based tool switching
   - Context-sensitive tool availability

2. **Performance optimizations**
   - Implement canvas tiling for large drawings
   - Add drawing data compression
   - Optimize WebSocket message batching
   - Use OffscreenCanvas for better performance

## 🔧 TECHNICAL IMPLEMENTATION NOTES

### Canvas Zoom Implementation Strategy
```typescript
// Touch gesture handling for zoom/pan
const handleTouchGestures = useCallback((e: TouchEvent) => {
  if (e.touches.length === 2) {
    // Pinch zoom logic
    const distance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    // Update zoom based on distance change
  } else if (gestureState.scale > 1) {
    // Single finger pan when zoomed
  }
}, [gestureState]);
```

### Share Token Generation
```typescript
// Simple 6-character token generation
const generateShareToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
```

### Visitor Permission Checks
```typescript
// Permission-based feature access
const canUserPerformAction = (action: string, userType: 'owner' | 'collaborator' | 'visitor'): boolean => {
  const permissions = {
    visitor: ['draw', 'changePenColor', 'changePenSize', 'export'],
    collaborator: ['draw', 'changePenColor', 'changePenSize', 'export', 'undo', 'redo'],
    owner: '*' // All permissions
  };
  
  return userType === 'owner' || permissions[userType].includes(action);
};
```

---

## 📋 COMPLETION TRACKING

**Legend:**
- [ ] Not started
- [x] Completed
- [-] In progress
- [!] Blocked/needs discussion

**Priority Levels:**
- 🎯 IMMEDIATE: Critical for next release
- 🔧 TECHNICAL DEBT: Should have been done already
- 🚀 ENHANCEMENTS: Should be done for better UX
- 🌟 FUTURE: Nice to have, long-term goals

---

*Last updated: October 29, 2025*
*Next review: Check mobile canvas progress and visitor permissions implementation*