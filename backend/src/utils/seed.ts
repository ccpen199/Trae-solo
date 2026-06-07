import { AppDataSource } from '../data-source';
import { ServiceCategory } from '../models/ServiceCategory';
import { ServiceSKU } from '../models/ServiceSKU';
import { ProductSKU, ProductCategory } from '../models/ProductSKU';
import { User, UserRole } from '../models/User';
import { ServiceProvider, ProviderStatus } from '../models/ServiceProvider';
import { Order, OrderStatus } from '../models/Order';
import { OrderItem, ItemType } from '../models/OrderItem';
import { OrderLog, LogType } from '../models/OrderLog';
import { SettlementRecord, SettlementStatus } from '../models/SettlementRecord';
import { Dispute, DisputeType, DisputeStatus } from '../models/Dispute';
import { DisputeMessage, MessageSender } from '../models/DisputeMessage';
import { QualityInspectionRule, InspectionTrigger } from '../models/QualityInspectionRule';
import bcrypt from 'bcryptjs';

const categories = [
  { name: '保洁服务', icon: '🧹', description: '日常保洁、深度清洁、开荒保洁' },
  { name: '家电维修', icon: '🔧', description: '空调、冰箱、洗衣机等家电维修' },
  { name: '水电维修', icon: '💡', description: '电路、水管、灯具维修安装' },
  { name: '搬家服务', icon: '📦', description: '居民搬家、公司搬迁、长途搬家' },
  { name: '管道疏通', icon: '🚿', description: '马桶、地漏、下水道疏通' },
  { name: '锁具服务', icon: '🔐', description: '开锁、换锁、指纹锁安装' },
  { name: '墙面翻新', icon: '🎨', description: '刷墙、贴壁纸、墙面修补' },
  { name: '家具安装', icon: '🪑', description: '衣柜、床、书桌等家具安装' },
  { name: '门窗维修', icon: '🚪', description: '门窗维修、纱窗安装、玻璃更换' },
  { name: '家政服务', icon: '👩‍🍳', description: '保姆、月嫂、育儿嫂' },
  { name: '除螨消杀', icon: '🦟', description: '除甲醛、除螨、消毒杀菌' },
  { name: '园艺服务', icon: '🌿', description: '绿植养护、花园设计、修剪' },
];

type ServiceSkuSeed = {
  name: string;
  price: number;
  originalPrice: number;
  duration: number;
  included: string[];
  excluded: string[];
};

