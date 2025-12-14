import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sequelize from './src/db/db.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - prioritize current working directory (where PM2 runs from)
const envPaths = [
  path.resolve(process.cwd(), '.env'),     // Current working directory (PM2 working dir)
  path.resolve(__dirname, '../.env'),     // Parent directory (for dev when in server/ folder)
  path.resolve(__dirname, '.env'),        // Same directory as server (fallback)
];

console.log('=== Environment Debug Info ===');
console.log('process.cwd():', process.cwd());
console.log('__dirname:', __dirname);

let envLoaded = false;
for (const envPath of envPaths) {
  console.log(`Checking for .env at: ${envPath}`);
  if (fs.existsSync(envPath)) {
    console.log(`Found .env file at: ${envPath}`);
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
  console.log('DB_PASS:', process.env.DB_PASS ? 'Set (***MASKED***)' : 'Not set');
}
console.log('=== End Environment Debug ===');

// Import the full app with all routes and middleware
import app from './app.js';
import { syncDB } from "./db/index.js";

const PORT = Number(process.env.PORT) || 8000;
const HOST = '0.0.0.0';

// Boot up the DB and server
const startServer = async () => {
  try {
    console.log("Before syncDB");
    await syncDB();
    console.log('Connected to DB');

    app.listen(PORT, HOST, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`External access: http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to DB:', err);
    process.exit(1);
  }
};

console.log("=== SERVER ENTRY ===");

startServer();
