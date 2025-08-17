import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug: Show current working directory and file structure
console.log('=== Environment Debug Info ===');
console.log('process.cwd():', process.cwd());
console.log('__dirname:', __dirname);
console.log('__filename:', __filename);

//small change
// List files in current working directory
try {
  console.log('Files in process.cwd():', fs.readdirSync(process.cwd()));
} catch (err) {
  console.log('Could not read process.cwd():', (err as Error).message);
}

// List files in __dirname
try {
  console.log('Files in __dirname:', fs.readdirSync(__dirname));
} catch (err) {
  console.log('Could not read __dirname:', (err as Error).message);
}

// Load environment variables - prioritize current working directory (where PM2 runs from)
const envPaths = [
  path.resolve(process.cwd(), '.env'),     // Current working directory (PM2 working dir)
  path.resolve(__dirname, '../.env'),     // Parent directory (for dev when in server/ folder)
  path.resolve(__dirname, '.env'),        // Same directory as server (fallback)
];

let envLoaded = false;
for (const envPath of envPaths) {
  console.log(`Checking for .env at: ${envPath}`);
  if (fs.existsSync(envPath)) {
    console.log(`Found .env file at: ${envPath}`);
    // Show file contents (first few lines only, masked)
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n').slice(0, 5);
      console.log('First few lines of .env file:');
      lines.forEach((line, i) => {
        if (line.trim()) {
          const [key] = line.split('=');
          console.log(`  ${i + 1}: ${key}=***MASKED***`);
        }
      });
    } catch (err) {
      console.log('Could not read .env file:', (err as Error).message);
    }
    
    console.log(`Loading environment variables from: ${envPath}`);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  } else {
    console.log(`No .env file found at: ${envPath}`);
  }
}

if (!envLoaded) {
  console.warn('No .env file found in any of the expected locations:', envPaths);
} else {
  console.log('✅ Environment variables loaded successfully!');
  console.log('DB_HOST:', process.env.DB_HOST ? `Set (${process.env.DB_HOST})` : 'Not set');
  console.log('DB_USER:', process.env.DB_USER ? `Set (${process.env.DB_USER})` : 'Not set');
  console.log('DB_NAME:', process.env.DB_NAME ? `Set (${process.env.DB_NAME})` : 'Not set');
  console.log('DB_PASS:', process.env.DB_PASS ? 'Set (***MASKED***)' : 'Not set');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
  console.log('PORT:', process.env.PORT || 'Not set');
}
console.log('=== End Environment Debug ===');

import express from "express";
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import "./config/passport.js";
import authRoutes from "./routes/auth.js";
import routes from "./routes/index.js";
import aiRoutes from "./routes/ai.js";
import scheduleRoutes from "./routes/schedule.js";
import s3ProxyRoutes from "./routes/s3Proxy.js";
import filesRoutes from "./routes/files.js";
import sharesRoutes from "./routes/shares.js";
import budgetRoutes from './routes/budget.js';
import socialAuthRoutes from './routes/socialAuth.js';
import threadsRoutes from './routes/threads.js';
import { syncDB } from "./db/index.js";
import captionRouter from './routes/caption.js';


const app = express();

// CORS configuration
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow same domain for deployed environments
    const currentHost = process.env.HOST || 'localhost';
    if (origin.includes(currentHost)) {
      return callback(null, true);
    }
    
    // Reject all others
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true // Allow cookies to be sent
}));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (REQUIRED for Google OAuth AND Threads OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware 
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from dist directory (where webpack builds frontend)
// Always serve static files from dist directory
const staticPath = path.join(__dirname, '../../dist');
console.log('Static files path:', staticPath);

// Debug: log all requests before static middleware
app.use((req, res, next) => {
  console.log(`[STATIC DEBUG] Incoming request: ${req.method} ${req.path}`);
  next();
});

app.use(express.static(staticPath));

// Debug: log if static middleware did NOT handle the request
app.use((req, res, next) => {
  console.log(`[STATIC DEBUG] Not handled by static: ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/auth', socialAuthRoutes);  // Add social auth routes (Threads OAuth)
app.use('/', routes);
app.use('/api/ai', aiRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/s3', s3ProxyRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/shares', sharesRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/threads', threadsRoutes);  // Add Threads API routes
app.use('/api/caption', captionRouter);


// API test route
app.get('/test-server', (req, res) => {
  res.json({ message: 'Server is working!' });
});


app.get('*', (req, res) => {
  // Only serve index.html for requests that do NOT contain a dot (i.e., not for static files)
  if (req.path.includes('.')) {
    return res.status(404).json({ error: 'Route not found' });
  }

  // Always serve index.html from the staticPath (dist directory)
  const indexPath = path.join(staticPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('index.html file not found at:', indexPath);
    return res.status(404).send('index.html file not found');
  }
  res.sendFile(indexPath);
});


app.listen(Number(process.env.PORT), process.env.HOST || '0.0.0.0', () => {
  console.log(`Server listening on ${process.env.HOST || '0.0.0.0'}:${process.env.PORT}`);
});

export default app;