const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/app.sqlite');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Database file deleted');
}

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Data directory created');
}

console.log('Clean complete, ready for re-init');
