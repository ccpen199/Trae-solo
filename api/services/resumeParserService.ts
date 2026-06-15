import { Resume, SkillItem, EducationItem, WorkItem, TownshipCode, JobSeekerType } from '../../shared/types/index.js';

type ParsedResumeResult = any;

const EDUCATION_LEVELS = ['博士', '硕士', '本科', '大专', '中专', '高中', '初中', '小学'];

const COMMON_SKILLS = [
  '数控车床操作', 'CNC编程', '模具设计', '钳工装配', '氩弧焊', '电子维修',
  'PLC编程', '电气控制', '工业机器人', '机械制图CAD', 'SolidWorks', '注塑机调试',
  '电工证', 'MES系统', '品质管理QC', '仓库管理', 'LED组装', '流水线作业',
  '办公软件Office', '财务会计', '人力资源', '外贸英语', '生产管理', '沟通协调',
  'Excel', 'Word', 'PPT', 'Photoshop', '叉车证', '焊工证', 'CAD', 'UG', 'Mastercam',
  'PRO/E', '机电维修', '设备维护', '自动化', '编程', 'Java', 'Python', 'JavaScript',
  'SQL', '项目管理', '质量管理', 'ISO9001', 'Six Sigma', '精益生产',
];

const COMPANY_KEYWORDS = ['公司', '集团', '厂', '企业', '有限公司', '有限责任公司', '股份', '实业'];
const POSITION_KEYWORDS = ['工程师', '主管', '经理', '主任', '操作工', '技师', '技工', '专员', '助理', '组长', '课长', '总监', '技术员'];

const TOWNSHIP_NAMES: Record<string, TownshipCode> = {
  '石岐': TownshipCode.SQ, '石岐街道': TownshipCode.SQ,
  '东凤': TownshipCode.DQ, '东凤镇': TownshipCode.DQ,
  '小榄': TownshipCode.XL, '小榄镇': TownshipCode.XL,
  '古镇': TownshipCode.GZ, '古镇镇': TownshipCode.GZ,
  '沙溪': TownshipCode.SX, '沙溪镇': TownshipCode.SX,
  '三角': TownshipCode.SJ, '三角镇': TownshipCode.SJ,
  '民众': TownshipCode.MZ, '民众街道': TownshipCode.MZ,
  '黄圃': TownshipCode.HP, '黄圃镇': TownshipCode.HP,
  '南头': TownshipCode.NT, '南头镇': TownshipCode.NT,
  '阜沙': TownshipCode.FS, '阜沙镇': TownshipCode.FS,
  '东升': TownshipCode.DS, '东升镇': TownshipCode.DS,
  '观澜': TownshipCode.GK, '观澜镇': TownshipCode.GK,
  '三乡': TownshipCode.SX2, '三乡镇': TownshipCode.SX2,
  '坦洲': TownshipCode.TZ, '坦洲镇': TownshipCode.TZ,
  '板芙': TownshipCode.BF, '板芙镇': TownshipCode.BF,
  '神湾': TownshipCode.SW, '神湾镇': TownshipCode.SW,
  '港口': TownshipCode.GK, '港口镇': TownshipCode.GK,
  '大涌': TownshipCode.DC, '大涌镇': TownshipCode.DC,
  '沙朗': TownshipCode.SQ, '沙朗镇': TownshipCode.SQ,
  '溪兰': TownshipCode.XL, '溪兰镇': TownshipCode.XL,
  '木棉': TownshipCode.NL, '木棉镇': TownshipCode.NL,
  '南朗': TownshipCode.NL, '南朗街道': TownshipCode.NL,
  '文田': TownshipCode.WGS, '文田镇': TownshipCode.WGS,
  '康乐': TownshipCode.HL, '康乐镇': TownshipCode.HL,
  '五桂山': TownshipCode.WGS, '五桂山街道': TownshipCode.WGS,
};

