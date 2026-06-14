import { AppDataSource } from '../data-source';
import { Skill, SkillCategory } from '../entities/Skill';
import { SensitiveWord, SensitiveWordCategory } from '../entities/SensitiveWord';
import { Company } from '../entities/Company';
import { Job } from '../entities/Job';
import { Resume } from '../entities/Resume';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';

const skillRepository = AppDataSource.getRepository(Skill);
const sensitiveWordRepository = AppDataSource.getRepository(SensitiveWord);
const companyRepository = AppDataSource.getRepository(Company);
const jobRepository = AppDataSource.getRepository(Job);
const resumeRepository = AppDataSource.getRepository(Resume);
const userRepository = AppDataSource.getRepository(User);

const printingSkills: Array<{ name: string; category: SkillCategory; description: string; relatedSkills: string[] }> = [
  {
    name: 'CTP制版',
    category: 'prepress',
    description: '计算机直接制版技术，掌握CTP设备操作与维护',
    relatedSkills: ['PS版处理', '数码打样', '色彩管理']
  },
  {
    name: '色彩管理',
    category: 'prepress',
    description: 'ICC色彩管理、色彩校准、屏幕软打样',
    relatedSkills: ['CTP制版', '数码打样', '印刷色彩控制']
  },
  {
    name: '数码打样',
    category: 'prepress',
    description: '数码打样设备操作、色彩校准、打样质量控制',
    relatedSkills: ['色彩管理', 'CTP制版', '印刷工艺']
  },
  {
    name: 'PS版处理',
    category: 'prepress',
    description: 'PS版晒版、显影、修版等工艺',
    relatedSkills: ['CTP制版', '胶印工艺', '晒版工艺']
  },
  {
    name: '文件排版',
    category: 'prepress',
    description: 'InDesign、Illustrator、CorelDRAW等排版软件操作',
    relatedSkills: ['图像处理', '拼版工艺', '印前检查']
  },
  {
    name: '图像处理',
    category: 'prepress',
    description: 'Photoshop图像处理、修图、色彩调整',
    relatedSkills: ['文件排版', '色彩管理', '印前检查']
  },
  {
    name: '拼版工艺',
    category: 'prepress',
    description: '折手拼版、自翻版、滚翻版等拼版技术',
    relatedSkills: ['文件排版', '印前检查', 'CTP制版']
  },
  {
    name: '印前检查',
    category: 'prepress',
    description: 'PDF预检、文件规范检查、出血位检查',
    relatedSkills: ['文件排版', '拼版工艺', 'CTP制版']
  },
  {
    name: '海德堡胶印机操作',
    category: 'printing',
    description: '海德堡SM/CD系列胶印机操作、维护、故障排除',
    relatedSkills: ['胶印工艺', '色彩控制', '水墨平衡']
  },
  {
    name: '小森胶印机操作',
    category: 'printing',
    description: '小森LS/GL系列胶印机操作、维护、故障排除',
    relatedSkills: ['胶印工艺', '色彩控制', '水墨平衡']
  },
  {
    name: '罗兰胶印机操作',
    category: 'printing',
    description: '罗兰R700/900系列胶印机操作、维护、故障排除',
    relatedSkills: ['胶印工艺', '色彩控制', '水墨平衡']
  },
  {
    name: '胶印工艺',
    category: 'printing',
    description: '胶印原理、水墨平衡、压力调节、质量控制',
    relatedSkills: ['海德堡胶印机操作', '小森胶印机操作', '色彩控制']
  },
  {
    name: '水墨平衡',
    category: 'printing',
    description: '胶印水墨平衡控制、润版液配比、pH值控制',
    relatedSkills: ['胶印工艺', '色彩控制', '质量检测']
  },
  {
    name: '色彩控制',
    category: 'printing',
    description: '印刷过程色彩控制、密度测量、色差调整',
    relatedSkills: ['胶印工艺', '水墨平衡', '色彩管理']
  },
  {
    name: '凹印工艺',
    category: 'printing',
    description: '凹版印刷工艺、设备操作、质量控制',
    relatedSkills: ['软包装印刷', '油墨调配', '质量检测']
  },
  {
    name: '柔印工艺',
    category: 'printing',
    description: '柔性版印刷工艺、设备操作、质量控制',
    relatedSkills: ['瓦楞纸印刷', '水墨应用', '质量检测']
  },
  {
    name: '丝网印刷',
    category: 'printing',
    description: '丝网印刷工艺、网版制作、设备操作',
    relatedSkills: ['特种印刷', '油墨调配', '质量检测']
  },
  {
    name: '数码印刷',
    category: 'printing',
    description: '数码印刷设备操作、可变数据印刷、按需印刷',
    relatedSkills: ['文件处理', '色彩管理', '质量检测']
  },
  {
    name: '油墨调配',
    category: 'printing',
    description: '专色调配、油墨性能调整、配色系统应用',
    relatedSkills: ['色彩控制', '胶印工艺', '质量检测']
  },
  {
    name: '质量检测',
    category: 'printing',
    description: '印刷品质量检测、缺陷识别、标准执行',
    relatedSkills: ['色彩控制', '水墨平衡', '胶印工艺']
  },
  {
    name: '模切工艺',
    category: 'postpress',
    description: '模切机操作、刀模制作、模切质量控制',
    relatedSkills: ['烫金工艺', '糊盒工艺', '压痕工艺']
  },
  {
    name: '烫金工艺',
    category: 'postpress',
    description: '烫金机操作、电化铝选择、烫印参数控制',
    relatedSkills: ['模切工艺', '压痕工艺', '表面整饰']
  },
  {
    name: '覆膜工艺',
    category: 'postpress',
    description: '覆膜机操作、预涂/即涂工艺、质量控制',
    relatedSkills: ['表面整饰', '糊盒工艺', '质量检测']
  },
  {
    name: 'UV上光',
    category: 'postpress',
    description: 'UV上光机操作、UV油墨应用、效果控制',
    relatedSkills: ['覆膜工艺', '表面整饰', '质量检测']
  },
  {
    name: '压痕工艺',
    category: 'postpress',
    description: '压痕机操作、线选择、压力调节',
    relatedSkills: ['模切工艺', '糊盒工艺', '折页工艺']
  },
  {
    name: '折页工艺',
    category: 'postpress',
    description: '折页机操作、折页方式、质量控制',
    relatedSkills: ['压痕工艺', '装订工艺', '裁切工艺']
  },
  {
    name: '装订工艺',
    category: 'postpress',
    description: '骑马钉、胶装、精装等装订工艺',
    relatedSkills: ['折页工艺', '裁切工艺', '糊盒工艺']
  },
  {
    name: '糊盒工艺',
    category: 'postpress',
    description: '糊盒机操作、胶水应用、纸盒成型',
    relatedSkills: ['模切工艺', '覆膜工艺', '压痕工艺']
  },
  {
    name: '裁切工艺',
    category: 'postpress',
    description: '切纸机操作、裁切精度控制、材料损耗控制',
    relatedSkills: ['折页工艺', '装订工艺', '质量检测']
  },
  {
    name: '表面整饰',
    category: 'postpress',
    description: '各种表面整饰工艺、效果设计、质量控制',
    relatedSkills: ['覆膜工艺', 'UV上光', '烫金工艺']
  },
  {
    name: '生产管理',
    category: 'management',
    description: '印刷生产计划、进度控制、资源调度',
    relatedSkills: ['质量管理', '设备管理', '成本控制']
  },
  {
    name: '质量管理',
    category: 'management',
    description: 'ISO质量管理体系、质量标准制定、过程控制',
    relatedSkills: ['生产管理', '质量检测', '体系认证']
  },
  {
    name: '设备管理',
    category: 'management',
    description: '印刷设备维护保养、故障诊断、备品备件管理',
    relatedSkills: ['生产管理', '成本控制', '海德堡胶印机操作']
  },
  {
    name: '成本控制',
    category: 'management',
    description: '印刷成本核算、物料损耗控制、报价体系',
    relatedSkills: ['生产管理', '设备管理', '质量管理']
  },
  {
    name: '体系认证',
    category: 'management',
    description: 'ISO9001、ISO14001、G7等体系认证与维护',
    relatedSkills: ['质量管理', '生产管理', '环保合规']
  },
  {
    name: '环保合规',
    category: 'management',
    description: 'VOCs治理、危废处理、环保法规 compliance',
    relatedSkills: ['体系认证', '生产管理', '质量管理']
  }
];

