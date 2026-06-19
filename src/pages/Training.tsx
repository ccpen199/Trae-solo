import { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  FileText,
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
} from 'lucide-react';
import { courses, exams, trainingRecords } from '../data/mockData';

export default function Training() {
  const [activeTab, setActiveTab] = useState<'courses' | 'exams' | 'records' | 'certificates'>('courses');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '课程总数', value: '36', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: '考试场次', value: '12', icon: FileQuestion, color: 'text-green-500', bg: 'bg-green-50' },
          { label: '累计学时', value: '1,280', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: '已获证书', value: '89', icon: Award, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((stat, index) => {
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
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedCourse(course)}
          >
            <div className="relative">
              <img src={course.cover} alt="" className="w-full h-40 object-cover" />
              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 bg-white/90 backdrop-blur rounded text-xs font-medium text-slate-700">
                  {course.category}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    course.status === 'published'
                      ? 'bg-green-500 text-white'
                      : 'bg-yellow-500 text-white'
                  }`}
                >
                  {course.status === 'published' ? '已发布' : '草稿'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-800 mb-2 line-clamp-1">{course.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-3">{course.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {course.instructor}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.floor(course.duration / 60)}课时
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {course.students}人
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium text-slate-700">{course.rating}</span>
                </div>
                <button className="text-primary-500 text-sm font-medium flex items-center gap-1">
                  查看详情
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseDetail({ course, onBack }: { course: any; onBack: () => void }) {
  const [activeChapter, setActiveChapter] = useState(0);

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
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    course.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {course.status === 'published' ? '已发布' : '草稿'}
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
              {course.chapters.map((chapter: any, index: number) => (
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
                    {index < 2 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <span
                        className={activeChapter === index ? 'text-primary-600' : 'text-slate-400'}
                      >
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
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">我的学习进度</h3>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">完成进度</span>
                <span className="text-sm font-medium text-primary-600">65%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-blue-500 rounded-full"
                  style={{ width: '65%' }}
                ></div>
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-500">
              已学习 {Math.floor((course.duration * 0.65) / 60)} / {Math.floor(course.duration / 60)} 课时
            </div>
            <button className="w-full mt-4 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
              继续学习
            </button>
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
        </div>
      </div>
    </div>
  );
}

function ExamList() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['全部', '进行中', '已结束', '草稿'].map((tab, index) => (
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
        {exams.map((exam) => (
          <div key={exam.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                {exam.status === 'published' ? '已发布' : '草稿'}
              </span>
              {exam.status === 'published' && exam.startDate && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  进行中
                </span>
              )}
            </div>
            <h3 className="font-semibold text-slate-800 mb-3">{exam.title}</h3>
            <div className="space-y-2 text-sm text-slate-500 mb-4">
              <div className="flex justify-between">
                <span>题目数量</span>
                <span className="text-slate-700">{exam.questionCount} 道</span>
              </div>
              <div className="flex justify-between">
                <span>考试时长</span>
                <span className="text-slate-700">{exam.duration} 分钟</span>
              </div>
              <div className="flex justify-between">
                <span>总分 / 及格分</span>
                <span className="text-slate-700">
                  {exam.totalScore} / {exam.passScore} 分
                </span>
              </div>
              {exam.startDate && (
                <div className="flex justify-between">
                  <span>考试时间</span>
                  <span className="text-slate-700 text-xs">
                    {exam.startDate} ~ {exam.endDate}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                预览
              </button>
              <button className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors">
                开始考试
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrainingRecordsList() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-4">学时统计概览</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '总学习时长', value: '48.5小时', color: 'text-primary-500' },
            { label: '已完成课程', value: '12门', color: 'text-green-500' },
            { label: '进行中课程', value: '3门', color: 'text-orange-500' },
            { label: '本月学时', value: '12.5小时', color: 'text-purple-500' },
          ].map((item, index) => (
            <div key={index} className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-2xl font-bold text-slate-800">{item.value}</div>
              <div className="text-sm text-slate-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">学习记录</h3>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                学员
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                课程名称
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                学习进度
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                学习时长
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                考试成绩
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                状态
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                完成时间
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {trainingRecords.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-5 py-4">
                  <div className="text-sm font-medium text-slate-700">{record.userName}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-sm text-slate-800">{record.courseTitle}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${record.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500">{record.progress}%</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">{record.studyHours} 学时</td>
                <td className="px-5 py-4">
                  {record.examScore !== undefined ? (
                    <span
                      className={`text-sm font-medium ${
                        record.examScore >= 60 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {record.examScore} 分
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : record.status === 'studying'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {record.status === 'completed'
                      ? '已完成'
                      : record.status === 'studying'
                      ? '学习中'
                      : '未通过'}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">
                  {record.completedAt || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CertificateList() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: '新闻业务培训证书',
            course: '新闻采访与写作基础',
            date: '2026-05-20',
            score: 92,
            holder: '张编辑',
          },
          {
            title: '新媒体运营资格证书',
            course: '新媒体运营与推广',
            date: '2026-05-25',
            score: 88,
            holder: '李记者',
          },
          {
            title: '短视频创作证书',
            course: '短视频拍摄与剪辑实战',
            date: '2026-06-05',
            score: 95,
            holder: '刘记者',
          },
        ].map((cert, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <Trophy className="w-full h-full text-amber-500" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-1">{cert.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{cert.course}</p>
              <div className="bg-white/80 rounded-lg p-4 mb-4">
                <div className="text-sm text-slate-600 mb-2">持证人</div>
                <div className="font-bold text-xl text-slate-800">{cert.holder}</div>
              </div>
              <div className="flex justify-between text-sm text-slate-500 mb-4">
                <span>
                  成绩：<span className="text-slate-700 font-medium">{cert.score}分</span>
                </span>
                <span>
                  发证：<span className="text-slate-700">{cert.date}</span>
                </span>
              </div>
              <div className="text-xs text-slate-400">
                证书编号：CPRM-{String(index + 1).padStart(6, '0')}
              </div>
            </div>
            <button className="w-full mt-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              下载证书
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
