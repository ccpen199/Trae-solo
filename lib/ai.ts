import { calculatePercentile, matchScore } from "@/lib/utils";

export interface ResumeParseResult {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  yearsExperience?: number;
  skills: string[];
  educations: Array<{
    school?: string;
    degree?: string;
    major?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  workExperiences: Array<{
    company?: string;
    position?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
    achievements?: string[];
    skillsUsed?: string[];
  }>;
  certificates: Array<{
    name?: string;
    issuer?: string;
    issueDate?: string;
  }>;
  projects: Array<{
    name?: string;
    role?: string;
    description?: string;
    technologies?: string[];
  }>;
  confidence: number;
}

export interface AIScreeningResult {
  overallScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  experienceMatch: {
    required: number;
    actual: number;
    score: number;
  };
  educationMatch: {
    required: string;
    actual: string;
    score: number;
  };
  certificateMatch: {
    required: string[];
    actual: string[];
    missing: string[];
    score: number;
  };
  skillMatch: {
    score: number;
    details: Array<{ skill: string; score: number }>;
  };
  summary: string;
  recommendations: string[];
}

const DEGREE_RANK: Record<string, number> = {
  高中: 1,
  中专: 1,
  大专: 2,
  专科: 2,
  本科: 3,
  学士: 3,
  硕士: 4,
  研究生: 4,
  MBA: 4,
  博士: 5,
  博士后: 6,
};

export function parseResumeText(text: string): ResumeParseResult {
  const result: ResumeParseResult = {
    skills: [],
    educations: [],
    workExperiences: [],
    certificates: [],
    projects: [],
    confidence: 0,
  };

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const fullText = text.toLowerCase();

  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) result.email = emailMatch[0];

  const phoneMatch = text.match(/(?:\+?86)?1[3-9]\d{9}/);
  if (phoneMatch) result.phone = phoneMatch[0].replace(/^\+?86/, "");

  if (lines.length > 0 && lines[0].length < 20) {
    result.fullName = lines[0].replace(/[【\[\(].*?[】\]\)]/g, "").trim();
  }

  const locationKeywords = ["北京", "上海", "广州", "深圳", "杭州", "成都", "南京", "武汉", "西安", "重庆", "苏州", "天津", "长沙", "郑州", "青岛", "宁波", "厦门", "福州", "济南", "合肥"];
  for (const loc of locationKeywords) {
    if (fullText.includes(loc)) {
      result.location = loc;
      break;
    }
  }

  const commonSkills = [
    "JavaScript", "TypeScript", "React", "Vue", "Angular", "Node.js", "Python",
    "Java", "Go", "Golang", "Rust", "C++", "C#", "PHP", "Ruby", "Swift", "Kotlin",
    "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Kafka", "RabbitMQ",
    "Docker", "Kubernetes", "K8s", "AWS", "阿里云", "腾讯云", "微服务", "分布式",
    "Spring Boot", "Spring Cloud", "Django", "Flask", "FastAPI", "Next.js", "Nuxt.js",
    "TailwindCSS", "Sass", "Less", "Webpack", "Vite", "Git", "Linux", "Nginx",
    "机器学习", "深度学习", "TensorFlow", "PyTorch", "NLP", "计算机视觉", "数据挖掘",
    "产品经理", "项目管理", "PMP", "敏捷开发", "Scrum", "UI设计", "UX设计", "Figma",
  ];

