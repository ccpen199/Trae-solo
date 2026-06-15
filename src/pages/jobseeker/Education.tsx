import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  Search,
  Filter,
  Building2,
  Clock,
  Award,
  CheckCircle2,
  Circle,
  ArrowRight,
  TrendingUp,
  Calendar,
  Target,
  Users,
} from 'lucide-react';
import {
  Tabs,
  Button,
  Tag,
  Select,
  Slider,
  Progress,
  Empty,
  Badge,
  Timeline,
  Space,
} from 'antd';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import MatchScoreRing from '@/components/common/MatchScoreRing';
import StatsCard from '@/components/common/StatsCard';

const { Option } = Select;

interface CourseMock {
  id: string;
  title: string;
  provider: string;
  type: '自考' | '成考' | '职业资格';
  targetDegree: string;
  major: string;
  duration: string;
  price: number;
  creditBankEligible: boolean;
  tags: string[];
  coverColor: string;
  rating: number;
  enrollmentCount: number;
  status: '招生中' | '已开班' | '已结束';
}

interface CreditCourseMock {
  id: string;
  courseTitle: string;
  earnedCredits: number;
  totalCredits: number;
  progress: number;
  status: '进行中' | '已完成' | '待开始';
  completedAt?: string;
}

const mockCourses: CourseMock[] = [
  {
    id: 'c1',
    title: '机电一体化技术大专班',
    provider: '中山职业技术学院',
    type: '自考',
    targetDegree: '大专',
    major: '机械电子',
    duration: '36个月',
    price: 12800,
    creditBankEligible: true,
    tags: ['热门', '推荐就业', '校企合作'],
    coverColor: 'from-industrial-blue-500 to-industrial-blue-600',
    rating: 4.8,
    enrollmentCount: 328,
    status: '招生中',
  },
  {
    id: 'c2',
    title: '工商管理专升本',
    provider: '电子科技大学中山学院继续教育',
    type: '成考',
    targetDegree: '本科',
    major: '工商管理',
    duration: '48个月',
    price: 24800,
    creditBankEligible: true,
    tags: ['学历提升', '学位可申请'],
    coverColor: 'from-vital-orange-500 to-vital-orange-600',
    rating: 4.6,
    enrollmentCount: 256,
    status: '招生中',
  },
  {
    id: 'c3',
    title: '工业机器人操作与编程',
    provider: '中山市技师学院',
    type: '职业资格',
    targetDegree: '职业证书',
    major: '智能制造',
    duration: '6个月',
    price: 6800,
    creditBankEligible: true,
    tags: ['高薪技能', '实操为主', '就业推荐'],
    coverColor: 'from-emerald-500 to-emerald-600',
    rating: 4.9,
    enrollmentCount: 189,
    status: '招生中',
  },
  {
    id: 'c4',
    title: '数控技术中专班',
    provider: '中山火炬职业技术学院',
    type: '自考',
    targetDegree: '中专',
    major: '数控技术',
    duration: '24个月',
    price: 8600,
    creditBankEligible: true,
    tags: ['技术工种', '紧缺岗位'],
    coverColor: 'from-purple-500 to-purple-600',
    rating: 4.7,
    enrollmentCount: 145,
    status: '招生中',
  },
  {
    id: 'c5',
    title: 'PLC自动化控制工程师',
    provider: '广东理工职业学院中山校区',
    type: '职业资格',
    targetDegree: '职业证书',
    major: '自动化',
    duration: '8个月',
    price: 9800,
    creditBankEligible: true,
    tags: ['高需求', '高薪行业'],
    coverColor: 'from-cyan-500 to-cyan-600',
    rating: 4.8,
    enrollmentCount: 212,
    status: '招生中',
  },
  {
    id: 'c6',
    title: '电子商务大专班',
    provider: '中山市开放大学',
    type: '成考',
    targetDegree: '大专',
    major: '电子商务',
    duration: '36个月',
    price: 11800,
    creditBankEligible: true,
    tags: ['热门专业', '线上学习'],
    coverColor: 'from-pink-500 to-pink-600',
    rating: 4.5,
    enrollmentCount: 378,
    status: '已开班',
  },
  {
    id: 'c7',
    title: '工业设计师资格证',
    provider: '中山职业技术学院',
    type: '职业资格',
    targetDegree: '职业证书',
    major: '工业设计',
    duration: '4个月',
    price: 5600,
    creditBankEligible: false,
    tags: ['创意设计', '作品集辅导'],
    coverColor: 'from-indigo-500 to-indigo-600',
    rating: 4.6,
    enrollmentCount: 98,
    status: '招生中',
  },
  {
    id: 'c8',
    title: '人力资源管理师二级',
    provider: '中山市开放大学',
    type: '职业资格',
    targetDegree: '职业证书',
    major: '人力资源',
    duration: '5个月',
    price: 4800,
    creditBankEligible: false,
    tags: ['管理岗位', '国考证书'],
    coverColor: 'from-amber-500 to-amber-600',
    rating: 4.4,
    enrollmentCount: 167,
    status: '招生中',
  },
];

