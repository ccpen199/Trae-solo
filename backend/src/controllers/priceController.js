const PriceQuote = require('../models/PriceQuote');

const getMarket = async (req, res, next) => {
  try {
    const { category, material } = req.query;

    const marketData = [
      {
        category: 'industrial_scrap',
        categoryName: '工业废料',
        materials: [
          { material: 'steel', name: '废钢', price: 3.5, unit: 'kg', trend: 'up', change: 0.15 },
          { material: 'aluminum', name: '废铝', price: 12.8, unit: 'kg', trend: 'stable', change: 0 },
          { material: 'copper', name: '废铜', price: 45.2, unit: 'kg', trend: 'down', change: -0.8 }
        ]
      },
      {
        category: 'used_equipment',
        categoryName: '二手设备',
        materials: [
          { material: 'machinery', name: '机械设备', price: 8500, unit: '台', trend: 'stable', change: 0 },
          { material: 'electronics', name: '电子设备', price: 1200, unit: '台', trend: 'down', change: -50 }
        ]
      },
      {
        category: 'old_appliance',
        categoryName: '旧家电',
        materials: [
          { material: 'refrigerator', name: '冰箱', price: 200, unit: '台', trend: 'up', change: 10 },
          { material: 'washing_machine', name: '洗衣机', price: 150, unit: '台', trend: 'stable', change: 0 },
          { material: 'air_conditioner', name: '空调', price: 350, unit: '台', trend: 'up', change: 20 }
        ]
      },
      {
        category: 'household_plastic',
        categoryName: '民用塑料',
        materials: [
          { material: 'pet', name: 'PET瓶', price: 1.2, unit: 'kg', trend: 'up', change: 0.08 },
          { material: 'pe', name: 'PE塑料', price: 0.85, unit: 'kg', trend: 'stable', change: 0 },
          { material: 'pvc', name: 'PVC', price: 0.65, unit: 'kg', trend: 'down', change: -0.03 }
        ]
      },
      {
        category: 'hazardous',
        categoryName: '危废',
        materials: [
          { material: 'battery', name: '废电池', price: 8.5, unit: 'kg', trend: 'up', change: 0.5 },
          { material: 'chemical', name: '化工废料', price: 12.0, unit: 'kg', trend: 'stable', change: 0 }
        ]
      }
    ];

    let result = marketData;
    if (category) {
      result = marketData.filter(item => item.category === category);
    }

    res.json({
      success: true,
      data: result,
      message: '获取市场行情成功'
    });
  } catch (error) {
    next(error);
  }
};

const estimate = async (req, res, next) => {
  try {
    const { wasteCategory, material, weight, quality, region } = req.body;

    if (!wasteCategory || !material || !weight) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '废弃物类别、材质和重量为必填项'
      });
    }

    const basePrices = {
      industrial_scrap: { steel: 3.5, aluminum: 12.8, copper: 45.2, iron: 2.8, default: 3.0 },
      used_equipment: { machinery: 8500, electronics: 1200, default: 2000 },
      old_appliance: { refrigerator: 200, washing_machine: 150, air_conditioner: 350, default: 180 },
      household_plastic: { pet: 1.2, pe: 0.85, pvc: 0.65, default: 0.8 },
      hazardous: { battery: 8.5, chemical: 12.0, default: 10.0 }
    };

    const categoryPrices = basePrices[wasteCategory] || basePrices.industrial_scrap;
    const basePrice = categoryPrices[material] || categoryPrices.default;

    const qualityFactor = quality === 'high' ? 1.3 : quality === 'low' ? 0.7 : 1.0;

    const regionFactors = {
      east: 1.1, south: 1.05, north: 1.0,
      west: 0.9, central: 0.95, default: 1.0
    };
    const regionFactor = regionFactors[region] || regionFactors.default;

    const unitPrice = basePrice * qualityFactor * regionFactor;
    const estimatedPrice = unitPrice * weight;
    const minPrice = estimatedPrice * 0.85;
    const maxPrice = estimatedPrice * 1.15;

    const priceQuote = new PriceQuote({
      wasteCategory,
      material,
      weight,
      estimatedPrice: Math.round(estimatedPrice * 100) / 100,
      priceRange: `${Math.round(minPrice * 100) / 100} - ${Math.round(maxPrice * 100) / 100}`,
      marketReferencePrice: Math.round(unitPrice * 100) / 100,
      marketTrend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
      factors: {
        basePrice,
        qualityFactor,
        regionFactor
      },
      formulaVersion: 'v1.0.0'
    });

    await priceQuote.save();

    res.json({
      success: true,
      data: {
        unitPrice: Math.round(unitPrice * 100) / 100,
        totalPrice: Math.round(estimatedPrice * 100) / 100,
        priceRange: `${Math.round(minPrice * 100) / 100} - ${Math.round(maxPrice * 100) / 100}`,
        marketTrend: priceQuote.marketTrend,
        factors: {
          basePrice,
          qualityFactor,
          regionFactor
        },
        quoteId: priceQuote._id
      },
      message: '智能估价完成'
    });
  } catch (error) {
    next(error);
  }
};

const getTrends = async (req, res, next) => {
  try {
    const { category, material, days } = req.query;
    const periodDays = parseInt(days) || 30;

    const trends = [];
    let basePrice = 5;

    const categoryBasePrices = {
      industrial_scrap: 3.5,
      used_equipment: 2000,
      old_appliance: 200,
      household_plastic: 0.8,
      hazardous: 10.0
    };

    basePrice = categoryBasePrices[category] || basePrice;

    for (let i = periodDays; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variation = (Math.random() - 0.5) * 0.1 * basePrice;
      const price = basePrice + variation;
      basePrice = price;

      trends.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100,
        volume: Math.floor(Math.random() * 1000 + 500)
      });
    }

    const firstPrice = trends[0].price;
    const lastPrice = trends[trends.length - 1].price;
    const change = lastPrice - firstPrice;
    const changePercent = ((change / firstPrice) * 100).toFixed(2);

    res.json({
      success: true,
      data: {
        trends,
        summary: {
          startPrice: firstPrice,
          endPrice: lastPrice,
          change: Math.round(change * 100) / 100,
          changePercent: changePercent + '%',
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
          days: periodDays
        }
      },
      message: '获取价格趋势成功'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMarket,
  estimate,
  getTrends
};