  const foundSkills = new Set<string>();
  for (const skill of commonSkills) {
    if (fullText.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  }
  result.skills = Array.from(foundSkills);

  parseEducationSections(text, result);
  parseWorkExperienceSections(text, result);
  parseCertificateSections(text, result);
  parseProjectSections(text, result);

  let totalYears = 0;
  for (const exp of result.workExperiences) {
    if (exp.startDate) {
      const start = new Date(exp.startDate);
      const end = exp.isCurrent || !exp.endDate ? new Date() : new Date(exp.endDate);
      totalYears += (end.getTime() - start.getTime()) / (365 * 24 * 60 * 60 * 1000);
    }
  }
  result.yearsExperience = Math.round(totalYears * 10) / 10;

  let conf = 0;
  if (result.email) conf += 15;
  if (result.phone) conf += 15;
  if (result.fullName) conf += 10;
  if (result.workExperiences.length > 0) conf += 20;
  if (result.educations.length > 0) conf += 15;
  if (result.skills.length > 0) conf += 15;
  if (result.certificates.length > 0) conf += 5;
  if (result.projects.length > 0) conf += 5;
  result.confidence = Math.min(100, conf);

  return result;
}

function parseEducationSections(text: string, result: ResumeParseResult) {
  const patterns = [
    /(教育背景|教育经历|学历)([\s\S]*?)(?=工作|项目|技能|实习|证书|$)/i,
    /(教育)([\s\S]*?)(?=工作|项目|技能|实习|证书|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const section = match[2];
      const entries = section.split(/\n\s*\n/).filter((s) => s.trim().length > 10);

      for (const entry of entries) {
        const schoolMatch = entry.match(/(清华|北大|复旦|交大|浙大|南大|中科大|武大|华科|人大|哈工大|同济|北航|北师大|南开|天大|厦大|中山|川大|山东大学|吉林大学|[北|上|广|深|杭|成|南]?\s*大学|学院|School|University|College)/i);
        if (!schoolMatch) continue;

        let school = "";
        const lines = entry.split(/\r?\n/);
        for (const line of lines) {
          if (/大学|学院|School|University|College/i.test(line)) {
            school = line.replace(/\d{4}.*?\d{4}|\d{4}[.\-/年到至至]+|[\|｜·•]/g, "").trim();
            break;
          }
        }
        if (!school) continue;

        const degreeMatch = entry.match(/(博士|硕士|研究生|MBA|本科|学士|大专|专科|高中|中专|PhD|Master|Bachelor|Associate)/i);
        const majorMatch = entry.match(/(计算机|软件|电子|通信|自动化|机械|土木|金融|会计|管理|营销|新闻|法律|医学|生物|化学|物理|数学|外语|英语|日语|文学|历史|哲学|经济学|法学|工学|理学|医学|教育学|艺术学|工程|设计|Humanities|Science|Engineering|Business|Arts|Major.*?:?)/i);
        const dateMatch = entry.match(/(\d{4})[.\-/年](\d{1,2})?[.\-/月]?.*?[到至\-~](\d{4})[.\-/年](\d{1,2})?[.\-/月]?|(\d{4})[.\-/年](\d{1,2})?[.\-/月]?/);

        result.educations.push({
          school: school,
          degree: degreeMatch?.[1],
          major: majorMatch?.[1],
          startDate: dateMatch ? `${dateMatch[1] || dateMatch[5]}-${dateMatch[2] || "01"}-01` : undefined,
          endDate: dateMatch && dateMatch[3] ? `${dateMatch[3]}-${dateMatch[4] || "01"}-01` : undefined,
          description: entry.trim(),
        });
      }

      if (result.educations.length > 0) break;
    }
  }

  if (result.educations.length === 0) {
    const eduRegex = /([\u4e00-\u9fa5A-Za-z\s]+大学|[\u4e00-\u9fa5A-Za-z\s]+学院)[\s,，]*(博士|硕士|研究生|MBA|本科|学士|大专|专科)?[\s,，]*([\u4e00-\u9fa5A-Za-z\s]+专业)?/g;
    let match;
    while ((match = eduRegex.exec(text)) !== null) {
      result.educations.push({
        school: match[1].trim(),
        degree: match[2],
        major: match[3]?.replace(/专业$/, "").trim(),
      });
    }
  }
}

function parseWorkExperienceSections(text: string, result: ResumeParseResult) {
  const patterns = [
    /(工作经历|工作经验|职业经历|从业经历)([\s\S]*?)(?=教育|项目|技能|实习|证书|自我评价|$)/i,
    /(工作|职业经历)([\s\S]*?)(?=教育|项目|技能|实习|证书|自我评价|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const section = match[2];
      const blocks = section.split(/\n(?=\s*[A-Z0-9\u4e00-\u9fa5].*\d{4})/);

      for (const block of blocks) {
        if (block.trim().length < 20) continue;

        const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const firstLine = lines[0] || "";

        const companyKeywords = /(公司|科技|集团|有限|股份|Co\.|Ltd\.|Inc\.|Corp\.)/i;
        let company = "";
        let position = "";

        if (companyKeywords.test(firstLine)) {
          company = firstLine.replace(/\d{4}.*?\d{4}|\d{4}[.\-/年到至至]+[\d.\-/年月至今]*|[\|｜·•]/g, "").trim();
          if (lines[1]) position = lines[1].replace(/[\|｜·•].*/, "").trim();
        } else {
          const parts = firstLine.split(/[\|｜·•,\s]{2,}/);
          if (parts.length >= 2) {
            company = parts[0].trim();
            position = parts[1].trim();
          }
        }

        const dateMatch = block.match(/(\d{4})[.\-/年](\d{1,2})?[.\-/月]?\s*[到至\-~至今]\s*(\d{4})?[.\-/年]?(\d{1,2})?[.\-/月]?/);
        const isCurrent = /至今|现在|Present|Now/i.test(block);

        let description = lines.slice(2).join("\n").trim();
        if (description.length < 10) description = lines.slice(1).join("\n").trim();

        const achievements: string[] = [];
        const achRegex = /[•·●\-\d][.、)）]?\s*([^\n]*?(?:负责|主导|参与|完成|优化|提升|实现|开发|设计|搭建|管理|建设|推动|取得|获得|获|率|%|倍|\+|万|千|百万|千万|亿)[^\n]*)/g;
        let achMatch;
        while ((achMatch = achRegex.exec(description)) !== null) {
          if (achMatch[1].trim().length > 5) achievements.push(achMatch[1].trim());
        }

        result.workExperiences.push({
          company: company || undefined,
          position: position || undefined,
          startDate: dateMatch && dateMatch[1] ? `${dateMatch[1]}-${dateMatch[2] || "01"}-01` : undefined,
          endDate: !isCurrent && dateMatch && dateMatch[3] ? `${dateMatch[3]}-${dateMatch[4] || "01"}-01` : undefined,
          isCurrent,
          description,
          achievements: achievements.slice(0, 5),
        });
      }

      if (result.workExperiences.length > 0) break;
    }
  }
}

