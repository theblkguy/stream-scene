// server/routes/index.ts
import { Router } from "express";

// ESM imports
import canvasRouter from './canvas.js';
import canvasCalendarRouter from './canvasCalendar.js';
import commentsRouter from './comments.js';
import contentSchedulerRouter from './contentScheduler.js';
import socialAuthRouter from './socialAuth.js';
import taskRouter from './tasks.js';
import threadsApiRouter from './threadsApi.js';
console.log('✅ Tasks router imported');
console.log('✅ Content scheduler router imported');
console.log('✅ Social auth router imported');
console.log('✅ Threads API router imported');
console.log('✅ Comments router imported');
console.log('✅ Canvas router imported');
console.log('✅ Canvas calendar router imported');
// Budget router now imported directly in app.ts 

const router = Router();

// Health check
router.get("/healthz", (_req, res) => {
  res.json({ 
    ok: true, 
    service: "streamscene-api", 
    ts: new Date().toISOString(),
    features: {
      socialAuth: true,
      contentScheduling: true,
      fileIntegration: true,
      threads: true,
      comments: true,
      canvas: true,
      canvasCalendar: true,
      budget: "mounted directly in app.ts",
    }
  });
});

// Route mounts
console.log('🚀 Mounting API routes...');
router.use('/api/tasks', taskRouter);
console.log('✅ Tasks routes mounted at /api/tasks');
router.use('/api/content-scheduler', contentSchedulerRouter); 
console.log('✅ Content scheduler routes mounted at /api/content-scheduler');
router.use('/api/auth/social', socialAuthRouter);
console.log('✅ Social auth routes mounted at /api/auth/social');
router.use('/api/threads', threadsApiRouter);
console.log('✅ Threads API routes mounted at /api/threads');
router.use('/api/comments', commentsRouter);
console.log('✅ Comments routes mounted at /api/comments');
router.use('/api/canvas', canvasRouter);
console.log('✅ Canvas routes mounted at /api/canvas');
router.use('/api/canvas-calendar', canvasCalendarRouter);
console.log('✅ Canvas calendar routes mounted at /api/canvas-calendar');
// Budget routes now mounted directly in app.ts at /api/budget

export default router;
