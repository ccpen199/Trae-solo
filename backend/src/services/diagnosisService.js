const { Fault } = require('../models');
const { Op } = require('sequelize');

class DiagnosisService {
  async diagnose(text, deviceType, imageData = null) {
    const keywords = this.extractKeywords(text);
    const faults = await Fault.findAll({
      where: {
        device_type: deviceType || 'smartphone'
      }
    });

    const scoredFaults = faults.map(fault => {
      const symptoms = JSON.parse(fault.symptoms || '[]');
      const score = this.calculateConfidence(keywords, symptoms, text, fault);
      return {
        id: fault.id,
        code: fault.code,
        name: fault.name,
        description: fault.description,
        confidence: score,
        estimatedCost: fault.estimated_cost,
        estimatedHours: fault.estimated_hours,
        solution: fault.solution,
        difficulty: fault.difficulty
      };
    });

    scoredFaults.sort((a, b) => b.confidence - a.confidence);
    
    const top3 = scoredFaults.slice(0, 3);
    const accuracy = top3.length > 0 ? top3[0].confidence : 0;

    return {
      top3,
      predictionAccuracy: accuracy,
      keywords
    };
  }

  extractKeywords(text) {
    const commonWords = ['的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
    const words = text.split(/[，。！？、\s]+/).filter(w => w.length >= 2 && !commonWords.includes(w));
    return [...new Set(words)];
  }

  calculateConfidence(keywords, symptoms, text, fault) {
    let score = 0.3;
    const matchedKeywords = [];

    symptoms.forEach(symptom => {
      if (text.includes(symptom)) {
        score += 0.15;
        matchedKeywords.push(symptom);
      }
    });

    keywords.forEach(kw => {
      if (fault.name.includes(kw) || (fault.description && fault.description.includes(kw))) {
        score += 0.1;
      }
    });

    if (text.includes('不开机') || text.includes('无法启动')) {
      if (fault.code.includes('POW') || fault.code.includes('BAT')) score += 0.15;
    }
    if (text.includes('充电')) {
      if (fault.code.includes('CHG') || fault.code.includes('BAT')) score += 0.15;
    }
    if (text.includes('屏幕') || text.includes('显示')) {
      if (fault.code.includes('SCR') || fault.code.includes('DSP')) score += 0.15;
    }
    if (text.includes('电池')) {
      if (fault.code.includes('BAT')) score += 0.2;
    }

    return Math.min(score, 0.98);
  }
}

module.exports = new DiagnosisService();
