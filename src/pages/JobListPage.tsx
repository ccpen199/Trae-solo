import { useState } from 'react';
import {
  Search,
  MapPin,
  Building2,
  Briefcase,
  Banknote,
  ShieldCheck,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  X,
  Filter,
  User,
  Heart,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tag from '@/components/ui/Tag';
import Input from '@/components/ui/Input';

const cities = [
  { name: '北京', count: 2340, checked: true },
  { name: '上海', count: 2180, checked: false },
  { name: '深圳', count: 1890, checked: true },
  { name: '杭州', count: 1340, checked: false },
  { name: '广州', count: 1120, checked: false },
  { name: '成都', count: 890, checked: false },
  { name: '武汉', count: 760, checked: false },
  { name: '南京', count: 680, checked: false },
  { name: '西安', count: 540, checked: false },
  { name: '其他', count: 1060, checked: false },
];

const industries = [
  { name: '互联网', color: 'brand' as const },
  { name: '金融', color: 'teal' as const },
  { name: '快消', color: 'amber' as const },
  { name: '教育', color: 'sky' as const },
  { name: '医疗', color: 'rose' as const },
  { name: '制造业', color: 'ink' as const },
  { name: '咨询', color: 'brand' as const },
  { name: '游戏', color: 'teal' as const },
];

const companyTypes = [
  '大厂（BAT/TMD）',
  '独角兽企业',
  '国企/央企',
  '外资企业',
  '创业公司',
  '中小型企业',
];

const jobs = [
  { id: 1, title: '前端开发实习生', company: '字节跳动', logoBg: 'bg-sky-100', logoText: '字', city: '北京·海淀区', salary: '200-300/天', convertRate: 86, tags: ['六险一金', '免费三餐', '弹性工作'], mentor: { name: '张明', title: '高级前端工程师', dept: '抖音电商' }, type: '大厂（BAT/TMD）', duration: '3个月', urgent: true },
  { id: 2, title: '产品经理实习生（商业化方向）', company: '腾讯科技', logoBg: 'bg-teal-100', logoText: '腾', city: '深圳·南山区', salary: '250-350/天', convertRate: 82, tags: ['转正机会大', '导师1v1', '项目核心'], mentor: { name: '李华', title: '高级产品经理', dept: '微信支付' }, type: '大厂（BAT/TMD）', duration: '4个月', urgent: false },
  { id: 3, title: '算法实习生-推荐系统', company: '阿里巴巴', logoBg: 'bg-orange-100', logoText: '阿', city: '杭州·余杭区', salary: '300-500/天', convertRate: 78, tags: ['技术氛围', '大牛带队', '论文支持'], mentor: { name: '王强', title: '算法专家', dept: '淘宝推荐' }, type: '大厂（BAT/TMD）', duration: '6个月', urgent: true },
  { id: 4, title: 'Java后端开发实习生', company: '美团点评', logoBg: 'bg-yellow-100', logoText: '美', city: '北京·朝阳区', salary: '220-320/天', convertRate: 75, tags: ['免费打车', '下午茶', '团建活动'], mentor: { name: '赵磊', title: '技术组长', dept: '外卖平台' }, type: '大厂（BAT/TMD）', duration: '3个月', urgent: false },
  { id: 5, title: 'UI设计师实习生', company: '网易互娱', logoBg: 'bg-red-100', logoText: '网', city: '广州·天河区', salary: '180-280/天', convertRate: 80, tags: ['游戏项目', '作品集', '创意空间'], mentor: { name: '陈芳', title: '主设计师', dept: '阴阳师项目组' }, type: '大厂（BAT/TMD）', duration: '4个月', urgent: true },
  { id: 6, title: '数据分析实习生', company: '京东集团', logoBg: 'bg-rose-100', logoText: '京', city: '北京·亦庄', salary: '200-300/天', convertRate: 72, tags: ['商业分析', 'SQL培训', '部门核心'], mentor: { name: '刘洋', title: '数据分析师', dept: '京东零售' }, type: '大厂（BAT/TMD）', duration: '3个月', urgent: false },
  { id: 7, title: '内容运营实习生', company: '小红书', logoBg: 'bg-pink-100', logoText: '红', city: '上海·黄浦区', salary: '160-240/天', convertRate: 88, tags: ['零食自由', '美妆福利', '扁平管理'], mentor: { name: '周婷', title: '运营主管', dept: '美妆内容' }, type: '独角兽企业', duration: '3个月', urgent: true },
  { id: 8, title: '市场推广实习生', company: '小米科技', logoBg: 'bg-amber-100', logoText: '小', city: '北京·清河', salary: '150-220/天', convertRate: 70, tags: ['内部折扣', '新品体验', '海外出差'], mentor: { name: '孙浩', title: '市场经理', dept: '手机产品线' }, type: '大厂（BAT/TMD）', duration: '4个月', urgent: false },
  { id: 9, title: 'iOS开发实习生', company: '快手科技', logoBg: 'bg-orange-100', logoText: '快', city: '北京·西二旗', salary: '230-330/天', convertRate: 83, tags: ['技术成长', '导师制度', '股票期权'], mentor: { name: '吴迪', title: 'iOS技术专家', dept: '主APP团队' }, type: '独角兽企业', duration: '5个月', urgent: true },
  { id: 10, title: '用户研究实习生', company: '拼多多', logoBg: 'bg-red-100', logoText: '拼', city: '上海·长宁区', salary: '210-310/天', convertRate: 77, tags: ['用户洞察', '定性研究', '方法论'], mentor: { name: '郑雪', title: '资深用研', dept: '用户体验部' }, type: '大厂（BAT/TMD）', duration: '4个月', urgent: false },
  { id: 11, title: '商业分析实习生', company: '蚂蚁集团', logoBg: 'bg-sky-100', logoText: '蚂', city: '杭州·西湖区', salary: '260-380/天', convertRate: 84, tags: ['金融科技', '数据驱动', '战略视野'], mentor: { name: '冯斌', title: '高级分析师', dept: '数字银行' }, type: '大厂（BAT/TMD）', duration: '6个月', urgent: true },
  { id: 12, title: '品牌公关实习生', company: '哔哩哔哩', logoBg: 'bg-pink-100', logoText: 'B', city: '上海·杨浦区', salary: '170-250/天', convertRate: 81, tags: ['ACG文化', '活动策划', '媒体资源'], mentor: { name: '林倩', title: '公关经理', dept: '市场品牌部' }, type: '独角兽企业', duration: '3个月', urgent: false },
];

const sortOptions = ['综合排序', '薪资最高', '热度最高', '最新发布'];

export default function JobListPage() {
  const [activeSort, setActiveSort] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [salaryRange, setSalaryRange] = useState([0, 500]);
  const [minConvertRate, setMinConvertRate] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');

  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const totalPages = 5;

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="container flex gap-6">
        {/* 左侧筛选栏 */}
        <aside className="w-[250px] shrink-0 space-y-5 sticky top-8 h-fit">
          <Card>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ink-900 flex items-center gap-2">
                  <Filter size={18} className="text-brand-500" /> 筛选条件
                </h3>
                <button className="text-xs text-ink-400 hover:text-brand-500 transition-colors">
                  清空
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-ink-700">关键词搜索</label>
                <Input
                  placeholder="输入岗位/公司名..."
                  leftIcon={<Search size={16} />}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-ink-700 flex items-center gap-2">
                  <MapPin size={16} className="text-sky-500" /> 工作城市
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {cities.map((c) => (
                    <label
                      key={c.name}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-xl hover:bg-ink-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${c.checked ? 'bg-brand-500 border-brand-500' : 'border-ink-300 group-hover:border-brand-300'}`}>
                          {c.checked && <div className="w-2 h-2 rounded-sm bg-white" />}
                        </div>
                        <span className="text-sm text-ink-700">{c.name}</span>
                      </div>
                      <span className="text-xs text-ink-400 font-num">{c.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-ink-700 flex items-center gap-2">
                  <Briefcase size={16} className="text-brand-500" /> 行业标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {industries.map((ind) => (
                    <Tag
                      key={ind.name}
                      variant={ind.color}
                      size="xs"
                      removable={selectedIndustry === ind.name}
                      onClick={() =>
                        setSelectedIndustry(selectedIndustry === ind.name ? null : ind.name)
                      }
                      className={selectedIndustry === ind.name ? 'ring-2 ring-offset-1 ring-current' : ''}
                    >
                      {ind.name}
                    </Tag>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-ink-700 flex items-center gap-2">
                  <Banknote size={16} className="text-amber-500" /> 薪资范围
                </label>
                <div className="space-y-2 px-1">
                  <input
                    type="range"
                    min={0}
                    max={500}
                    step={10}
                    value={salaryRange[1]}
                    onChange={(e) => setSalaryRange([salaryRange[0], Number(e.target.value)])}
                    className="w-full accent-brand-500"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-500">¥{salaryRange[0]}</span>
                    <span className="font-semibold text-brand-600 font-num">¥{salaryRange[1]}/天</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-ink-700">
                  转正率 ≥ <span className="text-teal-600 font-num">{minConvertRate}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minConvertRate}
                  onChange={(e) => setMinConvertRate(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
                <div className="flex justify-between text-xs text-ink-400">
                  <span>不限</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-ink-700 flex items-center gap-2">
                  <Building2 size={16} className="text-teal-500" /> 企业类型
                </label>
                <div className="space-y-1.5">
                  {companyTypes.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
                      className={`w-full text-left py-2 px-3 rounded-xl text-sm transition-all ${
                        selectedTypes.includes(t)
                          ? 'bg-brand-50 text-brand-700 border border-brand-200'
                          : 'text-ink-600 hover:bg-ink-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{t}</span>
                        {selectedTypes.includes(t) && <X size={14} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* 右侧内容区 */}
        <main className="flex-1 min-w-0 space-y-5">
          <Card>
            <CardContent className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-ink-900">
                  岗位广场
                  <span className="ml-3 text-sm font-normal text-ink-500">
                    共 <span className="font-bold text-brand-600 font-num">12,846</span> 个结果
                  </span>
                </h2>
                {(selectedIndustry || selectedTypes.length > 0) && (
                  <div className="flex items-center gap-2">
                    {selectedIndustry && (
                      <Tag variant="brand" size="xs" removable onRemove={() => setSelectedIndustry(null)}>
                        {selectedIndustry}
                      </Tag>
                    )}
                    {selectedTypes.map((t) => (
                      <Tag key={t} variant="teal" size="xs" removable onRemove={() => toggleType(t)}>
                        {t}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 p-1 bg-ink-50 rounded-xl">
                  {sortOptions.map((s, i) => (
                    <button
                      key={s}
                      onClick={() => setActiveSort(i)}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activeSort === i
                          ? 'bg-white text-ink-900 shadow-soft'
                          : 'text-ink-500 hover:text-ink-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex items-center p-1 bg-ink-50 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      viewMode === 'grid' ? 'bg-white shadow-soft text-brand-500' : 'text-ink-400'
                    }`}
                  >
                    <Grid3X3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      viewMode === 'list' ? 'bg-white shadow-soft text-brand-500' : 'text-ink-400'
                    }`}
                  >
                    <List size={18} />
                  </button>
                </div>
                <button className="w-11 h-11 rounded-xl border border-ink-200 flex items-center justify-center text-ink-500 hover:border-brand-300 hover:text-brand-500 transition-colors">
                  <SlidersHorizontal size={18} />
                </button>
              </div>
            </CardContent>
          </Card>

          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-5' : 'space-y-4'}>
            {jobs.map((job, i) => (
              <Card
                key={job.id}
                hoverable
                className="animate-fade-in-up overflow-hidden"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-14 h-14 rounded-2xl ${job.logoBg} flex items-center justify-center font-bold text-2xl shrink-0`}>
                        {job.logoText}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-ink-900 truncate">{job.title}</h3>
                          {job.urgent && <Badge variant="danger" size="xs" dot>急招</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-ink-500">
                          <span className="font-medium text-ink-700">{job.company}</span>
                          <Badge variant="verified" size="xs"><ShieldCheck size={10} /> 认证</Badge>
                        </div>
                      </div>
                    </div>
                    <button className="w-10 h-10 rounded-xl bg-ink-50 flex items-center justify-center text-ink-400 hover:text-brand-500 hover:bg-brand-50 transition-colors shrink-0">
                      <Heart size={18} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="salary">💰 {job.salary}</Badge>
                    <Badge variant="city"><MapPin size={12} /> {job.city}</Badge>
                    <Badge variant="info"><Clock size={12} /> {job.duration}</Badge>
                    <Badge variant="success">
                      转正率 <span className="font-bold font-num ml-0.5">{job.convertRate}%</span>
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((t) => (
                      <Tag key={t} variant="ink" size="xs">
                        {t}
                      </Tag>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50/60 to-brand-50/40 rounded-2xl border border-teal-100/50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-brand-400 flex items-center justify-center text-white">
                      <User size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
                        {job.mentor.name}
                        <Badge variant="senior" size="xs">带教人</Badge>
                      </div>
                      <div className="text-xs text-ink-500 truncate">
                        {job.mentor.title} · {job.mentor.dept}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <Button className="flex-1">立即投递</Button>
                    <Button variant="outline" size="md">
                      <ChevronDown size={16} className="mr-1" />
                      沟通
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 py-4">
            <Button variant="outline" size="sm" disabled={currentPage === 1}>
              <ChevronLeft size={16} />
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all font-num ${
                  currentPage === i + 1
                    ? 'bg-brand-gradient text-white shadow-float'
                    : 'bg-white text-ink-600 border border-ink-200 hover:border-brand-300 hover:text-brand-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <Button variant="outline" size="sm" disabled={currentPage === totalPages}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