const serviceSkus: Record<string, ServiceSkuSeed[]> = {
  保洁服务: [
    { name: '日常保洁2小时', price: 99, originalPrice: 120, duration: 120, included: ['客厅', '卧室', '厨房', '卫生间表面清洁'], excluded: ['油烟机深度清洁', '玻璃外侧清洁'] },
    { name: '深度保洁3小时', price: 199, originalPrice: 240, duration: 180, included: ['全屋深度清洁', '油烟机表面清洁', '玻璃内侧清洁'], excluded: ['开荒保洁', '玻璃外侧清洁'] },
    { name: '开荒保洁', price: 399, originalPrice: 480, duration: 240, included: ['装修后全面清洁', '墙面地面清洁', '窗户清洁'], excluded: ['除甲醛', '家具搬运'] },
  ],
  家电维修: [
    { name: '空调维修检测', price: 50, originalPrice: 80, duration: 60, included: ['故障检测', '基础调试'], excluded: ['配件更换', '加氟'] },
    { name: '冰箱维修', price: 80, originalPrice: 100, duration: 90, included: ['故障检测', '基础维修'], excluded: ['压缩机更换', '配件费用'] },
    { name: '洗衣机维修', price: 60, originalPrice: 80, duration: 60, included: ['故障检测', '基础调试'], excluded: ['配件更换'] },
  ],
  水电维修: [
    { name: '电路检修', price: 80, originalPrice: 100, duration: 60, included: ['故障检测', '简单修复'], excluded: ['材料费', '大工程改造'] },
    { name: '水管维修', price: 100, originalPrice: 120, duration: 90, included: ['漏水检测', '简单修复'], excluded: ['管材费用'] },
    { name: '灯具安装', price: 50, originalPrice: 70, duration: 45, included: ['普通灯具安装', '调试'], excluded: ['灯具费用', '复杂水晶灯'] },
  ],
  搬家服务: [
    { name: '小型搬家', price: 299, originalPrice: 350, duration: 180, included: ['1吨车', '2名工人', '5公里内'], excluded: ['大件家具拆装', '超距离费用'] },
    { name: '中型搬家', price: 499, originalPrice: 580, duration: 240, included: ['2吨车', '3名工人', '10公里内'], excluded: ['大件拆装', '超距离费用'] },
  ],
  管道疏通: [
    { name: '马桶疏通', price: 80, originalPrice: 100, duration: 30, included: ['普通堵塞疏通'], excluded: ['拆卸马桶', '配件更换'] },
    { name: '地漏疏通', price: 60, originalPrice: 80, duration: 30, included: ['普通堵塞疏通'], excluded: ['管道改造'] },
  ],
  锁具服务: [
    { name: '普通开锁', price: 80, originalPrice: 100, duration: 30, included: ['普通门锁开启'], excluded: ['换锁费用'] },
    { name: '换锁服务', price: 120, originalPrice: 150, duration: 45, included: ['人工费用', '普通锁芯'], excluded: ['高端锁具'] },
  ],
  墙面翻新: [
    { name: '墙面修补', price: 150, originalPrice: 180, duration: 120, included: ['小面积修补', '腻子找平'], excluded: ['乳胶漆费用'] },
    { name: '壁纸粘贴', price: 300, originalPrice: 360, duration: 180, included: ['人工费用', '基膜'], excluded: ['壁纸费用'] },
  ],
  家具安装: [
    { name: '衣柜安装', price: 150, originalPrice: 180, duration: 120, included: ['普通衣柜安装'], excluded: ['定制衣柜'] },
    { name: '床安装', price: 100, originalPrice: 120, duration: 60, included: ['普通床安装'], excluded: ['高低床、上下铺'] },
  ],
  门窗维修: [
    { name: '门锁调整', price: 50, originalPrice: 70, duration: 30, included: ['调试、上油'], excluded: ['配件更换'] },
    { name: '纱窗安装', price: 100, originalPrice: 120, duration: 45, included: ['普通纱窗安装'], excluded: ['金刚网纱窗'] },
  ],
  家政服务: [
    { name: '钟点工4小时', price: 150, originalPrice: 180, duration: 240, included: ['家务服务', '做饭'], excluded: ['照顾老人小孩'] },
    { name: '住家保姆', price: 4500, originalPrice: 5000, duration: 0, included: ['住家服务', '家务', '做饭'], excluded: ['特殊护理'] },
  ],
  除螨消杀: [
    { name: '家庭除螨', price: 199, originalPrice: 250, duration: 90, included: ['全屋除螨', '沙发床垫'], excluded: ['除甲醛'] },
    { name: '消毒杀菌', price: 299, originalPrice: 350, duration: 120, included: ['全屋消毒', '空间雾化'], excluded: ['特殊污染物'] },
  ],
  园艺服务: [
    { name: '绿植养护', price: 99, originalPrice: 120, duration: 60, included: ['浇水', '施肥', '修剪'], excluded: ['农资费用'] },
    { name: '花园修剪', price: 299, originalPrice: 350, duration: 180, included: ['灌木修剪', '杂草清理'], excluded: ['大型树木'] },
  ],
};