const mockCreditCourses: CreditCourseMock[] = [
  {
    id: 'cc1',
    courseTitle: '机电一体化技术大专班 - 机械制图',
    earnedCredits: 4,
    totalCredits: 4,
    progress: 100,
    status: '已完成',
    completedAt: '2024-06-15',
  },
  {
    id: 'cc2',
    courseTitle: '机电一体化技术大专班 - 电工基础',
    earnedCredits: 3,
    totalCredits: 4,
    progress: 75,
    status: '进行中',
  },
  {
    id: 'cc3',
    courseTitle: '机电一体化技术大专班 - PLC编程',
    earnedCredits: 0,
    totalCredits: 5,
    progress: 0,
    status: '待开始',
  },
  {
    id: 'cc4',
    courseTitle: '工业机器人操作与编程认证',
    earnedCredits: 6,
    totalCredits: 6,
    progress: 100,
    status: '已完成',
    completedAt: '2024-08-20',
  },
  {
    id: 'cc5',
    courseTitle: '机电一体化技术大专班 - 机械设计基础',
    earnedCredits: 2,
    totalCredits: 4,
    progress: 50,
    status: '进行中',
  },
];

const certificationTimeline = [
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
    time: '预计 2026-09',
    color: '#C9CDD4',
    done: false,
  },
  {
    title: '学历认证',
    description: '学信网学历认证，颁发毕业证书',
    time: '预计 2026-12',
    color: '#C9CDD4',
    done: false,
  },
];

