const { get, run, all } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const CATEGORY_TAGS = {
  civil: ['民事纠纷', '婚姻家庭', '遗产继承', '相邻关系'],
  contract: ['合同纠纷', '买卖合同', '租赁合同', '借款合同'],
  labor: ['劳动争议', '工伤赔偿', '劳动合同', '社会保险'],
  criminal: ['刑事辩护', '取保候审', '刑事自诉', '附带民事'],
  corporate: ['公司事务', '股权转让', '破产清算', '合伙协议'],
  intellectual: ['知识产权', '商标专利', '著作权', '商业秘密'],
  real_estate: ['房产纠纷', '拆迁补偿', '物业纠纷', '建筑工程'],
  traffic: ['交通事故', '保险理赔', '责任认定', '伤残鉴定'],
  consumer: ['消费维权', '产品质量', '虚假宣传', '服务合同']
};

const SENSITIVE_PATTERNS = [
  /[\u4e00-\u9fa5]{2,4}(?:律师|事务所|法院|检察院|公安局|公证处)/g,
  /1[3-9]\d{9}/g,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /\d{15}|\d{18}|\d{17}[xX]/g,
  /[\u4e00-\u9fa5]{2,4}(?:先生|女士|同志|同学)/g,
  /(?:省|市|区|县|镇|乡|村|街道|路|号|小区|大厦|公寓)[\u4e00-\u9fa50-9\-_]+/g
];

class KnowledgeVault {
  constructor() {
    this.sensitivePatterns = SENSITIVE_PATTERNS;
    this.categoryTags = CATEGORY_TAGS;
  }

  desensitizeText(text) {
    if (!text) return '';

    let desensitized = text;

    for (const pattern of this.sensitivePatterns) {
      desensitized = desensitized.replace(pattern, (match) => {
        if (match.length <= 2) return '***';
        return match[0] + '***' + match[match.length - 1];
      });
    }

    desensitized = desensitized.replace(/某[\u4e00-\u9fa5]/g, '某*');

    return desensitized;
  }

  generateTags(category, description) {
    const tags = new Set();

    if (this.categoryTags[category]) {
      this.categoryTags[category].forEach(tag => tags.add(tag));
    }

    const keywords = [
      '赔偿', '违约金', '定金', '利息', '诉讼', '仲裁', '调解',
      '合同', '协议', '担保', '抵押', '质押', '留置',
      '所有权', '使用权', '债权', '债务', '继承', '赠与',
      '离婚', '子女', '抚养', '赡养', '扶养',
      '工伤', '社保', '工资', '加班', '辞退', '解雇'
    ];

    for (const keyword of keywords) {
      if (description.includes(keyword)) {
        tags.add(keyword);
      }
    }

    return Array.from(tags);
  }

  generatePermalink(caseId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `/cases/${year}/${month}/${caseId}`;
  }

  async convertToCase(consultationId) {
    const consultation = await get(`
      SELECT c.*, 
             s.summary as suggestion_summary,
             s.detailed_advice as suggestion_detail,
             s.legal_basis as suggestion_legal_basis,
             s.recommended_actions as suggestion_actions,
             r.rating as review_rating,
             r.comment as review_comment
      FROM consultations c
      LEFT JOIN consultation_suggestions s ON c.suggestion_id = s.id
      LEFT JOIN reviews r ON c.review_id = r.id
      WHERE c.id = ?
    `, [consultationId]);

    if (!consultation) {
      return { success: false, message: '咨询单不存在' };
    }

    if (consultation.converted_to_case === 1) {
      return { success: false, message: '该咨询单已转换为案例' };
    }

    if (consultation.status !== 'settled' && consultation.status !== 'reviewed') {
      return { success: false, message: '咨询单尚未完成，无法转换为案例' };
    }

    if (consultation.is_disputed === 1) {
      const dispute = await get(
        'SELECT * FROM disputes WHERE consultation_id = ?',
        [consultationId]
      );
      if (dispute && dispute.status !== 'resolved') {
        return { success: false, message: '争议尚未解决，无法转换为案例' };
      }
    }

    const desensitizedTitle = this.desensitizeText(consultation.title);
    const desensitizedDescription = this.desensitizeText(consultation.description);
    
    let lawyerSuggestion = '';
    if (consultation.suggestion_summary) {
      lawyerSuggestion += `【咨询摘要】\n${this.desensitizeText(consultation.suggestion_summary)}\n\n`;
    }
    if (consultation.suggestion_detail) {
      lawyerSuggestion += `【详细建议】\n${this.desensitizeText(consultation.suggestion_detail)}\n\n`;
    }
    if (consultation.suggestion_legal_basis) {
      lawyerSuggestion += `【法律依据】\n${this.desensitizeText(consultation.suggestion_legal_basis)}\n\n`;
    }
    if (consultation.suggestion_actions) {
      lawyerSuggestion += `【行动建议】\n${this.desensitizeText(consultation.suggestion_actions)}`;
    }

    const tags = this.generateTags(consultation.category, desensitizedDescription);
    
    const caseId = uuidv4();
    const permalink = this.generatePermalink(caseId);

    await run(`
      INSERT INTO cases (
        id, consultation_id, original_consultation_id, title, description,
        category, lawyer_suggestion, tags, is_searchable, permalink, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      caseId, consultationId, consultationId, desensitizedTitle,
      desensitizedDescription, consultation.category, lawyerSuggestion,
      JSON.stringify(tags), 1, permalink
    ]);

    await run(`
      UPDATE consultations 
      SET converted_to_case = 1, case_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [caseId, consultationId]);

    return {
      success: true,
      caseId,
      consultationId,
      title: desensitizedTitle,
      category: consultation.category,
      tags,
      permalink,
      isSearchable: true
    };
  }

