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
      username: user.username,
      bio: user.bio,
      profilePicture: user.profile_picture_url,
      contactEmail: user.contact_email,
      phone: user.phone,
      socialLinks: user.socialLinks || (user.social_links ? JSON.parse(user.social_links) : undefined),
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
