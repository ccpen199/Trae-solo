import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

router.post('/resume/optimize', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const { content, target_position } = req.body

  if (!content) {
    res.status(400).json({ success: false, error: '缺少必要字段：content' })
    return
  }

  const position = target_position || '后端开发工程师'

  const mockOptimization = {
    original_content: content,
    optimized_content: `
【个人简介】
目标岗位：${position}
拥有扎实的专业基础和丰富的项目实践经验，具备优秀的学习能力和团队协作精神。

【专业技能】
• 编程语言：熟练掌握 Java/Python/Go 等至少一门主流语言
• 框架技术：熟悉 Spring Boot/Django/Gin 等主流开发框架
• 数据库：精通 MySQL/PostgreSQL，了解 Redis/MongoDB
• 工程化：熟悉 Git、Docker、CI/CD 等开发工具和流程
• 软技能：良好的沟通表达能力、问题分析与解决能力

【项目经验】
已根据 STAR 原则重写项目描述，突出量化成果：
• 项目名称：XXX管理系统
  角色：核心开发 | 时间：202X.XX - 202X.XX
  技术栈：Java + Spring Boot + MySQL + Redis
  工作内容：负责核心模块的设计与开发
  项目成果：通过缓存优化将接口响应时间降低 60%，日均访问量支持 10W+

【实习/工作经历】
已优化经历描述，突出个人贡献与业务价值。

【优化建议】
1. 建议增加量化指标，如：提升了X%性能、节省了Y小时
2. 技术栈建议补充具体版本号和使用场景
3. 建议添加 2-3 个与目标岗位匹配度高的项目
4. 可考虑增加开源贡献或技术博客链接提升竞争力
5. 建议根据目标公司 JD 针对性调整关键词，提高 ATS 通过率
    `.trim(),
    suggestions: [
      '量化成果：在项目描述中添加具体数字，如"响应时间降低60%"、"用户增长200%"',
      '关键词优化：根据目标JD增加匹配关键词，如微服务、分布式、高并发等',
      '结构优化：采用倒叙时间线，将最近的经历放在最前面',
      '技能分层：将技能分为熟练、掌握、了解三个层级',
      '去除冗余：删除与目标岗位无关的内容，保持简历在1-2页',
      '格式统一：字体、间距、项目符号保持一致，增强可读性',
    ],
    score: {
      overall: 85,
      content: 82,
      structure: 88,
      keywords: 80,
      design: 90,
    },
    ats_compatibility: 88,
    match_score: target_position ? 83 + Math.floor(Math.random() * 10) : null,
  }

  res.json({
    success: true,
    message: '简历优化完成（Mock数据）',
    data: mockOptimization,
  })
})

router.post('/resume/parse', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const { file_url, file_name } = req.body

  if (!file_url) {
    res.status(400).json({ success: false, error: '请提供简历文件地址' })
    return
  }

  const mockParsed = {
    file_name: file_name || 'resume.pdf',
    parsed_at: new Date().toISOString(),
    basic_info: {
      name: '张三',
      phone: '138****8888',
      email: 'zhangsan@example.com',
      age: 23,
      location: '北京市',
      gender: '男',
    },
    education: [
      {
        school: '清华大学',
        major: '计算机科学与技术',
        degree: '本科',
        start_date: '2021-09',
        end_date: '2025-06',
        gpa: 3.85,
        description: '主修课程：数据结构、算法设计、操作系统、计算机网络、数据库原理',
      },
    ],
    skills: [
      { name: 'Java', level: '熟练' },
      { name: 'Spring Boot', level: '熟练' },
      { name: 'MySQL', level: '掌握' },
      { name: 'Redis', level: '掌握' },
      { name: 'Git', level: '熟练' },
      { name: 'Docker', level: '了解' },
    ],
    experiences: [
      {
        company: '字节跳动',
        position: '后端开发实习生',
        start_date: '2024-03',
        end_date: '2024-06',
        description: '负责内容推荐系统后端接口开发，优化查询性能30%',
      },
    ],
    projects: [
      {
        name: '分布式电商系统',
        role: '后端开发',
        start_date: '2023-12',
        end_date: '2024-02',
        description: '基于微服务架构的电商系统，支持10W+ QPS',
        tech_stack: 'Spring Cloud, MySQL, Redis, RabbitMQ',
      },
    ],
    certificates: ['CET-6: 580分', '计算机二级Python', 'AWS SAA认证'],
    honors: ['国家奖学金', '校级三好学生', 'ACM程序设计竞赛省级二等奖'],
    confidence: 0.87,
    summary: '该简历匹配度较高，候选人具备扎实的计算机基础和大厂实习经历，建议进入面试环节',
  }

  res.json({
    success: true,
    message: '简历解析完成（Mock数据）',
    data: mockParsed,
  })
})

