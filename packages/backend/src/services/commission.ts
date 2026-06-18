import { prisma } from '../config/database.js';

export async function calculateCommission(
  orderId: string,
  partnerId: string,
  orderAmount: number,
): Promise<{ levels: { partnerId: string; depth: number; rate: number; amount: number }[] }> {
  const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
  if (!partner) {
    return { levels: [] };
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: partner.tenantId } });
  const settings = tenant?.settings as Record<string, unknown> | null;
  const commissionRates = (settings?.commissionRates as number[]) ?? [0.1, 0.05, 0.02];
  const maxLevels = (settings?.maxPartnerLevels as number) ?? 3;

  const invitePath = partner.invitePath ? partner.invitePath.split('/') : [];
  const ancestorIds = invitePath.filter(Boolean).slice(-maxLevels).reverse();

  const levels: { partnerId: string; depth: number; rate: number; amount: number }[] = [];

  for (let i = 0; i < ancestorIds.length; i++) {
    const ancestor = await prisma.partner.findUnique({ where: { id: ancestorIds[i] } });
    if (!ancestor || ancestor.status !== 'active') continue;

    const depth = i + 1;
    const rate = commissionRates[i] ?? commissionRates[commissionRates.length - 1] ?? 0;
    const amount = Math.round(orderAmount * rate * 100) / 100;

    levels.push({ partnerId: ancestor.id, depth, rate, amount });
  }

  const selfRate = commissionRates[0] ?? 0.1;
  levels.unshift({
    partnerId,
    depth: 0,
    rate: selfRate,
    amount: Math.round(orderAmount * selfRate * 100) / 100,
  });

  return { levels };
}

export async function distributeCommission(orderId: string): Promise<{ success: boolean; distributed?: number }> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return { success: false };
  }

  const orderItem = await prisma.orderItem.findFirst({ where: { orderId } });
  if (!orderItem) {
    return { success: false };
  }

  const product = await prisma.product.findUnique({ where: { id: orderItem.productId } });
  if (!product?.partnerId) {
    return { success: false };
  }

  const commissionResult = await calculateCommission(orderId, product.partnerId, order.payAmount);

  let distributed = 0;

  await prisma.$transaction(async (tx) => {
    for (const level of commissionResult.levels) {
      await tx.commissionRecord.create({
        data: {
          partnerId: level.partnerId,
          orderId,
          depth: level.depth,
          orderAmount: order.payAmount,
          commissionRate: level.rate,
          commissionAmount: level.amount,
          status: 'pending',
          fromPartnerId: level.depth > 0 ? product.partnerId : undefined,
          availableAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.partner.update({
        where: { id: level.partnerId },
        data: {
          totalCommission: { increment: level.amount },
          frozenCommission: { increment: level.amount },
        },
      });

      distributed += level.amount;
    }
  });

  return { success: true, distributed };
}

export async function settlePartner(partnerId: string): Promise<{ success: boolean; settledAmount?: number }> {
  const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
  if (!partner) {
    return { success: false };
  }

  if (partner.withdrawableCommission <= 0) {
    return { success: false };
  }

  const settleAmount = partner.withdrawableCommission;

  await prisma.$transaction(async (tx) => {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    await tx.partnerSettlement.create({
      data: {
        partnerId,
        tenantId: partner.tenantId,
        settlementNo: `STL-${Date.now()}`,
        periodStart,
        periodEnd: now,
        totalSales: partner.totalSales,
        totalCommission: settleAmount,
        deductionAmount: 0,
        netAmount: settleAmount,
        status: 'pending',
      },
    });

    await tx.partner.update({
      where: { id: partnerId },
      data: {
        withdrawableCommission: 0,
        settledCommission: { increment: settleAmount },
        frozenCommission: { decrement: settleAmount },
      },
    });

    await tx.commissionRecord.updateMany({
      where: {
        partnerId,
        status: 'available',
      },
      data: {
        status: 'settled',
        settledAt: now,
      },
    });
  });

  return { success: true, settledAmount: settleAmount };
}

export async function buildInviteTree(partnerId: string): Promise<{
  partnerId: string;
  children: { partnerId: string; depth: number; totalInvited: number; children: unknown[] }[];
}> {
  const relations = await prisma.partnerInviteRelation.findMany({
    where: { ancestorId: partnerId },
    orderBy: { depth: 'asc' },
  });

  const children: { partnerId: string; depth: number; totalInvited: number; children: unknown[] }[] = [];

  for (const relation of relations) {
    const descendant = await prisma.partner.findUnique({
      where: { id: relation.descendantId },
    });

    if (descendant) {
      children.push({
        partnerId: descendant.id,
        depth: relation.depth,
        totalInvited: descendant.totalInvited,
        children: [],
      });
    }
  }

  return { partnerId, children };
}
