import { AuditAction, OrderStatus } from '../types/constants';
import prisma from '../lib/prisma';
import { JWTPayload } from '../types';
import { createAuditLog, getChangeSummary } from '../services/audit.service';
import { generateContractNo } from '../utils/auth';

interface ContractData {
  orderId: string;
  version?: string;
  content?: string;
}

interface InsuranceData {
  orderId: string;
  company: string;
  policyType: string;
  coverage: number;
  premium: number;
  startDate: Date;
  endDate: Date;
}

interface TouristProfile {
  userId: string;
  orders: any[];
  passengers: any[];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date | null;
}

export class TouristEngine {
  async getTouristProfile(touristId: string): Promise<TouristProfile> {
    const orders = await prisma.order.findMany({
      where: {
        touristId,
        isArchived: false,
      },
      include: {
        group: {
          include: {
            tour: true,
          },
        },
        passengers: true,
        contracts: true,
        insurance: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalSpent = orders
      .filter((o) => o.status === OrderStatus.PAID || o.status === OrderStatus.CONFIRMED)
      .reduce((sum, order) => sum + order.paidAmount.toNumber(), 0);

    const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;

    const passengers = await prisma.passenger.findMany({
      where: {
        order: {
          touristId,
        },
      },
      distinct: ['idNumber'],
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      userId: touristId,
      orders,
      passengers,
      totalOrders: orders.length,
      totalSpent,
      lastOrderDate,
    };
  }

  async generateContract(user: JWTPayload, params: ContractData): Promise<Contract> {
    const { orderId, version = '1.0' } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        group: {
          include: {
            tour: true,
          },
        },
        tourist: true,
        passengers: true,
      },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    const existingContract = await prisma.contract.findFirst({
      where: { orderId, version },
    });

    if (existingContract && !params.content) {
      return existingContract;
    }

    const contractContent = params.content || this.generateContractContent(order);

    const contractNo = generateContractNo();

    const contract = await prisma.contract.create({
      data: {
        orderId,
        contractNo,
        version,
        content: contractContent,
      },
    });

    await createAuditLog({
      user,
      action: AuditAction.CREATE,
      entityType: 'Contract',
      entityId: contract.id,
      entityName: contract.contractNo,
      newValue: {
        orderNo: order.orderNo,
        version,
        contractNo: contract.contractNo,
      },
    });

    return contract;
  }

  private generateContractContent(order: any): string {
    const { group, tourist, passengers, orderNo, totalAmount, adultCount, childCount } = order;
    const { tour } = group;

    const passengerList = passengers.map((p: any, index: number) =>
      `${index + 1}. ${p.name} - ${p.idType}: ${p.idNumber}`
    ).join('\n');

    return `
旅游服务合同

合同编号：${generateContractNo()}
签订日期：${new Date().toLocaleDateString()}

一、服务内容
1. 线路名称：${tour.name}
2. 行程日期：${group.startDate.toLocaleDateString()} 至 ${group.endDate.toLocaleDateString()}
3. 行程天数：${tour.days}天${tour.nights}晚
4. 目的地：${tour.destination}

二、报名信息
1. 订单编号：${orderNo}
2. 报名人：${tourist.name}
3. 联系电话：${order.contactPhone}
4. 成人数：${adultCount}
5. 儿童数：${childCount}

三、游客名单
${passengerList}

四、费用说明
1. 总费用：人民币 ${totalAmount.toString()} 元
2. 费用包含：${tour.includeItems || '详见行程说明'}
3. 费用不含：${tour.excludeItems || '详见行程说明'}

五、双方权利与义务
（详细条款略）

六、其他约定
1. 本合同一式两份，双方各执一份
2. 未尽事宜，双方另行协商解决

甲方（游客）：________________
日期：________________

乙方（旅行社）：________________
日期：________________
    `.trim();
  }

  async generateInsurance(user: JWTPayload, params: InsuranceData): Promise<Insurance> {
    const { orderId, company, policyType, coverage, premium, startDate, endDate } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        group: true,
        passengers: true,
      },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    const insuranceNo = this.generateInsuranceNo();

    const insurance = await prisma.insurance.create({
      data: {
        orderId,
        insuranceNo,
        company,
        policyType,
        coverage,
        premium,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
    });

    await createAuditLog({
      user,
      action: AuditAction.CREATE,
      entityType: 'Insurance',
      entityId: insurance.id,
      entityName: insurance.insuranceNo,
      newValue: {
        company,
        policyType,
        coverage: coverage.toString(),
        premium: premium.toString(),
      },
    });

    return insurance;
  }

  async generateTravelNotice(orderId: string): Promise<string> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        group: {
          include: {
            tour: true,
            itineraryDays: {
              orderBy: { dayNumber: 'asc' },
            },
          },
        },
        tourist: true,
        passengers: true,
      },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    const { group, tourist, passengers } = order;
    const { tour, itineraryDays } = group;

    const itinerarySummary = itineraryDays.map((day) => `
第${day.dayNumber}天：${day.title}
  早餐：${day.breakfast || '自理'}
  午餐：${day.lunch || '自理'}
  晚餐：${day.dinner || '自理'}
  住宿：${day.hotel || '无'}
  景点：${day.attractions || '详见行程'}
    `.trim()).join('\n\n');

    const passengerList = passengers.map((p, index) =>
      `${index + 1}. ${p.name} (${p.isChild ? '儿童' : '成人'}) - 证件号: ${p.idNumber}`
    ).join('\n');

    return `
出行通知书

================================================================================

尊敬的${tourist.name}先生/女士：

您好！感谢您选择我们的旅游服务。以下是您的行程信息，请仔细阅读。

================================================================================

一、基本信息
--------------------------------------------------------------------------------
订单编号：${order.orderNo}
线路名称：${tour.name}
目的地：${tour.destination}
行程日期：${group.startDate.toLocaleDateString()} 至 ${group.endDate.toLocaleDateString()}
行程天数：${tour.days}天${tour.nights}晚
集合地点：${group.departurePoint || '出发前另行通知'}
集合时间：${group.meetingTime || '出发前另行通知'}

================================================================================

二、游客名单
--------------------------------------------------------------------------------
${passengerList}

================================================================================

三、行程安排
--------------------------------------------------------------------------------
${itinerarySummary}

================================================================================

四、注意事项
--------------------------------------------------------------------------------
1. 请携带有效身份证件原件（身份证、护照等）
2. 请提前到达集合地点，不要迟到
3. 行程中请遵守时间，不要擅自离队
4. 请妥善保管个人财物
5. 如有特殊饮食需求，请提前告知导游
6. 出行前请检查天气情况，准备合适的衣物
7. 建议购买旅游意外险

================================================================================

五、联系方式
--------------------------------------------------------------------------------
紧急联系电话：400-123-4567
导游联系电话：出团前将通过短信发送

================================================================================

祝您旅途愉快！

旅行社敬上
${new Date().toLocaleDateString()}
    `.trim();
  }

  async generateInsuranceList(orderId: string): Promise<string> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        group: {
          include: { tour: true },
        },
        tourist: true,
        passengers: true,
        insurance: true,
      },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    const insuranceList = order.insurance.map((ins, index) => `
保单 ${index + 1}:
  保单号：${ins.insuranceNo}
  保险公司：${ins.company}
  险种：${ins.policyType}
  保额：${ins.coverage.toString()} 元
  保费：${ins.premium.toString()} 元
  保险期间：${ins.startDate.toLocaleDateString()} 至 ${ins.endDate.toLocaleDateString()}
    `.trim()).join('\n\n');

