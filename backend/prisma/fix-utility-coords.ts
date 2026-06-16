import { PrismaClient } from '@prisma/client';
import { parseJson, toJson } from '../src/utils/json';

const prisma = new PrismaClient();

const WANGJING_CENTER = { lat: 39.9939, lon: 116.4778 };

async function main() {
  console.log('🚌 修复公交站点坐标...');
  const busService = await prisma.utilityService.findFirst({ where: { type: 'BUS' } });
  if (busService) {
    const data = parseJson<any>(busService.data, {});
    if (data.stations && Array.isArray(data.stations)) {
      data.stations = data.stations.map((s: any, i: number) => ({
        ...s,
        lat: WANGJING_CENTER.lat + (Math.random() - 0.5) * 0.02,
        lon: WANGJING_CENTER.lon + (Math.random() - 0.5) * 0.02,
      }));
      await prisma.utilityService.update({
        where: { id: busService.id },
        data: { data: toJson(data) },
      });
      console.log(`   ✅ 更新了 ${data.stations.length} 个公交站`);
      for (const s of data.stations) {
        console.log(`     ${s.name}: ${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}`);
      }
    }
  }

  console.log('\n🧪 修复核酸检测点坐标...');
  const covidService = await prisma.utilityService.findFirst({ where: { type: 'COVID_TEST' } });
  if (covidService) {
    const data = parseJson<any>(covidService.data, {});
    if (data.sites && Array.isArray(data.sites)) {
      data.sites = data.sites.map((s: any, i: number) => ({
        ...s,
        lat: WANGJING_CENTER.lat + (Math.random() - 0.5) * 0.02,
        lon: WANGJING_CENTER.lon + (Math.random() - 0.5) * 0.02,
      }));
      await prisma.utilityService.update({
        where: { id: covidService.id },
        data: { data: toJson(data) },
      });
      console.log(`   ✅ 更新了 ${data.sites.length} 个核酸检测点`);
    }
  }

  console.log('\n✅ 坐标修复完成！');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
