import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const citizen = await prisma.user.findFirst({ where: { role: 'CITIZEN' } });

  // 1. 设置至少2个帖子为PENDING状态，带风险等级
  const approvedPosts = await prisma.post.findMany({
    where: { status: 'APPROVED', NOT: { type: 'NOTICE' } },
    take: 3,
  });

  for (const post of approvedPosts.slice(0, 3)) {
    await prisma.post.update({
      where: { id: post.id },
      data: { status: 'PENDING', sourceLevel: 'ORDINARY' },
    });
    // 清理旧审核记录
    await prisma.auditLog.deleteMany({ where: { postId: post.id } });
    // 创建AI审核记录
    const riskLevels = ['HIGH', 'MEDIUM', 'CRITICAL'];
    const aiScores = [85, 55, 95];
    const reasons = [
      '涉及疫情谣言风险，可能引发恐慌',
      '涉及商家负面评价，建议核实真实性',
      '涉及敏感关键词，需人工复审',
    ];
    const idx = approvedPosts.indexOf(post);
    await prisma.auditLog.create({
      data: {
        postId: post.id,
        auditorId: admin?.id || '',
        action: 'PENDING',
        riskLevel: riskLevels[idx % 3],
        aiScore: aiScores[idx % 3],
        reason: reasons[idx % 3],
      },
    });
  }

  // 2. 设置至少2个帖子为ORDINARY信源
  const ordinaryPosts = await prisma.post.findMany({
    where: { sourceLevel: { not: 'ORDINARY' }, status: 'APPROVED' },
    take: 3,
  });
  for (const p of ordinaryPosts) {
    await prisma.post.update({
      where: { id: p.id },
      data: { sourceLevel: 'ORDINARY' },
    });
  }

  // 3. 确保避坑帖存在
  const pitfallExists = await prisma.post.findFirst({ where: { isPitfall: true } });
  if (!pitfallExists && citizen) {
    const pp = await prisma.post.create({
      data: {
        title: '避坑｜望京某网红咖啡店体验极差',
        content: '被种草的这家网红咖啡店，结果大失所望。环境一般，性价比极低。',
        type: 'REVIEW',
        sourceLevel: 'ORDINARY',
        status: 'APPROVED',
        userId: citizen.id,
        latitude: 39.9939,
        longitude: 116.4778,
        locationName: '望京SOHO',
        isPitfall: true,
        priceAnchor: 48,
        hasProof: true,
      },
    });
    if (admin) {
      await prisma.auditLog.create({
        data: {
          postId: pp.id,
          auditorId: admin.id,
          action: 'APPROVE',
          riskLevel: 'MEDIUM',
          aiScore: 25,
          reason: '涉及商家负面评价，建议核实',
        },
      });
    }
  }

  // 输出统计
  console.log('待审核:', await prisma.post.count({ where: { status: 'PENDING' } }));
  console.log('信源分布:');
  for (const lv of ['GOV', 'OFFICIAL', 'V', 'ORDINARY']) {
    console.log(`  ${lv}:`, await prisma.post.count({ where: { sourceLevel: lv } }));
  }
  console.log('避坑帖:', await prisma.post.count({ where: { isPitfall: true } }));
  const risks = await prisma.auditLog.findMany({ distinct: ['riskLevel'] });
  console.log('风险等级:', Array.from(new Set(risks.map(r => r.riskLevel))));
}

main().finally(() => prisma.$disconnect());
