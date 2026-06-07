const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/app.sqlite');
const db = new Database(dbPath);

console.log('开始更新POI数据...');

db.exec('DELETE FROM pois');

const grids = db.prepare('SELECT code, lat, lng FROM grids LIMIT 32').all();
const providers = db.prepare('SELECT id FROM providers LIMIT 32').all();

const poiTypes = [
  { type: 'restaurant', name: '美食坊', cost: 50, hours: '08:00-22:00' },
  { type: 'takeaway', name: '外卖店', cost: 35, hours: '10:00-21:00' },
  { type: 'home_service', name: '家政中心', cost: 80, hours: '09:00-18:00' },
  { type: 'repair', name: '维修店', cost: 60, hours: '09:00-19:00' },
  { type: 'carpool', name: '拼车站', cost: 25, hours: '06:00-22:00' },
  { type: 'market', name: '便民市场', cost: 40, hours: '07:00-21:00' },
  { type: 'secondhand', name: '二手交易点', cost: 0, hours: '10:00-18:00' },
  { type: 'job', name: '招聘服务站', cost: 0, hours: '09:00-18:00' },
  { type: 'express', name: '快递代取点', cost: 10, hours: '08:00-20:00' },
];

const statuses = ['open', 'closed', 'resting'];
let count = 0;

const insertPOI = db.prepare(`
  INSERT INTO pois (name, type, grid_code, address, lat, lng, business_status, avg_cost, service_hours, provider_id, rating)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

grids.forEach((grid, gIdx) => {
  poiTypes.forEach((pt, ptIdx) => {
    const idx = gIdx * poiTypes.length + ptIdx + 1;
    const status = statuses[idx % statuses.length];
    const provider = providers[idx % providers.length];
    
    insertPOI.run(
      `${pt.name}${idx}号`,
      pt.type,
      grid.code,
      `${grid.code}街道${idx}号`,
      grid.lat + (Math.random() - 0.5) * 0.02,
      grid.lng + (Math.random() - 0.5) * 0.02,
      status,
      pt.cost + Math.floor(Math.random() * 30),
      pt.hours,
      provider.id,
      3.5 + Math.random() * 1.5
    );
    count++;
  });
});

console.log(`成功插入 ${count} 个POI数据`);

const types = db.prepare('SELECT type, COUNT(*) as cnt FROM pois GROUP BY type').all();
console.log('\nPOI类型分布:');
types.forEach(t => console.log(`  ${t.type}: ${t.cnt}个`));

db.close();
