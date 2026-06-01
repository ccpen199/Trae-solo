import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database opening error:', err);
  } else {
    console.log('Connected to SQLite database');
    initTables();
  }
});

function initTables() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS dishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        target_audience TEXT,
        flavor_direction TEXT,
        price_range_min REAL,
        price_range_max REAL,
        rnd_owner TEXT,
        expected_margin REAL,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        price_per_unit REAL NOT NULL,
        loss_rate REAL DEFAULT 0,
        calories_per_unit REAL DEFAULT 0,
        protein_per_unit REAL DEFAULT 0,
        fat_per_unit REAL DEFAULT 0,
        carbs_per_unit REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS trial_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dish_id INTEGER NOT NULL,
        version TEXT NOT NULL,
        recipe TEXT,
        process_steps TEXT,
        photos TEXT,
        taste_score REAL,
        feedback TEXT,
        is_official INTEGER DEFAULT 0,
        approved_by TEXT,
        approved_at DATETIME,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dish_id) REFERENCES dishes(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS recipe_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trial_version_id INTEGER NOT NULL,
        ingredient_id INTEGER NOT NULL,
        quantity REAL NOT NULL,
        FOREIGN KEY (trial_version_id) REFERENCES trial_versions(id),
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS launch_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dish_id INTEGER NOT NULL,
        store_scope TEXT,
        training_materials TEXT,
        material_prep TEXT,
        launch_date DATE,
        status TEXT DEFAULT 'planning',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dish_id) REFERENCES dishes(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS store_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dish_id INTEGER NOT NULL,
        store_id TEXT,
        sales_volume REAL,
        customer_feedback TEXT,
        issues TEXT,
        feedback_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dish_id) REFERENCES dishes(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS acceptance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dish_id INTEGER NOT NULL,
        recipe_version_verified INTEGER DEFAULT 0,
        cost_stability_verified INTEGER DEFAULT 0,
        taste_pass_rate REAL,
        trial_sales_result TEXT,
        shelf_status TEXT,
        reviewer TEXT,
        review_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dish_id) REFERENCES dishes(id)
      )
    `);

    const stmt = db.prepare('SELECT COUNT(*) as count FROM ingredients');
    stmt.get((err, row) => {
      if (row.count === 0) {
        const defaultIngredients = [
          ['鸡胸肉', 'kg', 25, 0.1, 165, 31, 3.6, 0],
          ['猪肉', 'kg', 35, 0.15, 242, 27, 14, 0],
          ['鸡蛋', '个', 1.5, 0.02, 78, 6, 5, 0.6],
          ['大米', 'kg', 6, 0.05, 365, 7, 0.8, 77],
          ['青菜', 'kg', 8, 0.2, 25, 2.6, 0.3, 3.6],
          ['生抽', 'ml', 0.02, 0, 53, 8, 0.3, 5],
          ['食用油', 'ml', 0.015, 0, 884, 0, 100, 0],
          ['食盐', 'g', 0.005, 0, 0, 0, 0, 0],
        ];
        const prep = db.prepare('INSERT INTO ingredients (name, unit, price_per_unit, loss_rate, calories_per_unit, protein_per_unit, fat_per_unit, carbs_per_unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        defaultIngredients.forEach(ing => prep.run(ing));
        prep.finalize();
      }
    });
  });
}

export default db;
