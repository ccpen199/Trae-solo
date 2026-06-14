process.stdout.write('Testing require of db.js... ');
try {
  const { db } = require('./db');
  process.stdout.write('OK\n');
  process.stdout.write('Testing database connection... ');
  db.prepare('SELECT 1').get();
  process.stdout.write('OK\n');
  
  process.stdout.write('Testing auth middleware... ');
  require('./middleware/auth');
  process.stdout.write('OK\n');
  
  process.stdout.write('Testing routes... ');
  require('./routes/auth');
  require('./routes/farmers');
  require('./routes/finance');
  require('./routes/village');
  require('./routes/sunshine');
  require('./routes/admin');
  process.stdout.write('OK\n');
  
  process.stdout.write('Testing express app... ');
  const express = require('express');
  const app = express();
  process.stdout.write('OK\n');
  
  process.stdout.write('\nAll tests passed!\n');
  process.exit(0);
} catch (err) {
  process.stdout.write('FAILED\n');
  process.stdout.write('Error: ' + err.message + '\n');
  process.stdout.write('Stack: ' + err.stack + '\n');
  process.exit(1);
}
