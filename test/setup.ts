// test/setup.ts
// Test environment setup and configuration

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set test environment FIRST
process.env.NODE_ENV = 'test';

// Load test environment variables
const testEnvPath = path.resolve(__dirname, '..', '.env.test');
if (fs.existsSync(testEnvPath)) {
  dotenv.config({ path: testEnvPath, override: true });
  console.log('✅ Loaded .env.test configuration');
} else {
  // Fallback to main .env if test env doesn't exist
  console.warn('⚠️  .env.test not found, using default .env');
  dotenv.config();
}

// Ensure NODE_ENV is set to test
process.env.NODE_ENV = 'test';

// Configure test timeout
if (typeof global !== 'undefined') {
  (global as any).testTimeout = 30000; // Increased timeout for database operations
}

// Initialize test database before running tests
let dbInitialized = false;

export const ensureTestDatabase = async (): Promise<void> => {
  if (dbInitialized) return;
  
  try {
    // SQLite is used by default for tests (no setup required!)
    // If USE_SQLITE_FOR_TESTS=false, it will use MySQL instead
    const { initTestDatabase } = await import('./config/database.js');
    await initTestDatabase();
    dbInitialized = true;
  } catch (error: any) {
    // Only show MySQL-specific errors if SQLite isn't being used
    if (process.env.USE_SQLITE_FOR_TESTS === 'false') {
      if (error?.code === 'ER_ACCESS_DENIED_ERROR' || error?.name === 'SequelizeAccessDeniedError') {
        console.error('\n⚠️  TEST DATABASE SETUP REQUIRED');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('MySQL connection failed. Options:');
        console.error('');
        console.error('Option 1 (Recommended): Use SQLite (no setup needed)');
        console.error('   Tests use SQLite in-memory database by default');
        console.error('   Just run: npm test');
        console.error('');
        console.error('Option 2: Use MySQL');
        console.error('   1. Create database: mysql -u root -p');
        console.error('   2. Update .env.test with credentials');
        console.error('   3. Set USE_SQLITE_FOR_TESTS=false');
        console.error('═══════════════════════════════════════════════════════════\n');
      }
    }
    throw error;
  }
};

// Import test helpers
export * from './helpers/testHelpers.js';
export * from './helpers/authHelpers.js';

