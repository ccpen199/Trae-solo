import 'dotenv/config';
import db from '../db';
import { seedMockData } from '../mock/data';

function main() {
  console.log('[init-db] 数据库连接已建立，表结构已确保存在');

  seedMockData();
  console.log('[init-db] 模拟数据已插入（如果是首次运行）');

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  const clusterCount = db.prepare('SELECT COUNT(*) as count FROM clusters').get() as { count: number };
  const workloadCount = db.prepare('SELECT COUNT(*) as count FROM workloads').get() as { count: number };
  const podCount = db.prepare('SELECT COUNT(*) as count FROM pods').get() as { count: number };
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
  const nodeCount = db.prepare('SELECT COUNT(*) as count FROM nodes').get() as { count: number };
  const certCount = db.prepare('SELECT COUNT(*) as count FROM certificates').get() as { count: number };

  console.log('[init-db] 当前数据库统计:');
  console.log(`  用户: ${userCount.count}`);
  console.log(`  集群: ${clusterCount.count}`);
  console.log(`  工作负载: ${workloadCount.count}`);
  console.log(`  Pods: ${podCount.count}`);
  console.log(`  事件: ${eventCount.count}`);
  console.log(`  节点: ${nodeCount.count}`);
  console.log(`  证书: ${certCount.count}`);

  console.log('[init-db] 初始化完成');
  db.close();
}

main();
