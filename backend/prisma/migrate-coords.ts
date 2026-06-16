import { PrismaClient } from '@prisma/client';
import { parseJson, toJson } from '../src/utils/json';

const prisma = new PrismaClient();

// 望京中心点
const WANGJING_LAT = 39.9939;
const WANGJING_LNG = 116.4778;

// 北京市中心（旧坐标基准）
const OLD_CENTER_LAT = 39.9042;
const OLD_CENTER_LNG = 116.4074;

// 偏移量
const LAT_OFFSET = WANGJING_LAT - OLD_CENTER_LAT;
const LNG_OFFSET = WANGJING_LNG - OLD_CENTER_LNG;

function addOffset(lat: number | null, lng: number | null): { lat: number; lng: number } {
  // 如果坐标本来就在望京附近（lat > 39.95），就不偏移了
  if (lat && lat > 39.95) {
    return { lat, lng: lng || WANGJING_LNG };
  }
  return {
    lat: (lat || OLD_CENTER_LAT) + LAT_OFFSET + (Math.random() - 0.5) * 0.01,
    lng: (lng || OLD_CENTER_LNG) + LNG_OFFSET + (Math.random() - 0.5) * 0.01,
  };
}

async function main() {
  console.log('🗺️  将所有数据坐标迁移到望京区域...');
  console.log();

  // 1. 商户
  console.log('🏪 迁移商户坐标...');
  const merchants = await prisma.merchant.findMany();
  for (const m of merchants) {
    const { lat, lng } = addOffset(m.latitude, m.longitude);
    await prisma.merchant.update({
      where: { id: m.id },
      data: { latitude: lat, longitude: lng },
    });
  }
  console.log(`   ✅ 迁移了 ${merchants.length} 家商户`);

  // 2. 互助请求
  console.log('🤝 迁移互助请求坐标...');
  const helps = await prisma.helpRequest.findMany();
  for (const h of helps) {
    const { lat, lng } = addOffset(h.latitude, h.longitude);
    await prisma.helpRequest.update({
      where: { id: h.id },
      data: { latitude: lat, longitude: lng },
    });
  }
  console.log(`   ✅ 迁移了 ${helps.length} 条互助请求`);

  // 3. 旧帖子（seed 创建的，坐标在市中心）
  console.log('📝 迁移帖子坐标...');
  const posts = await prisma.post.findMany();
  let migratedPosts = 0;
  for (const p of posts) {
    if (p.latitude && p.latitude < 39.95) {
      const { lat, lng } = addOffset(p.latitude, p.longitude);
      await prisma.post.update({
        where: { id: p.id },
        data: { latitude: lat, longitude: lng },
      });
      migratedPosts++;
    }
  }
  console.log(`   ✅ 迁移了 ${migratedPosts} 篇旧帖子`);

  // 4. 用户坐标
  console.log('👤 迁移用户坐标...');
  const users = await prisma.user.findMany({ where: { latitude: { not: null } } });
  let migratedUsers = 0;
  for (const u of users) {
    if (u.latitude && u.latitude < 39.95) {
      const { lat, lng } = addOffset(u.latitude, u.longitude);
      await prisma.user.update({
        where: { id: u.id },
        data: { latitude: lat, longitude: lng },
      });
      migratedUsers++;
    }
  }
  console.log(`   ✅ 迁移了 ${migratedUsers} 个用户`);

  // 5. 便民服务 - 更新公交站和核酸点坐标（存在 data JSON 中）
  console.log('🚌 更新公交站点坐标...');
  const busService = await prisma.utilityService.findFirst({ where: { type: 'BUS' } });
  if (busService) {
    const data = parseJson<any>(busService.data, {});
    if (data.stations && Array.isArray(data.stations)) {
      data.stations = data.stations.map((s: any) => {
        if (s.latitude < 39.95) {
          const { lat, lng } = addOffset(s.latitude, s.longitude);
          return { ...s, latitude: lat, longitude: lng };
        }
        return s;
      });
      await prisma.utilityService.update({
        where: { id: busService.id },
        data: { data: toJson(data) },
      });
      console.log(`   ✅ 更新了 ${data.stations.length} 个公交站`);
    }
  }

  console.log('🧪 更新核酸检测点坐标...');
  const covidService = await prisma.utilityService.findFirst({ where: { type: 'COVID_TEST' } });
  if (covidService) {
    const data = parseJson<any>(covidService.data, {});
    if (data.sites && Array.isArray(data.sites)) {
      data.sites = data.sites.map((s: any) => {
        if (s.latitude < 39.95) {
          const { lat, lng } = addOffset(s.latitude, s.longitude);
          return { ...s, latitude: lat, longitude: lng };
        }
        return s;
      });
      await prisma.utilityService.update({
        where: { id: covidService.id },
        data: { data: toJson(data) },
      });
      console.log(`   ✅ 更新了 ${data.sites.length} 个核酸检测点`);
    }
  }

  console.log();
  console.log('✅ 所有坐标迁移完成！');
  console.log();

  // 验证
  console.log('📊 验证数据：');
  
  const m = await prisma.merchant.findFirst();
  if (m) console.log(`   商户示例: ${m.businessName} | lat: ${m.latitude.toFixed(4)} lng: ${m.longitude.toFixed(4)}`);
  
  const h = await prisma.helpRequest.findFirst();
  if (h) console.log(`   互助示例: ${h.title.substring(0,15)} | lat: ${h.latitude.toFixed(4)} lng: ${h.longitude.toFixed(4)}`);
  
  const p = await prisma.post.findFirst({ where: { status: 'APPROVED' } });
  if (p && p.latitude) console.log(`   帖子示例: ${p.title.substring(0,15)} | lat: ${p.latitude.toFixed(4)} lng: ${p.longitude?.toFixed(4)}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