const sensitiveWords: Array<{ word: string; category: SensitiveWordCategory; riskLevel: string; replacement?: string }> = [
  { word: '包吃包住', category: 'salary_promise', riskLevel: 'medium', replacement: '提供食宿' },
  { word: '高薪诚聘', category: 'false_publicity', riskLevel: 'medium', replacement: '诚意招聘' },
  { word: '月薪过万', category: 'false_publicity', riskLevel: 'high', replacement: '面议' },
  { word: '年薪百万', category: 'false_publicity', riskLevel: 'high', replacement: '面议' },
  { word: '保底工资', category: 'salary_promise', riskLevel: 'medium', replacement: '薪资范围' },
  { word: '工资面议', category: 'salary_promise', riskLevel: 'low', replacement: '面议' },
  { word: '多劳多得', category: 'overtime_culture', riskLevel: 'medium', replacement: '按劳分配' },
  { word: '能吃苦', category: 'overtime_culture', riskLevel: 'medium', replacement: '吃苦耐劳' },
  { word: '服从安排', category: 'overtime_culture', riskLevel: 'medium', replacement: '团队协作' },
  { word: '无条件加班', category: 'overtime_culture', riskLevel: 'high', replacement: '' },
  { word: '无偿加班', category: 'overtime_culture', riskLevel: 'high', replacement: '' },
  { word: '义务加班', category: 'overtime_culture', riskLevel: 'high', replacement: '' },
  { word: '弹性工作', category: 'overtime_culture', riskLevel: 'medium', replacement: '灵活工作' },
  { word: '不介意加班', category: 'overtime_culture', riskLevel: 'high', replacement: '' },
  { word: '接受加班', category: 'overtime_culture', riskLevel: 'medium', replacement: '可适应加班' },
  { word: '年轻人多', category: 'false_publicity', riskLevel: 'low', replacement: '团队氛围好' },
  { word: '晋升快', category: 'false_publicity', riskLevel: 'medium', replacement: '发展空间大' },
  { word: '美女多', category: 'false_publicity', riskLevel: 'medium', replacement: '' },
  { word: '帅哥多', category: 'false_publicity', riskLevel: 'low', replacement: '' },
  { word: '不打卡', category: 'false_publicity', riskLevel: 'low', replacement: '考勤灵活' },
  { word: '上班自由', category: 'false_publicity', riskLevel: 'medium', replacement: '工作灵活' },
  { word: '干股分红', category: 'salary_promise', riskLevel: 'high', replacement: '绩效奖励' },
  { word: '年底双薪', category: 'salary_promise', riskLevel: 'medium', replacement: '年终奖励' },
  { word: '十三薪', category: 'salary_promise', riskLevel: 'medium', replacement: '年终奖励' },
  { word: '五险一金齐全', category: 'salary_promise', riskLevel: 'low', replacement: '缴纳五险一金' },
  { word: '免费旅游', category: 'false_publicity', riskLevel: 'medium', replacement: '团队活动' },
  { word: '免费培训', category: 'false_publicity', riskLevel: 'low', replacement: '提供培训' },
  { word: '节日福利', category: 'false_publicity', riskLevel: 'low', replacement: '节日关怀' },
  { word: '全勤奖', category: 'salary_promise', riskLevel: 'low', replacement: '出勤奖励' },
  { word: '绩效奖金', category: 'salary_promise', riskLevel: 'low', replacement: '绩效奖励' }
];

