const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');
const { promisify } = require('util');

let db = null;

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const initDatabase = async () => {
  if (db) return db;

  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err);
        reject(err);
        return;
      }
      console.log('SQLite 数据库连接成功');

      db.serialize(() => {
        db.run('PRAGMA journal_mode = WAL');
        db.run('PRAGMA synchronous = NORMAL');
        db.run('PRAGMA foreign_keys = ON');
      });

      db.allAsync = promisify(db.all.bind(db));
      db.getAsync = promisify(db.get.bind(db));
      db.runAsync = promisify(db.run.bind(db));
      db.execAsync = function(sql) {
        return new Promise((resolve, reject) => {
          this.exec(sql, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      };

      resolve(db);
    });
  });
};

const getDb = () => db;

module.exports = {
  initDatabase,
  getDb
};
