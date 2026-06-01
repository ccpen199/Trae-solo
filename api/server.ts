/**
 * local server entry file, for local development
 */
import app from './app.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { runMigrations } from './src/config/database.js';
import { seedDatabase } from './src/data/seed.js';

dotenv.config();

const HOST = process.env.HOST || '127.0.0.1';
const PORT = parseInt(process.env.BACKEND_PORT || '58777');

console.log('Initializing database...');
runMigrations();

console.log('Seeding database...');
seedDatabase();

const server = app.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`);
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;