import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';

const router = express.Router();

// Test route
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Auth routes are working!' });
});

// Extend Request interface to include user
declare global {
  namespace Express {
    interface User {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      googleId?: string;
      profilePicture?: string;
    }
  }
}

// Initiate Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
<<<<<<< HEAD
<<<<<<< HEAD
router.get(
 '/google/callback',
 passport.authenticate('google', { failureRedirect: 'http://localhost:8000/?error=auth_failed' }),
 (req: Request, res: Response) => {
   res.redirect('http://localhost:8000/');
 }
=======
=======
>>>>>>> 741fab68 (fixed google OAuth authentication -Fixed Express Version Conflict, Changed GoogleLoginButton with styling, set up different routes for auth/google in cloud console, cleaned up conflicting server files, updated landing page to use new button)
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
=======
router.get(
<<<<<<< HEAD
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
>>>>>>> 9a9e39ee (fixed google OAuth authentication -Fixed Express Version Conflict, Changed GoogleLoginButton with styling, set up different routes for auth/google in cloud console, cleaned up conflicting server files, updated landing page to use new button)
  (req: Request, res: Response) => {
    res.redirect('/dashboard');
  }
<<<<<<< HEAD
>>>>>>> 9bcdc5cd (Fix/ Client AND server both run on port 8000)
=======
=======
 '/google/callback',
 passport.authenticate('google', { failureRedirect: 'http://localhost:8000/?error=auth_failed' }),
 (req: Request, res: Response) => {
   res.redirect('http://localhost:8000/');
 }
>>>>>>> 2b3d98b8 (fixed oauth callback)
>>>>>>> afead569 (fixed oauth callback)
);

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
// Get current authenticated user
=======
=======
>>>>>>> 741fab68 (fixed google OAuth authentication -Fixed Express Version Conflict, Changed GoogleLoginButton with styling, set up different routes for auth/google in cloud console, cleaned up conflicting server files, updated landing page to use new button)
=======
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
// Logout route
router.get('/logout', (req: Request, res: Response, next: NextFunction) => {
<<<<<<< HEAD
  try {
    req.logout((err) => {
=======
  req.logout((err) => {
>>>>>>> 118d8902 (Fix/ Delete src folder and moved all relevent files to server folder)
    if (err) {
      return next(err);
    }
    res.redirect('http://localhost:8000'); // frontend home
  });
});

// Check if user is authenticated
router.get('/user', (req: Request, res: Response) => {
  if (req.isAuthenticated() && req.user) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        profilePicture: req.user.profilePicture,
      },
    });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;



<<<<<<< HEAD
// Check if user is authenticated
>>>>>>> a80da8cd (Fix/ fixing server paths (rebase))
router.get('/user', (req: Request, res: Response) => {
  console.log('Auth check - Session ID:', req.sessionID);
  console.log('Auth check - User:', req.user);
  console.log('Auth check - Session:', req.session);
  
  if (req.user) {
    res.json({
      authenticated: true,
      user: req.user
    });
  } else {
    res.json({
      authenticated: false,
      user: null
    });
  }
});

<<<<<<< HEAD
// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;
=======
=======

<<<<<<< HEAD
>>>>>>> 9c0bfed6 (fix: resolve merge conflict in auth.ts and finalize correct redirect port)
<<<<<<< HEAD
export default router;
=======
export default router;
>>>>>>> 118d8902 (Fix/ Delete src folder and moved all relevent files to server folder)
<<<<<<< HEAD
>>>>>>> a80da8cd (Fix/ fixing server paths (rebase))
=======
=======


>>>>>>> 7ef24648 (fix: resolve merge conflict in auth.ts and finalize correct redirect port)
<<<<<<< HEAD
>>>>>>> 9c0bfed6 (fix: resolve merge conflict in auth.ts and finalize correct redirect port)
=======
=======
export default router;
>>>>>>> 9a9e39ee (fixed google OAuth authentication -Fixed Express Version Conflict, Changed GoogleLoginButton with styling, set up different routes for auth/google in cloud console, cleaned up conflicting server files, updated landing page to use new button)
<<<<<<< HEAD
>>>>>>> 741fab68 (fixed google OAuth authentication -Fixed Express Version Conflict, Changed GoogleLoginButton with styling, set up different routes for auth/google in cloud console, cleaned up conflicting server files, updated landing page to use new button)
=======
=======
// Get current authenticated user
router.get('/user', (req: Request, res: Response) => {
  console.log('Auth check - Session ID:', req.sessionID);
  console.log('Auth check - User:', req.user);
  console.log('Auth check - Session:', req.session);
  
  if (req.user) {
    res.json({
      authenticated: true,
      user: req.user
    });
  } else {
    res.json({
      authenticated: false,
      user: null
    });
  }
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;
>>>>>>> 4bdea172 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
>>>>>>> a2852ee5 (Add/ uploaded file model, uploaded file route, frontend file service to communicate with the backend. File upload now retrieves previously uploaded files. Associates files with logged-in user)
