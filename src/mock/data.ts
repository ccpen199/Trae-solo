import {
  Enterprise,
  JobPosition,
  JobSeeker,
  Resume,
  RPOProject,
  Application,
  ChannelROI,
  SubsidyApplication,
  MatchResult,
  FunnelMetrics,
  RetentionAnalysis,
  TownshipCode,
  IndustryTag,
  JobSeekerType,
  CampusSession,
  EducationCourse,
  WrittenExam,
  ExamQuestion,
  AIInterview,
  AIQuestion,
  AIScoreReport,
  MatchDimension,
  CourseType,
  JobWithMatch,
} from '../../shared/types';
import { TOWNSHIPS } from './townships';
import {
  createEnterprise,
  createJobPosition,
  createJobSeeker,
  createResume,
  createRPOProject,
  createApplication,
  createChannelROI,
  createSubsidyApplication,
  createMatchResult,
  createJobWithMatch,
  randomInt,
  randomPick,
  randomPicks,
  randomDate,
  randomFloat
} from './factory';

function weightedPick<T>(items: { value: T; weight: number }[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item.value;
  }
  return items[0].value;
}

export type MockDataset = {
  enterprises: Enterprise[];
  positions: JobPosition[];
  jobSeekers: JobSeeker[];
  resumes: Resume[];
  rpoProjects: RPOProject[];
  applications: Application[];
  channelROIs: ChannelROI[];
  subsidyApplications: SubsidyApplication[];
  matchResults: MatchResult[];
  funnelMetrics: FunnelMetrics[];
  retentionAnalyses: RetentionAnalysis[];
  campusSessions: CampusSession[];
  educationCourses: EducationCourse[];
  jobsWithMatch: JobWithMatch[];
};

