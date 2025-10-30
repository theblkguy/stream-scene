import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';

const router = express.Router();

// Threads constants (leaving these in case you still use them elsewhere)
const THREADS_CLIENT_ID = process.env.THREADS_CLIENT_ID;
const THREADS_CLIENT_SECRET = process.env.THREADS_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'https://streamscene.net';
const THREADS_REDIRECT_URI = `${BASE_URL}/auth/threads/callback`;

// Simple test route
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Auth routes are working!' });
});

// Store recent auth errors for debugging
const recentAuthErrors: {timestamp: string, error: string, details?: unknown}[] = [];

// Debug endpoint to check environment and database
router.get('/debug', async (req: Request, res: Response) => {
  try {
    // Import User model to test database connection
    const { User } = await import('../models/User.js');
    
    // Test database connection
    const userCount = await User.count();
    
    res.json({
      message: 'Debug info',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasSessionSecret: !!process.env.SESSION_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL,
        clientUrl: process.env.CLIENT_URL,
        dbHost: process.env.DB_HOST,
        dbName: process.env.DB_NAME,
        hasDbPass: !!process.env.DB_PASS
      },
      database: {
        connected: true,
        userCount: userCount
      },
      recentAuthErrors: recentAuthErrors.slice(-5) // Show last 5 errors
    });
  } catch (error) {
    res.status(500).json({
      message: 'Debug error',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasSessionSecret: !!process.env.SESSION_SECRET
      },
      database: {
        connected: false
      }
    });
  }
});

// ──────────────────────────────────────────
// GOOGLE OAUTH START
// ──────────────────────────────────────────

// Kick off Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', (err: any, user: any, info: any) => {
      console.log('=== Passport Authenticate Result ===');
      console.log('Error:', err);
      console.log('User:', user ? 'User object present' : 'No user');
      console.log('Info:', info);

      if (err) {
        console.error('Authentication error:', err);
        // Store error for debugging
        recentAuthErrors.push({
          timestamp: new Date().toISOString(),
          error: 'Authentication error',
          details: err instanceof Error ? err.message : err
        });
        return res.redirect('/?error=auth_failed');
      }

      if (!user) {
        console.error('No user returned from authentication');
        // Store error for debugging
        recentAuthErrors.push({
          timestamp: new Date().toISOString(),
          error: 'No user returned from authentication',
          details: { info }
        });
        return res.redirect('/?error=no_user');
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.redirect('/?error=login_failed');
        }

        console.log('Login successful, saving session...');

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.redirect('/?error=session_failed');
          }

          console.log('Session saved, preparing redirect...');

          // ─────────────────────────────
          // ✅ REDIRECT LOGIC (updated)
          // ─────────────────────────────
          //
          // We do NOT want to bounce the user to an ngrok URL anymore.
          //
          // Instead:
          // - In production, if you explicitly define CLIENT_URL in .env,
          //   we'll trust that.
          // - In development, we ALWAYS send them back to localhost:3001
          //   so that the browser stays on the same origin that issued
          //   the session cookie.
          //
          // This fixes the "Google login works but you're still not authenticated"
          // bug that Bradley saw.

          const isProd =
            process.env.NODE_ENV === 'production' ||
            process.env.NODE_ENV === 'prod';

          const LOCAL_DEV_URL = 'http://localhost:3001';
          const envClient = process.env.CLIENT_URL; // e.g. real deployed frontend

          const redirectUrl =
            (isProd && envClient)
              ? envClient
              : LOCAL_DEV_URL;

          console.log('Redirecting to:', redirectUrl);
          return res.redirect(redirectUrl);
        });
      });
    })(req, res, next);
  }
);

// ──────────────────────────────────────────
// GOOGLE OAUTH END
// ──────────────────────────────────────────



// ──────────────────────────────────────────
// DEMO LOGIN (dev / presentation mode only)
// ──────────────────────────────────────────
//
// This lets you log in as a specific demo user without Google OAuth.
// To use this in production you'd WANT THIS LOCKED DOWN HARD,
// but for your current flow it's helpful.

