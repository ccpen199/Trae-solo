const sequelize = require('../config/database');
const User = require('./User');
const ServiceProvider = require('./ServiceProvider');
const ServiceProduct = require('./ServiceProduct');
const Order = require('./Order');
const SubOrder = require('./SubOrder');
const RiskEventLog = require('./RiskEventLog');
const Coupon = require('./Coupon');
const Arbitration = require('./Arbitration');
const FeeConfig = require('./FeeConfig');
const bcrypt = require('bcryptjs');

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
User.hasMany(Coupon, { foreignKey: 'user_id', as: 'coupons' });
User.hasMany(RiskEventLog, { foreignKey: 'user_id', as: 'riskEvents' });
User.hasMany(Arbitration, { foreignKey: 'initiator_id', as: 'arbitrations' });

Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Order.belongsTo(ServiceProvider, { foreignKey: 'provider_id', as: 'provider' });
Order.hasMany(SubOrder, { foreignKey: 'order_id', as: 'subOrders' });
Order.hasMany(RiskEventLog, { foreignKey: 'order_id', as: 'riskEvents' });
Order.hasMany(Arbitration, { foreignKey: 'order_id', as: 'arbitrations' });

SubOrder.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

ServiceProvider.hasMany(ServiceProduct, { foreignKey: 'provider_id', as: 'products' });
ServiceProvider.hasMany(Order, { foreignKey: 'provider_id', as: 'orders' });
ServiceProvider.hasMany(FeeConfig, { foreignKey: 'provider_id', as: 'feeConfigs' });

ServiceProduct.belongsTo(ServiceProvider, { foreignKey: 'provider_id', as: 'provider' });

Coupon.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Arbitration.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Arbitration.belongsTo(User, { foreignKey: 'initiator_id', as: 'initiator' });

FeeConfig.belongsTo(ServiceProvider, { foreignKey: 'provider_id', as: 'provider' });

RiskEventLog.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
RiskEventLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

const db = {
  sequelize,
  User,
  ServiceProvider,
  ServiceProduct,
  Order,
  SubOrder,
  RiskEventLog,
  Coupon,
  Arbitration,
  FeeConfig,
};

db.sync = async () => {
  await sequelize.query('PRAGMA busy_timeout = 10000');
  await sequelize.sync();
  await seedDemoData();
};

async function ensureUser({ phone, password, role, real_name, id_card, wallet_balance = 0, has_bank_card = false }) {
  const hash = await bcrypt.hash(password, 10);
  const [user] = await User.findOrCreate({
    where: { phone },
    defaults: {
      phone,
      password: hash,
      role,
      real_name,
      id_card,
      id_card_verified: Boolean(id_card),
      has_bank_card,
      wallet_balance,
      status: 'active',
    },
  });

  await user.update({
    password: hash,
    role,
    real_name,
    id_card: id_card || user.id_card,
    id_card_verified: Boolean(id_card) || user.id_card_verified,
    has_bank_card,
    wallet_balance,
    status: 'active',
  });

  return user;
}

async function ensureProvider(data) {
  const [provider] = await ServiceProvider.findOrCreate({
    where: { license_no: data.license_no },
    defaults: data,
  });
  await provider.update(data);
  return provider;
}

async function ensureProduct(data) {
  const [product] = await ServiceProduct.findOrCreate({
    where: { sku_code: data.sku_code },
    defaults: data,
  });
  await product.update(data);
  return product;
}

async function ensureFeeConfig(data) {
  const existing = await FeeConfig.findOne({
    where: {
      category: data.category,
      provider_id: data.provider_id,
      effective_date: data.effective_date,
    },
  });

  if (existing) {
    await existing.update(data);
    return existing;
  }

  return FeeConfig.create(data);
}

