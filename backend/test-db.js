const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
console.log('DB Path:', dbPath);

const db = new sqlite3.Database(dbPath);

db.all(`
  SELECT v.*, u.nickname
  FROM videos v
  LEFT JOIN users u ON v.user_id = u.id
  WHERE v.status = 1 AND (v.title LIKE ? OR v.description LIKE ?)
  LIMIT 5
`, ['%美食%', '%美食%'], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Results:', rows);
  }
  db.close();
});
