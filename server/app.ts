import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - try multiple locations
const envPaths = [
  path.resolve(process.cwd(), '.env'),     // Current working directory
  path.resolve(__dirname, '.env'),        // Same directory as server
  path.resolve(__dirname, '../.env'),     // Parent directory (for dev)
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment from: ${envPath}`);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('No .env file found in any of the expected locations:', envPaths);
} else {
  console.log('Environment variables loaded. DB_HOST:', process.env.DB_HOST ? 'Set' : 'Not set');
  console.log('Environment variables loaded. DB_USER:', process.env.DB_USER ? 'Set' : 'Not set');
}

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

// Serve static files from public directory
// Dynamically determine the correct path based on deployment structure
const isDeployment = process.env.NODE_ENV === 'production';
const publicPath = isDeployment 
  ? path.join(__dirname, './public')      // For deployment: server files are in root, public is ./public
  : path.join(__dirname, '../public');   // For local dev: server -> ../public

console.log('Static files path:', publicPath);
console.log('Current __dirname:', __dirname);
console.log('Is deployment:', isDeployment);
console.log('Files in public directory:', fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : 'Directory does not exist');

app.use(express.static(publicPath));

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
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(404).json({ error: 'Route not found' });
  }

  // Dynamically determine the correct path for index.html
  const isDeployment = process.env.NODE_ENV === 'production';
  const indexPath = isDeployment 
    ? path.join(__dirname, './public/index.html')     // For deployment: ./public/index.html
    : path.join(__dirname, '../public/index.html');  // For local dev: ../public/index.html
  
  console.log('Looking for index.html at:', indexPath);
  console.log('File exists:', fs.existsSync(indexPath));
  
  if (!fs.existsSync(indexPath)) {
    console.error('index.html file not found at:', indexPath);
    // Let's also check alternative paths for debugging
    const altPath1 = path.join(__dirname, './public/index.html');
    const altPath2 = path.join(__dirname, '../public/index.html');
    const altPath3 = path.join(__dirname, '../../public/index.html');
    console.log('Alternative path 1 (./public/index.html):', fs.existsSync(altPath1));
    console.log('Alternative path 2 (../public/index.html):', fs.existsSync(altPath2));
    console.log('Alternative path 3 (../../public/index.html):', fs.existsSync(altPath3));
    return res.status(404).send('index.html file not found');
  }
  
  res.sendFile(indexPath);
});

const PORT = Number(process.env.PORT) || 8000;
const HOST = '0.0.0.0'; 

// Initialize database
syncDB().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`External access: http://${HOST}:${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

export default app;