async function seedDemoData() {
  const admin = await ensureUser({
    phone: '13800000001',
    password: 'admin123',
    role: 'admin',
    real_name: '中台管理员',
    id_card: '110101198801010011',
    wallet_balance: 5000,
    has_bank_card: true,
  });
  const merchant = await ensureUser({
    phone: '13800000002',
    password: 'merchant123',
    role: 'merchant',
    real_name: '商户运营',
    id_card: '110101198802020022',
    wallet_balance: 2600,
    has_bank_card: true,
  });
  const user = await ensureUser({
    phone: '13800000003',
    password: 'user123',
    role: 'user',
    real_name: '普通用户',
    id_card: '110101198803030033',
    wallet_balance: 888.88,
    has_bank_card: false,
  });

  const providerSeeds = [
    {
      name: '蓝鲸外卖服务',
      license_no: 'LIFE-FOOD-001',
      category: 'food_delivery',
      category_detail: '餐饮配送',
      status: 'approved',
      settlement_cycle: 'daily',
      contact_name: '王经理',
      contact_phone: '13810001001',
      remark: '覆盖核心商圈，可承接餐饮即时配送。',
      audit_by: admin.id,
      audit_at: new Date(),
    },
    {
      name: '城市出行聚合',
      license_no: 'LIFE-RIDE-001',
      category: 'ride_hailing',
      category_detail: '网约车',
      status: 'approved',
      settlement_cycle: 'weekly',
      contact_name: '李经理',
      contact_phone: '13810001002',
      remark: '支持打车、接送机与企业用车。',
      audit_by: admin.id,
      audit_at: new Date(),
    },
    {
      name: '政务缴费通',
      license_no: 'LIFE-GOV-001',
      category: 'gov_payment',
      category_detail: '水电燃缴费',
      status: 'pending',
      settlement_cycle: 'monthly',
      contact_name: '赵经理',
      contact_phone: '13810001003',
      remark: '待补充对账接口资料。',
    },
    {
      name: '建行优选超市',
      license_no: 'LIFE-RETAIL-001',
      category: 'retail',
      category_detail: '商超零售',
      status: 'approved',
      settlement_cycle: 'daily',
      contact_name: '陈经理',
      contact_phone: '13810001004',
      remark: '支持商超到家和优惠券核销。',
      audit_by: admin.id,
      audit_at: new Date(),
    },
  ];

  const providers = [];
  for (const provider of providerSeeds) {
    providers.push(await ensureProvider(provider));
  }

  const providerByCategory = Object.fromEntries(providers.map((p) => [p.category, p]));

  const productSeeds = [
    {
      provider_id: providerByCategory.food_delivery.id,
      name: '工作日午餐套餐',
      category: 'food_delivery',
      sku_code: 'FD-LUNCH-001',
      price: 36.8,
      original_price: 45.0,
      description: '覆盖白领午餐场景，支持钱包与优惠券混合支付。',
      spec: JSON.stringify({ delivery: '30分钟达', package: '主食+饮品' }),
      status: 'on_sale',
    },
    {
      provider_id: providerByCategory.ride_hailing.id,
      name: '城市快车券',
      category: 'ride_hailing',
      sku_code: 'RH-CITY-001',
      price: 50,
      original_price: 60,
      description: '适用于市内出行订单。',
      spec: JSON.stringify({ distance: '20公里内', validDays: 30 }),
      status: 'on_sale',
    },
    {
      provider_id: providerByCategory.gov_payment.id,
      name: '燃气缴费代扣',
      category: 'gov_payment',
      sku_code: 'GP-GAS-001',
      price: 100,
      original_price: 100,
      description: '政务缴费代扣服务。',
      spec: JSON.stringify({ channel: '政务缴费通' }),
      status: 'on_sale',
    },
    {
      provider_id: providerByCategory.retail.id,
      name: '商超满减券',
      category: 'retail',
      sku_code: 'RT-COUPON-001',
      price: 88,
      original_price: 100,
      description: '建行生活商超频道满减权益。',
      spec: JSON.stringify({ threshold: '满100减12' }),
      status: 'on_sale',
    },
  ];

  for (const product of productSeeds) {
    await ensureProduct(product);
  }

  const feeSeeds = [
    {
      category: 'food_delivery',
      provider_id: providerByCategory.food_delivery.id,
      fee_rate: 0.018,
      min_fee: 0.2,
      max_fee: 8,
      effective_date: '2026-06-01',
      status: 'active',
    },
    {
      category: 'ride_hailing',
      provider_id: providerByCategory.ride_hailing.id,
      fee_rate: 0.015,
      min_fee: 0.1,
      max_fee: 12,
      effective_date: '2026-06-01',
      status: 'active',
    },
    {
      category: 'retail',
      provider_id: providerByCategory.retail.id,
      fee_rate: 0.012,
      min_fee: 0.1,
      max_fee: 6,
      effective_date: '2026-06-01',
      status: 'active',
    },
  ];

  for (const feeConfig of feeSeeds) {
    await ensureFeeConfig(feeConfig);
  }

  const orderCount = await Order.count();
  if (orderCount === 0) {
    const orders = await Order.bulkCreate([
      {
        order_no: 'ORD-DEMO-FOOD-001',
        user_id: user.id,
        provider_id: providerByCategory.food_delivery.id,
        category: 'food_delivery',
        total_amount: 36.8,
        status: 'paid',
        pay_method: 'mixed',
        city: '北京',
        remark: '午餐套餐订单',
      },
      {
        order_no: 'ORD-DEMO-RIDE-001',
        user_id: user.id,
        provider_id: providerByCategory.ride_hailing.id,
        category: 'ride_hailing',
        total_amount: 50,
        status: 'completed',
        pay_method: 'wallet',
        city: '上海',
        remark: '市内出行订单',
      },
      {
        order_no: 'ORD-DEMO-RETAIL-001',
        user_id: user.id,
        provider_id: providerByCategory.retail.id,
        category: 'retail',
        total_amount: 88,
        status: 'disputed',
        pay_method: 'coupon',
        city: '深圳',
        remark: '优惠券核销异常',
      },
    ]);

    await SubOrder.bulkCreate([
      { order_id: orders[0].id, type: 'meal', amount: 32.8, status: 'processing' },
      { order_id: orders[0].id, type: 'delivery', amount: 4, status: 'processing' },
      { order_id: orders[1].id, type: 'delivery', amount: 50, status: 'completed' },
      { order_id: orders[2].id, type: 'payment', amount: 88, status: 'failed' },
    ]);

    await Arbitration.create({
      order_id: orders[2].id,
      initiator_id: user.id,
      reason: '优惠券核销失败，用户申请仲裁。',
      status: 'pending',
    });

    await RiskEventLog.bulkCreate([
      {
        order_id: orders[2].id,
        user_id: user.id,
        event_type: 'abnormal_amount',
        severity: 'medium',
        detail: '商超优惠券核销失败后重复发起支付。',
        handled: false,
      },
      {
        order_id: orders[0].id,
        user_id: user.id,
        event_type: 'frequency_alert',
        severity: 'low',
        detail: '同一手机号短时间内多次下单，已进入观察队列。',
        handled: true,
        handle_result: '核验为正常家庭消费。',
      },
    ]);
  }

  const couponCount = await Coupon.count();
  if (couponCount === 0) {
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 30);
    await Coupon.bulkCreate([
      {
        user_id: user.id,
        code: 'CCB-LIFE-FOOD-10',
        amount: 10,
        min_spend: 30,
        category: 'food_delivery',
        status: 'available',
        expired_at: expiredAt,
      },
      {
        user_id: user.id,
        code: 'CCB-LIFE-RETAIL-20',
        amount: 20,
        min_spend: 100,
        category: 'retail',
        status: 'available',
        expired_at: expiredAt,
      },
    ]);
  }
}

module.exports = db;