function parseCertificateSections(text: string, result: ResumeParseResult) {
  const patterns = [
    /(证书|资质|资格证书|Certificates?)([\s\S]*?)(?=教育|工作|项目|技能|自我评价|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const section = match[2];
      const lines = section.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

      for (const line of lines) {
        if (line.length < 3 || line.length > 80) continue;

        const certKeywords = /(PMP|ACP|CFA|CPA|司法|建造师|注册|教师资格|律师|医师|软考|高级|中级|初级|Oracle|AWS|阿里云|腾讯云|华为|思科|CCNA|CCNP|CCIE|PMP|ITIL|ISO|CISM|CISSP|CEH|SCJP|OCJP|MCSD|MCSE)/i;
        if (certKeywords.test(line) || /证书|认证|资格|License/i.test(line)) {
          result.certificates.push({
            name: line.replace(/\d{4}[.\-/年][\d.\-/年月]*/g, "").trim(),
          });
        }
      }

      if (result.certificates.length > 0) break;
    }
  }
}

function parseProjectSections(text: string, result: ResumeParseResult) {
  const patterns = [
    /(项目经验|项目经历|Projects?)([\s\S]*?)(?=教育|工作|技能|实习|证书|自我评价|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const section = match[2];
      const blocks = section.split(/\n(?=\s*[A-Z0-9\u4e00-\u9fa5].*\d{4}|项目[:：])/).slice(0, 5);

      for (const block of blocks) {
        if (block.trim().length < 15) continue;

        const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const projectLine = lines[0] || "";
        const name = projectLine.replace(/\d{4}.*?\d{4}|\d{4}[.\-/年到至至]+[\d.\-/年月至今]*|[\|｜·•]/g, "").trim();
        if (!name || name.length < 2) continue;

        const techs: string[] = [];
        const techRegex = /(JavaScript|TypeScript|React|Vue|Node\.js|Python|Java|Go|MySQL|Redis|MongoDB|Docker|K8s|Kubernetes|Spring|Django|Flask|微服务|分布式)/gi;
        let techMatch;
        while ((techMatch = techRegex.exec(block)) !== null) {
          if (!techs.includes(techMatch[0])) techs.push(techMatch[0]);
        }

        result.projects.push({
          name: name.slice(0, 60),
          role: (lines[1] || "").replace(/[\|｜·•].*/, "").trim().slice(0, 30) || undefined,
          description: lines.slice(2).join("\n").trim().slice(0, 500),
          technologies: techs,
        });
      }

      break;
    }
  }
}

