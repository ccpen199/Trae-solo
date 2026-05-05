import { Repository, In } from 'typeorm';
import { LogisticsOrder, LogisticsLink, LogisticsStatus } from '../entities/LogisticsOrder';
import { Enterprise, EnterpriseType } from '../entities/Enterprise';
import { AppDataSource } from '../config/database';
import * as XLSX from 'xlsx';
import { JwtPayload } from '../utils/jwt';

interface LogisticsOrderCreateParams {
  logisticsNo: string;
  proxyNo?: string;
  productionEnterpriseCode?: string;
  productionEnterpriseName?: string;
  initiatorEnterpriseCode?: string;
  initiatorEnterpriseName?: string;
  transferEnterpriseCode?: string;
  transferEnterpriseName?: string;
  receiverEnterpriseCode?: string;
  receiverEnterpriseName?: string;
  goodsName: string;
  quantity?: number;
  unit?: string;
  weight?: number;
  volume?: number;
  shipmentDate?: string;
  expectedDeliveryDate?: string;
  shipmentAddress?: string;
  deliveryAddress?: string;
  remark?: string;
}

export type LogisticsCategory = 'production' | 'initiator' | 'transfer' | 'receiver' | 'unmatched';

export class LogisticsService {
  private orderRepository: Repository<LogisticsOrder>;
  private enterpriseRepository: Repository<Enterprise>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(LogisticsOrder);
    this.enterpriseRepository = AppDataSource.getRepository(Enterprise);
  }

  private async matchEnterprise(code?: string, name?: string): Promise<Enterprise | null> {
    if (!code && !name) return null;

    let enterprise: Enterprise | null = null;

    if (code) {
      enterprise = await this.enterpriseRepository.findOne({
        where: { enterpriseCode: code }
      });
    }

    if (!enterprise && name) {
      enterprise = await this.enterpriseRepository.findOne({
        where: { enterpriseName: name }
      });
    }

    return enterprise;
  }

  private determineLink(
    currentEnterpriseId: string,
    currentEnterpriseCode: string,
    order: Partial<LogisticsOrder>
  ): LogisticsLink {
    if (order.productionEnterpriseId === currentEnterpriseId ||
        order.productionEnterpriseCode === currentEnterpriseCode) {
      return 'production';
    }

    if (order.initiatorEnterpriseId === currentEnterpriseId ||
        order.initiatorEnterpriseCode === currentEnterpriseCode) {
      return 'initiator';
    }

    if (order.transferEnterpriseId === currentEnterpriseId ||
        order.transferEnterpriseCode === currentEnterpriseCode) {
      return 'transfer';
    }

    if (order.receiverEnterpriseId === currentEnterpriseId ||
        order.receiverEnterpriseCode === currentEnterpriseCode) {
      return 'receiver';
    }

    return 'unmatched';
  }

  async createOrder(
    params: LogisticsOrderCreateParams,
    user: JwtPayload
  ): Promise<LogisticsOrder> {
    const existing = await this.orderRepository.findOne({
      where: { logisticsNo: params.logisticsNo }
    });

    if (existing) {
      throw new Error('物流单号已存在');
    }

    const [productionEnterprise, initiatorEnterprise, transferEnterprise, receiverEnterprise] = await Promise.all([
      this.matchEnterprise(params.productionEnterpriseCode, params.productionEnterpriseName),
      this.matchEnterprise(params.initiatorEnterpriseCode, params.initiatorEnterpriseName),
      this.matchEnterprise(params.transferEnterpriseCode, params.transferEnterpriseName),
      this.matchEnterprise(params.receiverEnterpriseCode, params.receiverEnterpriseName),
    ]);

    const orderData: any = {
      logisticsNo: params.logisticsNo,
      proxyNo: params.proxyNo || null,
      productionEnterpriseId: productionEnterprise?.id || null,
      productionEnterpriseCode: params.productionEnterpriseCode || null,
      productionEnterpriseName: params.productionEnterpriseName || productionEnterprise?.enterpriseName || null,
      initiatorEnterpriseId: initiatorEnterprise?.id || null,
      initiatorEnterpriseCode: params.initiatorEnterpriseCode || null,
      initiatorEnterpriseName: params.initiatorEnterpriseName || initiatorEnterprise?.enterpriseName || null,
      transferEnterpriseId: transferEnterprise?.id || null,
      transferEnterpriseCode: params.transferEnterpriseCode || null,
      transferEnterpriseName: params.transferEnterpriseName || transferEnterprise?.enterpriseName || null,
      receiverEnterpriseId: receiverEnterprise?.id || null,
      receiverEnterpriseCode: params.receiverEnterpriseCode || null,
      receiverEnterpriseName: params.receiverEnterpriseName || receiverEnterprise?.enterpriseName || null,
      goodsName: params.goodsName,
      quantity: params.quantity || null,
      unit: params.unit || null,
      weight: params.weight || null,
      volume: params.volume || null,
      shipmentDate: params.shipmentDate ? new Date(params.shipmentDate) : null,
      expectedDeliveryDate: params.expectedDeliveryDate ? new Date(params.expectedDeliveryDate) : null,
      shipmentAddress: params.shipmentAddress || null,
      deliveryAddress: params.deliveryAddress || null,
      status: 'created',
      remark: params.remark || null,
      createdByEnterpriseId: user.enterpriseId || null,
      createdByEnterpriseCode: user.enterpriseCode || null,
      createdByUserId: user.userId,
      sourceType: 'manual',
    };

    const isUnmatched = !productionEnterprise && !initiatorEnterprise && !transferEnterprise && !receiverEnterprise;
    orderData.isUnmatched = isUnmatched;

    if (user.enterpriseId) {
      orderData.currentLink = this.determineLink(
        user.enterpriseId,
        user.enterpriseCode || '',
        orderData
      );
    } else {
      orderData.currentLink = 'unmatched';
    }

    if (isUnmatched) {
      orderData.unmatchedReason = '无法匹配到任何企业信息';
    }

    const order = this.orderRepository.create(orderData);
    return this.orderRepository.save(order as any);
  }

  async importFromExcel(
    file: Express.Multer.File,
    user: JwtPayload
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        const params: LogisticsOrderCreateParams = {
          logisticsNo: row['物流单号'] || row['logisticsNo'] || '',
          proxyNo: row['代单号'] || row['proxyNo'],
          productionEnterpriseCode: row['生产企业编号'] || row['productionEnterpriseCode'],
          productionEnterpriseName: row['生产企业名称'] || row['productionEnterpriseName'],
          initiatorEnterpriseCode: row['发起企业编号'] || row['initiatorEnterpriseCode'],
          initiatorEnterpriseName: row['发起企业名称'] || row['initiatorEnterpriseName'],
          transferEnterpriseCode: row['中转企业编号'] || row['transferEnterpriseCode'],
          transferEnterpriseName: row['中转企业名称'] || row['transferEnterpriseName'],
          receiverEnterpriseCode: row['接收企业编号'] || row['receiverEnterpriseCode'],
          receiverEnterpriseName: row['接收企业名称'] || row['receiverEnterpriseName'],
          goodsName: row['货物名称'] || row['goodsName'] || '未命名货物',
          quantity: row['数量'] || row['quantity'],
          unit: row['单位'] || row['unit'],
          weight: row['重量'] || row['weight'],
          volume: row['体积'] || row['volume'],
          shipmentDate: row['发货日期'] || row['shipmentDate'],
          expectedDeliveryDate: row['预计送达日期'] || row['expectedDeliveryDate'],
          shipmentAddress: row['发货地址'] || row['shipmentAddress'],
          deliveryAddress: row['收货地址'] || row['deliveryAddress'],
          remark: row['备注'] || row['remark'],
        };

        if (!params.logisticsNo) {
          throw new Error('物流单号不能为空');
        }

        await this.createOrder(params, user);
        success++;
      } catch (error: any) {
        failed++;
        errors.push(`第${data.indexOf(row) + 2}行: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }

  async getOrderById(id: string): Promise<LogisticsOrder | null> {
    return this.orderRepository.findOne({
      where: { id },
      relations: [
        'productionEnterprise',
        'initiatorEnterprise',
        'transferEnterprise',
        'receiverEnterprise'
      ]
    });
  }

  async getOrdersForAdmin(query: {
    page?: number;
    pageSize?: number;
    logisticsNo?: string;
    productionEnterpriseCode?: string;
    initiatorEnterpriseCode?: string;
    receiverEnterpriseCode?: string;
    startDate?: string;
    endDate?: string;
    isUnmatched?: boolean;
  }): Promise<{ orders: LogisticsOrder[]; total: number }> {
    const {
      page = 1,
      pageSize = 20,
      logisticsNo,
      productionEnterpriseCode,
      initiatorEnterpriseCode,
      receiverEnterpriseCode,
      startDate,
      endDate,
      isUnmatched,
    } = query;

    const qb = this.orderRepository.createQueryBuilder('order');

    if (logisticsNo) {
      qb.andWhere('(order.logisticsNo LIKE :logisticsNo OR order.proxyNo LIKE :logisticsNo)', {
        logisticsNo: `%${logisticsNo}%`
      });
    }

    if (productionEnterpriseCode) {
      qb.andWhere('order.productionEnterpriseCode = :code', { code: productionEnterpriseCode });
    }

    if (initiatorEnterpriseCode) {
      qb.andWhere('order.initiatorEnterpriseCode = :code', { code: initiatorEnterpriseCode });
    }

    if (receiverEnterpriseCode) {
      qb.andWhere('order.receiverEnterpriseCode = :code', { code: receiverEnterpriseCode });
    }

    if (startDate) {
      qb.andWhere('order.createdAt >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      qb.andWhere('order.createdAt <= :endDate', { endDate: new Date(endDate + ' 23:59:59') });
    }

    if (typeof isUnmatched === 'boolean') {
      qb.andWhere('order.isUnmatched = :isUnmatched', { isUnmatched });
    }

    qb.orderBy('order.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [orders, total] = await qb.getManyAndCount();

    return { orders, total };
  }

  async getOrdersForEnterprise(
    user: JwtPayload,
    category: LogisticsCategory,
    query: {
      page?: number;
      pageSize?: number;
      logisticsNo?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ orders: LogisticsOrder[]; total: number }> {
    const { page = 1, pageSize = 20, logisticsNo, startDate, endDate } = query;

    if (!user.enterpriseId) {
      return { orders: [], total: 0 };
    }

    const qb = this.orderRepository.createQueryBuilder('order');

    qb.andWhere('order.isUnmatched = :isUnmatched', { isUnmatched: category === 'unmatched' });

    switch (category) {
      case 'production':
        qb.andWhere(
          '(order.productionEnterpriseId = :enterpriseId OR order.productionEnterpriseCode = :enterpriseCode)',
          { enterpriseId: user.enterpriseId, enterpriseCode: user.enterpriseCode }
        );
        break;
      case 'initiator':
        qb.andWhere(
          '(order.initiatorEnterpriseId = :enterpriseId OR order.initiatorEnterpriseCode = :enterpriseCode)',
          { enterpriseId: user.enterpriseId, enterpriseCode: user.enterpriseCode }
        );
        break;
      case 'transfer':
        qb.andWhere(
          '(order.transferEnterpriseId = :enterpriseId OR order.transferEnterpriseCode = :enterpriseCode)',
          { enterpriseId: user.enterpriseId, enterpriseCode: user.enterpriseCode }
        );
        break;
      case 'receiver':
        qb.andWhere(
          '(order.receiverEnterpriseId = :enterpriseId OR order.receiverEnterpriseCode = :enterpriseCode)',
          { enterpriseId: user.enterpriseId, enterpriseCode: user.enterpriseCode }
        );
        break;
      case 'unmatched':
        qb.andWhere(
          `(
            (order.productionEnterpriseCode IS NOT NULL AND order.productionEnterpriseId IS NULL)
            OR (order.initiatorEnterpriseCode IS NOT NULL AND order.initiatorEnterpriseId IS NULL)
            OR (order.transferEnterpriseCode IS NOT NULL AND order.transferEnterpriseId IS NULL)
            OR (order.receiverEnterpriseCode IS NOT NULL AND order.receiverEnterpriseId IS NULL)
          )`
        );
        qb.andWhere(
          `(
            order.productionEnterpriseCode = :enterpriseCode
            OR order.initiatorEnterpriseCode = :enterpriseCode
            OR order.transferEnterpriseCode = :enterpriseCode
            OR order.receiverEnterpriseCode = :enterpriseCode
            OR order.createdByEnterpriseCode = :enterpriseCode
          )`,
          { enterpriseCode: user.enterpriseCode }
        );
        break;
    }

    if (logisticsNo) {
      qb.andWhere('(order.logisticsNo LIKE :logisticsNo OR order.proxyNo LIKE :logisticsNo)', {
        logisticsNo: `%${logisticsNo}%`
      });
    }

    if (startDate) {
      qb.andWhere('order.createdAt >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      qb.andWhere('order.createdAt <= :endDate', { endDate: new Date(endDate + ' 23:59:59') });
    }

    qb.orderBy('order.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [orders, total] = await qb.getManyAndCount();

    return { orders, total };
  }

  async exportToExcel(orders: LogisticsOrder[]): Promise<Buffer> {
    const data = orders.map(order => ({
      '物流单号': order.logisticsNo,
      '代单号': order.proxyNo || '',
      '生产企业编号': order.productionEnterpriseCode || '',
      '生产企业名称': order.productionEnterpriseName || '',
      '发起企业编号': order.initiatorEnterpriseCode || '',
      '发起企业名称': order.initiatorEnterpriseName || '',
      '中转企业编号': order.transferEnterpriseCode || '',
      '中转企业名称': order.transferEnterpriseName || '',
      '接收企业编号': order.receiverEnterpriseCode || '',
      '接收企业名称': order.receiverEnterpriseName || '',
      '货物名称': order.goodsName,
      '数量': order.quantity || '',
      '单位': order.unit || '',
      '重量': order.weight || '',
      '体积': order.volume || '',
      '发货日期': order.shipmentDate ? order.shipmentDate.toISOString().split('T')[0] : '',
      '预计送达日期': order.expectedDeliveryDate ? order.expectedDeliveryDate.toISOString().split('T')[0] : '',
      '发货地址': order.shipmentAddress || '',
      '收货地址': order.deliveryAddress || '',
      '状态': this.mapStatusToChinese(order.status),
      '当前环节': this.mapLinkToChinese(order.currentLink),
      '是否异常': order.isUnmatched ? '是' : '否',
      '异常原因': order.unmatchedReason || '',
      '创建时间': order.createdAt.toISOString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '物流单');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private mapStatusToChinese(status: LogisticsStatus): string {
    const map: Record<LogisticsStatus, string> = {
      'created': '已创建',
      'transit': '运输中',
      'transferring': '中转中',
      'delivered': '已送达',
      'abnormal': '异常',
    };
    return map[status] || status;
  }

  private mapLinkToChinese(link: LogisticsLink): string {
    const map: Record<LogisticsLink, string> = {
      'production': '生产环节',
      'initiator': '发起环节',
      'transfer': '中转环节',
      'receiver': '接收环节',
      'unmatched': '未匹配',
    };
    return map[link] || link;
  }

  async getOrdersByIds(ids: string[]): Promise<LogisticsOrder[]> {
    return this.orderRepository.findBy({ id: In(ids) });
  }
}

export const logisticsService = new LogisticsService();
