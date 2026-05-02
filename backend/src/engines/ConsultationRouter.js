const { get, all } = require('../config/database');

const CATEGORY_MAP = {
  civil: ['民事纠纷', '婚姻家庭', '遗产继承'],
  contract: ['合同纠纷', '买卖纠纷', '租赁纠纷'],
  labor: ['劳动争议', '工伤赔偿', '社保纠纷'],
  criminal: ['刑事辩护', '取保候审', '刑事自诉'],
  corporate: ['公司事务', '股权纠纷', '破产清算'],
  intellectual: ['知识产权', '商标专利', '著作权'],
  real_estate: ['房产纠纷', '拆迁补偿', '物业纠纷'],
  traffic: ['交通事故', '保险理赔'],
  consumer: ['消费维权', '产品质量']
};

class ConsultationRouter {
  constructor() {
    this.categoryMap = CATEGORY_MAP;
  }

  async routeConsultation(consultation) {
    const { category, urgency, budget_amount } = consultation;
    
    const matchingLawyers = await this.findMatchingLawyers(category, budget_amount);
    
    if (matchingLawyers.length === 0) {
      return {
        success: false,
        message: '暂无匹配的律师，请稍后重试或选择其他分类'
      };
    }

    const scoredLawyers = this.scoreLawyers(matchingLawyers, consultation);
    
    const selectedLawyer = this.selectLawyer(scoredLawyers, urgency);

    return {
      success: true,
      lawyer_id: selectedLawyer.id,
      user_id: selectedLawyer.user_id,
      score: selectedLawyer.score,
      matches: scoredLawyers.length
    };
  }

  async findMatchingLawyers(category, budget) {
    const lawyers = await all(`
      SELECT l.*, u.username, u.real_name, u.avatar_url
      FROM lawyers l
      JOIN users u ON l.user_id = u.id
      WHERE l.is_available = 1 AND l.license_verified = 1
    `);

    return lawyers.filter(lawyer => {
      const specializations = JSON.parse(lawyer.specializations || '[]');
      return specializations.includes(category) || this.isCategoryRelated(category, specializations);
    });
  }

  isCategoryRelated(targetCategory, lawyerSpecializations) {
    for (const spec of lawyerSpecializations) {
      if (this.categoryMap[spec] && this.categoryMap[spec].includes(targetCategory)) {
        return true;
      }
    }
    return false;
  }

  scoreLawyers(lawyers, consultation) {
    return lawyers.map(lawyer => {
      let score = 0;

      score += lawyer.rating * 20;

      const completionRate = lawyer.total_consultations > 0 
        ? lawyer.completed_consultations / lawyer.total_consultations 
        : 0.8;
      score += completionRate * 30;

      score += Math.min(lawyer.practice_years * 2, 20);

      const avgResponse = lawyer.average_response_time || 300;
      score += Math.max(0, 20 - avgResponse / 60);

      return {
        ...lawyer,
        score: Math.min(score, 100)
      };
    }).sort((a, b) => b.score - a.score);
  }

  selectLawyer(scoredLawyers, urgency) {
    if (urgency === 'urgent') {
      return scoredLawyers[0];
    }

    const topLawyers = scoredLawyers.slice(0, Math.min(3, scoredLawyers.length));
    
    const weights = topLawyers.map((lawyer, index) => ({
      lawyer,
      weight: Math.max(0.1, 1 - index * 0.2)
    }));

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of weights) {
      random -= item.weight;
      if (random <= 0) {
        return item.lawyer;
      }
    }

    return topLawyers[0];
  }

  async reassignConsultation(consultationId, excludeLawyerId) {
    const consultation = await get(
      'SELECT * FROM consultations WHERE id = ?',
      [consultationId]
    );

    if (!consultation) {
      return { success: false, message: '咨询单不存在' };
    }

    const result = await this.routeConsultation(consultation);
    
    if (result.success && result.lawyer_id === excludeLawyerId) {
      const allLawyers = await this.findMatchingLawyers(
        consultation.category, 
        consultation.budget_amount
      );
      
      const otherLawyers = allLawyers.filter(l => l.id !== excludeLawyerId);
      
      if (otherLawyers.length > 0) {
        const scored = this.scoreLawyers(otherLawyers, consultation);
        return {
          success: true,
          lawyer_id: scored[0].id,
          user_id: scored[0].user_id
        };
      }
    }

    return result;
  }
}

module.exports = new ConsultationRouter();
