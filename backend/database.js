const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/game.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)
`);

function submitScore(playerName, score, level) {
  const stmt = db.prepare('INSERT INTO scores (player_name, score, level) VALUES (?, ?, ?)');
  const result = stmt.run(playerName, score, level);
  return { id: result.lastInsertRowid, playerName, score, level };
}

function getLeaderboard(limit = 50) {
  const stmt = db.prepare(`
    SELECT player_name, score, level, created_at,
           (SELECT COUNT(*) + 1 FROM scores s2 WHERE s2.score > s1.score) as rank
    FROM scores s1
    ORDER BY score DESC, created_at ASC
    LIMIT ?
  `);
  return stmt.all(limit);
}

function getPlayerRank(score) {
  const stmt = db.prepare(`
    SELECT COUNT(*) + 1 as rank
    FROM scores
    WHERE score > ?
  `);
  const result = stmt.get(score);
  return result ? result.rank : 1;
}

module.exports = {
  submitScore,
  getLeaderboard,
  getPlayerRank,
  db
};