router.post('/assessment/generate', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const { report_type, answers } = req.body
  const db = getDb()
  const profile = db.prepare('SELECT id, real_name FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number; real_name: string } | undefined

  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const types = {
    personality: {
      title: 'MBTI职业性格测评报告',
      summary: 'ENTP型人格 - 辩论家型。富有创造力和灵活性，善于发现新机会和解决复杂问题。',
      scores: JSON.stringify({
        总分: 87,
        外向E: 68,
        内向I: 32,
        感觉S: 28,
        直觉N: 72,
        思考T: 65,
        情感F: 35,
        判断J: 38,
        感知P: 62,
      }),
      details: `
【人格类型】ENTP - 辩论家型
【核心特质】创新、机敏、善辩、适应力强
【优势】
• 快速学习能力强，善于吸收新概念
• 创造性思维突出，能提出独特见解
• 沟通表达能力出色，说服力强
• 适应变化能力强，在压力下表现良好
【潜在不足】
• 有时缺乏持续性，容易厌倦重复性工作
• 对细节关注度可能不足
• 在团队中有时过于强势
• 决策时可能过于乐观，忽视风险
【适合岗位】
• 产品经理/战略分析师
• 创业团队核心成员
• 咨询顾问
• 研发工程师（偏创新方向）
• 市场营销策划
      `.trim(),
      suggestions: `
1. 职业发展：建议选择需要创新思维和快速应变的岗位
2. 团队协作：注意倾听他人意见，避免急于反驳
3. 工作习惯：培养持续跟进的习惯，避免虎头蛇尾
4. 技能提升：建议补充项目管理相关知识
5. 面试准备：重点突出创新成果和快速学习能力
      `.trim(),
    },
    skill: {
      title: '技术能力综合测评报告',
      summary: '编程基础扎实，算法能力优秀，工程实践能力良好，综合排名前20%',
      scores: JSON.stringify({
        总分: 84,
        数据结构与算法: 90,
        编程语言: 86,
        操作系统: 78,
        计算机网络: 80,
        数据库: 82,
        系统设计: 72,
        工程实践: 85,
      }),
      details: `
【整体评价】技术基础扎实，算法能力突出，具备较强的工程实践能力
【详细分析】
• 数据结构与算法：对常用数据结构和算法掌握熟练，刷题量充足
• 编程语言：对至少一门语言有深入理解，代码规范良好
• 操作系统：对进程、线程、内存管理有基本了解
• 计算机网络：掌握TCP/IP协议栈，了解HTTP/HTTPS原理
• 数据库：SQL熟练，对索引优化有一定理解
• 系统设计：了解基础设计模式，能进行简单系统设计
• 工程实践：有完整项目经验，熟悉基本开发流程
      `.trim(),
      suggestions: `
1. 短板补齐：建议加强系统设计方面的练习，可参考《系统设计面试》
2. 算法深化：继续保持刷题节奏，尝试困难题目
3. 工程能力：多参与开源项目，积累工程经验
4. 面试准备：多刷面经，注意基础知识细节
5. 简历优化：突出算法竞赛获奖或高星开源项目
      `.trim(),
    },
    career: {
      title: '职业倾向测评报告',
      summary: '适合从事技术研发类工作，有较强的逻辑思维和问题解决能力，匹配度90%',
      scores: JSON.stringify({
        总分: 88,
        研究型I: 85,
        艺术型A: 45,
        社会型S: 55,
        企业型E: 60,
        常规型C: 40,
        实际型R: 75,
      }),
      details: `
【职业兴趣代码】IRC（研究型+实际型+常规型）
【最佳匹配职业】
1. 软件工程师/研发工程师 - 匹配度95%
2. 算法工程师 - 匹配度92%
3. 数据科学家 - 匹配度88%
4. 系统架构师 - 匹配度85%
5. 技术咨询顾问 - 匹配度80%
【工作环境偏好】
• 希望有明确的技术成长路径
• 重视技术氛围和学习资源
• 偏好弹性工作制度
• 重视团队成员技术水平
      `.trim(),
      suggestions: `
1. 岗位选择：优先投递研发类岗位，避免纯管理或销售类
2. 公司选择：注重技术氛围和培养体系，大型互联网公司是不错的选择
3. 技能规划：可在工作2-3年后考虑是走技术专家还是技术管理路线
4. 行业选择：互联网、金融科技、AI、云计算等行业匹配度较高
5. 长期规划：建议持续保持技术敏感度，关注行业发展趋势
      `.trim(),
    },
    eq: {
      title: '情商与职场适应力报告',
      summary: '情绪管理能力良好，沟通表达清晰，团队协作意识强，职场适应力优秀',
      scores: JSON.stringify({
        总分: 86,
        自我认知: 82,
        情绪管理: 84,
        自我激励: 90,
        同理心: 80,
        社交能力: 85,
        抗压能力: 78,
      }),
      details: `
【职场适应性】优秀，能快速融入团队，应对工作压力
【优势领域】
• 自我激励能力强，有明确的职业目标和驱动力
• 社交能力出色，擅长团队协作和跨部门沟通
• 情绪稳定性好，在冲突中能保持理性
• 学习能力强，能快速适应新环境和新要求
【提升空间】
• 抗压能力还有提升空间，建议学习压力管理技巧
• 在表达不同意见时可更加委婉，注重沟通艺术
• 有时过于追求完美，需学会适当放权
      `.trim(),
      suggestions: `
1. 压力管理：学习冥想、运动等解压方式，保持工作生活平衡
2. 向上管理：主动与导师/上级沟通，定期汇报进度和困惑
3. 团队协作：发挥沟通优势，主动承担团队协调角色
4. 冲突处理：遇到分歧时，先倾听再表达，寻求双赢方案
5. 职业形象：注重专业形象塑造，建立个人品牌
      `.trim(),
    },
  }

  const type = (types as Record<string, typeof types.personality>)[report_type as string] || types.skill

  const result = db.prepare(`
    INSERT INTO assessment_reports (student_id, report_type, title, summary, scores, details, suggestions)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(profile.id, report_type || 'skill', type.title, type.summary, type.scores, type.details, type.suggestions)

  const report = db.prepare('SELECT * FROM assessment_reports WHERE id = ?').get(result.lastInsertRowid)

  res.json({
    success: true,
    message: '测评报告生成成功（Mock数据）',
    data: report,
  })
})

router.get('/assessment/templates', async (_req: Request, res: Response): Promise<void> => {
  const templates = [
    {
      id: 'personality',
      name: 'MBTI职业性格测评',
      description: '通过93道题全面分析你的职业性格类型，找到最适合你的职业方向',
      duration: '约15分钟',
      questions_count: 93,
      category: '职业规划',
    },
    {
      id: 'skill',
      name: '技术能力综合测评',
      description: '覆盖数据结构、算法、操作系统、网络、数据库等全栈技术知识点',
      duration: '约60分钟',
      questions_count: 50,
      category: '技术能力',
    },
    {
      id: 'career',
      name: '职业倾向测评（霍兰德）',
      description: '基于霍兰德职业兴趣理论，发现你的职业兴趣代码和最佳匹配职业',
      duration: '约20分钟',
      questions_count: 60,
      category: '职业规划',
    },
    {
      id: 'eq',
      name: '情商与职场适应力测评',
      description: '评估你的情绪智力和职场软技能，提供针对性提升建议',
      duration: '约10分钟',
      questions_count: 40,
      category: '职场能力',
    },
  ]

  res.json({
    success: true,
    data: templates,
  })
})

router.post('/ocr/recognize', auth, async (req: Request, res: Response): Promise<void> => {
  const { image_url, image_type } = req.body

  if (!image_url) {
    res.status(400).json({ success: false, error: '请提供图片地址' })
    return
  }

  const mockType = image_type || 'idcard'
  let result: Record<string, unknown>

  switch (mockType) {
    case 'idcard':
      result = {
        type: 'idcard',
        side: 'front',
        recognized_at: new Date().toISOString(),
        data: {
          name: '张三',
          gender: '男',
          ethnicity: '汉',
          birthday: '2001-05-20',
          address: '北京市海淀区中关村大街1号',
          id_number: '11010120010520****',
          issued_by: '北京市公安局海淀分局',
          valid_period: '2020.06.01-2040.06.01',
        },
        confidence: 0.96,
      }
      break
    case 'diploma':
      result = {
        type: 'diploma',
        recognized_at: new Date().toISOString(),
        data: {
          name: '张三',
          gender: '男',
          birthday: '2001年5月20日',
          school: '清华大学',
          major: '计算机科学与技术',
          degree: '普通高等学校本科毕业证书',
          enrollment_date: '2021年9月',
          graduation_date: '2025年6月',
          certificate_number: '100031202506****',
        },
        confidence: 0.93,
      }
      break
    case 'certificate':
      result = {
        type: 'certificate',
        recognized_at: new Date().toISOString(),
        data: {
          title: 'AWS Certified Solutions Architect - Associate',
          holder: '张三',
          issuer: 'Amazon Web Services Training and Certification',
          issue_date: '2024年3月15日',
          certificate_number: 'AWS-SAA-2024-0315-****',
          valid_period: '2024.03.15-2027.03.15',
          status: '有效',
        },
        confidence: 0.91,
      }
      break
    default:
      result = {
        type: 'general',
        recognized_at: new Date().toISOString(),
        text: '这是OCR识别出的文本内容示例。实际使用中会返回图片中的真实文字。\n\n支持多语言识别、表格识别、手写识别等功能。\n\n识别准确率高达98%以上，毫秒级响应速度。',
        confidence: 0.89,
        blocks: [
          { type: 'text', text: '这是OCR识别出的文本内容示例', bbox: [0, 0, 300, 30] },
          { type: 'text', text: '实际使用中会返回图片中的真实文字', bbox: [0, 40, 350, 70] },
        ],
      }
  }

  res.json({
    success: true,
    message: 'OCR识别完成（Mock数据）',
    data: result,
  })
})

router.get('/stats/dashboard', auth, async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const userId = req.user!.userId
  const role = req.user!.role

  let data: Record<string, unknown> = {}

  if (role === 'student') {
    const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(userId) as { id: number } | undefined
    if (profile) {
      const applications = db.prepare(`
        SELECT status, COUNT(*) as c FROM applications WHERE student_id = ? GROUP BY status
      `).all(profile.id) as Array<{ status: string; c: number }>
      const appTotal = applications.reduce((sum, a) => sum + a.c, 0)

      const projectsCount = db.prepare('SELECT COUNT(*) as c FROM projects WHERE student_id = ?').get(profile.id) as { c: number }
      const certsCount = db.prepare('SELECT COUNT(*) as c FROM certificates WHERE student_id = ?').get(profile.id) as { c: number }
      const journalsCount = db.prepare('SELECT COUNT(*) as c FROM journal_entries WHERE student_id = ?').get(profile.id) as { c: number }
      const reportsCount = db.prepare('SELECT COUNT(*) as c FROM assessment_reports WHERE student_id = ?').get(profile.id) as { c: number }
      const referralsClaimed = db.prepare("SELECT COUNT(*) as c FROM referrals WHERE claimed_by = ?").get(profile.id) as { c: number }

      const myQuestions = db.prepare('SELECT COUNT(*) as c FROM questions WHERE author_id = ?').get(userId) as { c: number }
      const myAnswers = db.prepare('SELECT COUNT(*) as c FROM answers WHERE author_id = ?').get(userId) as { c: number }

      data = {
        profile_completion: 85,
        applications: {
          total: appTotal,
          by_status: Object.fromEntries(applications.map(a => [a.status, a.c])),
        },
        portfolio: {
          projects: projectsCount.c,
          certificates: certsCount.c,
          journals: journalsCount.c,
          reports: reportsCount.c,
        },
        referrals: {
          claimed: referralsClaimed.c,
        },
        community: {
          questions: myQuestions.c,
          answers: myAnswers.c,
        },
        recent_activity: [
          { type: 'application', title: '投递了「前端开发实习生」岗位', time: '2天前' },
          { type: 'journal', title: '发布了新的日志「面试复盘」', time: '3天前' },
          { type: 'answer', title: '回答了问题「如何准备系统设计面试」', time: '5天前' },
          { type: 'report', title: '生成了「MBTI职业性格测评报告」', time: '1周前' },
        ],
      }
    }
  } else if (role === 'enterprise') {
    const profile = db.prepare('SELECT id FROM enterprise_profiles WHERE user_id = ?').get(userId) as { id: number } | undefined
    if (profile) {
      const jobs = db.prepare('SELECT status, COUNT(*) as c FROM jobs WHERE enterprise_id = ? GROUP BY status').all(profile.id) as Array<{ status: string; c: number }>
      const apps = db.prepare('SELECT status, COUNT(*) as c FROM applications WHERE enterprise_id = ? GROUP BY status').all(profile.id) as Array<{ status: string; c: number }>
      const jobsTotal = jobs.reduce((sum, j) => sum + j.c, 0)
      const appsTotal = apps.reduce((sum, a) => sum + a.c, 0)
      const totalViews = db.prepare('SELECT COALESCE(SUM(views_count),0) as s FROM jobs WHERE enterprise_id = ?').get(profile.id) as { s: number }

      data = {
        jobs: {
          total: jobsTotal,
          by_status: Object.fromEntries(jobs.map(j => [j.status, j.c])),
          total_views: totalViews.s,
        },
        applications: {
          total: appsTotal,
          by_status: Object.fromEntries(apps.map(a => [a.status, a.c])),
        },
        recent_applications: db.prepare(`
          SELECT a.id, a.status, a.created_at, j.title as job_title, sp.real_name as student_name
          FROM applications a
          LEFT JOIN jobs j ON a.job_id = j.id
          LEFT JOIN student_profiles sp ON a.student_id = sp.id
          WHERE a.enterprise_id = ?
          ORDER BY a.created_at DESC
          LIMIT 5
        `).all(profile.id),
        top_jobs: db.prepare(`
          SELECT id, title, views_count, applications_count, created_at
          FROM jobs
          WHERE enterprise_id = ?
          ORDER BY applications_count DESC
          LIMIT 5
        `).all(profile.id),
      }
    }
  }

  res.json({
    success: true,
    data,
  })
})

export default router
