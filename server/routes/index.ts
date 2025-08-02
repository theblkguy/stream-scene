// server/routes/index.ts
import { Router } from "express";
import taskRouter from './tasks';

// ESM imports
import taskRouter from './tasks.js';
import contentSchedulerRouter from './contentScheduler.js';
import socialAuthRouter from './socialAuth.js';
import threadsRouter from './threads.js'; 

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
    }
  });
});

<<<<<<< HEAD
// Route mounts
router.use('/api/tasks', taskRouter);
router.use('/api/content-scheduler', contentSchedulerRouter); 
router.use('/api/auth/social', socialAuthRouter);
router.use('/api/threads', threadsRouter);

export default router;
=======
router.use('/api/tasks', taskRouter);
export default router; 
>>>>>>> f858fd26 (built AIWeeklyPlanner component, made click function on landing page, created routes to create tasks, tasklist)