export const seedSkills = async (): Promise<{ success: boolean; message: string; count?: number }> => {
  try {
    const existingCount = await skillRepository.count();
    if (existingCount > 0) {
      return { success: true, message: '技能数据已存在，无需初始化' };
    }

    const skills = skillRepository.create(printingSkills);
    await skillRepository.save(skills);

    return { success: true, message: '技能数据初始化成功', count: skills.length };
  } catch (error) {
    return {
      success: false,
      message: '技能数据初始化失败',
      count: 0
    };
  }
};

export const seedSensitiveWords = async (): Promise<{ success: boolean; message: string; count?: number }> => {
  try {
    const existingCount = await sensitiveWordRepository.count();
    if (existingCount > 0) {
      return { success: true, message: '敏感词数据已存在，无需初始化' };
    }

    const words = sensitiveWordRepository.create(sensitiveWords);
    await sensitiveWordRepository.save(words);

    return { success: true, message: '敏感词数据初始化成功', count: words.length };
  } catch (error) {
    return {
      success: false,
      message: '敏感词数据初始化失败',
      count: 0
    };
  }
};

export const seedSampleData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const userCount = await userRepository.count();
    if (userCount > 0) {
      return { success: true, message: '示例数据已存在，无需初始化' };
    }

    const hashedPassword = await bcrypt.hash('123456', 10);

    const jobseeker = userRepository.create({
      email: 'jobseeker@example.com',
      password: hashedPassword,
      name: '张师傅',
      phone: '13800138001',
      role: 'jobseeker'
    });
    await userRepository.save(jobseeker);

    const enterprise = userRepository.create({
      email: 'enterprise@example.com',
      password: hashedPassword,
      name: '李经理',
      phone: '13800138002',
      role: 'enterprise'
    });
    await userRepository.save(enterprise);

    const admin = userRepository.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: '管理员',
      phone: '13800138000',
      role: 'admin'
    });
    await userRepository.save(admin);

    const company = companyRepository.create({
      userId: enterprise.id,
      companyName: '华彩印刷有限公司',
      industry: '包装印刷',
      scale: '100-500人',
      address: '广东省深圳市龙岗区印刷工业园A栋',
      licenseNo: '91440300MA5XXXXXXX',
      description: '专业从事高端包装印刷的企业，拥有海德堡、小森等多台进口印刷设备，服务于多家知名品牌客户。',
      certifications: {
        iso9001: true,
        iso14001: true,
        g7: true
      },
      status: 'approved'
    });
    await companyRepository.save(company);

    const jobs = jobRepository.create([
      {
        companyId: company.id,
        title: '海德堡胶印机机长',
        department: '印刷车间',
        salaryMin: 12000,
        salaryMax: 18000,
        workLocation: '深圳龙岗',
        jobType: '全职',
        processRequirements: {
          printingMethod: '胶印',
          colorGroupRequirement: '四色及以上',
          precisionRequirement: '±0.05mm'
        },
        equipmentModels: {
          heidelberg: ['CD102', 'SM74']
        },
        materialStandards: {
          paperType: '铜版纸/白卡纸',
          inkStandard: '大豆环保油墨',
          laminationRequirement: '光膜/哑膜'
        },
        requiredSkills: ['海德堡胶印机操作', '胶印工艺', '色彩控制', '水墨平衡'],
        experienceYears: '5年以上',
        education: '中专及以上',
        description: '负责海德堡CD102/SM74胶印机的操作与维护，确保印刷质量和生产进度。要求5年以上同岗位经验，熟悉包装印刷工艺。',
        status: 'active'
      },
      {
        companyId: company.id,
        title: 'CTP制版技术员',
        department: '印前车间',
        salaryMin: 8000,
        salaryMax: 12000,
        workLocation: '深圳龙岗',
        jobType: '全职',
        processRequirements: {
          printingMethod: '胶印',
          precisionRequirement: '±0.02mm'
        },
        requiredSkills: ['CTP制版', '色彩管理', '数码打样', '拼版工艺'],
        experienceYears: '3年以上',
        education: '中专及以上',
        description: '负责CTP制版、数码打样、色彩管理等印前工作。要求熟悉柯达/爱克发CTP设备，掌握ICC色彩管理。',
        status: 'active'
      },
      {
        companyId: company.id,
        title: '模切机机长',
        department: '印后车间',
        salaryMin: 9000,
        salaryMax: 14000,
        workLocation: '深圳龙岗',
        jobType: '全职',
        requiredSkills: ['模切工艺', '压痕工艺', '糊盒工艺', '质量检测'],
        experienceYears: '3年以上',
        education: '中专及以上',
        description: '负责全自动模切机的操作与维护，熟悉纸盒模切工艺。要求3年以上同岗位经验，能独立处理常见故障。',
        status: 'active'
      }
    ]);
    await jobRepository.save(jobs);

    const resume = resumeRepository.create({
      userId: jobseeker.id,
      name: '张师傅',
      gender: '男',
      age: 35,
      phone: '13800138001',
      email: 'jobseeker@example.com',
      education: '中专',
      expectedSalary: 15000,
      expectedPosition: '海德堡胶印机机长',
      workExperience: [
        {
          company: '深圳XX包装印刷有限公司',
          position: '海德堡胶印机机长',
          startDate: '2018-03',
          endDate: '至今',
          gravureExperienceYears: 0,
          offsetExperienceYears: 8,
          flexoExperienceYears: 0,
          description: '负责海德堡CD102四色机操作，日产印刷量15万印，产品合格率99.5%以上。带领3人机组完成生产任务。'
        },
        {
          company: '东莞XX印刷厂',
          position: '海德堡胶印机副机长',
          startDate: '2015-05',
          endDate: '2018-02',
          gravureExperienceYears: 0,
          offsetExperienceYears: 0,
          flexoExperienceYears: 0,
          description: '协助机长操作海德堡SM74，负责水墨调节、质量检查等工作。'
        }
      ],
      skills: [
        {
          name: '海德堡胶印机操作',
          psPlateSoftwareProficiency: 90,
          ctpOperationProficiency: 70,
          colorManagementProficiency: 85
        },
        {
          name: '胶印工艺',
          psPlateSoftwareProficiency: 85,
          ctpOperationProficiency: 60,
          colorManagementProficiency: 80
        },
        {
          name: '色彩控制',
          psPlateSoftwareProficiency: 80,
          ctpOperationProficiency: 50,
          colorManagementProficiency: 90
        }
      ],
      certifications: [
        {
          name: '印刷技师资格证',
          issuer: '广东省人力资源和社会保障厅',
          date: '2020-06',
          isoCertificationExperience: 'ISO9001内审员'
        }
      ],
      portfolio: []
    });
    await resumeRepository.save(resume);

    return { success: true, message: '示例数据初始化成功' };
  } catch (error) {
    return {
      success: false,
      message: '示例数据初始化失败'
    };
  }
};

export const seedAll = async (): Promise<{ skills: any; sensitiveWords: any; sampleData: any }> => {
  const skillsResult = await seedSkills();
  const sensitiveWordsResult = await seedSensitiveWords();
  const sampleDataResult = await seedSampleData();

  return {
    skills: skillsResult,
    sensitiveWords: sensitiveWordsResult,
    sampleData: sampleDataResult
  };
};
