import { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Award,
  Play,
  Clock,
  Users,
  Star,
  ChevronRight,
  Search,
  Plus,
  FileQuestion,
  CheckCircle,
  ChevronLeft,
  Trophy,
  Calendar,
  BarChart3,
  Download,
  FolderOpen,
  FileArchive,
  RotateCcw,
  QrCode,
  Share2,
  TrendingUp,
  Target,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  BookMarked,
  FileCheck,
  Eye,
  Send,
  Clock3,
  CircleDot,
  Circle,
  Pause,
  AlignJustify,
  FileText,
} from 'lucide-react';
import { courses, exams, trainingRecords } from '../data/mockData';

type LearningStatus = 'not_started' | 'learning' | 'exam' | 'completed';
type ExamStatus = 'pending' | 'in_progress' | 'submitted' | 'grading' | 'passed' | 'failed';
type CertStatus = 'applied' | 'reviewing' | 'making' | 'issued' | 'received';
type HoursSource = 'watch' | 'exam' | 'offline' | 'live';

const learningStatusConfig: Record<LearningStatus, { label: string; bg: string; text: string }> = {
  not_started: { label: '未开始', bg: 'bg-slate-100', text: 'text-slate-600' },
  learning: { label: '学习中', bg: 'bg-blue-100', text: 'text-blue-700' },
  exam: { label: '课程考核', bg: 'bg-orange-100', text: 'text-orange-700' },
  completed: { label: '已完成', bg: 'bg-green-100', text: 'text-green-700' },
};

