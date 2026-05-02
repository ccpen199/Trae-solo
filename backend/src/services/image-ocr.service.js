const db = require('../config/database');
const auditService = require('./audit.service');

const BRAND_DATABASE = {
  'apple': { name: 'Apple', category: '数码产品', confidence: 0.95, synonyms: ['苹果', 'iphone', 'ipad', 'macbook', 'imac'] },
  'samsung': { name: 'Samsung', category: '数码产品', confidence: 0.93, synonyms: ['三星', 'galaxy'] },
  'huawei': { name: 'Huawei', category: '数码产品', confidence: 0.92, synonyms: ['华为', '荣耀', 'honor'] },
  'xiaomi': { name: 'Xiaomi', category: '数码产品', confidence: 0.91, synonyms: ['小米', '红米', 'redmi'] },
  'sony': { name: 'Sony', category: '数码产品', confidence: 0.94, synonyms: ['索尼', 'playstation', 'ps'] },
  'nikon': { name: 'Nikon', category: '数码产品', confidence: 0.90, synonyms: ['尼康'] },
  'canon': { name: 'Canon', category: '数码产品', confidence: 0.90, synonyms: ['佳能'] },
  'dyson': { name: 'Dyson', category: '家用电器', confidence: 0.92, synonyms: ['戴森'] },
  'rolex': { name: 'Rolex', category: '奢侈品', confidence: 0.96, synonyms: ['劳力士'] },
  'omega': { name: 'Omega', category: '奢侈品', confidence: 0.94, synonyms: ['欧米茄'] },
  'cartier': { name: 'Cartier', category: '奢侈品', confidence: 0.95, synonyms: ['卡地亚'] },
  'lv': { name: 'Louis Vuitton', category: '奢侈品', confidence: 0.93, synonyms: ['路易威登', 'louis vuitton'] },
  'gucci': { name: 'Gucci', category: '奢侈品', confidence: 0.92, synonyms: ['古驰'] },
  'chanel': { name: 'Chanel', category: '奢侈品', confidence: 0.93, synonyms: ['香奈儿'] },
  'prada': { name: 'Prada', category: '奢侈品', confidence: 0.91, synonyms: ['普拉达'] },
  'hermes': { name: 'Hermes', category: '奢侈品', confidence: 0.94, synonyms: ['爱马仕'] },
  'nike': { name: 'Nike', category: '运动服饰', confidence: 0.90, synonyms: ['耐克'] },
  'adidas': { name: 'Adidas', category: '运动服饰', confidence: 0.90, synonyms: ['阿迪达斯'] },
  'uniqlo': { name: 'Uniqlo', category: '服饰', confidence: 0.88, synonyms: ['优衣库'] }
};

const CATEGORY_KEYWORDS = {
  '数码产品': ['手机', '电脑', '平板', '相机', '耳机', '音箱', '手表', '智能', '电子', '数码', '游戏机', '显示器', '键盘', '鼠标'],
  '家用电器': ['冰箱', '洗衣机', '空调', '电视', '微波炉', '烤箱', '吸尘器', '加湿器', '净化器', '热水器'],
  '奢侈品': ['手表', '包', '珠宝', '首饰', '钻石', '黄金', '铂金', '名牌', '限量'],
  '服饰': ['衣服', '裤子', '鞋子', '外套', '裙子', '内衣', '袜子', '帽子', '围巾', '皮带'],
  '运动户外': ['跑步', '健身', '篮球', '足球', '羽毛球', '网球', '游泳', '露营', '登山', '自行车'],
  '家居家具': ['沙发', '床', '桌子', '椅子', '柜子', '书架', '灯具', '窗帘', '地毯'],
  '美妆护肤': ['口红', '粉底', '面膜', '香水', '化妆', '护肤', '洗面奶', '面霜', '精华'],
  '母婴用品': ['奶粉', '奶瓶', '尿不湿', '婴儿车', '玩具', '童装', '孕妇', '胎教'],
  '图书文具': ['书', '杂志', '笔', '本子', '文具', '办公用品', '打印机'],
  '食品饮料': ['零食', '饮料', '咖啡', '茶', '酒', '生鲜', '水果', '蔬菜', '肉类']
};

class ImageOCRService {
  constructor() {
    this.brandDatabase = BRAND_DATABASE;
    this.categoryKeywords = CATEGORY_KEYWORDS;
  }