function extractName(text: string): string {
  const lines = text.split(/\n|。|；/).map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 10)) {
    const nameMatch = line.match(/(?:姓\s*名|Name)[：:]\s*([\u4e00-\u9fa5]{2,4})/);
    if (nameMatch) return nameMatch[1];
  }
  for (const line of lines.slice(0, 5)) {
    const cleanLine = line.replace(/[\s\-—|·•]/g, '');
    if (/^[\u4e00-\u9fa5]{2,4}$/.test(cleanLine) && !['求职简历', '个人简历', '基本信息', '联系方式'].includes(cleanLine)) {
      return cleanLine;
    }
  }
  return '未知姓名';
}

function extractPhone(text: string): string {
  const phoneMatch = text.match(/1[3-9]\d{9}/);
  if (phoneMatch) return phoneMatch[0];
  const telMatch = text.match(/(?:电话|Tel|Phone)[：:]\s*([\d\-]{7,15})/);
  if (telMatch) return telMatch[1].replace(/[-\s]/g, '');
  return '未提供';
}

function extractEducation(text: string): string {
  for (const level of EDUCATION_LEVELS) {
    if (text.includes(level)) return level;
  }
  const eduMatch = text.match(/(?:学历|最高学历)[：:]\s*([\u4e00-\u9fa5]+)/);
  if (eduMatch) return eduMatch[1];
  return '学历未注明';
}

function calculateWorkYears(text: string): number {
  const lines = text.split(/\n/);
  let totalMonths = 0;
  const datePatterns = [
    /(\d{4})[\s年.\-\/]+(\d{1,2})[\s月.\-\/]+[至到~—]+\s*(?:(\d{4})[\s年.\-\/]+(\d{1,2})[\s月]?|至今|现在)/g,
    /(\d{4})[\s年]+(\d{1,2})[\s月]+[\-~到至]+(?:(\d{4})[\s年]+(\d{1,2})[\s月]|至今|现在)/g,
  ];

  for (const line of lines) {
    for (const pattern of datePatterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(line)) !== null) {
        const startYear = parseInt(match[1]);
        const startMonth = parseInt(match[2]);
        let endYear, endMonth;

        if (match[3] && match[4]) {
          endYear = parseInt(match[3]);
          endMonth = parseInt(match[4]);
        } else {
          const now = new Date();
          endYear = now.getFullYear();
          endMonth = now.getMonth() + 1;
        }

        const months = (endYear - startYear) * 12 + (endMonth - startMonth);
        if (months > 0 && months < 600) {
          totalMonths += months;
        }
      }
    }
  }

  const yearMatch = text.match(/(\d+)\s*(?:年|years?)\s*(?:工作)?(?:经验|经历)/);
  if (yearMatch && totalMonths === 0) {
    return parseInt(yearMatch[1]);
  }

  return Math.max(0, Math.round(totalMonths / 12 * 10) / 10);
}

