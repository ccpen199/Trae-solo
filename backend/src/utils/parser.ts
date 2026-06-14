import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { ResumeContent, EducationItem, ExperienceItem, ProjectItem, SkillItem } from '../types';

const STRONG_VERBS = ['主导', '负责', '设计', '开发', '优化', '推动', '搭建', '重构', '落地', '实现', '提升', '降低', '完成', '带领', '管理', '协调', '建立', '制定', '推进', '突破'];
const WEAK_VERBS = ['参与', '协助', '学习', '了解', '熟悉', '接触', '做过', '尝试', '帮忙', '配合'];

const KEYWORDS_BY_INDUSTRY: Record<string, string[]> = {
  tech: ['JavaScript', 'TypeScript', 'React', 'Vue', 'Node.js', 'Python', 'Java', 'MySQL', 'Redis', 'Git', 'Docker', 'Kubernetes', '微服务', '高并发', '分布式', '算法', '数据结构', 'Linux', 'HTTP', 'RESTful', 'GraphQL', 'CI/CD', '敏捷开发'],
  product: ['需求分析', '用户调研', '原型设计', 'PRD', 'Axure', 'Figma', '用户增长', '数据分析', 'A/B测试', '用户画像', '竞品分析', '产品规划', '项目管理', '跨部门协作', 'OKR', 'KPI', '用户体验', '交互设计', '商业化', '运营'],
  design: ['UI设计', 'UX设计', 'Figma', 'Sketch', 'Adobe', 'Photoshop', 'Illustrator', '设计系统', '组件库', '交互设计', '视觉设计', '动效设计', '用户研究', '可用性测试', '品牌设计', '插画', '3D', 'C4D', '响应式设计', '设计规范'],
  data: ['SQL', 'Python', 'Excel', 'Tableau', 'Power BI', '数据分析', '数据挖掘', '机器学习', '统计学', 'A/B测试', '用户增长', '数据可视化', 'ETL', '数据仓库', 'Hadoop', 'Spark', 'Kafka', '数据建模', '指标体系', '商业分析'],
  marketing: ['市场推广', '品牌营销', '内容营销', '新媒体', '短视频', '直播', 'SEO', 'SEM', '小红书', '抖音', '微信公众号', '用户增长', '活动策划', '社群运营', '私域流量', '转化漏斗', '数据分析', 'ROI', '品牌定位', '整合营销'],
  hr: ['招聘', '培训', '绩效', '薪酬', '员工关系', '企业文化', '组织发展', '人才发展', 'HRBP', 'OD', 'TD', 'LD', '劳动法', '面试', '人才盘点', '胜任力模型', '员工体验', 'EAP', '人力资源规划', '雇主品牌'],
  finance: ['财务分析', '预算管理', '成本控制', '会计核算', '税务', '审计', '资金管理', '融资', '投资分析', '财务报表', 'ERP', 'SAP', '金蝶', '用友', '内部控制', '风险管理', '财务模型', '估值', 'IPO', '并购'],
  operation: ['用户运营', '内容运营', '活动运营', '社群运营', '电商运营', '产品运营', '数据运营', '增长黑客', 'A/B测试', '用户增长', '留存', '转化', '召回', 'GMV', 'DAU', 'MAU', '漏斗分析', 'RPA', '流程优化', '项目管理'],
  sales: ['客户开发', '商务谈判', '渠道管理', '销售技巧', 'CRM', '客户关系', '业绩达成', '市场拓展', '解决方案', '招投标', '合同管理', '回款', '客户成功', 'SaaS', '大客户', 'ToB', 'ToC', '销售漏斗', '陌拜', '关单技巧']
};

export async function parseResumeFile(file: Express.Multer.File): Promise<Partial<ResumeContent>> {
  let text = '';
  
  if (file.mimetype === 'application/pdf') {
    const data = await pdf(file.buffer);
    text = data.text;
  } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
             file.originalname.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    text = result.value;
  } else {
    text = file.buffer.toString('utf-8');
  }

  return parseResumeText(text);
}

export function parseResumeText(text: string): Partial<ResumeContent> {
  const result: Partial<ResumeContent> = {
    basicInfo: extractBasicInfo(text),
    education: extractEducation(text),
    experience: extractExperience(text),
    projects: extractProjects(text),
    skills: extractSkills(text),
    summary: extractSummary(text)
  };
  
  return result;
}

function extractBasicInfo(text: string): any {
  const phoneMatch = text.match(/1[3-9]\d{9}/);
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  
  const nameLines = text.split('\n').filter(l => l.trim().length > 0 && l.trim().length < 10);
  const name = nameLines[0]?.trim() || '';
  
  return {
    name,
    phone: phoneMatch?.[0] || '',
    email: emailMatch?.[0] || '',
    location: extractLocation(text),
    website: extractWebsite(text)
  };
}