export default function Education() {
  const [activeTab, setActiveTab] = useState('courses');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterDegree, setFilterDegree] = useState<string | undefined>();
  const [filterMajor, setFilterMajor] = useState<string | undefined>();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 30000]);

  const filteredCourses = useMemo(() => {
    return mockCourses.filter((c) => {
      if (filterType && c.type !== filterType) return false;
      if (filterDegree && c.targetDegree !== filterDegree) return false;
      if (filterMajor && c.major !== filterMajor) return false;
      if (c.price < priceRange[0] || c.price > priceRange[1]) return false;
      return true;
    });
  }, [filterType, filterDegree, filterMajor, priceRange]);

  const totalEarnedCredits = useMemo(() => {
    return mockCreditCourses.reduce((sum, c) => sum + c.earnedCredits, 0);
  }, []);

  const totalTargetCredits = 110;
  const creditProgress = (totalEarnedCredits / totalTargetCredits) * 100;

  const estimatedCertDate = useMemo(() => {
    const remainingCredits = totalTargetCredits - totalEarnedCredits;
    const monthsNeeded = Math.ceil(remainingCredits / 3);
    return dayjs().add(monthsNeeded, 'month').format('YYYY年MM月');
  }, [totalEarnedCredits]);

  const creditPieData = [
    { name: '已获得', value: totalEarnedCredits },
    { name: '待获得', value: totalTargetCredits - totalEarnedCredits },
  ];

  const PIE_COLORS = ['#165DFF', '#E5E6EB'];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="bg-gradient-to-r from-purple-600 to-industrial-blue-600 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-vital-orange-400/20 blur-2xl" />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">学历提升中心</h1>
            <p className="text-purple-100">
              学历进修 · 职业资格 · 学分银行 · 助力职场跃迁
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: 'courses',
              label: (
                <span className="flex items-center gap-2">
                  <BookOpen size={18} />
                  课程超市
                </span>
              ),
              children: (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Filter size={18} className="text-gray-500" />
                      <span className="text-base font-semibold text-gray-800">筛选条件</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">课程类型</label>
                        <Select
                          value={filterType}
                          onChange={setFilterType}
                          placeholder="全部类型"
                          allowClear
                          className="!w-full"
                        >
                          <Option value="自考">自考</Option>
                          <Option value="成考">成考</Option>
                          <Option value="职业资格">职业资格</Option>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">学历目标</label>
                        <Select
                          value={filterDegree}
                          onChange={setFilterDegree}
                          placeholder="全部学历"
                          allowClear
                          className="!w-full"
                        >
                          <Option value="中专">中专</Option>
                          <Option value="大专">大专</Option>
                          <Option value="本科">本科</Option>
                          <Option value="职业证书">职业证书</Option>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">专业方向</label>
                        <Select
                          value={filterMajor}
                          onChange={setFilterMajor}
                          placeholder="全部专业"
                          allowClear
                          className="!w-full"
                        >
                          <Option value="机械电子">机械电子</Option>
                          <Option value="工商管理">工商管理</Option>
                          <Option value="智能制造">智能制造</Option>
                          <Option value="数控技术">数控技术</Option>
                          <Option value="自动化">自动化</Option>
                          <Option value="电子商务">电子商务</Option>
                          <Option value="工业设计">工业设计</Option>
                          <Option value="人力资源">人力资源</Option>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">
                          价格区间：¥{priceRange[0].toLocaleString()} - ¥{priceRange[1].toLocaleString()}
                        </label>
                        <Slider
                          range
                          min={0}
                          max={30000}
                          step={1000}
                          value={priceRange}
                          onChange={(v) => setPriceRange(v as [number, number])}
                          tooltip={{
                            formatter: (v) => `¥${(v as number).toLocaleString()}`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Space>
                        <Button
                          onClick={() => {
                            setFilterType(undefined);
                            setFilterDegree(undefined);
                            setFilterMajor(undefined);
                            setPriceRange([0, 30000]);
                          }}
                        >
                          重置
                        </Button>
                        <Button type="primary" icon={<Search size={14} />}>
                          筛选
                        </Button>
                      </Space>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      共找到 <span className="font-semibold text-industrial-blue-600">{filteredCourses.length}</span> 门课程
                    </span>
                  </div>

                  {filteredCourses.length === 0 ? (
                    <Empty description="暂无符合条件的课程" />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredCourses.map((course, idx) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
                          whileHover={{ y: -4 }}
                          className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-industrial-blue-200 cursor-pointer group"
                        >
                          <div className={cn('relative h-32 bg-gradient-to-br', course.coverColor)}>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <GraduationCap size={48} className="text-white/30" />
                            </div>
                            <div className="absolute top-3 left-3 flex gap-1.5">
                              <Tag
                                color={
                                  course.type === '自考'
                                    ? 'blue'
                                    : course.type === '成考'
                                    ? 'purple'
                                    : 'orange'
                                }
                                className="!m-0 !text-xs"
                              >
                                {course.type}
                              </Tag>
                              {course.creditBankEligible && (
                                <Tag color="green" className="!m-0 !text-xs">
                                  学分银行
                                </Tag>
                              )}
                            </div>
                            <div className="absolute top-3 right-3">
                              <Badge
                                status={
                                  course.status === '招生中'
                                    ? 'success'
                                    : course.status === '已开班'
                                    ? 'warning'
                                    : 'default'
                                }
                                text={course.status}
                              />
                            </div>
                            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded px-2 py-0.5">
                              <span className="text-xs font-medium text-gray-700">
                                ⭐ {course.rating}
                              </span>
                            </div>
                          </div>

                          <div className="p-4">
                            <h3 className="text-base font-semibold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-industrial-blue-600 transition-colors">
                              {course.title}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                              <Building2 size={12} />
                              <span className="truncate">{course.provider}</span>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-3">
                              {course.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {course.duration}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users size={12} />
                                {course.enrollmentCount}人报名
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                              <div>
                                <span className="text-xs text-gray-400">学费</span>
                                <div className="text-lg font-bold text-vital-orange-500">
                                  ¥{course.price.toLocaleString()}
                                </div>
                              </div>
                              <Button
                                type="primary"
                                size="small"
                                icon={<ArrowRight size={14} />}
                                disabled={course.status === '已结束'}
                              >
                                {course.status === '已结束' ? '已结束' : '立即报名'}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'credit',
              label: (
                <span className="flex items-center gap-2">
                  <Award size={18} />
                  学分银行
                </span>
              ),
              children: (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                      title="累计已获学分"
                      value={totalEarnedCredits}
                      unit="学分"
                      theme="blue"
                      icon={<Award size={20} />}
                      suffix={`/ ${totalTargetCredits}`}
                    />
                    <StatsCard
                      title="学习进度"
                      value={Math.round(creditProgress)}
                      unit="%"
                      theme="orange"
                      icon={<TrendingUp size={20} />}
                      trend={5.2}
                      trendLabel="本月新增"
                    />
                    <StatsCard
                      title="已完成课程"
                      value={mockCreditCourses.filter((c) => c.status === '已完成').length}
                      unit="门"
                      theme="green"
                      icon={<CheckCircle2 size={20} />}
                    />
                    <StatsCard
                      title="预估拿证时间"
                      value={estimatedCertDate}
                      theme="purple"
                      icon={<Calendar size={20} />}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-semibold flex items-center gap-2">
                            <BookOpen size={18} className="text-industrial-blue-500" />
                            已修课程
                          </h3>
                          <span className="text-sm text-gray-500">
                            共 {mockCreditCourses.length} 门课程
                          </span>
                        </div>
                        <div className="space-y-3">
                          {mockCreditCourses.map((course, idx) => (
                            <motion.div
                              key={course.id}
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
                              className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {course.courseTitle}
                                </h4>
                                <Tag
                                  color={
                                    course.status === '已完成'
                                      ? 'success'
                                      : course.status === '进行中'
                                      ? 'processing'
                                      : 'default'
                                  }
                                  className="!m-0"
                                >
                                  {course.status}
                                </Tag>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500">
                                  学分进度：{course.earnedCredits}/{course.totalCredits} 学分
                                </span>
                                <span className="text-xs font-medium text-industrial-blue-600">
                                  {course.progress}%
                                </span>
                              </div>
                              <Progress
                                percent={course.progress}
                                showInfo={false}
                                size="small"
                                strokeColor={
                                  course.status === '已完成'
                                    ? '#00B42A'
                                    : course.status === '进行中'
                                    ? '#165DFF'
                                    : '#C9CDD4'
                                }
                              />
                              {course.completedAt && (
                                <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                                  <CheckCircle2 size={12} className="text-success-500" />
                                  完成于 {dayjs(course.completedAt).format('YYYY-MM-DD')}
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
                          <Target size={18} className="text-industrial-blue-500" />
                          累计学分
                        </h3>
                        <div className="flex justify-center py-4">
                          <MatchScoreRing
                            score={Math.round(creditProgress)}
                            size="lg"
                            label="学分完成率"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="text-center p-3 bg-industrial-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-industrial-blue-600">
                              {totalEarnedCredits}
                            </div>
                            <div className="text-xs text-gray-500">已获学分</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-600">
                              {totalTargetCredits - totalEarnedCredits}
                            </div>
                            <div className="text-xs text-gray-500">待修学分</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
                          <GraduationCap size={18} className="text-industrial-blue-500" />
                          学历认证进度
                        </h3>
                        <Timeline
                          items={certificationTimeline.map((item) => ({
                            color: item.color,
                            dot: item.done ? (
                              <CheckCircle2 size={16} style={{ color: item.color }} />
                            ) : (
                              <Circle size={16} style={{ color: item.color }} />
                            ),
                            children: (
                              <div className="mb-1">
                                <div className="text-sm font-medium text-gray-800">
                                  {item.title}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {item.description}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {item.time}
                                </div>
                              </div>
                            ),
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </motion.div>
    </div>
  );
}
