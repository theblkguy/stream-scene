import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './src/db/db.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.json());

// Test route
app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    message: 'StreamScene API healthy',
    ts: new Date().toISOString(),
  });
});

// Boot up the DB and server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error(' Failed to connect to DB:', err);
  }
};

startServer();
