const { db } = require('../database/init');
const PaymentCenterService = require('./paymentCenterService');
const UserCenterService = require('./userCenterService');
const InventoryService = require('./inventoryService');

class BusinessLineService {
  
  static getAllBusinessLines() {
    return db.prepare(`
      SELECT bl.*, bpa.balance as account_balance, bpa.total_used
      FROM business_lines bl
      LEFT JOIN business_point_accounts bpa ON bl.id = bpa.business_line_id
      WHERE bl.status = 1
      ORDER BY bl.id
    `).all();
  }

  static getBusinessLineById(id) {
    return db.prepare(`
      SELECT bl.*, bpa.balance as account_balance, bpa.total_used, bpa.total_allocated
      FROM business_lines bl
      LEFT JOIN business_point_accounts bpa ON bl.id = bpa.business_line_id
      WHERE bl.id = ? AND bl.status = 1
    `).get(id);
  }

  static getBusinessLineByCode(code) {
    return db.prepare(`
      SELECT bl.*, bpa.balance as account_balance, bpa.total_used
      FROM business_lines bl
      LEFT JOIN business_point_accounts bpa ON bl.id = bpa.business_line_id
      WHERE bl.code = ? AND bl.status = 1
    `).get(code);
  }

  static simulateBusinessPurchase(userId, businessLineId, productCode, originalAmount, customPointCoefficient = null) {
    const businessLine = this.getBusinessLineById(businessLineId);
    if (!businessLine) {
      throw new Error('业务线不存在或已停用');
    }

    const stockCheck = InventoryService.checkStock(productCode);
    if (!stockCheck.available) {
      throw new Error(stockCheck.message || '产品库存不足');
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const discountInfo = UserCenterService.getBusinessLineDiscounts(userId, businessLineId);
    const discountCalc = UserCenterService.calculateLevelDiscount(originalAmount, discountInfo);

    const order = PaymentCenterService.createOrder(
      userId,
      businessLineId,
      originalAmount,
      discountCalc.discountAmount,
      0
    );

    const paymentResult = PaymentCenterService.completePayment(order.orderId);

    const deductResult = InventoryService.deductStock(productCode, order.orderId);
    console.log(`库存扣减: ${productCode}, 订单: ${order.orderId}, 扣减前: ${deductResult.stockBefore}, 扣减后: ${deductResult.stockAfter}`);

    let pointResult = null;
    try {
      pointResult = PaymentCenterService.distributePoints(order.orderId, customPointCoefficient);
    } catch (e) {
      console.error('积分发放失败:', e.message);
    }

    let growthResult = null;
    try {
      growthResult = UserCenterService.processGrowthFromOrder(order.orderId);
    } catch (e) {
      console.error('成长值计算失败:', e.message);
    }

    const orderDetail = PaymentCenterService.getOrderDetail(order.orderId);
    const updatedUserInfo = UserCenterService.getUserInfo(userId);

    return {
      success: true,
      purchaseSummary: {
        businessLineName: businessLine.name,
        businessLineCode: businessLine.code,
        productCode,
        originalAmount,
        levelDiscount: discountCalc.discountAmount,
        levelDiscountPercent: discountInfo.hasDiscount ? (1 - discountInfo.discountPercent) * 100 : 0,
        payAmount: order.payAmount
      },
      orderDetail,
      pointResult,
      growthResult,
      inventoryUpdate: deductResult,
      userAfterPurchase: {
        level: updatedUserInfo.user.level_name,
        levelCode: updatedUserInfo.user.level_code,
        totalPoints: updatedUserInfo.user.total_points,
        availablePoints: updatedUserInfo.user.available_points,
        totalGrowth: updatedUserInfo.user.total_growth,
        currentGrowth: updatedUserInfo.user.current_growth,
        levelUpgraded: growthResult?.upgradeResult?.upgraded || false,
        progressToNext: updatedUserInfo.progressToNext
      }
    };
  }

  static getBusinessLineProducts(businessLineId) {
    const businessLine = this.getBusinessLineById(businessLineId);
    if (!businessLine) {
      return null;
    }

    const dbProducts = InventoryService.getProductsByBusinessLine(businessLine.code);
    
    if (dbProducts && dbProducts.length > 0) {
      return {
        businessLine,
        products: dbProducts.map(p => ({
          id: p.product_code,
          product_code: p.product_code,
          name: p.name,
          price: p.price,
          description: p.description,
          stock: p.stock,
          max_stock: p.max_stock,
          is_active: p.is_active,
          available: p.stock > 0
        }))
      };
    }

    const products = {
      HOTEL: [
        { id: 'H001', name: '北京王府半岛酒店', price: 288000, description: '豪华大床房，含双早', stock: 5, available: true },
        { id: 'H002', name: '上海外滩华尔道夫', price: 358000, description: '江景套房，行政礼遇', stock: 3, available: true },
        { id: 'H003', name: '三亚亚特兰蒂斯', price: 428000, description: '海景房，含水世界', stock: 8, available: true },
        { id: 'H004', name: '丽江古城悦榕庄', price: 198000, description: '花园别墅，含下午茶', stock: 2, available: true }
      ],
      FLIGHT: [
        { id: 'F001', name: '北京→上海 经济舱', price: 128000, description: '国航 CA1501，08:00-10:15', stock: 10, available: true },
        { id: 'F002', name: '北京→三亚 商务舱', price: 368000, description: '海航 HU7379，14:00-18:15', stock: 2, available: true },
        { id: 'F003', name: '上海→成都 经济舱', price: 98000, description: '东航 MU5401，09:30-13:00', stock: 15, available: true },
        { id: 'F004', name: '广州→北京 头等舱', price: 588000, description: '南航 CZ3101，16:00-19:00', stock: 1, available: true }
      ],
      TICKET: [
        { id: 'T001', name: '故宫博物院门票', price: 6000, description: '旺季成人票，含珍宝馆', stock: 100, available: true },
        { id: 'T002', name: '迪士尼度假区一日票', price: 59900, description: '成人票，高峰期', stock: 50, available: true },
        { id: 'T003', name: '八达岭长城门票', price: 4000, description: '成人票，含缆车', stock: 80, available: true },
        { id: 'T004', name: '西湖游船票', price: 15000, description: '豪华画舫，环湖游', stock: 30, available: true }
      ],
      TRAIN: [
        { id: 'R001', name: '北京→上海 高铁二等座', price: 55300, description: 'G1，07:00-11:28', stock: 20, available: true },
        { id: 'R002', name: '北京→广州 高铁一等座', price: 138000, description: 'G65，10:00-18:00', stock: 5, available: true },
        { id: 'R003', name: '上海→杭州 高铁二等座', price: 7300, description: 'G7351，08:30-09:45', stock: 30, available: true },
        { id: 'R004', name: '广州→深圳 高铁商务座', price: 19900, description: 'G6501，09:00-09:30', stock: 3, available: true }
      ],
      CAR: [
        { id: 'C001', name: '机场接送-经济型', price: 15000, description: '大众朗逸或同级', stock: 20, available: true },
        { id: 'C002', name: '机场接送-商务型', price: 28000, description: '别克GL8或同级', stock: 10, available: true },
        { id: 'C003', name: '日租包车-经济型', price: 45000, description: '8小时/100公里', stock: 15, available: true },
        { id: 'C004', name: '日租包车-豪华型', price: 128000, description: '奔驰E级或同级', stock: 5, available: true }
      ],
      VACATION: [
        { id: 'V001', name: '马尔代夫5日游', price: 2580000, description: '一价全包，水上别墅', stock: 2, available: true },
        { id: 'V002', name: '泰国普吉岛7日游', price: 688000, description: '含机票酒店，出海浮潜', stock: 5, available: true },
        { id: 'V003', name: '云南大理丽江6日游', price: 358000, description: '纯玩团，含玉龙雪山', stock: 10, available: true },
        { id: 'V004', name: '日本东京大阪7日游', price: 1280000, description: '含签证机票，环球影城', stock: 3, available: true }
      ],
      GROUP_BUY: [
        { id: 'G001', name: '双人牛排套餐', price: 29800, description: '原切菲力+红酒，门市价598', stock: 50, available: true },
        { id: 'G002', name: '4人火锅套餐', price: 39800, description: '含锅底调料，门市价698', stock: 30, available: true },
        { id: 'G003', name: '影院通兑票2张', price: 6800, description: '2D/3D通兑，门市价160', stock: 100, available: true },
        { id: 'G004', name: 'KTV黄金时段3小时', price: 19800, description: '含果盘饮料，门市价398', stock: 20, available: true }
      ],
      INSURANCE: [
        { id: 'I001', name: '境内旅游意外险', price: 2000, description: '保额50万，保期7天', stock: 999, available: true },
        { id: 'I002', name: '境外旅游意外险', price: 8000, description: '保额100万，保期15天', stock: 999, available: true },
        { id: 'I003', name: '航班延误险', price: 3000, description: '延误4小时赔付200元', stock: 999, available: true },
        { id: 'I004', name: '酒店取消险', price: 5000, description: '赔付订单金额80%', stock: 999, available: true }
      ]
    };

    return {
      businessLine,
      products: products[businessLine.code] || products.HOTEL
    };
  }
}

module.exports = BusinessLineService;