const examStatusConfig: Record<ExamStatus, { label: string; bg: string; text: string }> = {
  pending: { label: '待开始', bg: 'bg-slate-100', text: 'text-slate-600' },
  in_progress: { label: '进行中', bg: 'bg-blue-100', text: 'text-blue-700' },
  submitted: { label: '已提交', bg: 'bg-cyan-100', text: 'text-cyan-700' },
  grading: { label: '待批阅', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  passed: { label: '已通过', bg: 'bg-green-100', text: 'text-green-700' },
  failed: { label: '未通过', bg: 'bg-red-100', text: 'text-red-700' },
};

const certStatusConfig: Record<CertStatus, { label: string; bg: string; text: string }> = {
  applied: { label: '已申请', bg: 'bg-slate-100', text: 'text-slate-600' },
  reviewing: { label: '资料审核', bg: 'bg-blue-100', text: 'text-blue-700' },
  making: { label: '证书制作', bg: 'bg-purple-100', text: 'text-purple-700' },
  issued: { label: '已发放', bg: 'bg-green-100', text: 'text-green-700' },
  received: { label: '已领取', bg: 'bg-teal-100', text: 'text-teal-700' },
};

const hoursSourceConfig: Record<HoursSource, { label: string; icon: any; color: string }> = {
  watch: { label: '观看课程', icon: Play, color: 'text-blue-500' },
  exam: { label: '通过考试', icon: FileCheck, color: 'text-green-500' },
  offline: { label: '线下培训', icon: Users, color: 'text-orange-500' },
  live: { label: '直播研讨', icon: CircleDot, color: 'text-purple-500' },
};

const courseLearningMap: Record<string, { status: LearningStatus; progress: number; studiedHours: number }> = {
  '1': { status: 'completed', progress: 100, studiedHours: 8 },
  '2': { status: 'learning', progress: 65, studiedHours: 4 },
  '3': { status: 'exam', progress: 100, studiedHours: 5 },
  '4': { status: 'not_started', progress: 0, studiedHours: 0 },
};

const myExamList = [
  { examId: '1', myScore: 92, usedTime: 75, status: 'passed' as ExamStatus, wrongCount: 3 },
  { examId: '2', myScore: 58, usedTime: 110, status: 'failed' as ExamStatus, wrongCount: 12 },
  { examId: '3', myScore: undefined, usedTime: 0, status: 'pending' as ExamStatus, wrongCount: 0 },
  { examId: '4', myScore: undefined, usedTime: 35, status: 'in_progress' as ExamStatus, wrongCount: 0 },
  { examId: '5', myScore: undefined, usedTime: 0, status: 'grading' as ExamStatus, wrongCount: 0 },
  { examId: '6', myScore: 85, usedTime: 68, status: 'passed' as ExamStatus, wrongCount: 5 },
];

const extraExams = [
  { id: '4', title: '舆情分析实操考核', courseId: undefined, courseTitle: '舆情监测与应对', duration: 90, totalScore: 100, passScore: 60, questionCount: 45, startDate: '2026-06-15', endDate: '2026-07-15' },
  { id: '5', title: '内容安全规范考试', courseId: undefined, courseTitle: '内容安全与审核', duration: 45, totalScore: 100, passScore: 80, questionCount: 30, startDate: '2026-06-10', endDate: '2026-06-25' },
  { id: '6', title: '摄影技术基础测试', courseId: undefined, courseTitle: '新闻摄影入门', duration: 60, totalScore: 100, passScore: 60, questionCount: 35, startDate: '2026-06-20', endDate: '2026-07-20' },
];

const hoursRecords = [
  { date: '2026-06-18', courseName: '短视频拍摄与剪辑实战', hours: 1.5, source: 'watch' as HoursSource },
  { date: '2026-06-17', courseName: '新闻业务基础考试通过', hours: 2, source: 'exam' as HoursSource },
  { date: '2026-06-16', courseName: '新媒体运营与推广', hours: 2, source: 'watch' as HoursSource },
  { date: '2026-06-15', courseName: '新闻摄影线下实训', hours: 4, source: 'offline' as HoursSource },
  { date: '2026-06-14', courseName: '内容安全直播研讨', hours: 2, source: 'live' as HoursSource },
  { date: '2026-06-12', courseName: '短视频拍摄与剪辑实战', hours: 1, source: 'watch' as HoursSource },
  { date: '2026-06-10', courseName: '舆情分析实操考核通过', hours: 1.5, source: 'exam' as HoursSource },
  { date: '2026-06-08', courseName: '新媒体运营与推广', hours: 2, source: 'watch' as HoursSource },
  { date: '2026-05-28', courseName: '新闻采访与写作基础', hours: 3, source: 'watch' as HoursSource },
  { date: '2026-05-25', courseName: '新闻业务基础考试通过', hours: 2, source: 'exam' as HoursSource },
  { date: '2026-05-20', courseName: '采编流程线下培训', hours: 6, source: 'offline' as HoursSource },
  { date: '2026-05-15', courseName: '新媒体直播研讨会', hours: 3, source: 'live' as HoursSource },
];

const monthlyStats = [
  { month: '2026年6月', total: 16, target: 20 },
  { month: '2026年5月', total: 18, target: 20 },
  { month: '2026年4月', total: 22, target: 20 },
  { month: '2026年3月', total: 15, target: 20 },
  { month: '2026年2月', total: 12, target: 15 },
  { month: '2026年1月', total: 6, target: 15 },
];

const certificates = [
  {
    id: 'c1',
    title: '新闻业务培训证书',
    course: '新闻采访与写作基础',
    applyDate: '2026-05-18',
    issueDate: '2026-05-20',
    expireDate: '2029-05-20',
    score: 92,
    holder: '张编辑',
    status: 'received' as CertStatus,
    certNo: 'CPRM-2026-001256',
  },
  {
    id: 'c2',
    title: '新媒体运营资格证书',
    course: '新媒体运营与推广',
    applyDate: '2026-06-05',
    issueDate: '2026-06-12',
    expireDate: '2029-06-12',
    score: 85,
    holder: '张编辑',
    status: 'issued' as CertStatus,
    certNo: 'CPRM-2026-001289',
  },
  {
    id: 'c3',
    title: '短视频创作证书',
    course: '短视频拍摄与剪辑实战',
    applyDate: '2026-06-15',
    issueDate: undefined,
    expireDate: undefined,
    score: undefined,
    holder: '张编辑',
    status: 'making' as CertStatus,
    certNo: 'CPRM-2026-001320',
  },
  {
    id: 'c4',
    title: '舆情分析专业证书',
    course: '舆情监测与应对',
    applyDate: '2026-06-18',
    issueDate: undefined,
    expireDate: undefined,
    score: undefined,
    holder: '张编辑',
    status: 'reviewing' as CertStatus,
    certNo: 'CPRM-2026-001356',
  },
  {
    id: 'c5',
    title: '内容安全合规证书',
    course: '内容安全与审核',
    applyDate: '2026-06-19',
    issueDate: undefined,
    expireDate: undefined,
    score: undefined,
    holder: '张编辑',
    status: 'applied' as CertStatus,
    certNo: 'CPRM-2026-001378',
  },
];

export default function Training() {
  const [activeTab, setActiveTab] = useState<'courses' | 'exams' | 'records' | 'certificates'>('courses');

  const dashboardStats = [
    { label: '在学课程数', value: '3', icon: BookMarked, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: '已完成课程数', value: '8', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: '累计学时', value: '89', icon: Clock3, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: '本月学习时长', value: '16h', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl p-1 inline-flex">
        {[
          { id: 'courses', label: '课程管理', icon: BookOpen },
          { id: 'exams', label: '在线考试', icon: FileQuestion },
          { id: 'records', label: '学时统计', icon: BarChart3 },
          { id: 'certificates', label: '证书管理', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                isActive ? 'bg-primary-500 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'courses' && <CourseList />}
      {activeTab === 'exams' && <ExamList />}
      {activeTab === 'records' && <TrainingRecordsList />}
      {activeTab === 'certificates' && <CertificateList />}
    </div>
  );
}

function CourseList() {
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const categories = ['all', '新闻业务', '新媒体', '舆情', '管理'];

  const filteredCourses = courses.filter((course) => {
    const matchSearch = course.title.includes(searchText) || course.instructor.includes(searchText);
    const matchCategory = filterCategory === 'all' || course.category === filterCategory;
    return matchSearch && matchCategory;
  });

  if (selectedCourse) {
    return <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索课程..."
              className="pl-10 pr-4 py-2 w-64 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  filterCategory === cat
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {cat === 'all' ? '全部' : cat}
              </button>
            ))}
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          <Plus className="w-4 h-4" />
          发布课程
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => {
          const learning = courseLearningMap[course.id] || { status: 'not_started' as LearningStatus, progress: 0, studiedHours: 0 };
          const statusInfo = learningStatusConfig[learning.status];
          const totalHours = Math.floor(course.duration / 60);
          return (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative">
                <img src={course.cover} alt="" className="w-full h-40 object-cover" />
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur rounded text-xs font-medium text-slate-700">
                    {course.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 mb-2 line-clamp-1">{course.title}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    {course.instructor}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {totalHours}学时
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">学习进度</span>
                    <span className="text-xs font-medium text-primary-600">{learning.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        learning.status === 'completed'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : learning.status === 'exam'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                          : 'bg-gradient-to-r from-primary-500 to-blue-500'
                      }`}
                      style={{ width: `${learning.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5">
                    已学 {learning.studiedHours} / {totalHours} 学时
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-slate-700">{course.rating}</span>
                    <span className="text-xs text-slate-400 ml-1">({course.students}人)</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {learning.status === 'not_started' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCourse(course);
                      }}
                      className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <Play className="w-4 h-4" />
                      开始学习
                    </button>
                  )}
                  {learning.status === 'learning' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCourse(course);
                      }}
                      className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <Play className="w-4 h-4" />
                      继续学习
                    </button>
                  )}
                  {learning.status === 'exam' && (
                    <button className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-1">
                      <FileQuestion className="w-4 h-4" />
                      参加考核
                    </button>
                  )}
                  {learning.status === 'completed' && (
                    <button className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-1">
                      <Award className="w-4 h-4" />
                      查看证书
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCourse(course);
                    }}
                    className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                  >
                    <FileArchive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CourseDetail({ course, onBack }: { course: any; onBack: () => void }) {
  const [activeChapter, setActiveChapter] = useState(0);
  const learning = courseLearningMap[course.id] || { status: 'not_started' as LearningStatus, progress: 0, studiedHours: 0 };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-slate-600 text-sm flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" />
        返回课程列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <img src={course.cover} alt="" className="w-full h-64 object-cover" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-1 bg-primary-50 text-primary-600 rounded text-xs font-medium">
                  {course.category}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${learningStatusConfig[learning.status].bg} ${learningStatusConfig[learning.status].text}`}>
                  {learningStatusConfig[learning.status].label}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-3">{course.title}</h1>
              <p className="text-slate-600 mb-4">{course.description}</p>
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  讲师：{course.instructor}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  共 {course.chapters.length} 章节 / {Math.floor(course.duration / 60)} 课时
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.students} 名学员
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  {course.rating} 分
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4">课程章节</h3>
            <div className="space-y-2">
              {course.chapters.map((chapter: any, index: number) => {
                const isCompleted = index < Math.floor((course.chapters.length * learning.progress) / 100);
                return (
                  <div
                    key={chapter.id}
                    onClick={() => setActiveChapter(index)}
                    className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors ${
                      activeChapter === index
                        ? 'bg-primary-50 border border-primary-200'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <span className={activeChapter === index ? 'text-primary-600' : 'text-slate-400'}>
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800 text-sm">{chapter.title}</div>
                      <div className="text-xs text-slate-500">{chapter.duration} 分钟</div>
                    </div>
                    {index === activeChapter ? (
                      <Play className="w-5 h-5 text-primary-500" />
                    ) : isCompleted ? (
                      <span className="text-xs text-green-600">已学习</span>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">我的学习进度</h3>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">完成进度</span>
                <span className="text-sm font-medium text-primary-600">{learning.progress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-blue-500 rounded-full"
                  style={{ width: `${learning.progress}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-500">
              已学习 {learning.studiedHours} / {Math.floor(course.duration / 60)} 课时
            </div>
            {learning.status !== 'completed' && (
              <button className="w-full mt-4 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                {learning.status === 'exam' ? '参加课程考核' : '继续学习'}
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">相关考试</h3>
            <div className="space-y-3">
              {exams
                .filter((e) => e.courseId === course.id)
                .map((exam: any) => (
                  <div key={exam.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="font-medium text-slate-700 text-sm">{exam.title}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{exam.questionCount}道题</span>
                      <span>{exam.duration}分钟</span>
                      <span>{exam.totalScore}分</span>
                    </div>
                    <button className="w-full mt-3 py-1.5 border border-primary-500 text-primary-500 rounded text-xs font-medium hover:bg-primary-50 transition-colors">
                      开始考试
                    </button>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">课程资料</h3>
            <div className="space-y-2">
              {['课程讲义.pdf', '参考资料.docx', '课后习题.zip'].map((name, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{name}</span>
                  </div>
                  <Download className="w-4 h-4 text-primary-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamList() {
  const allExams = [...exams, ...extraExams];
  const passedCount = myExamList.filter(e => e.status === 'passed').length;
  const pendingCount = myExamList.filter(e => ['pending', 'in_progress', 'submitted', 'grading'].includes(e.status)).length;
  const avgScore = myExamList
    .filter(e => e.myScore !== undefined)
    .reduce((sum, e) => sum + (e.myScore || 0), 0) / myExamList.filter(e => e.myScore !== undefined).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">6</div>
              <div className="text-xs text-slate-500">本月考试</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{passedCount}</div>
              <div className="text-xs text-slate-500">通过数</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock3 className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{pendingCount}</div>
              <div className="text-xs text-slate-500">待考/待批</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{avgScore.toFixed(1)}</div>
              <div className="text-xs text-slate-500">平均分</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['全部', '待开始', '进行中', '已完成'].map((tab, index) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-lg text-sm ${
                index === 0
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          <Plus className="w-4 h-4" />
          创建考试
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allExams.map((exam: any, idx) => {
          const myExam = myExamList[idx % myExamList.length];
          const statusInfo = examStatusConfig[myExam.status];
          const courseTitle = exam.courseId
            ? courses.find(c => c.id === exam.courseId)?.title || exam.courseTitle
            : exam.courseTitle || '综合考试';
          return (
            <div key={exam.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                  {statusInfo.label}
                </span>
                {exam.startDate && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {exam.startDate}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-slate-800 mb-1 line-clamp-1">{exam.title}</h3>
              <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {courseTitle}
              </p>

              <div className="space-y-2 text-sm text-slate-500 mb-4">
                <div className="flex justify-between">
                  <span>总分 / 及格分</span>
                  <span className="text-slate-700">
                    {exam.totalScore} / {exam.passScore} 分
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>题目数量</span>
                  <span className="text-slate-700">{exam.questionCount} 道</span>
                </div>
                <div className="flex justify-between">
                  <span>考试时长</span>
                  <span className="text-slate-700">{exam.duration} 分钟</span>
                </div>
                {myExam.myScore !== undefined && (
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span>我的得分</span>
                    <span className={`font-bold ${
                      myExam.myScore >= exam.passScore ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {myExam.myScore} 分
                    </span>
                  </div>
                )}
                {myExam.usedTime > 0 && (
                  <div className="flex justify-between">
                    <span>用时</span>
                    <span className="text-slate-700">{myExam.usedTime} 分钟</span>
                  </div>
                )}
                {myExam.status === 'failed' && (
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1 text-red-500">
                      <XCircle className="w-3.5 h-3.5" />
                      错题数
                    </span>
                    <span className="font-medium text-red-600">{myExam.wrongCount} 道</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {myExam.status === 'pending' && (
                  <button className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors">
                    开始考试
                  </button>
                )}
                {myExam.status === 'in_progress' && (
                  <button className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors flex items-center justify-center gap-1">
                    <Pause className="w-4 h-4" />
                    继续答题
                  </button>
                )}
                {myExam.status === 'grading' && (
                  <button className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                    等待批阅中...
                  </button>
                )}
                {myExam.status === 'passed' && (
                  <button className="flex-1 py-2 border border-green-200 text-green-600 rounded-lg text-sm hover:bg-green-50 transition-colors flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    查看成绩单
                  </button>
                )}
                {myExam.status === 'failed' && (
                  <>
                    <button className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                      <Eye className="w-4 h-4" />
                      查看错题
                    </button>
                    <button className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-1">
                      <RotateCcw className="w-4 h-4" />
                      申请重考
                    </button>
                  </>
                )}
                {myExam.status === 'submitted' && (
                  <button className="flex-1 py-2 border border-cyan-200 text-cyan-600 rounded-lg text-sm hover:bg-cyan-50 transition-colors">
                    已提交，等待批阅
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrainingRecordsList() {
  const yearlyHours = 89;
  const yearlyTarget = 120;
  const yearlyRate = ((yearlyHours / yearlyTarget) * 100).toFixed(1);

  const groupByMonth = (records: typeof hoursRecords) => {
    const groups: Record<string, typeof hoursRecords> = {};
    records.forEach(r => {
      const month = r.date.substring(0, 7);
      if (!groups[month]) groups[month] = [];
      groups[month].push(r);
    });
    return groups;
  };

  const grouped = groupByMonth(hoursRecords);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg text-slate-800">2026年度学习目标</h3>
            <p className="text-sm text-slate-500 mt-0.5">年度累计学时完成情况</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary-600">{yearlyRate}%</div>
            <div className="text-sm text-slate-500">完成率</div>
          </div>
        </div>
        <div className="h-4 bg-slate-200 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-primary-500 via-blue-500 to-cyan-500 rounded-full transition-all"
            style={{ width: `${yearlyRate}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Target className="w-4 h-4 text-primary-500" />
            目标：<span className="font-medium text-slate-800">{yearlyTarget} 学时</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            已完成：<span className="font-bold text-green-600">{yearlyHours} 学时</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Clock3 className="w-4 h-4 text-orange-500" />
            剩余：<span className="font-medium text-orange-600">{yearlyTarget - yearlyHours} 学时</span>
          </div>
        </div>
      </div>

      {monthlyStats.map((stat) => {
        const rate = ((stat.total / stat.target) * 100).toFixed(0);
        const monthKey = stat.month.replace('年', '-').replace('月', '');
        const monthRecords = grouped[monthKey] || [];
        return (
          <div key={stat.month} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <h4 className="font-semibold text-slate-800">{stat.month}</h4>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">
                    目标：<span className="font-medium text-slate-700">{stat.target}学时</span>
                  </span>
                  <span className="text-slate-500">
                    已获得：<span className={`font-bold ${parseInt(rate) >= 100 ? 'text-green-600' : 'text-primary-600'}`}>{stat.total}学时</span>
                  </span>
                  <span className={`font-medium ${parseInt(rate) >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                    {rate}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${parseInt(rate) >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-primary-500 to-blue-500'}`}
                  style={{ width: `${Math.min(parseInt(rate), 100)}%` }}
                ></div>
              </div>
            </div>

            {monthRecords.length > 0 && (
              <div className="divide-y divide-slate-100">
                {monthRecords.map((record, idx) => {
                  const sourceInfo = hoursSourceConfig[record.source];
                  const SourceIcon = sourceInfo.icon;
                  return (
                    <div key={idx} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                      <div className="text-sm text-slate-500 w-24 shrink-0">{record.date}</div>
                      <div className={`w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0`}>
                        <SourceIcon className={`w-4.5 h-4.5 ${sourceInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">{record.courseName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className={sourceInfo.color}>{sourceInfo.label}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-lg font-bold ${sourceInfo.color}`}>+{record.hours}</div>
                        <div className="text-xs text-slate-400">学时</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CertificateList() {
  const certSteps: CertStatus[] = ['applied', 'reviewing', 'making', 'issued', 'received'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((cert) => {
          const statusInfo = certStatusConfig[cert.status];
          const currentStepIdx = certSteps.indexOf(cert.status);
          return (
            <div key={cert.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className={`h-2 ${
                cert.status === 'received' ? 'bg-gradient-to-r from-teal-500 to-cyan-500' :
                cert.status === 'issued' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                cert.status === 'making' ? 'bg-gradient-to-r from-purple-500 to-violet-500' :
                cert.status === 'reviewing' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                'bg-gradient-to-r from-slate-400 to-slate-500'
              }`}></div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    cert.status === 'received' || cert.status === 'issued' ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-slate-100'
                  }`}>
                    <Trophy className={`w-6 h-6 ${
                      cert.status === 'received' || cert.status === 'issued' ? 'text-white' : 'text-slate-400'
                    }`} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className={`rounded-lg p-4 mb-4 border-2 border-dashed ${
                  cert.status === 'received' || cert.status === 'issued'
                    ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'
                    : 'border-slate-200 bg-slate-50'
                }`}>
                  {cert.status === 'received' || cert.status === 'issued' ? (
                    <div className="text-center py-2">
                      <div className="text-xs text-slate-500 mb-2">证书预览</div>
                      <div className="text-sm font-bold text-slate-800 mb-1">{cert.title}</div>
                      <div className="text-xs text-slate-600 mb-3">{cert.holder}</div>
                      {cert.score !== undefined && (
                        <div className="inline-block px-3 py-1 bg-white/80 rounded-full text-xs">
                          成绩 <span className="font-bold text-amber-600">{cert.score}</span> 分
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <div className="text-xs">证书制作中...</div>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-slate-800 mb-1">{cert.title}</h3>
                <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {cert.course}
                </p>

                <div className="space-y-2 text-xs text-slate-500 mb-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between">
                    <span>证书编号</span>
                    <span className="text-slate-700 font-mono">{cert.certNo}</span>
                  </div>
                  {cert.issueDate && (
                    <div className="flex justify-between">
                      <span>颁发日期</span>
                      <span className="text-slate-700">{cert.issueDate}</span>
                    </div>
                  )}
                  {cert.expireDate && (
                    <div className="flex justify-between">
                      <span>有效期至</span>
                      <span className="text-slate-700">{cert.expireDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span>真伪查询</span>
                    <div className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center">
                      <QrCode className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-4">
                  {certSteps.map((step, idx) => {
                    const stepInfo = certStatusConfig[step];
                    const isDone = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <div key={step} className="flex-1 flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isDone
                            ? isCurrent
                              ? 'bg-primary-500 ring-2 ring-primary-200'
                              : 'bg-green-500'
                            : 'bg-slate-200'
                        }`}>
                          {isDone && !isCurrent ? (
                            <CheckCircle className="w-3 h-3 text-white" />
                          ) : isCurrent ? (
                            <CircleDot className="w-3 h-3 text-white" />
                          ) : (
                            <Circle className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                        <span className={`text-[10px] mt-1 ${isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                          {stepInfo.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  {(cert.status === 'issued' || cert.status === 'received') && (
                    <>
                      <button className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-1">
                        <Download className="w-4 h-4" />
                        下载电子版
                      </button>
                      <button className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {cert.status === 'applied' && (
                    <button className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-sm cursor-not-allowed">
                      等待审核...
                    </button>
                  )}
                  {cert.status === 'reviewing' && (
                    <button className="flex-1 py-2 border border-blue-200 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
                      <Eye className="w-4 h-4" />
                      查看审核进度
                    </button>
                  )}
                  {cert.status === 'making' && (
                    <button className="flex-1 py-2 border border-purple-200 text-purple-600 rounded-lg text-sm hover:bg-purple-50 transition-colors flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4" />
                      预计3个工作日
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
