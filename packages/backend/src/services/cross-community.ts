import { prisma } from '../config/database.js';

export async function getRecommendedTopics(
  userId: string,
  tenantId: string,
  page: number = 1,
  pageSize: number = 10,
) {
  const currentTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!currentTenant) {
    return { list: [], total: 0, page, pageSize };
  }

  const nearbyTenants = await prisma.tenant.findMany({
    where: {
      id: { not: tenantId },
      status: 'active',
      OR: [
        { province: currentTenant.province },
        { city: currentTenant.city },
      ],
    },
    select: { id: true, settings: true },
  });

  const tenantIds = nearbyTenants.map((t) => t.id);

  if (tenantIds.length === 0) {
    const ownTopics = await prisma.topic.findMany({
      where: { tenantId, status: 'published', isEssence: true },
      orderBy: { likeCount: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const total = await prisma.topic.count({
      where: { tenantId, status: 'published', isEssence: true },
    });
    return { list: ownTopics, total, page, pageSize };
  }

  const userCategories = await prisma.topic.findMany({
    where: { authorId: userId, status: 'published' },
    select: { category: true },
    distinct: ['category'],
  });

  const preferredCategories = userCategories.map((t) => t.category);

  const topics = await prisma.topic.findMany({
    where: {
      tenantId: { in: tenantIds },
      status: 'published',
      ...(preferredCategories.length > 0 ? { category: { in: preferredCategories } } : {}),
    },
    orderBy: [
      { isEssence: 'desc' },
      { likeCount: 'desc' },
      { viewCount: 'desc' },
    ],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const total = await prisma.topic.count({
    where: {
      tenantId: { in: tenantIds },
      status: 'published',
      ...(preferredCategories.length > 0 ? { category: { in: preferredCategories } } : {}),
    },
  });

  return { list: topics, total, page, pageSize };
}

export async function calculateCommunityRelevance(
  fromTenantId: string,
  toTenantId: string,
): Promise<number> {
  const [from, to] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: fromTenantId } }),
    prisma.tenant.findUnique({ where: { id: toTenantId } }),
  ]);

  if (!from || !to) return 0;

  let score = 0;

  if (from.province && to.province && from.province === to.province) {
    score += 0.3;
  }

  if (from.city && to.city && from.city === to.city) {
    score += 0.3;
  }

  if (from.district && to.district && from.district === to.district) {
    score += 0.2;
  }

  const fromSettings = from.settings as Record<string, unknown> | null;
  const toSettings = to.settings as Record<string, unknown> | null;

  if (fromSettings?.enableTopic && toSettings?.enableTopic) {
    score += 0.1;
  }

  if (fromSettings?.enableMarketplace && toSettings?.enableMarketplace) {
    score += 0.1;
  }

  return Math.min(score, 1);
}