function extractLocation(text: string): string {
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '苏州', '重庆', '天津', '长沙', '青岛', '大连', '厦门', '宁波', '无锡', '合肥', '郑州', '济南', '佛山', '东莞', '福州'];
  for (const city of cities) {
    if (text.includes(city)) return city;
  }
  return '';
}

function extractWebsite(text: string): string {
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  return urlMatch?.[0] || '';
}

function extractEducation(text: string): EducationItem[] {
  const items: EducationItem[] = [];
  const degrees = ['博士', '硕士', '本科', '大专', '高中', 'PhD', 'Master', 'Bachelor', 'MBA'];
  const schools = ['大学', '学院', 'University', 'College', 'Institute', 'Academy'];
  
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (schools.some(s => line.includes(s))) {
      let degree = '';
      for (const d of degrees) {
        if (line.includes(d) || (i > 0 && lines[i-1].includes(d)) || (i + 1 < lines.length && lines[i+1].includes(d))) {
          degree = d;
          break;
        }
      }
      
      const dateMatch = line.match(/(20\d{2})\s*[-~至到]\s*(20\d{2}|至今|现在)/);
      
      items.push({
        id: `edu-${Date.now()}-${i}`,
        school: line.replace(/\d{4}[-~至到]\d{4}/g, '').replace(/[年月至今]/g, '').trim().substring(0, 50),
        degree,
        major: extractMajor(lines, i),
        startDate: dateMatch?.[1] || '',
        endDate: dateMatch?.[2] || '',
        gpa: '',
        description: ''
      });
    }
  }
  
  return items.slice(0, 5);
}

function extractMajor(lines: string[], index: number): string {
  const majors = ['计算机', '软件', '电子', '通信', '自动化', '机械', '土木', '金融', '会计', '管理', '市场', '新闻', '外语', '数学', '物理', '化学', '生物', '医学', '法学', '设计', '艺术', 'Engineering', 'Computer', 'Science', 'Business', 'Finance', 'Marketing'];
  for (let offset = -1; offset <= 2; offset++) {
    const idx = index + offset;
    if (idx >= 0 && idx < lines.length) {
      for (const m of majors) {
        if (lines[idx].includes(m)) {
          return lines[idx].trim().substring(0, 30);
        }
      }
    }
  }
  return '';
}

function extractExperience(text: string): ExperienceItem[] {
  const items: ExperienceItem[] = [];
  const lines = text.split('\n');
  const companyKeywords = ['公司', '集团', '科技', '有限', '股份', 'Co.', 'Ltd.', 'Inc.', 'Corp.', '阿里巴巴', '腾讯', '字节', '百度', '美团', '京东', '华为', '小米', '网易', '滴滴', '快手', 'B站', '拼多多'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (companyKeywords.some(k => line.includes(k)) && line.length > 3 && line.length < 60) {
      const dateMatch = line.match(/(20\d{2})\s*[-~至到]\s*(20\d{2}|至今|现在)/);
      
      let description = '';
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        if (lines[j].trim().length > 0 && !companyKeywords.some(k => lines[j].includes(k))) {
          description += lines[j].trim() + '\n';
        } else {
          break;
        }
      }
      
      items.push({
        id: `exp-${Date.now()}-${i}`,
        company: line.replace(/\d{4}[-~至到]\d{4}/g, '').replace(/[年月至今]/g, '').trim().substring(0, 50),
        position: extractPosition(lines, i),
        startDate: dateMatch?.[1] || '',
        endDate: dateMatch?.[2] || '',
        description: description.trim()
      });
    }
  }
  
  return items.slice(0, 5);
}

function extractPosition(lines: string[], index: number): string {
  const positions = ['工程师', '开发', '经理', '主管', '总监', '专员', '助理', '实习生', '产品经理', '设计师', '运营', '分析师', '顾问', 'Engineer', 'Developer', 'Manager', 'Director', 'Intern', 'PM', 'Designer', 'Analyst'];
  for (let offset = -1; offset <= 2; offset++) {
    const idx = index + offset;
    if (idx >= 0 && idx < lines.length) {
      for (const p of positions) {
        if (lines[idx].includes(p)) {
          return lines[idx].trim().substring(0, 30);
        }
      }
    }
  }
  return '';
}

