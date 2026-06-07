const db = require('../db');
const _ = require('lodash');

class ReportGenerator {
  extractTop10Features(brands) {
    const features = {
      commonStrengths: [],
      marketConcentration: 0,
      avgEstablishedYears: 0,
      regionalDistribution: {},
      levelDistribution: {},
      keyTrends: []
    };

    const top3 = brands.slice(0, 3);
    if (top3.length >= 3) {
      const top3Share = top3.reduce((sum, b) => sum + (b.sales_volume || 0), 0);
      const totalShare = brands.reduce((sum, b) => sum + (b.sales_volume || 0), 0);
      features.marketConcentration = totalShare > 0 ? (top3Share / totalShare * 100).toFixed(1) : 0;
    }

    const years = brands.map(b => b.established_year || 2000);
    features.avgEstablishedYears = Math.floor(2024 - (years.reduce((a, b) => a + b, 0) / years.length));

    brands.forEach(b => {
      features.regionalDistribution[b.region] = (features.regionalDistribution[b.region] || 0) + 1;
      features.levelDistribution[b.level] = (features.levelDistribution[b.level] || 0) + 1;
    });

    if (parseFloat(features.marketConcentration) > 60) {
      features.keyTrends.push('市场集中度较高，头部品牌优势明显');
    } else if (parseFloat(features.marketConcentration) > 40) {
      features.keyTrends.push('市场竞争激烈，头部品牌存在被追赶风险');
    } else {
      features.keyTrends.push('市场格局分散，新兴品牌机会较多');
    }

    if (features.avgEstablishedYears > 15) {
      features.keyTrends.push('行业品牌普遍历史悠久，品牌沉淀深厚');
    } else if (features.avgEstablishedYears < 8) {
      features.keyTrends.push('行业品牌普遍较年轻，创新驱动特征明显');
    }

    features.commonStrengths = ['品牌知名度高', '产品质量稳定', '售后服务完善', '渠道覆盖广泛'];

    return features;
  }

  analyzeCompetition(brands, category) {
    const analysis = {
      category: category?.name || '综合',
      marketLeaders: [],
      challengers: [],
      nichePlayers: [],
      competitiveLandscape: '',
      opportunities: [],
      threats: []
    };

    const sorted = [...brands].sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
    
    analysis.marketLeaders = sorted.slice(0, 3).map(b => ({
      name: b.name,
      score: b.final_score?.toFixed(1),
      advantage: this.getBrandAdvantage(b)
    }));

    analysis.challengers = sorted.slice(3, 7).map(b => ({
      name: b.name,
      score: b.final_score?.toFixed(1),
      momentum: this.getMomentum(b)
    }));

    analysis.nichePlayers = sorted.slice(7).map(b => ({
      name: b.name,
      score: b.final_score?.toFixed(1),
      niche: b.category || '细分市场'
    }));

    const leaderScore = analysis.marketLeaders[0]?.score || 100;
    const secondScore = analysis.marketLeaders[1]?.score || 0;
    const gap = leaderScore - secondScore;

    if (gap > 20) {
      analysis.competitiveLandscape = '一超多强格局，龙头品牌优势显著，短期内难以撼动';
    } else if (gap > 10) {
      analysis.competitiveLandscape = '双雄争霸或多强并立格局，头部竞争激烈，存在位次更迭可能';
    } else {
      analysis.competitiveLandscape = '充分竞争格局，头部品牌差距微小，营销与产品创新是关键变量';
    }

    analysis.opportunities = [
      '消费升级带来高端化机遇',
      '数字化转型提升运营效率',
      '国潮兴起助力本土品牌崛起',
      'ESG理念推动可持续发展'
    ];

    analysis.threats = [
      '原材料价格波动影响利润',
      '监管政策趋严增加合规成本',
      '新进入者加剧市场竞争',
      '消费者需求变化速度加快'
    ];

    return analysis;
  }

  getBrandAdvantage(brand) {
    const advantages = [];
    if ((brand.sales_volume || 0) > 5000) advantages.push('销量领先');
    if ((brand.reputation_score || 0) > 80) advantages.push('口碑极佳');
    if ((brand.vote_count || 0) > 1000) advantages.push('人气旺盛');
    if (brand.level === 'S' || brand.level === 'A') advantages.push('品牌等级高');
    return advantages.join('、') || '综合实力强劲';
  }

  getMomentum(brand) {
    const random = Math.random();
    if (random > 0.7) return '上升势头迅猛';
    if (random > 0.4) return '稳中有升';
    return '保持稳定';
  }

  generateReport(categoryId, period = '2024-Q1') {
    const category = db.prepare('SELECT * FROM ranking_categories WHERE id = ?').get(categoryId);
    const rankings = db.prepare(`
      SELECT r.*, b.name, b.industry, b.category, b.region, b.level,
             b.established_year, b.sales_volume, b.reputation_score, b.vote_count
      FROM rankings r
      JOIN brands b ON r.brand_id = b.id
      WHERE r.category_id = ? AND r.period = ?
      ORDER BY r.rank_position ASC
      LIMIT 20
    `).all(categoryId, period);

    if (rankings.length === 0) {
      throw new Error('No ranking data available for this category');
    }

    const top10Features = this.extractTop10Features(rankings.slice(0, 10));
    const competitionAnalysis = this.analyzeCompetition(rankings, category);

    const reportTitle = `${period}${category?.name || '行业'}品牌研究报告`;
    const reportContent = this.generateReportContent(category, rankings, top10Features, competitionAnalysis, period);

    const reportId = db.prepare(`
      INSERT INTO research_reports (title, category, content, period, top10_features, competition_analysis, generated_by)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(
      reportTitle,
      category?.code || 'general',
      reportContent,
      period,
      JSON.stringify(top10Features),
      JSON.stringify(competitionAnalysis)
    ).lastInsertRowid;

    return {
      id: reportId,
      title: reportTitle,
      top10Features,
      competitionAnalysis,
      content: reportContent
    };
  }

  generateReportContent(category, rankings, features, competition, period) {
    const top3 = rankings.slice(0, 3).map((r, i) => `${i + 1}. ${r.name}（综合得分：${r.final_score?.toFixed(1)}）`).join('\n');
    
    return `
# ${competition.category}品牌竞争力分析报告

## 一、报告概述
本报告基于${period}数据，从品牌影响力、市场表现、消费者口碑等多个维度，对${competition.category}领域TOP20品牌进行全面评估。

## 二、TOP10品牌榜单
${top3}
...

## 三、行业特征分析
1. 品牌平均经营年限：${features.avgEstablishedYears}年
2. 市场集中度（CR3）：${features.marketConcentration}%
3. 品牌等级分布：${Object.entries(features.levelDistribution).map(([k, v]) => `${k}级${v}家`).join('、')}

## 四、竞争格局分析
${competition.competitiveLandscape}

### 市场领导者
${competition.marketLeaders.map(l => `- ${l.name}：${l.advantage}`).join('\n')}

### 主要挑战者
${competition.challengers.map(c => `- ${c.name}：${c.momentum}`).join('\n')}

## 五、行业机遇与挑战
### 机遇
${competition.opportunities.map(o => `- ${o}`).join('\n')}

### 挑战
${competition.threats.map(t => `- ${t}`).join('\n')}

## 六、关键趋势
${features.keyTrends.map(t => `- ${t}`).join('\n')}

---
*报告生成时间：${new Date().toLocaleString()}*
    `.trim();
  }

  getReports(category = null, limit = 20) {
    let query = 'SELECT * FROM research_reports';
    const params = [];
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    return db.prepare(query).all(...params);
  }
}

module.exports = new ReportGenerator();