export function runAIScreening(params: {
  jdKeywords: string[];
  jdText: string;
  resume: ResumeParseResult;
  minExperience: number;
  educationRequirement: string;
  requiredCertificates: string[];
}): AIScreeningResult {
  const { jdKeywords, resume, minExperience, educationRequirement, requiredCertificates } = params;

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const allResumeText = [
    resume.summary || "",
    ...resume.workExperiences.map((w) => `${w.company} ${w.position} ${w.description} ${(w.achievements || []).join(" ")}`),
    ...resume.educations.map((e) => `${e.school} ${e.degree} ${e.major}`),
    ...resume.skills,
    ...resume.certificates.map((c) => c.name || ""),
    ...resume.projects.map((p) => `${p.name} ${p.role} ${p.description} ${(p.technologies || []).join(" ")}`),
  ].join(" ").toLowerCase();

  for (const keyword of jdKeywords) {
    if (allResumeText.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  }

  const keywordScore = jdKeywords.length > 0
    ? Math.round((matchedKeywords.length / jdKeywords.length) * 100)
    : 50;

  const actualYears = resume.yearsExperience || 0;
  let experienceScore = 100;
  if (minExperience > 0) {
    if (actualYears >= minExperience) {
      experienceScore = 100;
    } else {
      experienceScore = Math.max(0, Math.round((actualYears / minExperience) * 70));
    }
  }

  const requiredRank = DEGREE_RANK[educationRequirement] || 0;
  let actualRank = 0;
  let actualDegree = "";
  for (const edu of resume.educations) {
    if (edu.degree) {
      const rank = DEGREE_RANK[edu.degree] || 0;
      if (rank > actualRank) {
        actualRank = rank;
        actualDegree = edu.degree;
      }
    }
  }
  let educationScore = 100;
  if (requiredRank > 0) {
    if (actualRank >= requiredRank) {
      educationScore = 100;
    } else if (actualRank === 0) {
      educationScore = 20;
    } else {
      const diff = requiredRank - actualRank;
      educationScore = Math.max(0, 100 - diff * 25);
    }
  }

  const actualCertificates = resume.certificates.map((c) => (c.name || "").toLowerCase());
  const matchedCerts: string[] = [];
  const missingCerts: string[] = [];
  for (const cert of requiredCertificates) {
    const matched = actualCertificates.some((c) => matchScore(c, cert.toLowerCase()) >= 60);
    if (matched) matchedCerts.push(cert);
    else missingCerts.push(cert);
  }
  const certScore = requiredCertificates.length > 0
    ? Math.round((matchedCerts.length / requiredCertificates.length) * 100)
    : 100;

  const skillDetails: Array<{ skill: string; score: number }> = [];
  for (const skill of resume.skills.slice(0, 10)) {
    let s = 50;
    const inWork = resume.workExperiences.some((w) =>
      (w.skillsUsed || []).some((x) => matchScore(x, skill) >= 60) ||
      (w.description || "").toLowerCase().includes(skill.toLowerCase())
    );
    const inProject = resume.projects.some((p) =>
      (p.technologies || []).some((x) => matchScore(x, skill) >= 60)
    );
    if (inWork && inProject) s = 95;
    else if (inWork) s = 85;
    else if (inProject) s = 70;
    skillDetails.push({ skill, score: s });
  }
  const skillScore = skillDetails.length > 0
    ? Math.round(skillDetails.reduce((acc, d) => acc + d.score, 0) / skillDetails.length)
    : 40;

  const overallScore = Math.round(
    keywordScore * 0.35 +
    experienceScore * 0.2 +
    educationScore * 0.15 +
    certScore * 0.15 +
    skillScore * 0.15
  );

  const recommendations: string[] = [];
  if (missingKeywords.length > 0) {
    recommendations.push(`建议补充以下关键技能的项目经验：${missingKeywords.slice(0, 5).join("、")}`);
  }
  if (actualYears < minExperience && minExperience > 0) {
    recommendations.push(`经验要求：需${minExperience}年以上，当前约${actualYears}年，可突出相关项目深度`);
  }
  if (actualRank < requiredRank && requiredRank > 0) {
    recommendations.push(`学历要求：${educationRequirement}，可通过证书/项目弥补`);
  }
  if (missingCerts.length > 0) {
    recommendations.push(`建议考取相关认证：${missingCerts.join("、")}`);
  }
  if (skillScore < 70) {
    recommendations.push("建议加强核心技能的实际项目历练，提升技能深度");
  }

  let summary = "";
  if (overallScore >= 85) summary = "高度匹配，核心要求全部满足，强烈推荐进入面试";
  else if (overallScore >= 70) summary = "较好匹配，大部分要求满足，建议安排初筛";
  else if (overallScore >= 55) summary = "基本匹配，部分硬性条件存在差距，可结合岗位需求考虑";
  else if (overallScore >= 40) summary = "匹配度一般，多项要求未达标，建议存入人才库后续跟进";
  else summary = "匹配度较低，暂不推荐当前岗位";

  return {
    overallScore,
    matchedKeywords,
    missingKeywords,
    experienceMatch: {
      required: minExperience,
      actual: actualYears,
      score: experienceScore,
    },
    educationMatch: {
      required: educationRequirement,
      actual: actualDegree || "未识别",
      score: educationScore,
    },
    certificateMatch: {
      required: requiredCertificates,
      actual: matchedCerts,
      missing: missingCerts,
      score: certScore,
    },
    skillMatch: {
      score: skillScore,
      details: skillDetails,
    },
    summary,
    recommendations,
  };
}

export function generateSalaryPercentiles(salaries: number[]) {
  if (salaries.length === 0) {
    return { p25: 0, p50: 0, p75: 0, avg: 0, min: 0, max: 0, count: 0 };
  }
  const sorted = [...salaries].sort((a, b) => a - b);
  return {
    p25: Math.round(calculatePercentile(salaries, 25)),
    p50: Math.round(calculatePercentile(salaries, 50)),
    p75: Math.round(calculatePercentile(salaries, 75)),
    avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    count: sorted.length,
  };
}
