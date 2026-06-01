const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath, { verbose: console.log });

module.exports = db;