export const generateMockData = (): MockDataset => {
  const enterprises: Enterprise[] = [];
  for (let i = 1; i <= 150; i++) {
    enterprises.push(createEnterprise(`ent_${i}`));
  }

  const positions: JobPosition[] = [];
  let posIdx = 1;
  for (const ent of enterprises) {
    const posCount = Math.min(ent.openPositionCount, randomInt(3, 12));
    for (let p = 0; p < posCount; p++) {
      positions.push(createJobPosition(`pos_${posIdx++}`, ent));
    }
  }
  while (positions.length < 800) {
    const ent = randomPick(enterprises);
    positions.push(createJobPosition(`pos_${posIdx++}`, ent));
  }

  const jobSeekers: JobSeeker[] = [];
  for (let i = 1; i <= 500; i++) {
    jobSeekers.push(createJobSeeker(`js_${i}`));
  }

  const resumes: Resume[] = [];
  for (let i = 0; i < jobSeekers.length; i++) {
    const js = jobSeekers[i];
    const resume = createResume(`res_${i + 1}`, js);
    js.resumeId = resume.id;
    resumes.push(resume);
  }

  const rpoProjects: RPOProject[] = [];
  for (let i = 1; i <= 30; i++) {
    rpoProjects.push(createRPOProject(`rpo_${i}`, i, enterprises));
  }

  const applications: Application[] = [];
  let appIdx = 1;
  for (let i = 0; i < 3000; i++) {
    const js = randomPick(jobSeekers);
    const pos = randomPick(positions);
    const exists = applications.some(a => a.jobSeekerId === js.id && a.positionId === pos.id);
    if (exists) continue;
    applications.push(createApplication(`app_${appIdx++}`, js.id, pos));
  }

  const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];
  const channelROIs: ChannelROI[] = [];
  let roiIdx = 1;
  months.forEach((month, mIdx) => {
    const channelCount = mIdx === months.length - 1 ? 10 : 15;
    for (let i = 0; i < channelCount; i++) {
      channelROIs.push(createChannelROI(`roi_${roiIdx++}_${mIdx}`, month));
    }
  });

  const townshipCodes = TOWNSHIPS.map(t => t.code);
  const subsidyApplications: SubsidyApplication[] = [];
  for (let i = 1; i <= 80; i++) {
    subsidyApplications.push(createSubsidyApplication(`sub_${i}`, String(i), enterprises, townshipCodes));
  }

  const matchResults: MatchResult[] = [];
  let matchIdx = 1;
  for (const app of applications.slice(0, 1500)) {
    const js = jobSeekers.find(j => j.id === app.jobSeekerId);
    const pos = positions.find(p => p.id === app.positionId);
    if (!js || !pos) continue;
    const resume = resumes.find(r => r.jobSeekerId === js.id);
    if (!resume) continue;
    matchResults.push(createMatchResult(
      `match_${matchIdx++}`,
      js.id,
      pos.id,
      resume.skills,
      pos.requiredSkills
    ));
  }

  const funnelMetrics: FunnelMetrics[] = [];
  const periods: string[] = [];
  for (let m = 1; m <= 6; m++) {
    periods.push(`2024-${m.toString().padStart(2, '0')}`);
  }
  let funnelIdx = 1;
  for (const period of periods) {
    const views = randomInt(20000, 80000);
    const applications = Math.floor(views * randomFloat(0.06, 0.12));
    const screeningPass = Math.floor(applications * randomFloat(0.4, 0.65));
    const interviews = Math.floor(screeningPass * randomFloat(0.35, 0.55));
    const offers = Math.floor(interviews * randomFloat(0.18, 0.32));
    const hires = Math.floor(offers * randomFloat(0.55, 0.78));
    funnelMetrics.push({
      id: `funnel_${funnelIdx++}`,
      period,
      periodType: '月',
      views,
      applications,
      screeningPass,
      interviews,
      offers,
      hires,
      retention30d: parseFloat(randomFloat(78, 95, 1).toString()),
      retention90d: parseFloat(randomFloat(65, 88, 1).toString()),
      retention180d: parseFloat(randomFloat(52, 78, 1).toString()),
      viewToApplicationRate: parseFloat(((applications / views) * 100).toFixed(2)),
      applicationToScreeningRate: parseFloat(((screeningPass / applications) * 100).toFixed(2)),
      screeningToInterviewRate: parseFloat(((interviews / screeningPass) * 100).toFixed(2)),
      interviewToOfferRate: parseFloat(((offers / interviews) * 100).toFixed(2)),
      offerToOnboardRate: parseFloat(((hires / offers) * 100).toFixed(2))
    } as FunnelMetrics);
  }

  const retentionAnalyses: RetentionAnalysis[] = [];
  let retIdx = 1;
  for (const period of periods) {
    const samples = randomInt(10, 18);
    const selectedTownships = randomPicks(townshipCodes, Math.ceil(samples / 2));
    const selectedIndustries = randomPicks(Object.values(IndustryTag), Math.ceil(samples / 3));
    for (const twp of selectedTownships) {
      for (const ind of selectedIndustries) {
        if (Math.random() > 0.35) continue;
        const cohortSize = randomInt(8, 120);
        const months = [
          { month: 1, remaining: Math.floor(cohortSize * randomFloat(0.78, 0.95)) },
          { month: 3, remaining: Math.floor(cohortSize * randomFloat(0.65, 0.88)) },
          { month: 6, remaining: Math.floor(cohortSize * randomFloat(0.52, 0.78)) },
          { month: 12, remaining: Math.floor(cohortSize * randomFloat(0.42, 0.68)) }
        ];
        retentionAnalyses.push({
          id: `ret_${retIdx++}`,
          cohort: period,
          cohortSize,
          channel: randomPick(['主动投递', '企业邀请', 'AI推荐', 'RPO推荐', '校招']),
          positionType: randomPick(Object.values(JobSeekerType)),
          township: twp,
          months,
          industry: ind,
          onboardCount: cohortSize,
          retention30d: parseFloat(randomFloat(78, 95, 1).toString()),
          retention90d: parseFloat(randomFloat(65, 88, 1).toString()),
          retention180d: parseFloat(randomFloat(52, 78, 1).toString()),
          retention365d: parseFloat(randomFloat(42, 68, 1).toString()),
          turnoverRate: parseFloat(randomFloat(8, 28, 1).toString()),
          avgTenure: parseFloat(randomFloat(8, 32, 1).toString())
        } as RetentionAnalysis);
      }
    }
  }

  const campusSessions: CampusSession[] = [];
  const schools = ['广东工业大学', '华南理工大学', '广州大学', '佛山科学技术学院', '五邑大学', '广东技术师范大学', '东莞理工学院', '肇庆学院', '惠州学院', '韶关学院', '嘉应学院', '韩山师范学院'];
  let csIdx = 1;
  for (let i = 1; i <= 8; i++) {
    const school = schools[i - 1];
    const selectedEnterprises = randomPicks(enterprises, randomInt(15, 35));
    const start = new Date(2024, randomInt(8, 10), randomInt(1, 28));
    const end = new Date(start.getTime() + randomInt(30, 90) * 24 * 60 * 60 * 1000);
    const participantCount = randomInt(200, 1200);
    const hireTarget = Math.floor(participantCount * randomFloat(0.05, 0.15));
    const industries = randomPicks(Object.values(IndustryTag), randomInt(3, 6));
    const samplePosition = positions.find(p => p.enterpriseId === selectedEnterprises[0]?.id);
    const writtenExam: WrittenExam | undefined = Math.random() > 0.3 ? {
      id: `we_${csIdx}`,
      positionId: samplePosition?.id || 'pos_1',
      campusSessionId: `cs_${csIdx}`,
      title: `${school}综合能力笔试`,
      duration: 90,
      totalScore: 100,
      passScore: 60,
      questions: Array.from({ length: 25 }, (_, qi) => {
        const qTypes: ExamQuestion['type'][] = ['单选', '多选', '判断', '简答'];
        const qType = weightedPick(qTypes.map((t, idx) => ({ value: t, weight: [10, 5, 6, 4][idx] })));
        return {
          id: `eq_${csIdx}_${qi}`,
          type: qType,
          content: `${randomPick(['逻辑推理', '数量关系', '行业常识', '专业基础', '综合分析', '英语能力'])}题${qi + 1}`,
          options: qType !== '简答' && qType !== '判断' ? ['A. 选项一', 'B. 选项二', 'C. 选项三', 'D. 选项四'] : undefined,
          answer: qType === '判断' ? (Math.random() > 0.5 ? '正确' : '错误') : qType === '简答' ? '参考答案要点...' : randomPick(['A', 'B', 'C', 'D']),
          score: qType === '简答' ? 10 : qType === '多选' ? 4 : 3,
          category: randomPick(['综合能力', '专业知识', '英语', '逻辑'])
        } as ExamQuestion;
      }),
      startTime: start.toISOString(),
      endTime: end.toISOString()
    } as WrittenExam : undefined;
    const aiInterview: AIInterview | undefined = Math.random() > 0.4 ? {
      id: `ai_${csIdx}`,
      positionId: samplePosition?.id || 'pos_1',
      campusSessionId: `cs_${csIdx}`,
      title: `${school}AI面试评估`,
      duration: 15,
      durationPerQuestion: 120,
      aiWeights: { expression: 0.3, speech: 0.3, semantics: 0.4 },
      questions: [
        { id: `aiq_${csIdx}_1`, question: '请用1-2分钟做一个自我介绍，包括你的专业背景和实习经历', expectedKeywords: ['专业', '实习', '背景', '技能'], answerDuration: 90, thinkTime: 30, type: '自我介绍' },
        { id: `aiq_${csIdx}_2`, question: '请谈谈你对本专业领域发展趋势的理解', expectedKeywords: ['发展', '趋势', '技术', '创新'], answerDuration: 120, thinkTime: 30, type: '专业能力' },
        { id: `aiq_${csIdx}_3`, question: '请分享一次你克服困难完成任务的经历', expectedKeywords: ['困难', '解决', '团队', '坚持'], answerDuration: 120, thinkTime: 30, type: '综合素质' },
        { id: `aiq_${csIdx}_4`, question: '如果领导安排的任务与你个人规划冲突，你会如何处理？', expectedKeywords: ['沟通', '协调', '优先级', '解决'], answerDuration: 90, thinkTime: 30, type: '情景模拟' }
      ] as AIQuestion[],
      scoreReports: [
        { id: `aisr_${csIdx}_1`, interviewId: `ai_${csIdx}`, candidateId: `js_${csIdx}`, overallScore: randomFloat(65, 95, 1), dimensions: { expression: randomFloat(60, 95), speech: randomFloat(60, 95), semantics: randomFloat(60, 95) }, keywordHitRate: randomFloat(0.5, 0.9), feedback: '表达清晰流畅，逻辑层次分明', overallComment: '表现良好', conductedAt: randomDate(start, end) },
        { id: `aisr_${csIdx}_2`, interviewId: `ai_${csIdx}`, candidateId: `js_${csIdx + 1}`, overallScore: randomFloat(60, 92, 1), dimensions: { expression: randomFloat(60, 95), speech: randomFloat(60, 95), semantics: randomFloat(60, 95) }, keywordHitRate: randomFloat(0.5, 0.9), feedback: '具备扎实的专业基础', overallComment: '表现良好', conductedAt: randomDate(start, end) },
        { id: `aisr_${csIdx}_3`, interviewId: `ai_${csIdx}`, candidateId: `js_${csIdx + 2}`, overallScore: randomFloat(58, 90, 1), dimensions: { expression: randomFloat(60, 95), speech: randomFloat(60, 95), semantics: randomFloat(60, 95) }, keywordHitRate: randomFloat(0.5, 0.9), feedback: '反应敏捷，思路清晰', overallComment: '表现良好', conductedAt: randomDate(start, end) },
        { id: `aisr_${csIdx}_4`, interviewId: `ai_${csIdx}`, candidateId: `js_${csIdx + 3}`, overallScore: randomFloat(62, 93, 1), dimensions: { expression: randomFloat(60, 95), speech: randomFloat(60, 95), semantics: randomFloat(60, 95) }, keywordHitRate: randomFloat(0.5, 0.9), feedback: '职业定位明确，与岗位匹配度高', overallComment: '表现良好', conductedAt: randomDate(start, end) }
      ] as AIScoreReport[],
      overallScore: randomFloat(65, 92, 1),
      overallComment: '综合表现良好，具备较强的发展潜力',
      conductedAt: randomDate(start, end)
    } as AIInterview : undefined;
    campusSessions.push({
      id: `cs_${csIdx}`,
      code: `CAMPUS${2024}${csIdx.toString().padStart(3, '0')}`,
      name: `中山市${school}2025届校园招聘会`,
      university: school,
      school,
      enterpriseIds: selectedEnterprises.map(e => e.id),
      positionIds: positions.slice(0, randomInt(10, 30)).map(p => p.id),
      date: start.toISOString().slice(0, 10),
      format: randomPick(['线上', '线下', '混合']),
      venue: `${randomPick(TOWNSHIPS).name}国际会展中心${randomInt(1, 5)}号馆`,
      capacity: randomInt(500, 2000),
      registered: participantCount,
      industry: industries as any,
      township: randomPick(townshipCodes),
      location: `${randomPick(TOWNSHIPS).name}国际会展中心${randomInt(1, 5)}号馆`,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      status: randomPick(['筹备中', '进行中', '已结束']),
      writtenExam,
      aiInterview,
      participantCount,
      hireTarget,
      hiredCount: Math.floor(hireTarget * randomFloat(0.3, 0.9)),
      description: `汇聚${selectedEnterprises.length}家中山优质企业，提供${randomInt(50, 200)}个${industries.slice(0, 3).join('/')}相关岗位，面向2025届毕业生。`,
      createdAt: randomDate(new Date(2024, 5, 1), start)
    } as CampusSession);
    csIdx++;
  }

  const educationCourses: EducationCourse[] = [];
  const courseProviders = ['中山职业技术学院', '中山火炬职业技术学院', '中山市技师学院', '电子科技大学中山学院继续教育', '中山市开放大学', '广东理工职业学院中山校区'];
  const courseNames = [
    { name: '机电一体化技术大专班', category: '学历提升', level: '大专' as const, major: '机电一体化', targetDegree: '大专' },
    { name: '数控技术中专班', category: '学历提升', level: '中专' as const, major: '数控技术', targetDegree: '中专' },
    { name: '工商管理专升本', category: '学历提升', level: '本科' as const, major: '工商管理', targetDegree: '本科' },
    { name: '电子商务大专班', category: '学历提升', level: '大专' as const, major: '电子商务', targetDegree: '大专' },
    { name: '工业机器人操作与编程', category: '职业技能', level: '大专' as const, major: '工业机器人', targetDegree: '职业资格' },
    { name: 'CNC精密加工高级班', category: '职业技能', level: '中专' as const, major: 'CNC加工', targetDegree: '职业资格' },
    { name: 'PLC自动化控制工程师', category: '职业技能', level: '大专' as const, major: '自动化控制', targetDegree: '职业资格' },
    { name: '工业设计师资格证', category: '职业资格', level: '大专' as const, major: '工业设计', targetDegree: '职业资格' },
    { name: '模具设计师职业资格', category: '职业资格', level: '大专' as const, major: '模具设计', targetDegree: '职业资格' },
    { name: '焊工高级技能班', category: '职业技能', level: '中专' as const, major: '焊接技术', targetDegree: '职业资格' },
    { name: '电工技师资格培训', category: '职业资格', level: '中专' as const, major: '电工技术', targetDegree: '职业资格' },
    { name: '人力资源管理师二级', category: '职业资格', level: '本科' as const, major: '人力资源', targetDegree: '职业资格' }
  ];
  for (let i = 0; i < courseNames.length; i++) {
    const cn = courseNames[i];
    const duration = cn.category === '学历提升' ? (cn.level === '本科' ? 48 : cn.level === '大专' ? 36 : 24) : randomInt(4, 12);
    const start = new Date(2024, randomInt(6, 11), randomInt(1, 28));
    const end = new Date(start.getTime() + duration * 30 * 24 * 60 * 60 * 1000);
    const maxStudents = cn.category === '学历提升' ? randomInt(60, 150) : randomInt(25, 50);
    const enrollmentCount = Math.floor(maxStudents * randomFloat(0.55, 0.98));
    const creditBankRecords = Array.from({ length: randomInt(5, 15) }, (_, ri) => ({
      id: `cbr_${i}_${ri}`,
      jobSeekerId: `js_${randomInt(1, 500)}`,
      courseId: `ec_${i + 1}`,
      credits: randomInt(2, 8),
      earnedAt: randomDate(start, end),
      status: randomPick(['已获得', '已获得', '待审核'])
    }));
    const township = randomPick(townshipCodes);
    const townshipName = TOWNSHIPS.find(t => t.code === township)!.name;
    const courseType = cn.category === '学历提升' ? (cn.level === '本科' ? CourseType.ADULT_EDU : CourseType.SELF_STUDY) : CourseType.VOCATIONAL_QUAL;
    educationCourses.push({
      id: `ec_${i + 1}`,
      code: `EDU${2024}${(i + 1).toString().padStart(3, '0')}`,
      title: cn.name,
      provider: randomPick(courseProviders),
      type: courseType,
      targetDegree: cn.targetDegree,
      major: cn.major,
      duration: String(duration),
      price: cn.category === '学历提升' ? randomInt(6000, 28000) : randomInt(1500, 8800),
      creditBankEligible: Math.random() > 0.3,
      enrollmentLink: `https://zs-edu.example.com/course/ec_${i + 1}`,
      tags: [cn.category, cn.major, cn.level],
      totalCredits: cn.category === '学历提升' ? (cn.level === '本科' ? 140 : cn.level === '大专' ? 110 : 90) : randomInt(15, 60),
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      township,
      location: `${townshipName}${randomPick(['职业培训中心', '成人教育中心', '技能鉴定中心', '继续教育学院', '人才服务中心'])}`,
      description: `${cn.name}培训课程，涵盖理论学习和实操训练，考核合格颁发相应证书。适合在职人员提升学历和技能水平。`,
      enrollmentCount,
      maxStudents,
      status: start > new Date() ? '招生中' : end < new Date() ? '已结束' : randomPick(['招生中', '已开班']),
      creditBankRecords,
      createdAt: randomDate(new Date(2024, 3, 1), start)
    } as EducationCourse);
  }

  const jobsWithMatch: JobWithMatch[] = [];
  const sampleJobSeeker = jobSeekers[0];
  const sampleResume = resumes.find(r => r.jobSeekerId === sampleJobSeeker.id) || resumes[0];
  for (const pos of positions) {
    jobsWithMatch.push(createJobWithMatch(pos, sampleJobSeeker, sampleResume));
  }

  return {
    enterprises,
    positions,
    jobSeekers,
    resumes,
    rpoProjects,
    applications,
    channelROIs,
    subsidyApplications,
    matchResults,
    funnelMetrics,
    retentionAnalyses,
    campusSessions,
    educationCourses,
    jobsWithMatch,
  };
};

export const mockData = generateMockData();

export const datasetSummary = {
  enterprises: mockData.enterprises.length,
  positions: mockData.positions.length,
  jobSeekers: mockData.jobSeekers.length,
  resumes: mockData.resumes.length,
  rpoProjects: mockData.rpoProjects.length,
  applications: mockData.applications.length,
  channelROIs: mockData.channelROIs.length,
  subsidyApplications: mockData.subsidyApplications.length,
  matchResults: mockData.matchResults.length,
  funnelMetrics: mockData.funnelMetrics.length,
  retentionAnalyses: mockData.retentionAnalyses.length,
  campusSessions: mockData.campusSessions.length,
  educationCourses: mockData.educationCourses.length,
  jobsWithMatch: mockData.jobsWithMatch.length,
};

export default mockData;
