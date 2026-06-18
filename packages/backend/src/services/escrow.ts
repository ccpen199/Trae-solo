import { prisma } from '../config/database.js';

export async function holdPayment(orderId: string, amount: number): Promise<{ success: boolean; error?: string }> {
  const existing = await prisma.escrowTransaction.findFirst({
    where: { orderId, type: 'hold', status: 'success' },
  });

  if (existing) {
    return { success: false, error: 'Payment already held in escrow' };
  }

  const order = await prisma.secondhandOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.paymentStatus !== 'unpaid') {
    return { success: false, error: 'Order payment status invalid for hold' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.escrowTransaction.create({
      data: {
        orderId,
        type: 'hold',
        amount,
        fromAccount: order.buyerId,
        toAccount: 'escrow',
        status: 'success',
        remark: 'Payment held in escrow',
      },
    });

    await tx.secondhandOrder.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'paid_held',
        paidAt: new Date(),
        status: 'paid_held',
      },
    });
  });

  return { success: true };
}

export async function releasePayment(orderId: string): Promise<{ success: boolean; error?: string }> {
  const holdTx = await prisma.escrowTransaction.findFirst({
    where: { orderId, type: 'hold', status: 'success' },
  });

  if (!holdTx) {
    return { success: false, error: 'No held payment found for this order' };
  }

  const order = await prisma.secondhandOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.paymentStatus !== 'paid_held') {
    return { success: false, error: 'Order is not in escrow hold state' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.escrowTransaction.create({
      data: {
        orderId,
        type: 'release',
        amount: order.sellerReceiveAmount,
        fromAccount: 'escrow',
        toAccount: order.sellerId,
        status: 'success',
        remark: 'Escrow payment released to seller',
      },
    });

    await tx.secondhandOrder.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'released',
        escrowReleasedAt: new Date(),
        status: 'completed',
        completedAt: new Date(),
      },
    });

    const sellerWallet = await tx.userWallet.findUnique({ where: { userId: order.sellerId } });
    if (sellerWallet) {
      await tx.userWallet.update({
        where: { userId: order.sellerId },
        data: {
          balance: { increment: order.sellerReceiveAmount },
          totalIncome: { increment: order.sellerReceiveAmount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: sellerWallet.id,
          userId: order.sellerId,
          amount: order.sellerReceiveAmount,
          balanceAfter: sellerWallet.balance + order.sellerReceiveAmount,
          type: 'income',
          source: 'refund',
          sourceId: orderId,
          description: 'Secondhand sale payment received',
        },
      });
    }
  });

  return { success: true };
}

export async function refundPayment(orderId: string): Promise<{ success: boolean; error?: string }> {
  const holdTx = await prisma.escrowTransaction.findFirst({
    where: { orderId, type: 'hold', status: 'success' },
  });

  if (!holdTx) {
    return { success: false, error: 'No held payment found for this order' };
  }

  const order = await prisma.secondhandOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.paymentStatus === 'released') {
    return { success: false, error: 'Payment already released' };
  }

  if (order.paymentStatus === 'refunded') {
    return { success: false, error: 'Payment already refunded' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.escrowTransaction.create({
      data: {
        orderId,
        type: 'refund',
        amount: order.totalAmount,
        fromAccount: 'escrow',
        toAccount: order.buyerId,
        status: 'success',
        remark: 'Escrow payment refunded to buyer',
      },
    });

    await tx.secondhandOrder.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'refunded',
        status: 'refunded',
        cancelledAt: new Date(),
        cancelReason: order.cancelReason ?? 'Refund processed',
      },
    });
  });

  return { success: true };
}

export async function getEscrowStatus(orderId: string): Promise<{ status: string; amount?: number; heldAt?: Date }> {
  const holdTx = await prisma.escrowTransaction.findFirst({
    where: { orderId, type: 'hold', status: 'success' },
    orderBy: { createdAt: 'desc' },
  });

  if (!holdTx) {
    return { status: 'none' };
  }

  const releaseTx = await prisma.escrowTransaction.findFirst({
    where: { orderId, type: 'release', status: 'success' },
  });

  const refundTx = await prisma.escrowTransaction.findFirst({
    where: { orderId, type: 'refund', status: 'success' },
  });

  if (refundTx) {
    return { status: 'refunded', amount: holdTx.amount, heldAt: holdTx.createdAt };
  }

  if (releaseTx) {
    return { status: 'released', amount: holdTx.amount, heldAt: holdTx.createdAt };
  }

  return { status: 'held', amount: holdTx.amount, heldAt: holdTx.createdAt };
}