function extractSkills(text: string): string[] {
  const foundSkills = new Set<string>();
  const lowerText = text.toLowerCase();

  for (const skill of COMMON_SKILLS) {
    if (text.includes(skill) || lowerText.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  }

  const skillSectionMatch = text.match(/(?:专业技能|技能|Skill|专长|能力)[：:\n]([\s\S]*?)(?=\n\s*(?:工作经历|教育|项目|自我评价|证书|$))/i);
  if (skillSectionMatch) {
    const sectionText = skillSectionMatch[1];
    const skillItems = sectionText.split(/[、,，;；\n|·•]/).map(s => s.trim()).filter(Boolean);
    skillItems.forEach(item => {
      if (item.length >= 2 && item.length < 20) {
        foundSkills.add(item.replace(/[（(].*?[）)]/g, '').trim());
      }
    });
  }

  return Array.from(foundSkills).slice(0, 30);
}

function extractWorkExperience(text: string): string[] {
  const results: string[] = [];
  const workSectionMatch = text.match(/(?:工作经历|工作经验|职业经历|Experience)[：:\n]([\s\S]*?)(?=\n\s*(?:教育|技能|项目|自我评价|证书|$))/i);

  if (workSectionMatch) {
    const section = workSectionMatch[1];
    const blocks = section.split(/\n{2,}|\n(?=\d{4})/);
    for (const block of blocks) {
      const trimmed = block.trim();
      if (trimmed.length < 10) continue;

      let company = '';
      let position = '';

      for (const keyword of COMPANY_KEYWORDS) {
        const idx = trimmed.indexOf(keyword);
        if (idx > -1) {
          const start = Math.max(0, idx - 10);
          company = trimmed.slice(start, idx + keyword.length).replace(/^[\s\-|·•]*/, '').trim();
          if (/^[\u4e00-\u9fa5A-Za-z0-9]/.test(company)) break;
        }
      }

      for (const keyword of POSITION_KEYWORDS) {
        const idx = trimmed.indexOf(keyword);
        if (idx > -1) {
          const start = Math.max(0, idx - 8);
          position = trimmed.slice(start, idx + keyword.length).replace(/^[\s\-|·•]*/, '').trim();
          break;
        }
      }

      const dateMatch = trimmed.match(/(\d{4}[\s年.\-\/]+\d{0,2}[\s月.\-\/]*[至到~—]+\s*(?:\d{4}[\s年.\-\/]*\d{0,2}[\s月]?|至今|现在))/);
      const period = dateMatch ? dateMatch[1].replace(/\s+/g, '') : '';

      if (company || position) {
        results.push(`${period} ${company} ${position}`.trim());
      }
    }
  }

  return results.length > 0 ? results : ['工作经历解析失败，请手动填写'];
}

function extractEducationHistory(text: string): string[] {
  const results: string[] = [];
  const eduSectionMatch = text.match(/(?:教育经历|教育背景|Education)[：:\n]([\s\S]*?)(?=\n\s*(?:工作|技能|项目|自我评价|证书|$))/i);

  if (eduSectionMatch) {
    const section = eduSectionMatch[1];
    const blocks = section.split(/\n{2,}|\n(?=\d{4})/);
    for (const block of blocks) {
      const trimmed = block.trim();
      if (trimmed.length < 6) continue;

      let school = '';
      const schoolMatch = trimmed.match(/([\u4e00-\u9fa5A-Za-z]+(?:大学|学院|学校|职业技术|中学|高中))/);
      if (schoolMatch) school = schoolMatch[1];

      let degree = '';
      for (const level of EDUCATION_LEVELS) {
        if (trimmed.includes(level)) {
          degree = level;
          break;
        }
      }

      let major = '';
      const majorMatch = trimmed.match(/(?:专业|Major)[：:]\s*([\u4e00-\u9fa5A-Za-z]+)/);
      if (majorMatch) major = majorMatch[1];

      const dateMatch = trimmed.match(/(\d{4}[\s年.\-\/]+\d{0,2}[\s月.\-\/]*[至到~—]+\s*(?:\d{4}[\s年.\-\/]*\d{0,2}[\s月]?|至今|现在))/);
      const period = dateMatch ? dateMatch[1].replace(/\s+/g, '') : '';

      if (school || degree) {
        results.push(`${period} ${school} ${degree} ${major}`.trim());
      }
    }
  }

  return results.length > 0 ? results : ['教育经历解析失败，请手动填写'];
}

export function parseResumeText(text: string): ParsedResumeResult {
  const warnings: string[] = [];
  const cleanedText = text.replace(/\r\n/g, '\n').replace(/\t/g, '  ');

  const name = extractName(cleanedText);
  if (name === '未知姓名') warnings.push('未能识别姓名，请核对');

  const phone = extractPhone(cleanedText);
  if (phone === '未提供') warnings.push('未能识别联系电话，请核对');

  const education = extractEducation(cleanedText);
  const workYears = calculateWorkYears(cleanedText);
  const skills = extractSkills(cleanedText);
  if (skills.length < 2) warnings.push('识别技能较少，建议手动补充');

  const workExperience = extractWorkExperience(cleanedText);
  const educationHistory = extractEducationHistory(cleanedText);

  let confidence = 100;
  if (name === '未知姓名') confidence -= 15;
  if (phone === '未提供') confidence -= 15;
  if (skills.length < 3) confidence -= 10;
  if (skills.length < 2) confidence -= 15;
  if (workExperience.length === 0) confidence -= 15;
  if (educationHistory.length === 0) confidence -= 10;
  confidence = Math.max(20, confidence);

  const educationList = educationHistory.map((e: string) => ({
    school: e.match(/([\u4e00-\u9fa5A-Za-z]+(?:大学|学院|学校|职业技术|中学|高中))/)?.[1] || '待补充学校',
    degree: (EDUCATION_LEVELS.find(l => e.includes(l)) || '大专') as string,
    startDate: '2018-09',
    endDate: '2021-06',
    confidence: 80,
  }));

  return {
    basicInfo: {
      name,
      phone,
      education,
      workYears: typeof workYears === 'number' ? workYears : parseFloat(workYears) || 0,
      confidence,
    },
    skills: skills.map((s: string) => ({ name: s, proficiency: 3, confidence: 85 })),
    workExperience: workExperience.map((w: string) => ({
      company: w.match(/[\u4e00-\u9fa5A-Za-z0-9]+(?:公司|集团|厂|企业|有限公司|有限责任公司|股份|实业)/)?.[0] || '待补充公司',
      position: w.match(/[\u4e00-\u9fa5]+(?:工程师|主管|经理|主任|操作工|技师|技工|专员|助理|组长|课长|总监|技术员)/)?.[0] || '待补充职位',
      startDate: '2021-07',
      endDate: new Date().toISOString().slice(0, 7),
      description: w,
      confidence: 80,
    })),
    education: educationList,
    educationHistory,
    skillKeywords: skills,
    overallConfidence: confidence,
    confidence,
    warnings,
    rawText: text,
  } as ParsedResumeResult;
}

export function buildResumeFromParsed(
  parsed: ParsedResumeResult,
  existingResume?: Resume
): Resume {
  const newId = existingResume?.id || `res_${Date.now()}`;
  const newSeekerId = existingResume?.jobSeekerId || `js_${Date.now()}`;

  const parsedSkills = Array.isArray(parsed.skills) ? parsed.skills : [];
  const skillList: SkillItem[] = parsedSkills.map((s: any, idx: number) => ({
    id: `skill_parsed_${idx}`,
    name: typeof s === 'string' ? s : (s.name || '未知技能'),
    proficiency: (typeof s === 'string' ? (idx < 3 ? 4 : 3) : (s.proficiency || 3)) as 1 | 2 | 3 | 4 | 5,
    level: (typeof s === 'string' ? (idx < 3 ? 4 : 3) : (s.level || 3)) as 1 | 2 | 3 | 4 | 5,
    years: typeof s === 'string' ? Math.max(0, idx) : (s.years || 1),
    category: typeof s !== 'string' && s.category ? s.category : '通用技能',
  }));

  const parsedEdu = Array.isArray(parsed.education) ? parsed.education : (parsed.educationHistory || []);
  const educationList: EducationItem[] = parsedEdu.map((item: any, idx: number) => {
    const itemStr = typeof item === 'string' ? item : JSON.stringify(item);
    const dateMatch = itemStr.match(/(\d{4})[\s年.\-\/]*(\d{0,2})?[\s月]*[至到~—]*\s*(\d{4})?[\s年.\-\/]*(\d{0,2})?[\s月]?/);
    return {
      id: `edu_parsed_${idx}`,
      school: typeof item === 'string'
        ? (item.match(/([\u4e00-\u9fa5A-Za-z]+(?:大学|学院|学校|职业技术|中学|高中))/)?.[1] || '待补充学校')
        : (item.school || '待补充学校'),
      major: typeof item === 'string'
        ? (item.match(/[\u4e00-\u9fa5]+?(?=专业|$)/)?.[0] || '待补充专业')
        : (item.major || '待补充专业'),
      degree: (EDUCATION_LEVELS.find(l => itemStr.includes(l)) || '大专') as EducationItem['degree'],
      startDate: dateMatch ? `${dateMatch[1]}-${dateMatch[2]?.padStart(2, '0') || '09'}` : '2018-09',
      endDate: dateMatch && dateMatch[3] ? `${dateMatch[3]}-${dateMatch[4]?.padStart(2, '0') || '06'}` : '2021-06',
      description: typeof item !== 'string' ? item.description : undefined,
    };
  });

  const parsedWork = Array.isArray(parsed.workExperience) ? parsed.workExperience : [];
  const workExperienceList: WorkItem[] = parsedWork.map((item: any, idx: number) => {
    const itemStr = typeof item === 'string' ? item : JSON.stringify(item);
    const dateMatch = itemStr.match(/(\d{4})[\s年.\-\/]*(\d{0,2})?[\s月]*[至到~—]*\s*(\d{4})?[\s年.\-\/]*(\d{0,2})?[\s月]?(至今|现在)?/);
    return {
      id: `work_parsed_${idx}`,
      company: typeof item === 'string'
        ? (item.match(/[\u4e00-\u9fa5A-Za-z0-9]+(?:公司|集团|厂|企业|有限公司|有限责任公司|股份|实业)/)?.[0] || '待补充公司')
        : (item.company || '待补充公司'),
      position: typeof item === 'string'
        ? (item.match(/[\u4e00-\u9fa5]+(?:工程师|主管|经理|主任|操作工|技师|技工|专员|助理|组长|课长|总监|技术员)/)?.[0] || '待补充职位')
        : (item.position || '待补充职位'),
      startDate: dateMatch ? `${dateMatch[1]}-${dateMatch[2]?.padStart(2, '0') || '01'}` : '2021-07',
      endDate: dateMatch && (dateMatch[3] || dateMatch[5]) ? (dateMatch[5] ? new Date().toISOString().slice(0, 7) : `${dateMatch[3]}-${dateMatch[4]?.padStart(2, '0') || '01'}`) : new Date().toISOString().slice(0, 7),
      salary: typeof item !== 'string' && item.salary ? item.salary : 6000,
      highlights: typeof item !== 'string' && item.highlights ? item.highlights : ['完成日常工作任务', '参与团队协作'],
      achievements: [],
      skillsUsed: [],
    } as WorkItem;
  });

  const basicInfoEdu = (EDUCATION_LEVELS.find(l => String(parsed.basicInfo.education || '').includes(l)) || '大专') as any;

  return {
    id: newId,
    jobSeekerId: newSeekerId,
    title: existingResume?.title || `${parsed.basicInfo.name}的个人简历`,
    basicInfo: {
      name: parsed.basicInfo.name,
      gender: existingResume?.basicInfo?.gender || '男',
      age: existingResume?.basicInfo?.age || 28,
      phone: parsed.basicInfo.phone,
      education: basicInfoEdu,
      location: existingResume?.basicInfo?.location || TownshipCode.XL,
      avatar: existingResume?.basicInfo?.avatar,
      workYears: parsed.basicInfo.workYears,
      jobSeekerType: JobSeekerType.SKILLED_WORKER,
    },
    skills: skillList.length > 0 ? skillList : (existingResume?.skills || []),
    skillList: skillList.length > 0 ? skillList : (existingResume?.skillList || []),
    educationList: educationList.length > 0 ? educationList : (existingResume?.educationList || []),
    workList: workExperienceList.length > 0 ? workExperienceList : (existingResume?.workList || []),
    workExperienceList: workExperienceList.length > 0 ? workExperienceList : (existingResume?.workExperienceList || []),
    projectList: existingResume?.projectList || [],
    projects: existingResume?.projects || [],
    certificates: existingResume?.certificates || [],
    selfEvaluation: existingResume?.selfEvaluation || '本人工作认真负责，具有团队合作精神。',
    updatedAt: new Date().toISOString(),
  } as Resume;
}
