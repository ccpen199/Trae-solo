import db from './db.js'

const keywordMap = {
  '合同': '合同纠纷',
  '违约': '合同纠纷',
  '协议': '合同纠纷',
  '借款': '债权债务',
  '欠款': '债权债务',
  '借贷': '债权债务',
  '房产': '房产纠纷',
  '房屋': '房产纠纷',
  '买房': '房产纠纷',
  '离婚': '婚姻家庭',
  '结婚': '婚姻家庭',
  '抚养': '婚姻家庭',
  '继承': '继承纠纷',
  '遗产': '继承纠纷',
  '遗嘱': '继承纠纷',
  '劳动': '劳动争议',
  '工资': '劳动争议',
  '工伤': '工伤赔偿',
  '交通事故': '交通事故',
  '车祸': '交通事故',
  '肇事': '交通事故',
  '刑事': '刑事辩护',
  '犯罪': '刑事辩护',
  '盗窃': '刑事辩护',
  '诈骗': '刑事辩护',
  '故意伤害': '刑事辩护',
  '人身损害': '人身损害',
  '侵权': '人身损害',
  '赔偿': '人身损害'
}

const caseCodes = {
  '合同纠纷': 'M0101',
  '债权债务': 'M0102',
  '房产纠纷': 'M0103',
  '婚姻家庭': 'M0201',
  '继承纠纷': 'M0202',
  '人身损害': 'M0301',
  '劳动争议': 'M0401',
  '工伤赔偿': 'M0402',
  '刑事辩护': 'M0501',
  '交通事故': 'M0601'
}

export const analyzeConsultation = (content) => {
  const keywords = []
  const categories = new Set()
  
  for (const [kw, cat] of Object.entries(keywordMap)) {
    if (content.includes(kw)) {
      keywords.push(kw)
      categories.add(cat)
    }
  }
  
  return {
    keywords: Array.from(new Set(keywords)),
    categories: Array.from(categories),
    primaryCategory: Array.from(categories)[0] || '合同纠纷'
  }
}

export const matchLawyers = (consultationContent, limit = 3) => {
  const analysis = analyzeConsultation(consultationContent)
  const targetCategories = analysis.categories.length > 0 ? analysis.categories : ['合同纠纷']
  
  const allLawyers = db.prepare(`
    SELECT l.*, json_group_array(json_object('category', ls.category, 'weight', ls.weight)) as specialties_json
    FROM lawyers l
    LEFT JOIN lawyer_specialties ls ON l.id = ls.lawyer_id
    WHERE l.license_verified = 1
    GROUP BY l.id
  `).all()
  
  const scored = allLawyers.map(lawyer => {
    let score = 0
    const specialties = JSON.parse(lawyer.specialties_json || '[]').filter(s => s.category)
    
    for (const cat of targetCategories) {
      const spec = specialties.find(s => s.category === cat)
      if (spec) {
        score += spec.weight * 100
      }
    }
    
    score += lawyer.win_rate * 30
    score += lawyer.sentiment_score * 20
    score += Math.min(lawyer.practice_years, 20) * 0.5
    score -= lawyer.avg_response_time * 0.1
    
    return {
      ...lawyer,
      specialties: specialties,
      match_score: Math.round(score * 10) / 10
    }
  })
  
  scored.sort((a, b) => b.match_score - a.match_score)
  
  return {
    analysis,
    caseCode: caseCodes[analysis.primaryCategory] || 'M0000',
    matchedLawyers: scored.slice(0, limit)
  }
}

export default { analyzeConsultation, matchLawyers }
