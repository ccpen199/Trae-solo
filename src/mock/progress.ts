import dayjs from 'dayjs';

export interface MyCampusSession {
  id: string;
  name: string;
  school: string;
  date: string;
  time: string;
  venue: string;
  format: '线上' | '线下' | '混合';
  status: '已预约' | '待参加' | '进行中' | '已结束';
}

export interface MyWrittenExam {
  id: string;
  enterprise: string;
  position: string;
  duration: number;
  questionCount: number;
  deadline: string;
  status: '待开始' | '进行中' | '已完成';
}

export interface MyAIInterview {
  id: string;
  enterprise: string;
  position: string;
  questionCount: number;
  durationPerQuestion: number;
  expressionWeight: number;
  speechWeight: number;
  semanticsWeight: number;
  deadline: string;
  status: '待开始' | '进行中' | '已完成';
  appointmentStatus: '待预约' | '已预约' | '已完成';
}

export interface MyFinalInterview {
  id: string;
  enterprise: string;
  position: string;
  interviewer: string;
  date: string;
  time: string;
  type: '线上' | '线下';
  location: string;
  meetingUrl?: string;
  status: '待面试' | '进行中' | '已完成';
}

export interface CampusProgress {
  sessions: MyCampusSession[];
  exams: MyWrittenExam[];
  aiInterviews: MyAIInterview[];
  finalInterviews: MyFinalInterview[];
}

export interface MyCourse {
  id: string;
  title: string;
  provider: string;
  type: '自考' | '成考' | '职业资格';
  progress: number;
  totalCredits: number;
  earnedCredits: number;
  status: '进行中' | '已完成' | '待开始';
  lastStudyTime?: string;
  coverColor: string;
}

export interface CreditRecord {
  id: string;
  source: '自考' | '成考' | '职业资格';
  courseTitle: string;
  credits: number;
  earnedAt: string;
}

export interface CertificationProgress {
  targetDegree: string;
  targetMajor: string;
  progressPercent: number;
  estimatedDate: string;
  timeline: {
    title: string;
    description: string;
    time: string;
    color: string;
    done: boolean;
  }[];
}

export interface EducationProgress {
  courses: MyCourse[];
  creditRecords: CreditRecord[];
  certification: CertificationProgress;
}

export const myCampusSessions: MyCampusSession[] = [
  {
    id: 'my_cs1',
    name: '中山市2025届秋季校园招聘会',
    school: '广东工业大学',
    date: '2024-10-15',
    time: '09:00-17:00',
    venue: '大学城校区体育馆',
    format: '线下',
    status: '待参加',
  },
  {
    id: 'my_cs2',
    name: '中山企业线上宣讲会',
    school: '广州大学',
    date: '2024-10-20',
    time: '19:00-21:00',
    venue: '腾讯会议',
    format: '线上',
    status: '已预约',
  },
];

export const myWrittenExams: MyWrittenExam[] = [
  {
    id: 'my_we1',
    enterprise: '中山市明阳电器有限公司',
    position: '电气工程师',
    duration: 90,
    questionCount: 35,
    deadline: '2024-10-16 18:00',
    status: '待开始',
  },
  {
    id: 'my_we2',
    enterprise: '广东三和管桩股份有限公司',
    position: '结构工程师',
    duration: 120,
    questionCount: 45,
    deadline: '2024-10-15 20:00',
    status: '进行中',
  },
];

export const myAIInterviews: MyAIInterview[] = [
  {
    id: 'my_ai1',
    enterprise: '中山市木林森股份有限公司',
    position: 'LED研发工程师',
    questionCount: 5,
    durationPerQuestion: 120,
    expressionWeight: 25,
    speechWeight: 35,
    semanticsWeight: 40,
    deadline: '2024-10-18 23:59',
    status: '待开始',
    appointmentStatus: '已预约',
  },
];

export const myFinalInterviews: MyFinalInterview[] = [
  {
    id: 'my_fi1',
    enterprise: '中山市格兰仕集团有限公司',
    position: '硬件研发工程师',
    interviewer: '李经理（HR总监）',
    date: '2024-10-16',
    time: '10:00-11:00',
    type: '线上',
    location: '腾讯会议ID: 856-234-901',
    meetingUrl: 'https://meeting.tencent.com/dm/example',
    status: '待面试',
  },
];

export const campusProgress: CampusProgress = {
  sessions: myCampusSessions,
  exams: myWrittenExams,
  aiInterviews: myAIInterviews,
  finalInterviews: myFinalInterviews,
};