const products = [
  { name: '厨房水龙头', category: ProductCategory.KITCHEN, price: 199, originalPrice: 259, stock: 50 },
  { name: '不锈钢洗菜盆', category: ProductCategory.KITCHEN, price: 399, originalPrice: 499, stock: 30 },
  { name: '智能马桶盖', category: ProductCategory.BATHROOM, price: 1299, originalPrice: 1599, stock: 20 },
  { name: '淋浴花洒套装', category: ProductCategory.BATHROOM, price: 599, originalPrice: 759, stock: 40 },
  { name: '螺丝刀套装', category: ProductCategory.HARDWARE, price: 49, originalPrice: 69, stock: 200 },
  { name: '电钻家用', category: ProductCategory.HARDWARE, price: 199, originalPrice: 259, stock: 50 },
  { name: 'LED灯泡', category: ProductCategory.ELECTRICAL, price: 19, originalPrice: 29, stock: 500 },
  { name: '排插插线板', category: ProductCategory.ELECTRICAL, price: 39, originalPrice: 59, stock: 300 },
  { name: '多功能清洁剂', category: ProductCategory.CLEANING, price: 29, originalPrice: 45, stock: 500 },
  { name: '厨房油污净', category: ProductCategory.CLEANING, price: 35, originalPrice: 49, stock: 400 },
];