router.post('/demo-login', async (req: Request, res: Response) => {
  // Allow demo login in development OR if ALLOW_DEMO_LOGIN=true
  const isDemoAllowed =
    process.env.NODE_ENV === 'development' ||
    process.env.ALLOW_DEMO_LOGIN === 'true';

  if (!isDemoAllowed) {
    return res.status(403).json({ error: 'Demo login disabled' });
  }

  try {
    // Lazy-import models so we don't create circular deps at load time
    const { User } = await import('../models/User.js');

    // Find the seeded demo user
    const demoUser = await User.findOne({
      where: { email: 'allblk13@gmail.com' }
    });

    if (!demoUser) {
      return res.status(404).json({
        error: 'Demo user not found. Please run seed script first.'
      });
    }

    // Log in the demo user and also reset demo data
    req.logIn(demoUser, (err) => {
      if (err) {
        console.error('Demo login error:', err);
        return res.status(500).json({ error: 'Demo login failed' });
      }

      // Wrap reset in an IIFE so we can await inside
      (async () => {
        try {
          // Reset tasks
          const { Task } = await import('../models/Task.js');

          await Task.destroy({ where: { user_id: demoUser.id } });

          const now = Date.now();
          const days = (n: number) =>
            new Date(now + n * 24 * 60 * 60 * 1000);

          const demoTasks = [
            {
              title: 'Welcome to StreamScene',
              description:
                'Explore the collaborative features and get started with your first project!',
              priority: 'medium',
              task_type: 'admin',
              status: 'pending',
              deadline: days(7),
              estimated_hours: 2,
              user_id: demoUser.id,
            },
            {
              title: 'Tech Review Script',
              description: 'Write script for iPhone 16 review video',
              priority: 'high',
              task_type: 'creative',
              status: 'in_progress',
              deadline: days(0),
              estimated_hours: 4,
              user_id: demoUser.id,
            },
            {
              title: 'Thumbnail Design',
              description: 'Create eye-catching thumbnail for review video',
              priority: 'medium',
              task_type: 'creative',
              status: 'pending',
              deadline: days(1),
              estimated_hours: 2,
              user_id: demoUser.id,
            },
            {
              title: 'Brand Partnership Meeting',
              description:
                'Video call with Sony about camera gear sponsorship',
              priority: 'high',
              task_type: 'admin',
              status: 'pending',
              deadline: days(3),
              estimated_hours: 1,
              user_id: demoUser.id,
            },
            {
              title: 'Content Calendar Planning',
              description: 'Plan next month content strategy',
              priority: 'medium',
              task_type: 'admin',
              status: 'pending',
              deadline: days(7),
              estimated_hours: 3,
              user_id: demoUser.id,
            },
            {
              title: 'SEO Optimization',
              description:
                'Optimized video titles and descriptions',
              priority: 'medium',
              task_type: 'admin',
              status: 'completed',
              deadline: days(-3),
              estimated_hours: 2,
              user_id: demoUser.id,
            },
          ];

          await Task.bulkCreate(demoTasks as any);

          // Reset budget data
          const { default: BudgetProject } = await import('../models/BudgetProject.js');
          const { default: BudgetEntry } = await import('../models/BudgetEntry.js');

          await BudgetEntry.destroy({ where: { user_id: demoUser.id } });
          await BudgetProject.destroy({ where: { user_id: demoUser.id } });

          const demoProjects = [
            {
              user_id: demoUser.id,
              name: 'YouTube Channel',
              description:
                'Main content creation expenses and revenue',
              color: '#ff6b6b',
              is_active: true,
              tags: ['content', 'youtube', 'main']
            },
            {
              user_id: demoUser.id,
              name: 'Equipment Fund',
              description:
                'Camera gear and tech equipment purchases',
              color: '#4ecdc4',
              is_active: true,
              tags: ['equipment', 'gear', 'investment']
            },
            {
              user_id: demoUser.id,
              name: 'Business Operations',
              description:
                'General business and operational expenses',
              color: '#45b7d1',
              is_active: true,
              tags: ['business', 'operations', 'overhead']
            }
          ];

          const createdProjects = await BudgetProject.bulkCreate(demoProjects);

          const demoEntries = [
            // Income
            {
              user_id: demoUser.id,
              type: 'income',
              amount: 2500.0,
              category: 'YouTube Revenue',
              description: 'Monthly AdSense revenue',
              date: days(-5),
              project_id: createdProjects[0].id,
              tags: ['adsense', 'monthly', 'recurring']
            },
            {
              user_id: demoUser.id,
              type: 'income',
              amount: 1800.0,
              category: 'Sponsorship',
              description: 'Brand partnership payment',
              date: days(-10),
              project_id: createdProjects[0].id,
              tags: ['sponsorship', 'brand', 'partnership']
            },
            {
              user_id: demoUser.id,
              type: 'income',
              amount: 350.0,
              category: 'Merchandise',
              description: 'T-shirt and sticker sales',
              date: days(-15),
              project_id: createdProjects[0].id,
              tags: ['merchandise', 'merch', 'sales']
            },

            // Expenses
            {
              user_id: demoUser.id,
              type: 'expense',
              amount: 1299.99,
              category: 'Equipment',
              description: 'Sony A7IV Camera Body',
              date: days(-20),
              project_id: createdProjects[1].id,
              receipt_title: 'Sony A7IV Purchase',
              ocr_scanned: true,
              ocr_confidence: 0.95,
              tags: ['camera', 'equipment', 'gear']
            },
            {
              user_id: demoUser.id,
              type: 'expense',
              amount: 89.99,
              category: 'Software',
              description: 'Adobe Creative Suite subscription',
              date: days(-1),
              project_id: createdProjects[2].id,
              tags: ['software', 'subscription', 'monthly']
            },
            {
              user_id: demoUser.id,
              type: 'expense',
              amount: 45.5,
              category: 'Office Supplies',
              description: 'SD cards and batteries',
              date: days(-7),
              project_id: createdProjects[1].id,
              tags: ['supplies', 'accessories', 'gear']
            },
            {
              user_id: demoUser.id,
              type: 'expense',
              amount: 25.0,
              category: 'Transportation',
              description: 'Gas for location shooting',
              date: days(-3),
              project_id: createdProjects[0].id,
              tags: ['gas', 'transportation', 'location']
            }
          ];

          await BudgetEntry.bulkCreate(demoEntries as any);

        } catch (taskTrimErr) {
          console.error('Demo data reset failed:', taskTrimErr);
          // We still continue to log them in
        } finally {
          console.log('Demo login successful for:', demoUser.email);

          res.json({
            message: 'Demo login successful',
            user: {
              id: demoUser.id,
              email: demoUser.email,
              name: demoUser.name,
            },
          });
        }
      })();
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// Custom Demo Login with User-Provided Information
router.post('/custom-demo-login', async (req: Request, res: Response) => {
  // Allow demo login in development OR if ALLOW_DEMO_LOGIN=true
  const isDemoAllowed =
    process.env.NODE_ENV === 'development' ||
    process.env.ALLOW_DEMO_LOGIN === 'true';

  if (!isDemoAllowed) {
    return res.status(403).json({ error: 'Demo login disabled' });
  }

  try {
    const { firstName, lastName, email, twitchUsername } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Lazy-import models
    const { User } = await import('../models/User.js');

    // Create a temporary demo user with the provided information
    const demoUser = await User.findOrCreate({
      where: { email: email },
      defaults: {
        name: `${firstName} ${lastName}`,
        email: email,
        google_id: `demo_${Date.now()}` // Unique demo ID
      }
    });

    // Log in the user and set up demo data
    req.logIn(demoUser[0], (err) => {
      if (err) {
        console.error('Custom demo login error:', err);
        return res.status(500).json({ error: 'Demo login failed' });
      }

      // Set up streamer-focused demo data
      (async () => {
        try {
          const { Task } = await import('../models/Task.js');
          const { BudgetProject } = await import('../models/BudgetProject.js');
          const { BudgetEntry } = await import('../models/BudgetEntry.js');

          // Clear existing data for this user
          await Task.destroy({ where: { user_id: demoUser[0].id } });
          await BudgetEntry.destroy({ where: { user_id: demoUser[0].id } });
          await BudgetProject.destroy({ where: { user_id: demoUser[0].id } });

          const now = Date.now();
          const days = (n: number) => new Date(now + n * 24 * 60 * 60 * 1000);

          // Streamer-focused demo tasks
          const streamerTasks = [
            {
              user_id: demoUser[0].id,
              title: 'Welcome to StreamScene!',
              description: 'You\'re a Twitch Affiliate working towards Partner status. Use StreamScene to manage your streaming schedule, content creation, and collaborations. Start by exploring the Weekly Planner to organize your streaming sessions.',
              dueDate: days(0),
              priority: 'high',
              status: 'pending',
              tags: ['welcome', 'getting-started']
            },
            {
              user_id: demoUser[0].id,
              title: 'Plan This Week\'s Streaming Schedule',
              description: 'Schedule your streaming sessions for the week. Aim for consistent times to build viewer expectations. Consider variety content, Just Chatting sessions, and your main game category.',
              dueDate: days(1),
              priority: 'high',
              status: 'pending',
              tags: ['streaming', 'schedule', 'consistency']
            },
            {
              user_id: demoUser[0].id,
              title: 'Brainstorm Content Ideas for Next Month',
              description: 'Plan content themes, special events, collaborations, and community challenges. Consider trending games, seasonal events, and viewer suggestions for engaging content.',
              dueDate: days(2),
              priority: 'medium',
              status: 'pending',
              tags: ['content', 'brainstorming', 'planning']
            },
            {
              user_id: demoUser[0].id,
              title: 'Research New Background Frame Design',
              description: 'Design a new stream overlay and background frame that matches your brand. Consider using the Project Center to collaborate with designers or get feedback from your community.',
              dueDate: days(3),
              priority: 'medium',
              status: 'pending',
              tags: ['design', 'branding', 'overlay']
            },
            {
              user_id: demoUser[0].id,
              title: 'Update Channel Panels and About Section',
              description: 'Refresh your Twitch panels with current information, social links, and streaming schedule. Make sure your brand message is clear for new viewers.',
              dueDate: days(4),
              priority: 'low',
              status: 'pending',
              tags: ['twitch', 'panels', 'branding']
            },
            {
              user_id: demoUser[0].id,
              title: 'Plan Collaboration Stream with Other Creators',
              description: 'Reach out to other streamers for collaboration opportunities. Use the Project Center to coordinate timing, games, and shared promotion strategies.',
              dueDate: days(5),
              priority: 'medium',
              status: 'pending',
              tags: ['collaboration', 'networking', 'community']
            },
            {
              user_id: demoUser[0].id,
              title: 'Track Streaming Equipment Budget',
              description: 'Review your equipment needs and budget for upgrades. Consider webcam, microphone, lighting, or PC improvements to enhance stream quality.',
              dueDate: days(6),
              priority: 'low',
              status: 'pending',
              tags: ['equipment', 'budget', 'quality']
            },
            {
              user_id: demoUser[0].id,
              title: 'Analyze Last Month\'s Streaming Analytics',
              description: 'Review your Twitch analytics, subscriber growth, and engagement metrics. Identify your best performing content and optimal streaming times.',
              dueDate: days(7),
              priority: 'medium',
              status: 'pending',
              tags: ['analytics', 'growth', 'metrics']
            }
          ];

          await Task.bulkCreate(streamerTasks as any);

          // Streamer-focused budget projects
          const streamerProjects = [
            {
              user_id: demoUser[0].id,
              name: 'Streaming Revenue',
              description: 'Track income from Twitch subscriptions, donations, bits, and sponsorships',
              color: '#9146ff',
              is_active: true,
              tags: ['income', 'twitch', 'revenue']
            },
            {
              user_id: demoUser[0].id,
              name: 'Equipment & Setup',
              description: 'Camera, microphone, lighting, and PC hardware investments',
              color: '#ff6b6b',
              is_active: true,
              tags: ['equipment', 'hardware', 'investment']
            },
            {
              user_id: demoUser[0].id,
              name: 'Content Creation',
              description: 'Software, games, assets, and tools for content creation',
              color: '#4ecdc4',
              is_active: true,
              tags: ['content', 'software', 'games']
            },
            {
              user_id: demoUser[0].id,
              name: 'Marketing & Growth',
              description: 'Promotion, networking events, and community building expenses',
              color: '#45b7d1',
              is_active: true,
              tags: ['marketing', 'growth', 'networking']
            }
          ];

          const createdProjects = await BudgetProject.bulkCreate(streamerProjects);

          // Realistic streamer budget entries
          const streamerBudgetEntries = [
            // Income entries
            {
              user_id: demoUser[0].id,
              type: 'income',
              amount: 450.0,
              category: 'Twitch Subscriptions',
              description: 'Monthly subscriber revenue (Tier 1, 2, 3)',
              date: days(-5),
              project_id: createdProjects[0].id,
              tags: ['subscriptions', 'recurring', 'twitch']
            },
            {
              user_id: demoUser[0].id,
              type: 'income',
              amount: 180.0,
              category: 'Donations & Bits',
              description: 'Viewer donations and bit contributions',
              date: days(-3),
              project_id: createdProjects[0].id,
              tags: ['donations', 'bits', 'community']
            },
            {
              user_id: demoUser[0].id,
              type: 'income',
              amount: 300.0,
              category: 'Sponsorship',
              description: 'Gaming peripheral brand partnership',
              date: days(-10),
              project_id: createdProjects[0].id,
              tags: ['sponsorship', 'brand', 'gaming']
            },
            // Equipment expenses
            {
              user_id: demoUser[0].id,
              type: 'expense',
              amount: -250.0,
              category: 'Webcam Upgrade',
              description: 'Logitech Brio 4K webcam for better stream quality',
              date: days(-15),
              project_id: createdProjects[1].id,
              tags: ['webcam', 'quality', 'upgrade']
            },
            {
              user_id: demoUser[0].id,
              type: 'expense',
              amount: -180.0,
              category: 'Microphone',
              description: 'Audio-Technica AT2020USB+ for clearer audio',
              date: days(-20),
              project_id: createdProjects[1].id,
              tags: ['microphone', 'audio', 'quality']
            },
            // Content creation expenses
            {
              user_id: demoUser[0].id,
              type: 'expense',
              amount: -60.0,
              category: 'New Game Purchase',
              description: 'Latest AAA game for variety content',
              date: days(-7),
              project_id: createdProjects[2].id,
              tags: ['games', 'content', 'variety']
            },
            {
              user_id: demoUser[0].id,
              type: 'expense',
              amount: -25.0,
              category: 'Stream Assets',
              description: 'Custom emotes and overlay graphics',
              date: days(-12),
              project_id: createdProjects[2].id,
              tags: ['graphics', 'emotes', 'branding']
            },
            // Marketing expenses
            {
              user_id: demoUser[0].id,
              type: 'expense',
              amount: -40.0,
              category: 'Networking Event',
              description: 'Local gaming/content creator meetup',
              date: days(-8),
              project_id: createdProjects[3].id,
              tags: ['networking', 'community', 'events']
            }
          ];

          await BudgetEntry.bulkCreate(streamerBudgetEntries as any);

        } catch (error) {
          console.error('Demo data setup failed:', error);
          // Continue with login even if data setup fails
        } finally {
          console.log('Custom demo login successful for:', demoUser[0].email);

          res.json({
            message: 'Demo login successful',
            user: {
              id: demoUser[0].id,
              email: demoUser[0].email,
              name: demoUser[0].name,
            },
          });
        }
      })();
    });
  } catch (error) {
    console.error('Custom demo login error:', error);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// ──────────────────────────────────────────
// CURRENT USER
// ─────────────────────────────────────────-

router.get('/user', (req: Request, res: Response) => {
  let userData = null;

  if (req.user) {
    const user = req.user as any;
    userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName || user.name?.split(' ')[0] || '',
      lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
      google_id: user.google_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
      threadsConnected: !!req.session?.threadsAuth,
      threadsUsername: req.session?.threadsAuth?.username || null,
    };
  }

  const responseData = {
    authenticated: !!req.user,
    user: userData,
    threadsAuth: req.session?.threadsAuth
      ? {
          connected: true,
          username: req.session.threadsAuth.username,
          userId: req.session.threadsAuth.userId,
        }
      : {
          connected: false,
        },
    debug: {
      sessionId: req.sessionID,
      hasSession: !!req.session,
      hasUser: !!req.user,
      hasThreads: !!req.session?.threadsAuth,
    },
  };

  res.json(responseData);
});

// ──────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────-

router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Session cleanup failed' });
      }

      res.clearCookie('connect.sid');
      res.clearCookie('streamscene.sid');
      console.log('Logout successful');

      res.json({ message: 'Logged out successfully' });
    });
  });
});

