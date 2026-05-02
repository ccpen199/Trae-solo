import { Response } from 'express';
import { query } from 'express-validator';
import prisma from '../config/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const exportValidation = [
  query('type').notEmpty().withMessage('请指定导出类型'),
  query('format').optional().isIn(['csv', 'json']),
];

const generateCSV = (data: any[], headers: { key: string; label: string }[]): string => {
  const headerRow = headers.map(h => `\"${h.label}\"`).join(',');
  const dataRows = data.map(item =>
    headers.map(h => {
      const value = item[h.key];
      if (value === null || value === undefined) {
        return '';
      }
      const strValue = String(value);
      return `\"${strValue.replace(/"/g, '\"\"')}\"`;
    }).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
};

export const exportAccounts = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const { status, gameName, minPrice, maxPrice, format = 'json' } = req.query;

    const where: any = {};

    if (req.user.role === 'USER') {
      where.sellerId = req.user.id;
    }

    if (status) {
      where.status = status;
    }

    if (gameName) {
      where.gameName = gameName;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = parseFloat(minPrice as string);
      }
      if (maxPrice !== undefined) {
        where.price.lte = parseFloat(maxPrice as string);
      }
    }

    const accounts = await prisma.gameAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: { username: true },
        },
      },
    });

    if (format === 'csv') {
      const headers = [
        { key: 'id', label: 'ID' },
        { key: 'title', label: '标题' },
        { key: 'gameName', label: '游戏名称' },
        { key: 'gameServer', label: '服务器' },
        { key: 'accountLevel', label: '等级' },
        { key: 'price', label: '价格' },
        { key: 'status', label: '状态' },
        { key: 'viewCount', label: '浏览量' },
        { key: 'isTop', label: '是否置顶' },
        { key: 'isHot', label: '是否热门' },
        { key: 'sellerName', label: '卖家' },
        { key: 'createdAt', label: '创建时间' },
      ];

      const csvData = accounts.map(account => ({
        ...account,
        sellerName: account.seller?.username,
        createdAt: account.createdAt.toISOString(),
      }));

      const csv = generateCSV(csvData, headers);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=accounts_${Date.now()}.csv`);
      return res.send('\ufeff' + csv);
    }

    successResponse(res, accounts);
  } catch (error) {
    console.error('Export accounts error:', error);
    errorResponse(res, 500, '导出账号失败');
  }
};

export const exportOrders = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const { status, role, startDate, endDate, format = 'json' } = req.query;

    const where: any = {};

    if (req.user.role === 'USER') {
      where.OR = [
        { buyerId: req.user.id },
        { sellerId: req.user.id },
      ];
    }

    if (role === 'buyer') {
      where.buyerId = req.user.id;
    } else if (role === 'seller') {
      where.sellerId = req.user.id;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        account: {
          select: { title: true, gameName: true },
        },
        buyer: {
          select: { username: true },
        },
        seller: {
          select: { username: true },
        },
      },
    });

    if (format === 'csv') {
      const headers = [
        { key: 'orderNo', label: '订单号' },
        { key: 'gameName', label: '游戏名称' },
        { key: 'accountTitle', label: '账号标题' },
        { key: 'buyerName', label: '买家' },
        { key: 'sellerName', label: '卖家' },
        { key: 'price', label: '价格' },
        { key: 'status', label: '状态' },
        { key: 'paymentMethod', label: '支付方式' },
        { key: 'paidAt', label: '支付时间' },
        { key: 'deliveredAt', label: '发货时间' },
        { key: 'confirmedAt', label: '确认时间' },
        { key: 'completedAt', label: '完成时间' },
        { key: 'createdAt', label: '创建时间' },
      ];

      const csvData = orders.map(order => ({
        ...order,
        gameName: order.account?.gameName,
        accountTitle: order.account?.title,
        buyerName: order.buyer?.username,
        sellerName: order.seller?.username,
        paidAt: order.paidAt?.toISOString() || '',
        deliveredAt: order.deliveredAt?.toISOString() || '',
        confirmedAt: order.confirmedAt?.toISOString() || '',
        completedAt: order.completedAt?.toISOString() || '',
        createdAt: order.createdAt.toISOString(),
      }));

      const csv = generateCSV(csvData, headers);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=orders_${Date.now()}.csv`);
      return res.send('\ufeff' + csv);
    }

    successResponse(res, orders);
  } catch (error) {
    console.error('Export orders error:', error);
    errorResponse(res, 500, '导出订单失败');
  }
};

export const exportExceptions = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const { status, type, priority, format = 'json' } = req.query;

    const where: any = {};

    if (req.user.role === 'USER') {
      where.OR = [
        {
          order: { buyerId: req.user.id },
        },
        {
          order: { sellerId: req.user.id },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    const exceptions = await prisma.exception.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        order: {
          include: {
            account: { select: { title: true } },
          },
        },
        handler: {
          select: { username: true },
        },
      },
    });

    if (format === 'csv') {
      const headers = [
        { key: 'id', label: 'ID' },
        { key: 'title', label: '标题' },
        { key: 'type', label: '类型' },
        { key: 'priority', label: '优先级' },
        { key: 'status', label: '状态' },
        { key: 'orderNo', label: '关联订单' },
        { key: 'handlerName', label: '处理人' },
        { key: 'resolution', label: '处理结果' },
        { key: 'createdAt', label: '创建时间' },
        { key: 'resolvedAt', label: '解决时间' },
      ];

      const csvData = exceptions.map(exc => ({
        ...exc,
        orderNo: exc.order?.orderNo,
        handlerName: exc.handler?.username,
        createdAt: exc.createdAt.toISOString(),
        resolvedAt: exc.resolvedAt?.toISOString() || '',
      }));

      const csv = generateCSV(csvData, headers);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=exceptions_${Date.now()}.csv`);
      return res.send('\ufeff' + csv);
    }

    successResponse(res, exceptions);
  } catch (error) {
    console.error('Export exceptions error:', error);
    errorResponse(res, 500, '导出异常记录失败');
  }
};
