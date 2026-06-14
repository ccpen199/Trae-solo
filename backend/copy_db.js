const Database = require('better-sqlite3');
const path = require('path');

const sourceDBPath = path.resolve(__dirname, './data/app.sqlite');
const targetDBPath = path.resolve(__dirname, '../data/app.sqlite');

console.log('Source DB:', sourceDBPath);
console.log('Target DB:', targetDBPath);

const sourceDB = new Database(sourceDBPath, { readonly: true });
const targetDB = new Database(targetDBPath);

try {
  const tables = sourceDB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  
  for (const table of tables) {
    const tableName = table.name;
    console.log(`\nProcessing table: ${tableName}`);
    
    try {
      const count = sourceDB.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`  Source records: ${count.count}`);
      
      if (count.count > 0) {
        const targetCount = targetDB.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
        console.log(`  Target records before: ${targetCount.count}`);
        
        const columns = sourceDB.prepare(`PRAGMA table_info(${tableName})`).all();
        const columnNames = columns.map(c => c.name).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        
        const rows = sourceDB.prepare(`SELECT * FROM ${tableName}`).all();
        
        const insertStmt = targetDB.prepare(`INSERT OR REPLACE INTO ${tableName} (${columnNames}) VALUES (${placeholders})`);
        
        const transaction = targetDB.transaction(() => {
          for (const row of rows) {
            insertStmt.run(...columns.map(c => row[c.name]));
          }
        });
        
        transaction();
        
        const targetCountAfter = targetDB.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
        console.log(`  Target records after: ${targetCountAfter.count}`);
      }
    } catch (e) {
      console.log(`  Error processing ${tableName}:`, e.message);
    }
  }
  
  console.log('\n✓ Data copy completed successfully!');
} finally {
  sourceDB.close();
  targetDB.close();
}
