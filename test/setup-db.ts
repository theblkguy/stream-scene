// test/setup-db.ts
// Standalone script to set up test database

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set environment
process.env.NODE_ENV = 'test';

// Load test environment
const testEnvPath = path.resolve(__dirname, '..', '.env.test');
dotenv.config({ path: testEnvPath, override: true });

// Import and run database setup
import { initTestDatabase, dropTestDatabase } from './config/database.js';

async function main() {
  const command = process.argv[2];
  
  try {
    if (command === 'drop') {
      console.log('🗑️  Dropping test database...');
      await dropTestDatabase();
      console.log('✅ Test database dropped');
    } else if (command === 'init') {
      console.log('🚀 Initializing test database...');
      await initTestDatabase();
      console.log('✅ Test database initialized');
    } else {
      console.log('Usage:');
      console.log('  npm run test:setup init  - Initialize test database');
      console.log('  npm run test:setup drop  - Drop test database');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

