const db = require('../db');
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');

class DataCollector {
  constructor() {
    this.sources = [
      { id: 1, name: '电商平台API', type: 'api', endpoint: 'https://api.example.com/ecommerce' },
      { id: 2, name: '天眼查工商数据', type: 'api', endpoint: 'https://api.tianyancha.com/' },
      { id: 3, name: '新闻爬虫', type: 'crawler', endpoint: '' },
      { id: 4, name: '社交媒体舆情', type: 'api', endpoint: 'https://api.example.com/social' }
    ];
  }

  async fetchEcommerceData(brandName) {
    try {
      const mockData = {
        platform: ['天猫', '京东', '拼多多'][Math.floor(Math.random() * 3)],
        monthly_sales: Math.floor(Math.random() * 10000) + 1000,
        rating: (Math.random() * 1 + 4).toFixed(1),
        shop_name: `${brandName}官方旗舰店`
      };
      
      return mockData;
    } catch (error) {
      console.error('Ecommerce fetch error:', error.message);
      return null;
    }
  }

  async fetchBusinessInfo(brandName) {
    try {
      const mockData = {
        registered_capital: `${Math.floor(Math.random() * 5000) + 100}万人民币`,
        legal_person: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
        established_year: Math.floor(Math.random() * 30) + 1990,
        unified_social_code: '91' + Math.floor(Math.random() * 1000000000000000000).toString().padStart(17, '0')
      };
      return mockData;
    } catch (error) {
      console.error('Business info fetch error:', error.message);
      return null;
    }
  }

  async crawlNews(keyword) {
    try {
      const mockNews = [
        {
          title: `${keyword}推出全新产品系列，引领行业创新`,
          source: '网易新闻',
          sentiment_type: 'positive',
          sentiment_score: 0.85,
          published_at: moment().subtract(Math.random() * 30, 'days').format('YYYY-MM-DD HH:mm:ss')
        },
        {
          title: `${keyword}2024年Q1财报发布，营收同比增长${Math.floor(Math.random() * 50) + 10}%`,
          source: '新浪财经',
          sentiment_type: 'positive',
          sentiment_score: 0.78,
          published_at: moment().subtract(Math.random() * 15, 'days').format('YYYY-MM-DD HH:mm:ss')
        },
        {
          title: `市场监管总局点名${keyword}，质量问题引关注`,
          source: '央视新闻',
          sentiment_type: 'negative',
          sentiment_score: -0.65,
          published_at: moment().subtract(Math.random() * 20, 'days').format('YYYY-MM-DD HH:mm:ss')
        }
      ];
      
      return mockNews;
    } catch (error) {
      console.error('News crawl error:', error.message);
      return [];
    }
  }

  async fetchSentimentData(brandName) {
    try {
      const newsItems = await this.crawlNews(brandName);
      return newsItems;
    } catch (error) {
      console.error('Sentiment fetch error:', error.message);
      return [];
    }
  }