export const seedDatabase = async () => {
  const categoryRepo = AppDataSource.getRepository(ServiceCategory);
  const skuRepo = AppDataSource.getRepository(ServiceSKU);
  const productRepo = AppDataSource.getRepository(ProductSKU);
  const userRepo = AppDataSource.getRepository(User);
  const providerRepo = AppDataSource.getRepository(ServiceProvider);
  const orderRepo = AppDataSource.getRepository(Order);
  const orderItemRepo = AppDataSource.getRepository(OrderItem);
  const orderLogRepo = AppDataSource.getRepository(OrderLog);
  const settlementRepo = AppDataSource.getRepository(SettlementRecord);
  const inspectionRuleRepo = AppDataSource.getRepository(QualityInspectionRule);
  const hashedPassword = await bcrypt.hash('123456', 10);

  const ensureUser = async (data: Partial<User> & { phone: string; name: string; role: UserRole }) => {
    const userData: Partial<User> = { ...data, password: data.password || hashedPassword };
    const existing = await userRepo.findOne({ where: { phone: data.phone } });
    if (existing) {
      userRepo.merge(existing, userData);
      return userRepo.save(existing);
    }

    return userRepo.save(userRepo.create(userData));
  };

  const ensureProviderProfile = async (
    user: User,
    status: ProviderStatus,
    companyName: string,
  ) => {
    const providerData: Partial<ServiceProvider> = {
      status,
      companyName,
      businessLicense: `DEMO-${user.phone}`,
      idCardFront: 'demo-id-card-front.png',
      idCardBack: 'demo-id-card-back.png',
      qualificationCertificate: 'demo-certificate.png',
      serviceAreas: ['北京市朝阳区', '北京市海淀区'],
      bankInfo: {
        bankName: '演示银行',
        accountNumber: `622200${user.phone}`,
        accountName: user.name,
      },
      pendingSettlement: 0,
      totalEarnings: 0,
    };
    const existing = await providerRepo.findOne({ where: { userId: user.id } });
    if (existing) {
      providerRepo.merge(existing, { user, ...providerData });
      return providerRepo.save(existing);
    }

    return providerRepo.save(providerRepo.create({
      user,
      userId: user.id,
      ...providerData,
    }));
  };

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    let category = await categoryRepo.findOne({ where: { name: cat.name } });
    const categoryData: Partial<ServiceCategory> = {
      icon: cat.icon,
      description: cat.description,
      sortOrder: i,
      isActive: true,
    };
    if (category) {
      categoryRepo.merge(category, categoryData);
    } else {
      category = categoryRepo.create({ name: cat.name, ...categoryData });
    }
    category = await categoryRepo.save(category);

    const skus = serviceSkus[cat.name] || [];
    for (const sku of skus) {
      let serviceSku = await skuRepo.findOne({
        where: { name: sku.name, categoryId: category.id },
      });
      const skuData: Partial<ServiceSKU> = {
        name: sku.name,
        price: sku.price,
        originalPrice: sku.originalPrice,
        duration: sku.duration,
        includedItems: sku.included,
        excludedItems: sku.excluded,
        categoryId: category.id,
        isActive: true,
      };
      if (serviceSku) {
        skuRepo.merge(serviceSku, skuData);
      } else {
        serviceSku = skuRepo.create(skuData);
      }
      await skuRepo.save(serviceSku);
    }
  }

  for (const product of products) {
    let productSku = await productRepo.findOne({
      where: { name: product.name, category: product.category },
    });
    const productData: Partial<ProductSKU> = {
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      description: `${product.name} - 高品质自营商品`,
      isActive: true,
    };
    if (productSku) {
      productRepo.merge(productSku, productData);
    } else {
      productSku = productRepo.create(productData);
    }
    await productRepo.save(productSku);
  }

  await ensureUser({
    phone: '13800000000',
    name: '系统管理员',
    role: UserRole.ADMIN,
    isVerified: true,
  });

  const provider = await ensureUser({
    phone: '13900000000',
    name: '张师傅',
    role: UserRole.PROVIDER,
    isVerified: true,
    faceVerified: true,
    rating: 4.8,
    orderCount: 156,
    address: '北京市朝阳区望京街道',
    latitude: 39.9892,
    longitude: 116.4714,
    skills: [1, 2, 3],
    tools: ['吸尘器', '拖把', '清洁工具套装', '油烟机清洗剂'],
  });
  await ensureProviderProfile(provider, ProviderStatus.APPROVED, '张师傅家政服务中心');

  const provider2 = await ensureUser({
    phone: '13900000001',
    name: '李师傅',
    role: UserRole.PROVIDER,
    isVerified: true,
    faceVerified: true,
    rating: 4.9,
    orderCount: 203,
    address: '北京市海淀区中关村',
    latitude: 39.9842,
    longitude: 116.3074,
    skills: [2, 4, 5],
    tools: ['扳手套装', '螺丝刀', '电钻', '检测仪'],
  });
  await ensureProviderProfile(provider2, ProviderStatus.APPROVED, '李师傅维修服务中心');

  const pendingProviders = [
    { phone: '13900000010', name: '王师傅', companyName: '安心保洁服务部' },
    { phone: '13900000011', name: '赵师傅', companyName: '快修到家服务站' },
    { phone: '13900000012', name: '孙师傅', companyName: '社区搬家服务队' },
  ];

  for (const pending of pendingProviders) {
    const pendingUser = await ensureUser({
      phone: pending.phone,
      name: pending.name,
      role: UserRole.PROVIDER,
      isVerified: false,
      faceVerified: true,
      rating: 5,
      orderCount: 0,
      address: '北京市朝阳区演示街道',
      latitude: 39.9892,
      longitude: 116.4714,
      skills: [1, 2],
      tools: ['身份证', '技能证书', '人脸识别认证'],
    });
    await ensureProviderProfile(pendingUser, ProviderStatus.PENDING_REVIEW, pending.companyName);
  }

  const customer = await ensureUser({
    phone: '13600000000',
    name: '王先生',
    role: UserRole.CUSTOMER,
    isVerified: true,
    address: '北京市朝阳区三里屯',
    latitude: 39.9339,
    longitude: 116.4521,
  });

  const allSkus = await skuRepo.find({ relations: { category: true } as any });
  const demoOrders = [
    {
      orderNo: 'HS-DEMO-1001',
      status: OrderStatus.DISPATCHED,
      skuIndex: 0,
      provider,
      address: '北京市朝阳区三里屯太古里 8 号楼',
      scheduledTime: new Date(Date.now() + 2 * 3600000),
      notes: '预约时间已确认，系统已派单给距离 3.2km 的张师傅。',
      logs: ['订单创建成功', '系统自动派单给张师傅', '师傅已确认 2 小时内上门']
    },
    {
      orderNo: 'HS-DEMO-1002',
      status: OrderStatus.ACCEPTED,
      skuIndex: 1,
      provider,
      address: '北京市朝阳区三里屯太古里 12 号楼',
      scheduledTime: new Date(Date.now() + 4 * 3600000),
      notes: '深度保洁已确认上门时间。',
      logs: ['订单创建成功', '系统自动派单给张师傅', '张师傅已接单']
    },
    {
      orderNo: 'HS-DEMO-1003',
      status: OrderStatus.IN_PROGRESS,
      skuIndex: 3,
      provider: provider2,
      address: '北京市海淀区中关村软件园 A 座',
      scheduledTime: new Date(Date.now() - 3600000),
      notes: '现场照片和施工进度已留痕，预计 30 分钟完成。',
      logs: ['订单创建成功', '李师傅已接单', '师傅已到达现场', '服务进行中，已上传现场照片']
    },
    {
      orderNo: 'HS-DEMO-1004',
      status: OrderStatus.COMPLETED,
      skuIndex: 2,
      provider,
      address: '北京市朝阳区望京 SOHO T3',
      scheduledTime: new Date(Date.now() - 86400000),
      notes: '客户已验收，待 T+1 结算。',
      logs: ['订单创建成功', '张师傅已接单', '客户确认上门', '服务已完成并验收']
    },
    {
      orderNo: 'HS-DEMO-1005',
      status: OrderStatus.SETTLED,
      skuIndex: 6,
      provider: provider2,
      address: '北京市海淀区五道口华联商厦',
      scheduledTime: new Date(Date.now() - 3 * 86400000),
      notes: '小型搬家已完成，费用已结算。',
      logs: ['订单创建成功', '李师傅已接单', '师傅已到达现场', '搬家服务完成', '客户验收确认', '费用已结算至师傅账户']
    },
  ];

  for (const item of demoOrders) {
    let order = await orderRepo.findOne({ where: { orderNo: item.orderNo } });
    const sku = allSkus[item.skuIndex] || allSkus[0];
    const totalAmount = Number(sku.price);
    if (!order) {
      order = await orderRepo.save(orderRepo.create({
        orderNo: item.orderNo,
        customerId: customer.id,
        providerId: item.provider.id,
        status: item.status,
        totalAmount,
        platformFee: Number((totalAmount * 0.1).toFixed(2)),
        serviceFee: 0,
        customerAddress: item.address,
        latitude: customer.latitude,
        longitude: customer.longitude,
        scheduledTime: item.scheduledTime,
        customerNotes: item.notes,
        acceptedTime: item.status !== OrderStatus.PENDING_DISPATCH ? item.scheduledTime : undefined,
        startedTime: item.status === OrderStatus.IN_PROGRESS || item.status === OrderStatus.COMPLETED || item.status === OrderStatus.SETTLED ? item.scheduledTime : undefined,
        completedTime: item.status === OrderStatus.COMPLETED || item.status === OrderStatus.SETTLED ? new Date(Date.now() - 2 * 3600000) : undefined,
      }));

      await orderItemRepo.save(orderItemRepo.create({
        orderId: order.id,
        type: ItemType.SERVICE,
        serviceSkuId: sku.id,
        name: sku.name,
        price: totalAmount,
        quantity: 1,
        subtotal: totalAmount,
      }));

      for (const message of item.logs) {
        await orderLogRepo.save(orderLogRepo.create({
          orderId: order.id,
          operatorId: item.provider.id,
          type: LogType.STATUS_CHANGE,
          message,
          metadata: { source: 'demo-seed' },
        }));
      }
    }

    if (item.status === OrderStatus.COMPLETED || item.status === OrderStatus.SETTLED) {
      const existingSettlement = await settlementRepo.findOne({ where: { orderId: order.id } });
      if (!existingSettlement) {
        await settlementRepo.save(settlementRepo.create({
          settlementNo: `SET-DEMO-${order.id}`,
          providerId: item.provider.id,
          orderId: order.id,
          orderAmount: totalAmount,
          platformFee: Number((totalAmount * 0.1).toFixed(2)),
          settlementAmount: Number((totalAmount * 0.9).toFixed(2)),
          status: item.status === OrderStatus.SETTLED ? SettlementStatus.COMPLETED : SettlementStatus.PENDING,
          settlementDays: item.status === OrderStatus.SETTLED ? 0 : 1,
          scheduledDate: item.status === OrderStatus.SETTLED ? new Date(Date.now() - 86400000) : new Date(Date.now() + 86400000),
          settledDate: item.status === OrderStatus.SETTLED ? new Date(Date.now() - 86400000) : undefined,
          bankAccount: '演示银行 622200********001',
          remarks: item.status === OrderStatus.SETTLED ? 'T+1 已结算完成' : 'T+1 自动生成待结算记录',
        }));
      }
    }
  }

  const disputedOrder = await orderRepo.findOne({ where: { orderNo: 'HS-DEMO-1001' } });
  if (disputedOrder) {
    const existingDispute = await AppDataSource.getRepository(Dispute).findOne({ where: { orderId: disputedOrder.id } });
    if (!existingDispute) {
      const dispute = await AppDataSource.getRepository(Dispute).save(AppDataSource.getRepository(Dispute).create({
        orderId: disputedOrder.id,
        initiatorId: customer.id,
        type: DisputeType.QUALITY,
        description: '服务质量不满意，清洁不彻底，厨房油污未清理干净',
        evidence: ['照片显示厨房油污未清理干净', '卫生间地面有明显水渍'],
        requestedRefund: 50,
        status: DisputeStatus.OPEN,
      }));
      const disputeMessages = [
        { senderId: customer.id, senderType: MessageSender.CUSTOMER, content: '清洁质量不满意，要求部分退款' },
        { senderId: provider.id, senderType: MessageSender.PROVIDER, content: '已按标准完成服务，可提供现场照片证明' },
      ];
      for (const msg of disputeMessages) {
        await AppDataSource.getRepository(DisputeMessage).save(AppDataSource.getRepository(DisputeMessage).create({
          disputeId: dispute.id,
          senderId: msg.senderId,
          senderType: msg.senderType,
          content: msg.content,
        }));
      }
    }
  }

  const demoRules = [
    {
      name: '上门服务标准质检',
      description: '覆盖服务态度、准时到达、工具携带和现场清洁的基础抽检规则。',
      trigger: InspectionTrigger.RANDOM,
      samplingRate: 20,
      checkItems: [
        { id: 'attitude', name: '服务态度', description: '沟通礼貌，按流程确认需求', required: true, scoreWeight: 30 },
        { id: 'arrival', name: '准时到达', description: '按预约时间上门并完成签到', required: true, scoreWeight: 25 },
        { id: 'tools', name: '工具齐全', description: '携带服务所需工具和耗材', required: true, scoreWeight: 25 },
        { id: 'cleanup', name: '现场清洁', description: '服务结束后清理现场并留存照片', required: false, scoreWeight: 20 },
      ],
    },
    {
      name: '投诉订单必检',
      description: '客户投诉或争议订单进入复核流程，要求记录证据和处理结论。',
      trigger: InspectionTrigger.COMPLAINT,
      samplingRate: 100,
      checkItems: [
        { id: 'evidence', name: '证据完整', description: '核验沟通记录、照片和轨迹信息', required: true, scoreWeight: 40 },
        { id: 'response', name: '响应时效', description: '客服与服务商在规定时间内响应', required: true, scoreWeight: 30 },
        { id: 'resolution', name: '处理结论', description: '赔付、返工或解释结论明确', required: true, scoreWeight: 30 },
      ],
    },
  ];

  for (const ruleData of demoRules) {
    let rule = await inspectionRuleRepo.findOne({ where: { name: ruleData.name } });
    const payload: Partial<QualityInspectionRule> = {
      ...ruleData,
      totalScore: 100,
      passingScore: 80,
      isActive: true,
    };
    if (rule) {
      inspectionRuleRepo.merge(rule, payload);
    } else {
      rule = inspectionRuleRepo.create(payload);
    }
    await inspectionRuleRepo.save(rule);
  }

  console.log('Database seed complete');
};
