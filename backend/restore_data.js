import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.exec('DELETE FROM resources');
db.exec("DELETE FROM sqlite_sequence WHERE name='resources'");

const insert = db.prepare(`
  INSERT INTO resources (id, type, name, description, location, latitude, longitude, opening_hours, suitable_for, price, stock, supplier_id, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insert.run(1, 'scenic', '故宫博物院', '中国明清两代的皇家宫殿', '北京市东城区景山前街4号', 39.9163, 116.3972, '08:30-17:00', '全年龄段', 60, 1000, 1, '周一闭馆');
insert.run(2, 'scenic', '长城', '世界文化遗产', '北京市延庆区', 40.4319, 116.5704, '07:30-18:00', '全年龄段', 45, 2000, 1, '建议穿舒适鞋子');
insert.run(3, 'hotel', '北京饭店', '五星级豪华酒店', '北京市东城区东长安街33号', 39.9087, 116.4074, '24小时', '商务/旅游', 888, 200, 2, '含早餐');
insert.run(4, 'restaurant', '全聚德', '北京烤鸭老字号', '北京市东城区前门大街30号', 39.8995, 116.3978, '10:00-22:00', '全年龄段', 200, 500, 3, '需提前预订');
insert.run(5, 'activity', '京剧表演', '传统京剧演出', '北京市西城区', 39.9139, 116.3748, '19:30-21:30', '文化爱好者', 180, 300, 1, '建议提前30分钟入场');

const result = db.prepare('SELECT id, name FROM resources ORDER BY id').all();
console.log('恢复的数据:');
console.log(result);

db.close();
