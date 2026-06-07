const db = require('../src/db');
const rankingEngine = require('../src/engines/rankingEngine');

const existingCount = db.prepare('SELECT COUNT(*) as count FROM brand_comparisons').get().count;
if (existingCount > 0) {
  console.log('Brand comparisons already exist, skipping seed');
  db.close();
  process.exit(0);
}

const comparisons = [
  { brand_ids: [1, 2, 3], category_id: 1, user_id: 3 },
  { brand_ids: [4, 5], category_id: 2, user_id: 3 },
  { brand_ids: [6, 7, 8], category_id: 3, user_id: null },
  { brand_ids: [9, 10], category_id: 4, user_id: 3 }
];

const insertStmt = db.prepare(`
  INSERT INTO brand_comparisons (user_id, category_id, brand_ids, comparison_data, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

comparisons.forEach((c, idx) => {
  const comparisonData = rankingEngine.compareBrands(c.brand_ids, c.category_id);
  const createdAt = new Date(Date.now() - (idx * 3600000)).toISOString();
  
  insertStmt.run(
    c.user_id,
    c.category_id,
    JSON.stringify(c.brand_ids),
    JSON.stringify(comparisonData),
    createdAt
  );
  console.log(`Inserted comparison ${idx + 1}: brands ${c.brand_ids.join(', ')}`);
});

console.log('\n=== Seed data inserted successfully ===');
const count = db.prepare('SELECT COUNT(*) as count FROM brand_comparisons').get().count;
console.log(`Total comparisons: ${count}`);

db.close();