  async collectBrandData(brandId) {
    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(brandId);
    if (!brand) return null;

    const updateStmt = db.prepare(`
      UPDATE brands SET 
        registered_capital = ?, legal_person = ?, established_year = ?,
        unified_social_code = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const shopStmt = db.prepare(`
      INSERT INTO brand_online_shops (brand_id, platform, shop_url, shop_name, monthly_sales, rating)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const sentimentStmt = db.prepare(`
      INSERT INTO brand_sentiments (brand_id, source, title, content, sentiment_score, sentiment_type, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const recordStmt = db.prepare(`
      INSERT INTO data_records (source_id, record_type, record_id, raw_data)
      VALUES (?, ?, ?, ?)
    `);

    const businessInfo = await this.fetchBusinessInfo(brand.name);
    if (businessInfo) {
      updateStmt.run(
        businessInfo.registered_capital,
        businessInfo.legal_person,
        businessInfo.established_year,
        businessInfo.unified_social_code,
        brandId
      );
      recordStmt.run(2, 'brand', brandId, JSON.stringify(businessInfo));
    }

    const ecommerceData = await this.fetchEcommerceData(brand.name);
    if (ecommerceData) {
      shopStmt.run(
        brandId, ecommerceData.platform,
        `https://${ecommerceData.platform}.example.com/${brand.id}`,
        ecommerceData.shop_name,
        ecommerceData.monthly_sales,
        ecommerceData.rating
      );
      recordStmt.run(1, 'brand_shop', brandId, JSON.stringify(ecommerceData));
      
      db.prepare('UPDATE brands SET sales_volume = ? WHERE id = ?')
        .run(ecommerceData.monthly_sales, brandId);
    }

    const sentimentData = await this.fetchSentimentData(brand.name);
    sentimentData.forEach(item => {
      sentimentStmt.run(
        brandId, item.source, item.title, item.title,
        item.sentiment_score, item.sentiment_type, item.published_at
      );
      recordStmt.run(3, 'brand_sentiment', brandId, JSON.stringify(item));
    });

    if (sentimentData.length > 0) {
      const avgScore = sentimentData.reduce((sum, s) => sum + s.sentiment_score, 0) / sentimentData.length;
      db.prepare('UPDATE brands SET reputation_score = ? WHERE id = ?')
        .run((avgScore + 1) * 50, brandId);
    }

    db.prepare('UPDATE data_sources SET last_sync_at = CURRENT_TIMESTAMP, sync_status = ? WHERE id IN (1,2,3)')
      .run('success');

    return { businessInfo, ecommerceData, sentimentData };
  }

  async collectAllBrands() {
    const brands = db.prepare('SELECT id FROM brands WHERE status = ?').all('active');
    const results = [];
    
    for (const brand of brands) {
      const result = await this.collectBrandData(brand.id);
      results.push({ brandId: brand.id, ...result });
      await new Promise(r => setTimeout(r, 100));
    }
    
    return results;
  }

  checkForUpdates() {
    const policyChanges = [
      { type: 'policy', title: '新能源汽车补贴政策调整', content: '2024年新能源汽车补贴政策将退坡30%', category: '汽车' },
      { type: 'policy', title: '食品安全新标准发布', content: '国家市场监管总局发布最新食品安全标准', category: '食品' }
    ];

    const newProducts = [
      { type: 'product', title: '华为Mate 70系列发布', brand: '华为', category: '手机' },
      { type: 'product', title: '特斯拉Model Q正式上市', brand: '特斯拉', category: '汽车' }
    ];

    const alertStmt = db.prepare(`
      INSERT INTO update_alerts (alert_type, title, content, related_brand_id, related_topic_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    [...policyChanges, ...newProducts].forEach(alert => {
      const existing = db.prepare('SELECT id FROM update_alerts WHERE title = ?').get(alert.title);
      if (!existing) {
        const relatedBrand = db.prepare('SELECT id FROM brands WHERE name LIKE ?').get(`%${alert.brand || alert.category}%`);
        const relatedTopic = db.prepare('SELECT id FROM knowledge_topics WHERE category = ?').get(alert.category);
        
        alertStmt.run(
          alert.type, alert.title, alert.content,
          relatedBrand?.id || null,
          relatedTopic?.id || null
        );

        if (relatedTopic) {
          db.prepare('UPDATE knowledge_topics SET needs_review = 1, review_reason = ? WHERE id = ?')
            .run(alert.title, relatedTopic.id);
        }
      }
    });

    return { policyChanges, newProducts };
  }

  getCollectionStatus() {
    return db.prepare('SELECT * FROM data_sources').all();
  }

  getDataTraceability(recordType, recordId) {
    return db.prepare(`
      SELECT dr.*, ds.source_name, ds.source_type
      FROM data_records dr
      JOIN data_sources ds ON dr.source_id = ds.id
      WHERE dr.record_type = ? AND dr.record_id = ?
      ORDER BY dr.fetched_at DESC
    `).all(recordType, recordId);
  }
}

module.exports = new DataCollector();
