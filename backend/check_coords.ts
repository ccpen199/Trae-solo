import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('商户坐标:');
  const merchants = await prisma.merchant.findMany();
  for (const m of merchants) {
    console.log(`  ${m.businessName} | lat: ${m.latitude} lng: ${m.longitude} | status: ${m.status}`);
  }

  console.log('\n互助请求坐标:');
  const helps = await prisma.helpRequest.findMany();
  for (const h of helps) {
    console.log(`  ${h.title.substring(0,20)} | lat: ${h.latitude} lng: ${h.longitude} | status: ${h.status}`);
  }

  console.log('\n管理员账号:');
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  for (const a of admins) {
    console.log(`  ${a.phone} | ${a.nickname} | ${a.role}`);
  }

  console.log('\n政务用户:');
  const govs = await prisma.user.findMany({ where: { role: 'GOVERNMENT' } });
  for (const g of govs) {
    console.log(`  ${g.phone} | ${g.nickname} | ${g.role}`);
  }

  console.log('\n帖子坐标和类型:');
  const posts = await prisma.post.findMany({ where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' }, take: 5 });
  for (const p of posts) {
    console.log(`  [${p.type}] ${p.title.substring(0,20)} | src: ${p.sourceLevel} | lat: ${p.latitude} lng: ${p.longitude}`);
  }

  console.log('\n便民服务类型:');
  const services = await prisma.utilityService.findMany();
  for (const s of services) {
    console.log(`  ${s.type} | ${s.name} | status: ${s.status}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