// Threads OAuth Routes
router.get('/threads', async (req: Request, res: Response) => {
  try {
    const { initiateThreadsAuth } = await import('../services/threadsOAuth.js');
    const authUrl = await initiateThreadsAuth();
    
    // Store state in session for verification
    req.session.threadsAuthState = 'initiated';
    
    // Set CSP-friendly headers for Meta OAuth redirect
    res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline' *.facebook.com *.meta.com *.threads.net; object-src 'none'; base-uri 'self';");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    res.redirect(authUrl);
  } catch (error) {
    console.error('Threads auth initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate Threads authentication' });
  }
});

router.get('/threads/callback', async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      console.error('Threads OAuth error:', error);
      return res.send(`
        <html>
          <head><title>Threads Auth</title></head>
          <body>
            <script>
              window.opener?.postMessage({ type: 'threads-auth-error', error: '${error}' }, '*');
              window.close();
            </script>
            <p>Authentication failed. You can close this window.</p>
          </body>
        </html>
      `);
    }
    
    if (!code || typeof code !== 'string') {
      return res.send(`
        <html>
          <head><title>Threads Auth</title></head>
          <body>
            <script>
              window.opener?.postMessage({ type: 'threads-auth-error', error: 'missing_auth_code' }, '*');
              window.close();
            </script>
            <p>Missing authorization code. You can close this window.</p>
          </body>
        </html>
      `);
    }
    
    const { handleThreadsCallback } = await import('../services/threadsOAuth.js');
    const result = await handleThreadsCallback(code);
    
    // Store in session
    req.session.threadsAuth = {
      accessToken: result.accessToken,
      userId: result.userId,
      username: result.username,
      expiresAt: result.expiresAt
    };
    
    // Redirect back to dashboard with success message
    res.redirect('/?threads_connected=true&username=' + encodeURIComponent(result.username));
  } catch (error) {
    console.error('Threads callback error:', error);
    res.redirect('/?error=threads_auth_failed');
  }
});

router.get('/threads/status', (req: Request, res: Response) => {
  const isConnected = !!req.session?.threadsAuth;
  const username = req.session?.threadsAuth?.username || null;
  
  res.json({
    connected: isConnected,
    username: username,
    expiresAt: req.session?.threadsAuth?.expiresAt || null
  });
});

// Disconnect Threads
router.post('/threads/disconnect', (req: Request, res: Response) => {
  if (req.session?.threadsAuth) {
    delete req.session.threadsAuth;
  }
  
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to disconnect' });
    }
    res.json({ success: true });
  });
});

export default router;
