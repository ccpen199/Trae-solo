const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
require('dotenv').config();

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'database.json');

const defaultData = {
  users: [],
  categories: [],
  weightTags: [],
  contents: [],
  userProfiles: [],
  recommendationRecords: [],
  advertisers: [],
  campaigns: [],
  adMaterials: [],
  adDeliveries: [],
  interactions: [],
  comments: [],
  contentLikes: [],
  contentCollects: [],
  negativeFeedbacks: [],
  dailyStats: [],
  retentionStats: [],
  auditLogs: [],
  adReconciliations: []
};

let db = null;

async function initDatabase() {
  if (db) return db;
  
  const adapter = new JSONFile(DB_PATH);
  db = new Low(adapter, defaultData);
  
  await db.read();
  
  if (!db.data || Object.keys(db.data).length === 0) {
    db.data = { ...defaultData };
    await db.write();
  }
  
  console.log(`数据库已初始化: ${DB_PATH}`);
  return db;
}

async function getDb() {
  if (!db) {
    await initDatabase();
  }
  return db;
}

module.exports = {
  initDatabase,
  getDb
};
