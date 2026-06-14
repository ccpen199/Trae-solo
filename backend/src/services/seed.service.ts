import { AppDataSource } from "../database/data-source";
import { Position } from "../entities/Position";
import { Candidate } from "../entities/Candidate";
import { Interview } from "../entities/Interview";
import { User } from "../entities/User";
import { TalentTag } from "../entities/TalentTag";
import { Approval } from "../entities/Approval";
import { IMMessage } from "../entities/IMMessage";
import { In } from "typeorm";

export class SeedService {
  public static async initDemoData(): Promise<void> {
    try {
      const positionCount = await AppDataSource.getRepository(Position).count();
      const candidateCount = await AppDataSource.getRepository(Candidate).count();
      const interviewCount = await AppDataSource.getRepository(Interview).count();
      const tagCount = await AppDataSource.getRepository(TalentTag).count();

      console.log(`[Seed] Current counts: positions=${positionCount}, candidates=${candidateCount}, interviews=${interviewCount}, tags=${tagCount}`);

      if (positionCount > 0 || candidateCount > 0) {
        console.log("[Seed] Demo data already exists, skipping...");
        return;
      }

      console.log("[Seed] Initializing demo data...");

      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find();
      const hrUser = users.find(u => u.role === "hr");
      const managerUser = users.find(u => u.role === "hiring_manager");
      const interviewerUser = users.find(u => u.role === "interviewer");
      const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 3600 * 1000);
      const daysLater = (days: number) => new Date(Date.now() + days * 24 * 3600 * 1000);

      const positionRepository = AppDataSource.getRepository(Position);
      const positions: Position[] = [];

      const positionData = [
        {
          title: "高级前端开发工程师",
          department: "技术部",
          jobType: "full_time",
          location: "北京",
          salaryMin: 25000,
          salaryMax: 40000,
          experienceMin: 5,
          experienceMax: 10,
          education: "本科",
          description: "负责公司核心产品的前端开发，参与技术架构设计，优化用户体验。",
          requirements: "1. 5年以上前端开发经验\n2. 精通React/Vue框架\n3. 熟悉TypeScript\n4. 有大型项目经验优先",
          keywords: ["React", "TypeScript", "Vue", "Node.js", "Webpack"],
          publishChannels: ["boss", "zhilian", "lagou"] as any,
          hiringManagerId: managerUser?.id,
          createdById: hrUser?.id,
          status: "published" as const,
          publishStatus: {
            boss: {
              channel: "boss",
              status: "synced" as const,
              syncedAt: daysAgo(15),
              postUrl: "https://www.zhipin.com/job_detail/100001",
            },
            zhilian: {
              channel: "zhilian",
              status: "synced" as const,
              syncedAt: daysAgo(14),
              postUrl: "https://www.zhaopin.com/job/100002",
            },
            lagou: {
              channel: "lagou",
              status: "synced" as const,
              syncedAt: daysAgo(14),
              postUrl: "https://www.lagou.com/jobs/100003.html",
            },
          },
        },
        {
          title: "Java后端开发工程师",
          department: "技术部",
          jobType: "full_time",
          location: "上海",
          salaryMin: 30000,
          salaryMax: 50000,
          experienceMin: 3,
          experienceMax: 5,
          education: "本科",
          description: "负责电商平台后端服务开发，保障系统高可用、高性能。",
          requirements: "1. 3年以上Java开发经验\n2. 精通Spring Boot\n3. 熟悉MySQL、Redis\n4. 有微服务经验优先",
          keywords: ["Java", "Spring Boot", "MySQL", "Redis", "微服务"],
          publishChannels: ["boss", "51job"] as any,
          hiringManagerId: managerUser?.id,
          createdById: hrUser?.id,
          status: "published" as const,
          publishStatus: {
            boss: {
              channel: "boss",
              status: "synced" as const,
              syncedAt: daysAgo(20),
              postUrl: "https://www.zhipin.com/job_detail/200001",
            },
            "51job": {
              channel: "51job",
              status: "syncing" as const,
              syncedAt: daysAgo(0),
            },
          },
        },
        {
          title: "产品经理",
          department: "产品部",
          jobType: "full_time",
          location: "深圳",
          salaryMin: 20000,
          salaryMax: 35000,
          experienceMin: 3,
          experienceMax: 5,
          education: "本科",
          description: "负责SaaS产品规划和设计，推动产品迭代优化。",
          requirements: "1. 3年以上B端产品经验\n2. 优秀的需求分析能力\n3. 熟悉Axure、Figma\n4. 有SaaS产品经验优先",
          keywords: ["产品设计", "需求分析", "Axure", "SaaS", "数据分析"],
          publishChannels: ["boss", "zhilian"] as any,
          hiringManagerId: managerUser?.id,
          createdById: hrUser?.id,
          status: "pending_approval" as const,
          publishStatus: {
            boss: {
              channel: "boss",
              status: "pending" as const,
              syncedAt: daysAgo(0),
            },
            zhilian: {
              channel: "zhilian",
              status: "pending" as const,
              syncedAt: daysAgo(0),
            },
          },
        },
        {
          title: "UI/UX设计师",
          department: "设计部",
          jobType: "full_time",
          location: "杭州",
          salaryMin: 15000,
          salaryMax: 25000,
          experienceMin: 1,
          experienceMax: 3,
          education: "本科",
          description: "负责产品界面设计和用户体验优化，参与设计规范制定。",
          requirements: "1. 1年以上UI设计经验\n2. 精通Figma、Sketch\n3. 有完整作品集\n4. 了解前端开发知识",
          keywords: ["UI设计", "Figma", "Sketch", "用户体验", "设计规范"],
          publishChannels: ["boss"] as any,
          hiringManagerId: managerUser?.id,
          createdById: hrUser?.id,
          status: "published" as const,
          publishStatus: {
            boss: {
              channel: "boss",
              status: "failed" as const,
              syncedAt: daysAgo(5),
              error: "接口调用超时，请稍后重试",
            },
          },
        },
        {
          title: "销售经理",
          department: "销售部",
          jobType: "full_time",
          location: "广州",
          salaryMin: 18000,
          salaryMax: 30000,
          experienceMin: 3,
          experienceMax: 5,
          education: "大专",
          description: "负责企业客户开发和维护，完成销售目标。",
          requirements: "1. 3年以上B2B销售经验\n2. 优秀的沟通能力\n3. 有HR SaaS行业经验优先\n4. 能接受出差",
          keywords: ["销售", "客户开发", "B2B", "SaaS", "商务谈判"],
          publishChannels: ["boss", "51job", "lagou"] as any,
          hiringManagerId: managerUser?.id,
          createdById: hrUser?.id,
          status: "draft" as const,
          publishStatus: {
            boss: {
              channel: "boss",
              status: "pending" as const,
              syncedAt: daysAgo(0),
            },
            "51job": {
              channel: "51job",
              status: "pending" as const,
              syncedAt: daysAgo(0),
            },
            lagou: {
              channel: "lagou",
              status: "pending" as const,
              syncedAt: daysAgo(0),
            },
          },
        },
      ];

      for (const data of positionData) {
        const position = positionRepository.create(data as any) as unknown as Position;
        const saved = await positionRepository.save(position);
        positions.push(Array.isArray(saved) ? saved[0] : saved);
      }

      console.log(`Created ${positions.length} demo positions`);

      const candidateRepository = AppDataSource.getRepository(Candidate);
      const interviewRepository = AppDataSource.getRepository(Interview);
      const talentTagRepository = AppDataSource.getRepository(TalentTag);

      const tagData = [
        { name: "React", category: "skill" as const, color: "#1890ff" },
        { name: "TypeScript", category: "skill" as const, color: "#31465f" },
        { name: "Node.js", category: "skill" as const, color: "#52c41a" },
        { name: "高并发", category: "project" as const, color: "#fa8c16" },
        { name: "电商平台", category: "project" as const, color: "#eb2f96" },
        { name: "微服务", category: "project" as const, color: "#722ed1" },
        { name: "主动离职", category: "resignation_reason" as const, color: "#f5222d" },
        { name: "薪资涨幅", category: "resignation_reason" as const, color: "#faad14" },
        { name: "职业发展", category: "resignation_reason" as const, color: "#13c2c2" },
        { name: "团队协作", category: "performance" as const, color: "#a0d911" },
        { name: "领导力", category: "performance" as const, color: "#fa541c" },
        { name: "沟通能力", category: "performance" as const, color: "#2f54eb" },
      ];

      const tags: TalentTag[] = [];
      for (const t of tagData) {
        const tag = talentTagRepository.create({
          name: t.name,
          category: t.category,
          metadata: { color: t.color },
        });
        const savedTag = await talentTagRepository.save(tag);
        tags.push(savedTag);
      }

      console.log(`Created ${tags.length} demo talent tags`);

      const candidateData = [
        {
          name: "张三",
          gender: "male",
          phone: "13900001001",
          email: "zhangsan@example.com",
          positionId: positions[0].id,
          expectedSalaryMin: 28000,
          expectedSalaryMax: 38000,
          currentCompany: "字节跳动",
          currentPosition: "高级前端工程师",
          yearsOfExperience: 6,
          education: "硕士",
          graduationSchool: "清华大学",
          major: "计算机科学与技术",
          stage: "first_interview" as const,
          skillTags: ["React", "TypeScript", "Node.js"],
          aiScreeningResult: {
            keywordMatchScore: 92,
            experienceMatchScore: 85,
            stabilityScore: 82,
            overallScore: 88,
            riskLevel: "low" as const,
            summary: "关键词匹配度高，React经验丰富，学历背景优秀。近6年仅换2份工作，稳定性较好。建议进入面试环节。",
            screenedAt: daysAgo(6),
            matchedKeywords: [
              { keyword: "React", found: true, weight: 0.25 },
              { keyword: "TypeScript", found: true, weight: 0.2 },
              { keyword: "Vue", found: false, weight: 0.15 },
              { keyword: "Node.js", found: true, weight: 0.2 },
              { keyword: "Webpack", found: true, weight: 0.2 },
            ],
            experienceAnalysis: {
              matchedRoles: ["高级前端工程师", "前端技术负责人"],
              relevantYears: 6,
              gap: "符合要求，超出最低要求1年",
            },
            stabilityAnalysis: {
              jobChanges: 2,
              avgTenure: 3,
              trend: "稳定，近年无频繁跳槽",
            },
          },
          talentProfile: {
            projectExperience: [
              { name: "抖音电商前端架构升级", role: "技术负责人", duration: "2023-2024", description: "主导千万级用户产品的前端架构升级" },
            ],
            resignationReasons: ["职业发展"],
            strengths: ["技术扎实", "学习能力强"],
            weaknesses: ["英语一般"],
          },
          onboardingChecklist: [
            { item: "身份证复印件", completed: false },
            { item: "学历证明", completed: false },
            { item: "离职证明", completed: false },
          ],
          source: "BOSS直聘",
          notes: "AI初筛评分88分，推荐进入初试",
          tagIds: [tags[0].id, tags[1].id, tags[2].id, tags[9].id],
        },
        {
          name: "李四",
          gender: "male",
          phone: "13900001002",
          email: "lisi@example.com",
          positionId: positions[0].id,
          expectedSalaryMin: 30000,
          expectedSalaryMax: 45000,
          currentCompany: "阿里巴巴",
          currentPosition: "前端技术专家",
          yearsOfExperience: 8,
          education: "本科",
          graduationSchool: "浙江大学",
          major: "软件工程",
          stage: "second_interview" as const,
          skillTags: ["React", "TypeScript", "微前端"],
          aiScreeningResult: {
            keywordMatchScore: 98,
            experienceMatchScore: 96,
            stabilityScore: 88,
            overallScore: 95,
            riskLevel: "low" as const,
            summary: "非常优秀的候选人，大厂背景，技术深度足够。8年3份工作，稳定性良好。强烈推荐进入复试。",
            screenedAt: daysAgo(13),
            matchedKeywords: [
              { keyword: "React", found: true, weight: 0.25 },
              { keyword: "TypeScript", found: true, weight: 0.2 },
              { keyword: "Vue", found: true, weight: 0.15 },
              { keyword: "Node.js", found: true, weight: 0.2 },
              { keyword: "Webpack", found: true, weight: 0.2 },
            ],
            experienceAnalysis: {
              matchedRoles: ["前端技术专家", "前端架构师", "高级前端工程师"],
              relevantYears: 8,
              gap: "超出要求3年，经验非常丰富",
            },
            stabilityAnalysis: {
              jobChanges: 3,
              avgTenure: 2.67,
              trend: "职业晋升导向，每次跳槽均有职位提升",
            },
          },
          talentProfile: {
            projectExperience: [
              { name: "天猫双11大促技术保障", role: "核心开发", duration: "2022-2023", description: "参与双11大促技术保障，支撑亿级流量" },
              { name: "微前端架构落地", role: "架构师", duration: "2023-2024", description: "推动微前端架构在集团内落地" },
            ],
            resignationReasons: ["职业发展", "薪资涨幅"],
            strengths: ["技术深度", "架构能力", "团队管理"],
            weaknesses: [],
          },
          onboardingChecklist: [
            { item: "身份证复印件", completed: false },
            { item: "学历证明", completed: false },
            { item: "离职证明", completed: false },
          ],
          source: "猎聘",
          notes: "初试评价优秀，已安排复试",
          tagIds: [tags[0].id, tags[1].id, tags[5].id, tags[10].id, tags[11].id],
        },
        {
          name: "王五",
          gender: "female",
          phone: "13900001003",
          email: "wangwu@example.com",
          positionId: positions[1].id,
          expectedSalaryMin: 35000,
          expectedSalaryMax: 50000,
          currentCompany: "美团",
          currentPosition: "高级Java开发工程师",
          yearsOfExperience: 5,
          education: "硕士",
          graduationSchool: "北京大学",
          major: "计算机科学与技术",
          stage: "offer" as const,
          skillTags: ["Java", "Spring Boot", "MySQL", "Redis", "微服务"],
          aiScreeningResult: {
            keywordMatchScore: 95,
            experienceMatchScore: 90,
            stabilityScore: 90,
            overallScore: 92,
            riskLevel: "low" as const,
            summary: "技术能力强，高并发经验丰富，学历优秀。稳定性很好，5年仅换1份工作。建议发Offer。",
            screenedAt: daysAgo(20),
            matchedKeywords: [
              { keyword: "Java", found: true, weight: 0.25 },
              { keyword: "Spring Boot", found: true, weight: 0.2 },
              { keyword: "MySQL", found: true, weight: 0.2 },
              { keyword: "Redis", found: true, weight: 0.2 },
              { keyword: "微服务", found: true, weight: 0.15 },
            ],
            experienceAnalysis: {
              matchedRoles: ["高级Java开发工程师", "Java后端工程师", "后端技术负责人"],
              relevantYears: 5,
              gap: "超出要求2年，符合高级开发要求",
            },
            stabilityAnalysis: {
              jobChanges: 1,
              avgTenure: 5,
              trend: "非常稳定，5年仅换1份工作",
            },
          },
          talentProfile: {
            projectExperience: [
              { name: "美团外卖订单系统优化", role: "核心开发", duration: "2022-2024", description: "主导订单系统高并发优化，支撑日均千万级订单" },
            ],
            resignationReasons: ["职业发展"],
            strengths: ["高并发经验", "技术扎实", "沟通顺畅"],
            weaknesses: [],
          },
          onboardingChecklist: [
            { item: "身份证复印件", completed: true },
            { item: "学历证明", completed: true },
            { item: "离职证明", completed: false },
            { item: "体检报告", completed: false },
            { item: "Offer确认", completed: true },
          ],
          offerSentAt: daysAgo(2),
          source: "前程无忧",
          notes: "复试通过，Offer已发放待确认",
          tagIds: [tags[3].id, tags[4].id, tags[5].id, tags[10].id],
        },
        {
          name: "赵六",
          gender: "male",
          phone: "13900001004",
          email: "zhaoliu@example.com",
          positionId: positions[1].id,
          expectedSalaryMin: 28000,
          expectedSalaryMax: 38000,
          currentCompany: "京东",
          currentPosition: "Java开发工程师",
          yearsOfExperience: 3,
          education: "本科",
          graduationSchool: "北京邮电大学",
          major: "软件工程",
          stage: "ai_screened" as const,
          skillTags: ["Java", "Spring Boot", "MySQL"],
          aiScreeningResult: {
            keywordMatchScore: 82,
            experienceMatchScore: 75,
            stabilityScore: 76,
            overallScore: 78,
            riskLevel: "medium" as const,
            summary: "基本符合要求，Java基础扎实，但微服务经验稍欠缺。3年换2份工作，稳定性一般。可安排初试。",
            screenedAt: daysAgo(1),
            matchedKeywords: [
              { keyword: "Java", found: true, weight: 0.25 },
              { keyword: "Spring Boot", found: true, weight: 0.2 },
              { keyword: "MySQL", found: true, weight: 0.2 },
              { keyword: "Redis", found: false, weight: 0.2 },
              { keyword: "微服务", found: false, weight: 0.15 },
            ],
            experienceAnalysis: {
              matchedRoles: ["Java开发工程师", "后端开发工程师"],
              relevantYears: 3,
              gap: "刚好达到最低要求，微服务经验不足",
            },
            stabilityAnalysis: {
              jobChanges: 2,
              avgTenure: 1.5,
              trend: "稳定性一般，3年换2份工作",
            },
          },
          talentProfile: {
            projectExperience: [
              { name: "京东订单系统开发", role: "开发工程师", duration: "2023-2024", description: "参与电商订单系统的开发和维护" },
            ],
            resignationReasons: ["主动离职"],
            strengths: ["学习能力强", "积极主动"],
            weaknesses: ["微服务经验不足"],
          },
          onboardingChecklist: [],
          source: "BOSS直聘",
          notes: "AI初筛完成，评分78分，待HR确认是否邀约",
          tagIds: [tags[4].id, tags[11].id],
        },
        {
          name: "陈七",
          gender: "female",
          phone: "13900001005",
          email: "chenqi@example.com",
          positionId: positions[2].id,
          expectedSalaryMin: 22000,
          expectedSalaryMax: 30000,
          currentCompany: "腾讯",
          currentPosition: "高级产品经理",
          yearsOfExperience: 4,
          education: "硕士",
          graduationSchool: "复旦大学",
          major: "工商管理",
          stage: "hired" as const,
          skillTags: ["产品设计", "数据分析", "Axure", "SaaS"],
          aiScreeningResult: {
            keywordMatchScore: 94,
            experienceMatchScore: 88,
            stabilityScore: 86,
            overallScore: 90,
            riskLevel: "low" as const,
            summary: "SaaS产品经验丰富，数据能力强，学历背景好。4年1份工作，稳定性很好。已入职。",
            screenedAt: daysAgo(44),
            matchedKeywords: [
              { keyword: "产品设计", found: true, weight: 0.25 },
              { keyword: "需求分析", found: true, weight: 0.2 },
              { keyword: "Axure", found: true, weight: 0.2 },
              { keyword: "SaaS", found: true, weight: 0.2 },
              { keyword: "数据分析", found: true, weight: 0.15 },
            ],
            experienceAnalysis: {
              matchedRoles: ["高级产品经理", "产品负责人", "SaaS产品经理"],
              relevantYears: 4,
              gap: "超出要求1年，SaaS经验丰富",
            },
            stabilityAnalysis: {
              jobChanges: 1,
              avgTenure: 4,
              trend: "非常稳定，4年仅换1份工作",
            },
          },
          talentProfile: {
            projectExperience: [
              { name: "企业微信SaaS产品", role: "产品负责人", duration: "2021-2024", description: "负责亿级用户SaaS产品规划和设计" },
            ],
            resignationReasons: ["职业发展"],
            strengths: ["产品思维", "数据驱动", "用户调研"],
            weaknesses: [],
          },
          onboardingChecklist: [
            { item: "身份证复印件", completed: true },
            { item: "学历证明", completed: true },
            { item: "离职证明", completed: true },
            { item: "体检报告", completed: true },
            { item: "Offer确认", completed: true },
            { item: "劳动合同签署", completed: true },
            { item: "工牌制作", completed: true },
          ],
          offerSentAt: daysAgo(25),
          offerAcceptedAt: daysAgo(20),
          onboardDate: daysAgo(7),
          source: "内部推荐",
          notes: "已入职一周，状态良好",
          tagIds: [tags[7].id, tags[8].id, tags[10].id, tags[11].id],
        },
        {
          name: "孙八",
          gender: "male",
          phone: "13900001006",
          email: "sunba@example.com",
          positionId: positions[0].id,
          expectedSalaryMin: 20000,
          expectedSalaryMax: 30000,
          currentCompany: "创业公司",
          currentPosition: "前端开发工程师",
          yearsOfExperience: 2,
          education: "本科",
          graduationSchool: "普通大学",
          major: "计算机科学与技术",
          stage: "rejected" as const,
          skillTags: ["Vue", "React"],
          aiScreeningResult: {
            keywordMatchScore: 60,
            experienceMatchScore: 50,
            stabilityScore: 58,
            overallScore: 55,
            riskLevel: "high" as const,
            summary: "经验不足，技术深度不够，项目背景一般。2年换3份工作，稳定性较差。建议拒绝。",
            screenedAt: daysAgo(2),
            matchedKeywords: [
              { keyword: "React", found: true, weight: 0.25 },
              { keyword: "TypeScript", found: false, weight: 0.2 },
              { keyword: "Vue", found: true, weight: 0.15 },
              { keyword: "Node.js", found: false, weight: 0.2 },
              { keyword: "Webpack", found: false, weight: 0.2 },
            ],
            experienceAnalysis: {
              matchedRoles: ["前端开发工程师"],
              relevantYears: 2,
              gap: "未达到最低要求，缺少3年经验",
            },
            stabilityAnalysis: {
              jobChanges: 3,
              avgTenure: 0.67,
              trend: "稳定性差，2年换3份工作",
            },
          },
          talentProfile: {
            projectExperience: [
              { name: "公司官网开发", role: "前端开发", duration: "2024", description: "公司官网和后台管理系统开发" },
            ],
            resignationReasons: ["主动离职", "主动离职"],
            strengths: ["学习意愿强"],
            weaknesses: ["经验不足", "稳定性差"],
          },
          onboardingChecklist: [],
          source: "BOSS直聘",
          notes: "已拒绝：经验不足，稳定性较差",
          tagIds: [],
        },
        {
          name: "周九",
          gender: "male",
          phone: "13900001007",
          email: "zhoujiu@example.com",
          positionId: positions[3].id,
          expectedSalaryMin: 18000,
          expectedSalaryMax: 25000,
          currentCompany: "网易",
          currentPosition: "UI设计师",
          yearsOfExperience: 2,
          education: "本科",
          graduationSchool: "中国美术学院",
          major: "视觉传达设计",
          stage: "interview_scheduled" as const,
          skillTags: ["UI设计", "Figma", "Sketch"],
          aiScreeningResult: {
            keywordMatchScore: 85,
            experienceMatchScore: 80,
            stabilityScore: 80,
            overallScore: 82,
            riskLevel: "low" as const,
            summary: "专业背景好，设计能力较强，作品集完整。2年1份工作，稳定性尚可。可安排面试。",
            screenedAt: daysAgo(3),
            matchedKeywords: [
              { keyword: "UI设计", found: true, weight: 0.25 },
              { keyword: "Figma", found: true, weight: 0.2 },
              { keyword: "Sketch", found: true, weight: 0.2 },
              { keyword: "用户体验", found: true, weight: 0.2 },
              { keyword: "设计规范", found: false, weight: 0.15 },
            ],
            experienceAnalysis: {
              matchedRoles: ["UI设计师", "视觉设计师"],
              relevantYears: 2,
              gap: "超出最低要求1年，符合初级设计师要求",
            },
            stabilityAnalysis: {
              jobChanges: 1,
              avgTenure: 2,
              trend: "稳定，2年仅换1份工作",
            },
          },
          talentProfile: {
            projectExperience: [
              { name: "网易云音乐UI改版", role: "UI设计师", duration: "2023-2024", description: "参与网易云音乐界面改版设计" },
            ],
            resignationReasons: ["职业发展"],
            strengths: ["设计感好", "科班出身"],
            weaknesses: ["动效设计经验少"],
          },
          onboardingChecklist: [],
          source: "站酷",
          notes: "作品集优秀，已安排面试",
          tagIds: [tags[8].id, tags[9].id],
        },
        {
          name: "吴十",
          gender: "female",
          phone: "13900001008",
          email: "wushi@example.com",
          positionId: positions[2].id,
          expectedSalaryMin: 25000,
          expectedSalaryMax: 35000,
          currentCompany: "字节跳动",
          currentPosition: "产品经理",
          yearsOfExperience: 5,
          education: "本科",
          graduationSchool: "上海交通大学",
          major: "信息管理",
          stage: "applied" as const,
          skillTags: ["产品设计", "数据分析", "A/B测试"],
          aiScreeningResult: null,
          talentProfile: null,
          onboardingChecklist: [],
          source: "BOSS直聘",
          notes: "新投递简历，待AI初筛",
          tagIds: [],
        },
      ];

      const candidates: Candidate[] = [];
      for (const data of candidateData) {
        const { tagIds, ...candidateFields } = data;
        const candidate = candidateRepository.create(candidateFields as any) as unknown as Candidate;
        if (tagIds && tagIds.length > 0) {
          const foundTags = await talentTagRepository.findBy({ id: In(tagIds) });
          candidate.skillTags = foundTags.map(t => t.name);
        }
        const saved = await candidateRepository.save(candidate);
        candidates.push(Array.isArray(saved) ? saved[0] : saved);
      }

      console.log(`Created ${candidates.length} demo candidates`);

      const interviewData = [
        {
          candidateId: candidates[0].id,
          positionId: positions[0].id,
          interviewerId: interviewerUser?.id,
          round: "first" as const,
          type: "video" as const,
          scheduledAt: daysLater(1),
          duration: 60,
          status: "scheduled" as const,
          roomId: "ROOM20260608001",
          meetingUrl: "https://meet.example.com/room/ROOM20260608001",
          transcriptData: [
            { speaker: "面试官", timestamp: 60, text: "你好，张三，欢迎参加今天的面试。请先做一下自我介绍。", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 120, text: "您好，我是张三，有6年前端开发经验，目前在字节跳动担任高级前端工程师。", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 180, text: "主要负责抖音电商的前端架构和核心功能开发。", isKeyPoint: true, isFinal: true },
            { speaker: "面试官", timestamp: 300, text: "请介绍一下你在React性能优化方面的经验。", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 420, text: "我主要从几个方面进行优化：首先是组件层面，使用React.memo和useMemo减少不必要的重渲染；其次是代码分割，使用React.lazy和Suspense进行按需加载；还有图片优化和虚拟列表等技术。", isKeyPoint: true, isFinal: true },
            { speaker: "面试官", timestamp: 600, text: "你有处理过大型项目的前端架构升级经验吗？", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 720, text: "有的，我曾主导过抖音电商的前端架构升级项目，将原有的单体应用拆分为微前端架构，提升了团队协作效率和系统稳定性。", isKeyPoint: true, isFinal: true },
          ],
          behaviorMarkers: [
            { timestamp: 180, marker: "专业能力", severity: "positive" as const, notes: "技术栈匹配度高，大厂经验丰富" },
            { timestamp: 420, marker: "逻辑思维", severity: "positive" as const, notes: "回答条理清晰，分点阐述" },
            { timestamp: 720, marker: "领导力", severity: "positive" as const, notes: "有项目主导经验" },
            { timestamp: 900, marker: "沟通表达", severity: "positive" as const, notes: "表达流畅，重点突出" },
          ],
        },
        {
          candidateId: candidates[1].id,
          positionId: positions[0].id,
          interviewerId: managerUser?.id,
          round: "second" as const,
          type: "video" as const,
          scheduledAt: daysLater(2),
          duration: 90,
          status: "scheduled" as const,
          roomId: "ROOM20260609001",
          meetingUrl: "https://meet.example.com/room/ROOM20260609001",
          transcriptData: [
            { speaker: "面试官", timestamp: 60, text: "李四你好，恭喜通过初试，今天是复试，我们主要考察你的技术深度和架构能力。", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 120, text: "谢谢面试官，我是李四，有8年前端开发经验，目前在阿里巴巴担任前端技术专家。", isKeyPoint: false, isFinal: true },
            { speaker: "面试官", timestamp: 240, text: "请详细介绍一下你在微前端架构方面的实践经验。", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 360, text: "我在2023年主导了集团内的微前端架构落地项目，采用qiankun框架，将原有的巨石应用拆分为12个子应用。", isKeyPoint: true, isFinal: true },
            { speaker: "候选人", timestamp: 480, text: "在实施过程中，我们解决了样式隔离、状态共享、应用通信等核心问题，最终实现了独立部署、灰度发布的能力。", isKeyPoint: true, isFinal: true },
            { speaker: "面试官", timestamp: 660, text: "在双11大促期间，你们是如何保障前端系统稳定性的？", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 780, text: "我们做了多层次的保障：首先是性能优化，包括资源预加载、懒加载、CDN加速；其次是容灾预案，包括降级方案、错误监控、自动告警；还有全链路压测，确保系统能够支撑亿级流量。", isKeyPoint: true, isFinal: true },
            { speaker: "面试官", timestamp: 960, text: "你在团队管理方面有什么经验？", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 1080, text: "我目前带领一个8人的前端团队，负责技术选型、代码审查、新人培养等工作。我推崇敏捷开发模式，注重代码质量和工程化建设。", isKeyPoint: true, isFinal: true },
          ],
          behaviorMarkers: [
            { timestamp: 360, marker: "专业能力", severity: "positive" as const, notes: "微前端架构经验丰富，有实际落地案例" },
            { timestamp: 780, marker: "问题分析", severity: "positive" as const, notes: "对高并发场景有深入理解，考虑周全" },
            { timestamp: 1080, marker: "领导力", severity: "positive" as const, notes: "有团队管理经验，方法论清晰" },
            { timestamp: 1200, marker: "沟通表达", severity: "positive" as const, notes: "技术表达准确，逻辑清晰" },
            { timestamp: 1380, marker: "应变能力", severity: "positive" as const, notes: "回答问题反应迅速，考虑全面" },
          ],
        },
        {
          candidateId: candidates[2].id,
          positionId: positions[1].id,
          interviewerId: interviewerUser?.id,
          round: "first" as const,
          type: "video" as const,
          scheduledAt: daysAgo(10),
          duration: 60,
          status: "completed" as const,
          roomId: "ROOM20260528001",
          meetingUrl: "https://meet.example.com/room/ROOM20260528001",
          startedAt: daysAgo(10),
          endedAt: daysAgo(10),
          transcript: JSON.stringify([
            { time: "00:01:20", speaker: "候选人", text: "您好，我是王五，有5年Java后端开发经验。" },
            { time: "00:02:30", speaker: "面试官", text: "请介绍一下你最有成就感的项目。" },
            { time: "00:05:00", speaker: "候选人", text: "我主导了美团外卖订单系统的高并发优化，支撑了日均千万级订单量。" },
          ]),
          transcriptData: [
            { speaker: "候选人", timestamp: 80, text: "您好，我是王五，有5年Java后端开发经验。", isKeyPoint: false, isFinal: true },
            { speaker: "面试官", timestamp: 150, text: "请介绍一下你最有成就感的项目。", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 300, text: "我主导了美团外卖订单系统的高并发优化，支撑了日均千万级订单量。", isKeyPoint: true, isFinal: true },
            { speaker: "面试官", timestamp: 450, text: "能具体说一下你们是如何处理高并发场景的吗？", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 570, text: "我们主要采用了多级缓存策略，包括本地缓存Caffeine和分布式缓存Redis，同时对数据库进行了分库分表，使用了异步消息队列削峰填谷。", isKeyPoint: true, isFinal: true },
            { speaker: "候选人", timestamp: 720, text: "另外，我们还做了服务降级和熔断机制，确保核心服务的可用性。", isKeyPoint: true, isFinal: true },
            { speaker: "面试官", timestamp: 840, text: "在项目中遇到过什么技术挑战？", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 960, text: "最大的挑战是分布式事务的一致性问题，我们最终采用了TCC方案结合本地消息表来解决。", isKeyPoint: true, isFinal: true },
          ],
          behaviorMarkers: [
            { timestamp: 300, marker: "专业能力", severity: "positive" as const, notes: "对高并发场景理解深刻，有实际经验" },
            { timestamp: 570, marker: "问题分析", severity: "positive" as const, notes: "技术方案考虑周全，涉及多个技术层面" },
            { timestamp: 960, marker: "应变能力", severity: "positive" as const, notes: "对技术挑战有清晰的解决方案" },
            { timestamp: 1100, marker: "沟通表达", severity: "positive" as const, notes: "回答流畅，技术术语准确" },
          ],
          evaluation: {
            overallScore: 90,
            technicalScore: 92,
            communicationScore: 88,
            problemSolvingScore: 90,
            culturalFitScore: 90,
            strengths: ["技术功底扎实", "高并发经验丰富", "沟通表达能力强"],
            weaknesses: [],
            recommendation: "strong_hire" as const,
            notes: "技术功底扎实，高并发经验丰富，沟通表达能力强。建议通过。",
            evaluatedAt: daysAgo(10),
          },
          feedback: "技术功底扎实，高并发经验丰富，沟通表达能力强。建议通过。",
        },
        {
          candidateId: candidates[2].id,
          positionId: positions[1].id,
          interviewerId: managerUser?.id,
          round: "second" as const,
          type: "video" as const,
          scheduledAt: daysAgo(5),
          duration: 90,
          status: "completed" as const,
          roomId: "ROOM20260602001",
          meetingUrl: "https://meet.example.com/room/ROOM20260602001",
          startedAt: daysAgo(5),
          endedAt: daysAgo(5),
          transcript: JSON.stringify([
            { time: "00:01:00", speaker: "面试官", text: "请谈谈你对微服务架构的理解。" },
            { time: "00:03:00", speaker: "候选人", text: "微服务需要考虑服务拆分、数据一致性、服务治理等问题..." },
          ]),
          transcriptData: [
            { speaker: "面试官", timestamp: 60, text: "请谈谈你对微服务架构的理解。", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 180, text: "微服务需要考虑服务拆分、数据一致性、服务治理等问题。我认为好的微服务架构应该是松耦合、高内聚的，每个服务有清晰的边界和职责。", isKeyPoint: true, isFinal: true },
            { speaker: "面试官", timestamp: 360, text: "你在项目中是如何进行服务拆分的？", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 480, text: "我们主要基于业务领域进行拆分，参考DDD的思想，将订单、支付、用户、商品等核心领域拆分为独立服务。同时考虑团队组织结构，确保每个团队负责2-3个服务。", isKeyPoint: true, isFinal: true },
            { speaker: "面试官", timestamp: 660, text: "如何处理微服务之间的数据一致性问题？", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 780, text: "我们采用最终一致性方案，对于非核心业务使用异步消息队列，对于需要强一致性的场景使用TCC或Seata分布式事务框架。同时建立了完善的补偿机制和重试策略。", isKeyPoint: true, isFinal: true },
            { speaker: "面试官", timestamp: 960, text: "你有带团队的经验吗？", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 1080, text: "有的，我目前带领一个5人的后端小组，负责核心业务系统的开发。我注重代码质量和技术分享，每周组织一次技术分享会，帮助团队成员成长。", isKeyPoint: true, isFinal: true },
            { speaker: "面试官", timestamp: 1260, text: "你对未来的职业规划是什么？", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 1380, text: "我希望能够在技术深度和管理能力上都有所提升，成为一名技术专家型的管理者，能够带领团队解决更复杂的技术挑战。", isKeyPoint: true, isFinal: true },
          ],
          behaviorMarkers: [
            { timestamp: 180, marker: "专业能力", severity: "positive" as const, notes: "对微服务架构有深入理解" },
            { timestamp: 480, marker: "问题分析", severity: "positive" as const, notes: "服务拆分思路清晰，有方法论支撑" },
            { timestamp: 780, marker: "专业能力", severity: "positive" as const, notes: "分布式事务方案考虑周全" },
            { timestamp: 1080, marker: "团队协作", severity: "positive" as const, notes: "有团队管理经验，注重团队成长" },
            { timestamp: 1380, marker: "主动性", severity: "positive" as const, notes: "有清晰的职业规划，积极向上" },
          ],
          evaluation: {
            overallScore: 92,
            technicalScore: 94,
            communicationScore: 90,
            problemSolvingScore: 92,
            culturalFitScore: 92,
            strengths: ["技术视野开阔", "有团队管理潜力", "沟通能力强"],
            weaknesses: [],
            recommendation: "strong_hire" as const,
            notes: "技术视野开阔，有团队管理潜力。强烈推荐录用。",
            evaluatedAt: daysAgo(5),
          },
          feedback: "技术视野开阔，有团队管理潜力。强烈推荐录用。",
        },
        {
          candidateId: candidates[4].id,
          positionId: positions[2].id,
          interviewerId: managerUser?.id,
          round: "first" as const,
          type: "onsite" as const,
          scheduledAt: daysAgo(30),
          duration: 60,
          status: "completed" as const,
          roomId: "ROOM20260508001",
          meetingUrl: "https://meet.example.com/room/ROOM20260508001",
          startedAt: daysAgo(30),
          endedAt: daysAgo(30),
          transcriptData: [
            { speaker: "面试官", timestamp: 60, text: "陈七你好，欢迎来参加我们的产品经理面试。请先做一下自我介绍。", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 120, text: "您好，我是陈七，有4年B端产品经验，目前在腾讯负责企业微信SaaS产品。", isKeyPoint: false, isFinal: true },
            { speaker: "面试官", timestamp: 240, text: "请介绍一个你最有成就感的产品项目。", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 360, text: "我曾负责企业微信客户联系功能的产品设计，从0到1搭建了客户SOP体系，帮助企业提升客户转化率30%。", isKeyPoint: true, isFinal: true },
            { speaker: "面试官", timestamp: 540, text: "你是如何进行需求分析和优先级排序的？", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 660, text: "我主要通过用户调研、数据分析和业务目标三个维度来评估需求。使用RICE模型进行优先级排序，同时考虑开发成本和市场时机。", isKeyPoint: true, isFinal: true },
            { speaker: "面试官", timestamp: 840, text: "如何看待SaaS产品的用户体验？", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 960, text: "我认为SaaS产品的核心是效率，好的用户体验应该是让用户用最少的操作完成目标。同时需要考虑不同角色的使用场景，提供个性化的功能。", isKeyPoint: true, isFinal: true },
          ],
          behaviorMarkers: [
            { timestamp: 360, marker: "专业能力", severity: "positive" as const, notes: "SaaS产品经验丰富，有实际成功案例" },
            { timestamp: 660, marker: "逻辑思维", severity: "positive" as const, notes: "需求分析方法论清晰，有数据支撑" },
            { timestamp: 960, marker: "问题分析", severity: "positive" as const, notes: "对产品体验有深入理解" },
            { timestamp: 1100, marker: "沟通表达", severity: "positive" as const, notes: "表达流畅，产品思路清晰" },
          ],
          evaluation: {
            overallScore: 88,
            technicalScore: 85,
            communicationScore: 90,
            problemSolvingScore: 88,
            culturalFitScore: 90,
            strengths: ["产品思维清晰", "数据驱动能力强", "沟通顺畅"],
            weaknesses: [],
            recommendation: "strong_hire" as const,
            notes: "产品思维清晰，数据驱动能力强。已录用。",
            evaluatedAt: daysAgo(30),
          },
          feedback: "产品思维清晰，数据驱动能力强。已录用。",
        },
        {
          candidateId: candidates[6].id,
          positionId: positions[3].id,
          interviewerId: interviewerUser?.id,
          round: "first" as const,
          type: "video" as const,
          scheduledAt: daysLater(3),
          duration: 45,
          status: "scheduled" as const,
          roomId: "ROOM20260610001",
          meetingUrl: "https://meet.example.com/room/ROOM20260610001",
          transcriptData: [
            { speaker: "面试官", timestamp: 60, text: "周九你好，欢迎参加今天的UI设计师面试。请先做一下自我介绍。", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 120, text: "您好，我是周九，毕业于中国美术学院，有2年UI设计经验，目前在网易担任UI设计师。", isKeyPoint: false, isFinal: true },
            { speaker: "面试官", timestamp: 240, text: "请介绍一下你的作品集里最满意的一个作品。", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 360, text: "我最满意的是网易云音乐的UI改版项目，我负责了播放器界面的重新设计，通过用户调研和A/B测试，将用户停留时间提升了15%。", isKeyPoint: true, isFinal: true },
            { speaker: "面试官", timestamp: 540, text: "你在设计过程中是如何与产品和开发团队协作的？", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 660, text: "我通常会在需求阶段就参与进来，和产品经理一起梳理用户场景。设计完成后会和开发团队做技术评审，确保设计方案的可实现性。", isKeyPoint: true, isFinal: true },
            { speaker: "面试官", timestamp: 840, text: "你对设计规范和组件库有什么了解？", isKeyPoint: false, isFinal: true },
            { speaker: "候选人", timestamp: 960, text: "我曾参与过公司设计系统的搭建，包括色彩规范、字体规范、组件库等，使用Figma进行管理，提高了团队的设计效率。", isKeyPoint: true, isFinal: true },
          ],
          behaviorMarkers: [
            { timestamp: 360, marker: "专业能力", severity: "positive" as const, notes: "设计作品优秀，有实际数据支撑" },
            { timestamp: 660, marker: "团队协作", severity: "positive" as const, notes: "跨团队协作经验丰富" },
            { timestamp: 960, marker: "专业能力", severity: "positive" as const, notes: "有设计系统搭建经验" },
            { timestamp: 1100, marker: "沟通表达", severity: "positive" as const, notes: "表达清晰，设计思路明确" },
          ],
        },
      ];

      for (const data of interviewData) {
        const interview = interviewRepository.create(data as any);
        await interviewRepository.save(interview);
      }

      console.log(`Created ${interviewData.length} demo interviews`);

      const approvalRepository = AppDataSource.getRepository(Approval);
      const approvalData = [
        {
          type: "position_publish" as const,
          targetId: positions[2].id,
          targetType: "position" as const,
          applicantId: hrUser?.id,
          approverId: managerUser?.id,
          status: "pending" as const,
          title: "职位发布审批：产品经理",
          description: "申请发布产品经理职位，招聘1人。",
        },
        {
          type: "offer_approval" as const,
          targetId: candidates[2].id,
          targetType: "candidate" as const,
          applicantId: hrUser?.id,
          approverId: managerUser?.id,
          status: "approved" as const,
          title: "Offer审批：王五",
          description: "申请给王五发放Offer，薪资35K-50K。",
          approvedAt: daysAgo(3),
          approvalComment: "同意，候选人技术能力强，符合岗位要求。",
        },
        {
          type: "offer_approval" as const,
          targetId: candidates[4].id,
          targetType: "candidate" as const,
          applicantId: hrUser?.id,
          approverId: managerUser?.id,
          status: "approved" as const,
          title: "Offer审批：陈七",
          description: "申请给陈七发放Offer，薪资25K-30K。",
          approvedAt: daysAgo(28),
          approvalComment: "同意，候选人产品思维清晰，数据驱动能力强。",
        },
        {
          type: "offer_approval" as const,
          targetId: candidates[1].id,
          targetType: "candidate" as const,
          applicantId: hrUser?.id,
          approverId: managerUser?.id,
          status: "pending" as const,
          title: "Offer审批：李四",
          description: "申请给李四发放Offer，薪资40K-55K。",
        },
      ];

      for (const data of approvalData) {
        const approval = approvalRepository.create(data);
        await approvalRepository.save(approval);
      }

      console.log(`[Seed] Created ${approvalData.length} demo approvals`);

      const imMessageRepository = AppDataSource.getRepository(IMMessage);
      const imMessageData = [
        {
          senderId: hrUser?.id,
          receiverId: managerUser?.id,
          type: "text" as const,
          content: "你好，王五的面试评价已经提交了，请查看一下是否可以发Offer。",
          isRead: true,
          readAt: daysAgo(8),
          isEncrypted: false,
          auditStatus: "normal" as const,
          auditResult: {
            hasSensitiveContent: false,
            sensitiveWords: [],
            riskLevel: "low" as const,
          },
          createdAt: daysAgo(9),
        },
        {
          senderId: managerUser?.id,
          receiverId: hrUser?.id,
          type: "text" as const,
          content: "好的，我看一下，王五的技术能力不错，可以考虑给薪资35K。",
          isRead: true,
          readAt: daysAgo(8),
          isEncrypted: false,
          auditStatus: "warning" as const,
          auditResult: {
            hasSensitiveContent: true,
            sensitiveWords: ["薪资"],
            riskLevel: "medium" as const,
            notes: "包含敏感词'薪资'，已标记警告",
          },
          createdAt: daysAgo(8),
        },
        {
          senderId: hrUser?.id,
          receiverId: interviewerUser?.id,
          type: "text" as const,
          content: "明天下午2点有个张三的面试，请准时参加。会议链接：https://meet.example.com/room/ROOM20260608001",
          isRead: true,
          readAt: daysAgo(1),
          isEncrypted: false,
          auditStatus: "normal" as const,
          auditResult: {
            hasSensitiveContent: false,
            sensitiveWords: [],
            riskLevel: "low" as const,
          },
          createdAt: daysAgo(1),
        },
        {
          senderId: interviewerUser?.id,
          receiverId: hrUser?.id,
          type: "text" as const,
          content: "好的，我已经准备好面试问题了。另外，有个朋友想内推一下，可以吗？",
          isRead: true,
          readAt: daysAgo(1),
          isEncrypted: false,
          auditStatus: "warning" as const,
          auditResult: {
            hasSensitiveContent: true,
            sensitiveWords: ["内推"],
            riskLevel: "medium" as const,
            notes: "包含敏感词'内推'，已标记警告",
          },
          createdAt: daysAgo(1),
        },
        {
          senderId: hrUser?.id,
          receiverId: interviewerUser?.id,
          type: "text" as const,
          content: "可以的，走正常内推流程就行，不要私下联系候选人哦。",
          isRead: false,
          isEncrypted: false,
          auditStatus: "violation" as const,
          auditResult: {
            hasSensitiveContent: true,
            sensitiveWords: ["私下联系"],
            riskLevel: "high" as const,
            notes: "包含敏感词'私下联系'，需人工审核",
          },
          createdAt: daysAgo(0),
        },
        {
          senderId: hrUser?.id,
          receiverId: interviewerUser?.id,
          type: "text" as const,
          content: "王五你好，你的面试已经通过，我们会尽快发送Offer给你。",
          isRead: true,
          readAt: daysAgo(4),
          isEncrypted: true,
          encryptionType: "AES-256",
          auditStatus: "normal" as const,
          auditResult: {
            hasSensitiveContent: false,
            sensitiveWords: [],
            riskLevel: "low" as const,
          },
          createdAt: daysAgo(4),
        },
        {
          senderId: interviewerUser?.id,
          receiverId: hrUser?.id,
          type: "text" as const,
          content: "好的，谢谢！请问薪资大概是多少范围呢？",
          isRead: true,
          readAt: daysAgo(4),
          isEncrypted: true,
          encryptionType: "AES-256",
          auditStatus: "warning" as const,
          auditResult: {
            hasSensitiveContent: true,
            sensitiveWords: ["薪资"],
            riskLevel: "medium" as const,
            notes: "包含敏感词'薪资'，已标记警告",
          },
          createdAt: daysAgo(4),
        },
        {
          senderId: hrUser?.id,
          receiverId: managerUser?.id,
          type: "text" as const,
          content: "陈七你好，欢迎加入我们公司！下周一记得来入职，带好相关材料。",
          isRead: true,
          readAt: daysAgo(8),
          isEncrypted: true,
          encryptionType: "AES-256",
          auditStatus: "normal" as const,
          auditResult: {
            hasSensitiveContent: false,
            sensitiveWords: [],
            riskLevel: "low" as const,
          },
          createdAt: daysAgo(8),
        },
        {
          senderId: managerUser?.id,
          receiverId: hrUser?.id,
          type: "file" as const,
          content: "这是张三的面试评价表，请查收。",
          isRead: true,
          readAt: daysAgo(2),
          isEncrypted: false,
          auditStatus: "normal" as const,
          auditResult: {
            hasSensitiveContent: false,
            sensitiveWords: [],
            riskLevel: "low" as const,
          },
          attachments: [
            {
              fileName: "张三-面试评价表.pdf",
              fileSize: 1024000,
              fileType: "application/pdf",
              filePath: "/uploads/interview/张三-面试评价表.pdf",
            },
          ],
          createdAt: daysAgo(2),
        },
        {
          senderId: interviewerUser?.id,
          receiverId: hrUser?.id,
          type: "text" as const,
          content: "李四的复试安排在后天，他的技术能力很强，我觉得可以给高点的薪资。",
          isRead: true,
          readAt: daysAgo(1),
          isEncrypted: false,
          auditStatus: "warning" as const,
          auditResult: {
            hasSensitiveContent: true,
            sensitiveWords: ["薪资"],
            riskLevel: "medium" as const,
            notes: "包含敏感词'薪资'，已标记警告",
          },
          createdAt: daysAgo(1),
        },
        {
          senderId: hrUser?.id,
          receiverId: managerUser?.id,
          type: "text" as const,
          content: "李四的Offer审批已经提交了，请尽快审批。另外提醒一下，不要在消息里讨论回扣等敏感话题。",
          isRead: false,
          isEncrypted: false,
          auditStatus: "violation" as const,
          auditResult: {
            hasSensitiveContent: true,
            sensitiveWords: ["回扣"],
            riskLevel: "high" as const,
            notes: "包含敏感词'回扣'，需人工审核",
          },
          createdAt: daysAgo(0),
        },
        {
          senderId: managerUser?.id,
          receiverId: hrUser?.id,
          type: "text" as const,
          content: "好的，我知道了。对了，陈七的入职手续办好了吗？听说她原来的公司给了不少好处想留她。",
          isRead: false,
          isEncrypted: false,
          auditStatus: "warning" as const,
          auditResult: {
            hasSensitiveContent: true,
            sensitiveWords: ["好处"],
            riskLevel: "medium" as const,
            notes: "包含敏感词'好处'，已标记警告",
          },
          createdAt: daysAgo(0),
        },
        {
          senderId: hrUser?.id,
          receiverId: interviewerUser?.id,
          type: "text" as const,
          content: "周九的面试安排在大后天，请把你的微信发我一下，我拉你进面试群。",
          isRead: false,
          isEncrypted: false,
          auditStatus: "violation" as const,
          auditResult: {
            hasSensitiveContent: true,
            sensitiveWords: ["微信"],
            riskLevel: "high" as const,
            notes: "包含敏感词'微信'，需人工审核",
          },
          createdAt: daysAgo(0),
        },
        {
          senderId: interviewerUser?.id,
          receiverId: hrUser?.id,
          type: "text" as const,
          content: "好的，我的QQ是12345678，电话是13800138000。",
          isRead: false,
          isEncrypted: false,
          auditStatus: "violation" as const,
          auditResult: {
            hasSensitiveContent: true,
            sensitiveWords: ["QQ", "电话"],
            riskLevel: "high" as const,
            notes: "包含敏感词'QQ、电话'，需人工审核",
          },
          createdAt: daysAgo(0),
        },
        {
          senderId: hrUser?.id,
          receiverId: managerUser?.id,
          type: "image" as const,
          content: "这是王五的背调报告截图，看起来没问题。",
          isRead: true,
          readAt: daysAgo(6),
          isEncrypted: true,
          encryptionType: "AES-256",
          auditStatus: "normal" as const,
          auditResult: {
            hasSensitiveContent: false,
            sensitiveWords: [],
            riskLevel: "low" as const,
          },
          attachments: [
            {
              fileName: "王五-背调报告.png",
              fileSize: 512000,
              fileType: "image/png",
              filePath: "/uploads/background-check/王五-背调报告.png",
            },
          ],
          createdAt: daysAgo(6),
        },
        {
          senderId: managerUser?.id,
          receiverId: hrUser?.id,
          type: "text" as const,
          content: "收到，背调没问题就可以发Offer了。另外，赵六的简历你看了吗？觉得怎么样？",
          isRead: true,
          readAt: daysAgo(5),
          isEncrypted: false,
          auditStatus: "normal" as const,
          auditResult: {
            hasSensitiveContent: false,
            sensitiveWords: [],
            riskLevel: "low" as const,
          },
          createdAt: daysAgo(6),
        },
        {
          senderId: hrUser?.id,
          receiverId: managerUser?.id,
          type: "text" as const,
          content: "赵六的AI初筛评分78分，我觉得可以安排初试。不过要注意不要泄漏候选人的隐私信息。",
          isRead: true,
          readAt: daysAgo(5),
          isEncrypted: false,
          auditStatus: "warning" as const,
          auditResult: {
            hasSensitiveContent: true,
            sensitiveWords: ["泄漏"],
            riskLevel: "medium" as const,
            notes: "包含敏感词'泄漏'，已标记警告",
          },
          createdAt: daysAgo(5),
        },
        {
          senderId: hrUser?.id,
          receiverId: managerUser?.id,
          type: "file" as const,
          content: "陈七你好，这是你的入职须知和劳动合同，请查收。",
          isRead: true,
          readAt: daysAgo(15),
          isEncrypted: true,
          encryptionType: "AES-256",
          auditStatus: "normal" as const,
          auditResult: {
            hasSensitiveContent: false,
            sensitiveWords: [],
            riskLevel: "low" as const,
          },
          attachments: [
            {
              fileName: "入职须知.docx",
              fileSize: 256000,
              fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              filePath: "/uploads/onboarding/入职须知.docx",
            },
            {
              fileName: "劳动合同.pdf",
              fileSize: 1024000,
              fileType: "application/pdf",
              filePath: "/uploads/onboarding/劳动合同.pdf",
            },
          ],
          createdAt: daysAgo(18),
        },
      ];

      for (const data of imMessageData) {
        const message = imMessageRepository.create(data as any);
        await imMessageRepository.save(message);
      }

      console.log(`[Seed] Created ${imMessageData.length} demo IM messages`);

      const candidateRepository2 = AppDataSource.getRepository(Candidate);
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        if (i === 2) {
          candidate.backgroundCheck = {
            status: "completed",
            startedAt: daysAgo(15),
            completedAt: daysAgo(10),
            reportUrl: "/uploads/background-check/王五-背调报告.pdf",
            items: [
              { name: "学历验证", status: "pass", notes: "北京大学硕士学历验证通过", checkedAt: daysAgo(14) },
              { name: "工作经历验证", status: "pass", notes: "美团5年工作经验验证通过", checkedAt: daysAgo(13) },
              { name: "犯罪记录查询", status: "pass", notes: "无犯罪记录", checkedAt: daysAgo(12) },
              { name: "征信查询", status: "pass", notes: "征信良好", checkedAt: daysAgo(11) },
              { name: "职业资格验证", status: "pass", notes: "相关资格证书有效", checkedAt: daysAgo(10) },
            ],
            overallResult: "pass",
            notes: "背调全部通过，候选人信息真实有效",
          };
          candidate.onboardingChecklist = [
            { item: "身份证复印件", completed: true, completedAt: daysAgo(5) },
            { item: "学历证明", completed: true, completedAt: daysAgo(5) },
            { item: "离职证明", completed: false },
            { item: "体检报告", completed: false },
            { item: "Offer确认", completed: true, completedAt: daysAgo(3) },
            { item: "劳动合同签署", completed: false },
            { item: "社保公积金转移", completed: false },
          ];
        } else if (i === 4) {
          candidate.backgroundCheck = {
            status: "completed",
            startedAt: daysAgo(40),
            completedAt: daysAgo(35),
            reportUrl: "/uploads/background-check/陈七-背调报告.pdf",
            items: [
              { name: "学历验证", status: "pass", notes: "复旦大学硕士学历验证通过", checkedAt: daysAgo(39) },
              { name: "工作经历验证", status: "pass", notes: "腾讯4年工作经验验证通过", checkedAt: daysAgo(38) },
              { name: "犯罪记录查询", status: "pass", notes: "无犯罪记录", checkedAt: daysAgo(37) },
              { name: "征信查询", status: "pass", notes: "征信良好", checkedAt: daysAgo(36) },
              { name: "职业资格验证", status: "pass", notes: "相关资格证书有效", checkedAt: daysAgo(35) },
            ],
            overallResult: "pass",
            notes: "背调全部通过，候选人信息真实有效",
          };
          candidate.onboardingChecklist = [
            { item: "身份证复印件", completed: true, completedAt: daysAgo(25) },
            { item: "学历证明", completed: true, completedAt: daysAgo(25) },
            { item: "离职证明", completed: true, completedAt: daysAgo(20) },
            { item: "体检报告", completed: true, completedAt: daysAgo(18) },
            { item: "Offer确认", completed: true, completedAt: daysAgo(20) },
            { item: "劳动合同签署", completed: true, completedAt: daysAgo(15) },
            { item: "工牌制作", completed: true, completedAt: daysAgo(10) },
            { item: "社保公积金转移", completed: true, completedAt: daysAgo(8) },
            { item: "电脑设备领取", completed: true, completedAt: daysAgo(7) },
            { item: "入职培训完成", completed: true, completedAt: daysAgo(5) },
          ];
        } else if (i === 1) {
          candidate.backgroundCheck = {
            status: "in_progress",
            startedAt: daysAgo(2),
            items: [
              { name: "学历验证", status: "pass", notes: "浙江大学本科学历验证通过", checkedAt: daysAgo(2) },
              { name: "工作经历验证", status: "pending" },
              { name: "犯罪记录查询", status: "pending" },
              { name: "征信查询", status: "pending" },
              { name: "职业资格验证", status: "pending" },
            ],
            overallResult: "pending",
            notes: "背调进行中",
          };
        }
        await candidateRepository2.save(candidate);
      }

      console.log("[Seed] Updated candidate background check and onboarding checklist");
      console.log("[Seed] ✅ Demo data initialization completed!");
    } catch (error) {
      console.error("[Seed] Init demo data error:", error);
    }
  }
}