    const passengerList = order.passengers.map((p, index) =>
      `${index + 1}. ${p.name} - ${p.idType}: ${p.idNumber}`
    ).join('\n');

    return `
保险清单

================================================================================

订单编号：${order.orderNo}
线路名称：${order.group.tour.name}
投保人：${order.tourist.name}
联系电话：${order.contactPhone}

================================================================================

一、被保险人名单
--------------------------------------------------------------------------------
${passengerList}

================================================================================

二、保险信息
--------------------------------------------------------------------------------
${insuranceList || '暂无投保记录'}

================================================================================

三、投保说明
--------------------------------------------------------------------------------
1. 本保险由旅行社代投保
2. 详细条款以保险公司正式保单为准
3. 出险时请及时拨打保险公司报案电话

================================================================================

旅行社
${new Date().toLocaleDateString()}
    `.trim();
  }

  private generateInsuranceNo(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INS${timestamp}${random}`;
  }

  async getTouristTravelHistory(touristId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          touristId,
          status: {
            in: ['PAID', 'CONFIRMED', 'COMPLETED'],
          },
          isArchived: false,
        },
        include: {
          group: {
            include: {
              tour: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.order.count({
        where: {
          touristId,
          status: {
            in: ['PAID', 'CONFIRMED', 'COMPLETED'],
          },
          isArchived: false,
        },
      }),
    ]);

    return {
      data: orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

export const touristEngine = new TouristEngine();