function extractProjects(text: string): ProjectItem[] {
  const items: ProjectItem[] = [];
  const lines = text.split('\n');
  const projectKeywords = ['项目', '系统', '平台', 'Project', 'System', 'App', '网站', '小程序'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (projectKeywords.some(k => line.includes(k)) && line.length > 3 && line.length < 60 && !line.includes('公司')) {
      let description = '';
      const techs: string[] = [];
      
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const trimmed = lines[j].trim();
        if (trimmed.length > 0 && !projectKeywords.some(k => trimmed.includes(k)) && !trimmed.includes('公司')) {
          description += trimmed + '\n';
          const techKeywords = ['React', 'Vue', 'Node', 'Python', 'Java', 'MySQL', 'Redis', 'TypeScript', 'JavaScript', 'Go', 'Rust', 'Docker', 'K8s', 'MongoDB', 'Elasticsearch'];
          for (const t of techKeywords) {
            if (trimmed.includes(t) && !techs.includes(t)) {
              techs.push(t);
            }
          }
        } else {
          break;
        }
      }
      
      if (description.length > 20) {
        items.push({
          id: `proj-${Date.now()}-${i}`,
          name: line.substring(0, 50),
          role: '',
          startDate: '',
          endDate: '',
          description: description.trim(),
          technologies: techs
        });
      }
    }
  }
  
  return items.slice(0, 5);
}

function extractSkills(text: string): SkillItem[] {
  const categories: Record<string, string[]> = {
    '编程语言': ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin'],
    '前端开发': ['React', 'Vue', 'Angular', 'Next.js', 'Nuxt', 'Webpack', 'Vite', 'HTML5', 'CSS3', 'SASS', 'Less', 'TailwindCSS'],
    '后端开发': ['Node.js', 'Express', 'Koa', 'NestJS', 'Django', 'Flask', 'Spring Boot', 'MyBatis', 'Gin', 'Echo'],
    '数据库': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite', 'Oracle', 'SQL Server'],
    '工具与其他': ['Git', 'Docker', 'Kubernetes', 'Linux', 'Nginx', 'CI/CD', 'Jenkins', 'Webpack', 'Figma', 'Sketch', 'Photoshop', 'Excel', 'Tableau', 'Power BI']
  };
  
  const result: SkillItem[] = [];
  
  for (const [category, keywords] of Object.entries(categories)) {
    const found: string[] = [];
    for (const kw of keywords) {
      if (text.includes(kw)) {
        found.push(kw);
      }
    }
    if (found.length > 0) {
      result.push({
        id: `skill-${Date.now()}-${category}`,
        name: category,
        category,
        items: found
      });
    }
  }
  
  return result;
}

function extractSummary(text: string): string {
  const lines = text.split('\n');
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i].trim();
    if ((line.includes('个人简介') || line.includes('自我评价') || line.includes('自我介绍') || line.includes('Summary')) && i + 1 < lines.length) {
      let summary = '';
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        if (lines[j].trim().length > 0) {
          summary += lines[j].trim() + ' ';
        }
      }
      return summary.trim().substring(0, 300);
    }
  }
  return lines[0]?.trim() || '';
}

export function analyzeQuality(content: ResumeContent, industry: string = 'tech') {
  const fullText = JSON.stringify(content);
  const keywords = KEYWORDS_BY_INDUSTRY[industry] || KEYWORDS_BY_INDUSTRY.tech;
  
  const foundKeywords = keywords.filter(k => fullText.includes(k));
  const keywordScore = Math.min(100, Math.round((foundKeywords.length / keywords.length) * 100));
  const missingKeywords = keywords.filter(k => !fullText.includes(k)).slice(0, 10);
  
  const foundStrong = STRONG_VERBS.filter(v => fullText.includes(v));
  const foundWeak = WEAK_VERBS.filter(v => fullText.includes(v));
  const verbScore = Math.min(100, Math.round((foundStrong.length / (foundStrong.length + foundWeak.length + 1)) * 100));
  
  const descriptions = [
    ...content.experience.map(e => e.description),
    ...content.projects.map(p => p.description)
  ].join(' ');
  
  const avgSentenceLength = descriptions.length / Math.max(1, descriptions.split(/[。！？.!?\n]/).length);
  const readabilityScore = avgSentenceLength < 50 ? 80 : avgSentenceLength < 80 ? 60 : 40;
  
  const suggestions: string[] = [];
  
  if (content.experience.length === 0) {
    suggestions.push('建议添加实习或工作经历，这是简历中最重要的部分');
  }
  if (content.projects.length === 0) {
    suggestions.push('建议添加项目经历，展示你的实践能力');
  }
  if (content.education.length === 0) {
    suggestions.push('请完善教育背景信息');
  }
  if (content.skills.length === 0) {
    suggestions.push('建议添加技能标签，帮助HR快速了解你的能力');
  }
  if (!content.summary || content.summary.length < 50) {
    suggestions.push('建议添加个人简介，用2-3句话突出你的核心优势');
  }
  if (missingKeywords.length > 5) {
    suggestions.push(`建议在简历中体现更多行业关键词：${missingKeywords.slice(0, 3).join('、')}等`);
  }
  if (foundWeak.length > 0) {
    suggestions.push(`建议将"${foundWeak.slice(0, 3).join('、')}"等弱动词替换为"主导、负责、设计、优化"等强动词`);
  }
  if (avgSentenceLength > 80) {
    suggestions.push('部分描述过长，建议拆分为短句，使用数字量化成果');
  }
  if (!content.basicInfo.phone || !content.basicInfo.email) {
    suggestions.push('请完善联系方式，确保HR能够联系到你');
  }
  
  const overallScore = Math.round((keywordScore * 0.35 + verbScore * 0.35 + readabilityScore * 0.3));
  
  return {
    overallScore,
    keywordScore,
    verbScore,
    readabilityScore,
    missingKeywords,
    weakVerbs: foundWeak,
    suggestions
  };
}

