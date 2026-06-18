const summaryTemplates = [
  '本次实践活动的核心内容围绕{theme}展开，团队通过{method}方式深入{location}，取得了{result}的显著成效，为后续工作积累了宝贵经验。',
  '实践团队以{theme}为主题，在{location}开展了为期数天的实地调研与服务，通过{method}，有效提升了当地{field}水平，获得了各方好评。',
  '在{location}的实践中，团队聚焦{theme}，运用{method}方法，帮助当地实现了{result}的突破性进展，实践成果获高度认可。',
];

const keywordPool = ['乡村振兴', '社会实践', '志愿服务', '科技助农', '教育帮扶', '文化传承', '生态环保', '医疗健康', '数字赋能', '产业调研', '政策宣讲', '社区服务'];

const serviceTagPool = ['乡村调研', '技能培训', '健康宣讲', '文化宣传', '环境监测', '教育辅导', '电商助农', '社区服务', '基地对接', '志愿服务'];

export function generateSummary(text: string): string {
  if (!text || text.length < 10) return '内容过短，无法生成摘要。';

  const theme = keywordPool[Math.floor(Math.random() * keywordPool.length)];
  const method = ['实地走访', '问卷调查', '座谈交流', '数据分析', '现场教学'][Math.floor(Math.random() * 5)];
  const location = ['基层乡村', '社区一线', '实践基地', '合作单位'][Math.floor(Math.random() * 4)];
  const result = ['服务质量提升', '工作效率改善', '群众满意度提高', '产业效益增长'][Math.floor(Math.random() * 4)];
  const field = ['公共服务', '产业发展', '文化建设', '生态治理'][Math.floor(Math.random() * 4)];

  const template = summaryTemplates[Math.floor(Math.random() * summaryTemplates.length)];
  return template
    .replace('{theme}', theme)
    .replace('{method}', method)
    .replace('{location}', location)
    .replace('{result}', result)
    .replace('{field}', field);
}

export function extractKeywords(text: string): string[] {
  if (!text || text.length < 10) return [];

  const matched = keywordPool.filter((kw) => text.includes(kw));
  if (matched.length >= 3) return matched.slice(0, 4);

  const shuffled = [...keywordPool].sort(() => Math.random() - 0.5);
  const fallback = shuffled.slice(0, 3 - matched.length);
  return [...matched, ...fallback].slice(0, 4);
}

export function extractServiceTags(text: string): string[] {
  if (!text || text.length < 10) return [];

  const matched = serviceTagPool.filter((tag) => text.includes(tag));
  if (matched.length >= 2) return matched.slice(0, 3);

  const shuffled = [...serviceTagPool].sort(() => Math.random() - 0.5);
  const fallback = shuffled.slice(0, 2 - matched.length);
  return [...matched, ...fallback].slice(0, 3);
}