  async batchConvertEligible(limit = 10) {
    const eligibleConsultations = await all(`
      SELECT c.id FROM consultations c
      WHERE c.converted_to_case = 0
        AND c.status IN ('settled', 'reviewed')
        AND (c.is_disputed = 0 OR EXISTS (
          SELECT 1 FROM disputes d 
          WHERE d.consultation_id = c.id AND d.status = 'resolved'
        ))
      ORDER BY c.updated_at DESC
      LIMIT ?
    `, [limit]);

    const results = [];
    for (const consultation of eligibleConsultations) {
      try {
        const result = await this.convertToCase(consultation.id);
        results.push(result);
      } catch (error) {
        console.error(`转换咨询单 ${consultation.id} 失败:`, error);
        results.push({
          success: false,
          consultationId: consultation.id,
          message: error.message
        });
      }
    }

    return {
      total: eligibleConsultations.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  async searchCases(keyword, category = null, limit = 20, offset = 0) {
    let query = `
      SELECT c.*, 
             (SELECT COUNT(*) FROM cases WHERE is_searchable = 1) as total_count
      FROM cases c
      WHERE c.is_searchable = 1
    `;
    const params = [];

    if (keyword) {
      query += ` AND (c.title LIKE ? OR c.description LIKE ? OR c.lawyer_suggestion LIKE ? OR c.tags LIKE ?)`;
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern);
    }

    if (category) {
      query += ` AND c.category = ?`;
      params.push(category);
    }

    query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const cases = await all(query, params);

    if (cases.length === 0) {
      return {
        success: true,
        cases: [],
        total: 0,
        limit,
        offset
      };
    }

    const total = cases[0].total_count;

    return {
      success: true,
      cases: cases.map(c => ({
        ...c,
        tags: JSON.parse(c.tags || '[]')
      })),
      total,
      limit,
      offset
    };
  }

  async getCaseById(caseId, incrementView = true) {
    const caseItem = await get(`
      SELECT c.*, cons.category as consultation_category
      FROM cases c
      LEFT JOIN consultations cons ON c.consultation_id = cons.id
      WHERE c.id = ?
    `, [caseId]);

    if (!caseItem) {
      return { success: false, message: '案例不存在' };
    }

    if (incrementView) {
      await run(
        'UPDATE cases SET view_count = view_count + 1 WHERE id = ?',
        [caseId]
      );
    }

    return {
      success: true,
      caseData: {
        ...caseItem,
        tags: JSON.parse(caseItem.tags || '[]')
      }
    };
  }

  async markHelpful(caseId) {
    await run(
      'UPDATE cases SET helpful_count = helpful_count + 1 WHERE id = ?',
      [caseId]
    );

    return { success: true };
  }

  async getRelatedCases(caseId, limit = 5) {
    const currentCase = await get(
      'SELECT category, tags FROM cases WHERE id = ?',
      [caseId]
    );

    if (!currentCase) {
      return { success: false, message: '案例不存在' };
    }

    const tags = JSON.parse(currentCase.tags || '[]');
    
    let query = `
      SELECT c.* FROM cases c
      WHERE c.id != ? AND c.is_searchable = 1 AND c.category = ?
    `;
    const params = [caseId, currentCase.category];

    if (tags.length > 0) {
      const tagConditions = tags.map(() => `c.tags LIKE ?`).join(' OR ');
      query += ` AND (${tagConditions})`;
      tags.forEach(tag => params.push(`%"${tag}"%`));
    }

    query += ` ORDER BY c.created_at DESC LIMIT ?`;
    params.push(limit);

    const related = await all(query, params);

    return {
      success: true,
      relatedCases: related.map(r => ({
        ...r,
        tags: JSON.parse(r.tags || '[]')
      }))
    };
  }
}

module.exports = new KnowledgeVault();