export const myCourses: MyCourse[] = [
  {
    id: 'my_c1',
    title: '机电一体化技术大专班 - 电工基础',
    provider: '中山职业技术学院',
    type: '自考',
    progress: 75,
    totalCredits: 4,
    earnedCredits: 3,
    status: '进行中',
    lastStudyTime: '2024-10-10 20:30',
    coverColor: 'from-industrial-blue-500 to-industrial-blue-600',
  },
  {
    id: 'my_c2',
    title: '机电一体化技术大专班 - 机械设计基础',
    provider: '中山职业技术学院',
    type: '自考',
    progress: 50,
    totalCredits: 4,
    earnedCredits: 2,
    status: '进行中',
    lastStudyTime: '2024-10-08 19:00',
    coverColor: 'from-cyan-500 to-cyan-600',
  },
  {
    id: 'my_c3',
    title: '机电一体化技术大专班 - 机械制图',
    provider: '中山职业技术学院',
    type: '自考',
    progress: 100,
    totalCredits: 4,
    earnedCredits: 4,
    status: '已完成',
    lastStudyTime: '2024-06-15 15:00',
    coverColor: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'my_c4',
    title: '工业机器人操作与编程认证',
    provider: '中山市技师学院',
    type: '职业资格',
    progress: 100,
    totalCredits: 6,
    earnedCredits: 6,
    status: '已完成',
    lastStudyTime: '2024-08-20 16:30',
    coverColor: 'from-vital-orange-500 to-vital-orange-600',
  },
];

export const creditRecords: CreditRecord[] = [
  {
    id: 'cr1',
    source: '自考',
    courseTitle: '机械制图',
    credits: 4,
    earnedAt: '2024-06-15',
  },
  {
    id: 'cr2',
    source: '职业资格',
    courseTitle: '工业机器人操作与编程',
    credits: 6,
    earnedAt: '2024-08-20',
  },
  {
    id: 'cr3',
    source: '自考',
    courseTitle: '电工基础（部分）',
    credits: 2,
    earnedAt: '2024-09-10',
  },
];

export const certificationProgress: CertificationProgress = {
  targetDegree: '大专',
  targetMajor: '机电一体化技术',
  progressPercent: 45,
  estimatedDate: '2026年09月',
  timeline: [
    {
      title: '报名注册',
      description: '提交报名材料，完成学籍注册',
      time: '2024-03-01',
      color: '#00B42A',
      done: true,
    },
    {
      title: '课程学习',
      description: '完成规定学分课程学习',
      time: '2024-03-15 ~ 至今',
      color: '#165DFF',
      done: true,
    },
    {
      title: '学分银行对接',
      description: '已修课程学分同步至学分银行',
      time: '进行中',
      color: '#FF7D00',
      done: false,
    },
    {
      title: '毕业审核',
      description: '学分达到要求，提交毕业申请',
      time: '预计 2026-06',
      color: '#C9CDD4',
      done: false,
    },
    {
      title: '学历认证',
      description: '学信网学历认证，颁发毕业证书',
      time: '预计 2026-09',
      color: '#C9CDD4',
      done: false,
    },
  ],
};

export const educationProgress: EducationProgress = {
  courses: myCourses,
  creditRecords,
  certification: certificationProgress,
};

export const getCampusHomeBadge = () => {
  const pendingInterviews = myAIInterviews.filter((i) => i.status === '待开始').length;
  const reservedSessions = myCampusSessions.filter((s) => s.status === '已预约' || s.status === '待参加').length;
  if (pendingInterviews > 0) {
    return {
      text: `${pendingInterviews} 个待面试`,
      tooltip: myAIInterviews.map((i) => `${i.enterprise} - ${i.position}`).join('\n'),
    };
  }
  if (reservedSessions > 0) {
    const latest = myCampusSessions[0];
    return {
      text: `${reservedSessions} 场宣讲预约成功`,
      tooltip: `${latest.name}\n${dayjs(latest.date).format('MM-DD')} ${latest.time}`,
    };
  }
  return null;
};

export const getEducationHomeBadge = () => {
  const learningCourses = myCourses.filter((c) => c.status === '进行中').length;
  const totalCredits = creditRecords.reduce((sum, c) => sum + c.credits, 0);
  if (learningCourses > 0) {
    return {
      text: `${learningCourses} 门学习中`,
      tooltip: myCourses
        .filter((c) => c.status === '进行中')
        .map((c) => `${c.title} (${c.progress}%)`)
        .join('\n'),
    };
  }
  if (totalCredits > 0) {
    return {
      text: `已获 ${totalCredits} 学分`,
      tooltip: `累计获得 ${totalCredits} 学分\n目标：${certificationProgress.targetDegree} ${certificationProgress.targetMajor}`,
    };
  }
  return null;
};

export const countdownText = (deadline: string) => {
  const now = dayjs();
  const end = dayjs(deadline);
  const diffHours = end.diff(now, 'hour');
  if (diffHours < 0) return '已截止';
  if (diffHours < 24) return `剩余 ${diffHours} 小时`;
  return `剩余 ${Math.floor(diffHours / 24)} 天 ${diffHours % 24} 小时`;
};

export const getTotalEarnedCredits = () => {
  return creditRecords.reduce((sum, c) => sum + c.credits, 0);
};

export const getCreditDistribution = () => {
  const distribution: Record<string, number> = {
    自考: 0,
    成考: 0,
    职业资格: 0,
  };
  creditRecords.forEach((r) => {
    distribution[r.source] += r.credits;
  });
  return distribution;
};