  analyzeText(text) {
    if (!text || typeof text !== 'string') {
      return null;
    }

    const lowerText = text.toLowerCase();
    const results = {
      brands: [],
      categories: [],
      keywords: [],
      rawText: text
    };

    for (const [key, brand] of Object.entries(this.brandDatabase)) {
      const allSynonyms = [key, ...brand.synonyms];
      
      for (const synonym of allSynonyms) {
        if (lowerText.includes(synonym.toLowerCase())) {
          results.brands.push({
            name: brand.name,
            category: brand.category,
            confidence: brand.confidence,
            matchedKeyword: synonym
          });
          break;
        }
      }
    }

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          if (!results.categories.includes(category)) {
            results.categories.push(category);
          }
          if (!results.keywords.includes(keyword)) {
            results.keywords.push(keyword);
          }
        }
      }
    }

    results.brands = results.brands.sort((a, b) => b.confidence - a.confidence);

    return results;
  }

  analyzeProduct(productId, additionalText = '', actor = null) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      throw new Error(`商品不存在: ${productId}`);
    }

    const combinedText = `${product.title} ${product.description || ''} ${product.brand || ''} ${product.model || ''} ${additionalText}`;
    const analysis = this.analyzeText(combinedText);

    if (!analysis) {
      return { productId, detected: false };
    }

    let ocrResult = {
      detected_brand: null,
      model: product.model || null,
      category: product.category || null,
      confidence: 0,
      keywords: analysis.keywords
    };

    let brandSuggestion = null;

    if (analysis.brands.length > 0) {
      const topBrand = analysis.brands[0];
      ocrResult = {
        ...ocrResult,
        detected_brand: topBrand.name,
        category: topBrand.category,
        confidence: topBrand.confidence
      };

      brandSuggestion = this.generateBrandSuggestion(topBrand, product);
    }

    if (analysis.categories.length > 0 && !ocrResult.category) {
      ocrResult.category = analysis.categories[0];
    }

    const updateStmt = db.prepare(`
      UPDATE products 
      SET ocr_result = ?, brand_suggestion = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(
      JSON.stringify(ocrResult),
      brandSuggestion,
      productId
    );

    auditService.logUpdate({
      user: actor,
      module: auditService.MODULES.PRODUCT,
      resourceType: 'product',
      resourceId: productId,
      oldValue: { ocr_result: product.ocr_result },
      newValue: { ocr_result: JSON.stringify(ocrResult) },
      description: `商品 OCR 识别完成，检测品牌: ${ocrResult.detected_brand || '未检测到'}`
    });

    return {
      productId,
      detected: true,
      ocrResult,
      brandSuggestion,
      analysis
    };
  }

  generateBrandSuggestion(brand, product) {
    const suggestions = [];
    const basePrice = product.price;

    if (brand.category === '奢侈品') {
      suggestions.push('此商品属于奢侈品类别，建议启用专业鉴定服务');
      suggestions.push(`当前标价 ¥${basePrice}，奢侈品市场波动较大，建议参考近期成交价`);
    } else if (brand.category === '数码产品') {
      suggestions.push(`检测到品牌 ${brand.name}，该品牌商品需求稳定`);
      const priceRange = this.getPriceRange(basePrice, 0.1);
      suggestions.push(`建议标价范围：¥${priceRange.min} - ¥${priceRange.max}`);
    } else {
      const priceRange = this.getPriceRange(basePrice, 0.15);
      suggestions.push(`建议标价范围：¥${priceRange.min} - ¥${priceRange.max}`);
    }

    return suggestions.join('；');
  }

  getPriceRange(basePrice, variance) {
    const min = Math.round(basePrice * (1 - variance));
    const max = Math.round(basePrice * (1 + variance));
    return { min, max };
  }

  getBrandSuggestion(productId) {
    const product = db.prepare('SELECT id, title, price, brand_suggestion, ocr_result FROM products WHERE id = ?').get(productId);
    if (!product) {
      return null;
    }

    return {
      productId: product.id,
      title: product.title,
      price: product.price,
      brandSuggestion: product.brand_suggestion,
      ocrResult: product.ocr_result ? JSON.parse(product.ocr_result) : null
    };
  }

  validateBrand(brandName) {
    const lowerBrand = brandName.toLowerCase();
    
    for (const [key, brand] of Object.entries(this.brandDatabase)) {
      const allSynonyms = [key, ...brand.synonyms];
      
      for (const synonym of allSynonyms) {
        if (lowerBrand === synonym.toLowerCase() || lowerBrand.includes(synonym.toLowerCase())) {
          return {
            isValid: true,
            canonicalName: brand.name,
            category: brand.category,
            confidence: brand.confidence
          };
        }
      }
    }

    return {
      isValid: false,
      canonicalName: null,
      category: null,
      confidence: 0
    };
  }

  getCategoryByKeywords(text) {
    if (!text) return null;

    const lowerText = text.toLowerCase();
    const categoryScores = {};

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      categoryScores[category] = 0;
      
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          categoryScores[category]++;
        }
      }
    }

    const sortedCategories = Object.entries(categoryScores)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length > 0) {
      return {
        primaryCategory: sortedCategories[0][0],
        score: sortedCategories[0][1],
        allCategories: sortedCategories.map(c => ({ category: c[0], score: c[1] }))
      };
    }

    return null;
  }

  getAllBrands() {
    return Object.entries(this.brandDatabase).map(([key, brand]) => ({
      key,
      name: brand.name,
      category: brand.category,
      synonyms: brand.synonyms
    }));
  }

  getAllCategories() {
    return Object.keys(this.categoryKeywords);
  }
}

module.exports = new ImageOCRService();
module.exports.BRAND_DATABASE = BRAND_DATABASE;
module.exports.CATEGORY_KEYWORDS = CATEGORY_KEYWORDS;
