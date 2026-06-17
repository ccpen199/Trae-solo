import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const lat = 39.9939, lon = 116.4778;
  const all = await prisma.post.findMany();
  console.log('数据库总帖子数:', all.length);
  const byLv: Record<string, number> = {};
  for (const p of all) {
    byLv[p.sourceLevel] = (byLv[p.sourceLevel] || 0) + 1;
  }
  console.log('信源分布:', byLv);
  console.log();
  
  // 打印每个帖子的经纬度
  for (const p of all) {
    if (p.sourceLevel === 'ORDINARY') {
      const dx = Math.abs((p.latitude || 0) - lat);
      const dy = Math.abs((p.longitude || 0) - lon);
      const latStr = p.latitude ? p.latitude.toFixed(4) : 'null';
      const lonStr = p.longitude ? p.longitude.toFixed(4) : 'null';
      console.log(`ORDINARY: lat=${latStr}, lon=${lonStr}, diff=${dx.toFixed(4)},${dy.toFixed(4)}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