export function generateATSPlainText(content: ResumeContent): string {
  let text = '';
  
  if (!content) {
    return '简历内容为空，请先编辑简历内容后再导出。\n\n建议完善以下信息：\n▪ 个人基本信息（姓名、电话、邮箱）\n▪ 个人简介\n▪ 教育背景\n▪ 工作/实习经历\n▪ 项目经历\n▪ 专业技能';
  }
  
  const basicInfo = content.basicInfo || {};
  text += `${basicInfo.name || '待填写姓名'}\n`;
  const contactParts: string[] = [];
  if (basicInfo.phone) contactParts.push(`电话: ${basicInfo.phone}`);
  if (basicInfo.email) contactParts.push(`邮箱: ${basicInfo.email}`);
  if (contactParts.length > 0) text += contactParts.join(' | ') + '\n';
  if (basicInfo.location) text += `所在地: ${basicInfo.location}\n`;
  if (basicInfo.website) text += `个人主页: ${basicInfo.website}\n`;
  text += '\n';
  
  if (content.summary) {
    text += '【个人简介】\n';
    text += content.summary + '\n\n';
  }
  
  const experience = content.experience || [];
  if (experience.length > 0) {
    text += '【工作/实习经历】\n';
    for (const exp of experience) {
      text += `▪ ${exp.company || ''}${exp.position ? ' - ' + exp.position : ''}\n`;
      if (exp.startDate) text += `  ${exp.startDate} - ${exp.endDate || '至今'}\n`;
      if (exp.description) text += `  ${exp.description.split('\n').join('\n  ')}\n`;
      text += '\n';
    }
  }
  
  const projects = content.projects || [];
  if (projects.length > 0) {
    text += '【项目经历】\n';
    for (const proj of projects) {
      text += `▪ ${proj.name || ''}${proj.role ? ' - ' + proj.role : ''}\n`;
      if (proj.startDate) text += `  ${proj.startDate} - ${proj.endDate || '至今'}\n`;
      const technologies = proj.technologies || [];
      if (technologies.length > 0) text += `  技术栈: ${technologies.join(', ')}\n`;
      if (proj.description) text += `  ${proj.description.split('\n').join('\n  ')}\n`;
      text += '\n';
    }
  }
  
  const education = content.education || [];
  if (education.length > 0) {
    text += '【教育背景】\n';
    for (const edu of education) {
      const eduParts: string[] = [];
      if (edu.school) eduParts.push(edu.school);
      if (edu.degree) eduParts.push(edu.degree);
      if (edu.major) eduParts.push(edu.major);
      text += `▪ ${eduParts.join(' - ')}\n`;
      if (edu.startDate) text += `  ${edu.startDate} - ${edu.endDate || '至今'}\n`;
      if (edu.gpa) text += `  GPA: ${edu.gpa}\n`;
      if (edu.description) text += `  ${edu.description}\n`;
      text += '\n';
    }
  }
  
  const skills = content.skills || [];
  if (skills.length > 0) {
    text += '【专业技能】\n';
    for (const skill of skills) {
      if (skill.category && skill.items && skill.items.length > 0) {
        text += `▪ ${skill.category}: ${skill.items.join(', ')}\n`;
      } else if (skill.name) {
        const levelText = skill.level ? ` (${skill.level}%)` : '';
        text += `▪ ${skill.name}${levelText}\n`;
      }
    }
    text += '\n';
  }
  
  if (text.trim().length < 20) {
    text = `简历内容为空，请先编辑简历内容后再导出。\n\n建议完善以下信息：\n▪ 个人基本信息（姓名、电话、邮箱）\n▪ 个人简介\n▪ 教育背景\n▪ 工作/实习经历\n▪ 项目经历\n▪ 专业技能\n\n---\n当前模板信息：\n`;
    const features = content.templateFeatures || {};
    if (features.hasCover) text += '▪ 包含封面\n';
    if (features.hasLetter) text += '▪ 包含自荐信\n';
    if (features.hasCharts) text += '▪ 包含技能图表\n';
  }
  
  return text;
}
