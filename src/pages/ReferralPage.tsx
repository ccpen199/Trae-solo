import { useState } from 'react';
import {
  TrendingUp,
  UserCheck,
  Target,
  MapPin,
  DollarSign,
  Briefcase,
  ChevronDown,
  Search,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  Users,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';

interface ReferralJob {
  id: number;
  title: string;
  company: string;
  logo: string;
  salary: string;
  city: string;
  industry: string;
  urgent: boolean;
  hasOfficer: boolean;
  officer: {
    name: string;
    avatar: string;
    rate: number;
  };
  progress: number;
  successCount: number;
  tags: string[];
}

const mockJobs: ReferralJob[] = [
  {
    id: 1, title: '前端开发实习生', company: '字节跳动',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bytedance%20company%20logo%20minimal%20blue&image_size=square',
    salary: '300-500/天', city: '北京', industry: '互联网', urgent: true, hasOfficer: true,
    officer: { name: '张学长', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=asian%20male%20professional%20portrait%20smile&image_size=square', rate: 92 },
    progress: 3, successCount: 47, tags: ['React', 'TypeScript', '大厂'],
  },
  {
    id: 2, title: '算法工程师实习生', company: '阿里巴巴',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=alibaba%20company%20logo%20orange%20minimal&image_size=square',
    salary: '400-600/天', city: '杭州', industry: '互联网', urgent: true, hasOfficer: true,
    officer: { name: '王学姐', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=asian%20female%20professional%20portrait%20friendly&image_size=square', rate: 88 },
    progress: 2, successCount: 32, tags: ['机器学习', 'Python', '推荐系统'],
  },
  {
    id: 3, title: '产品经理实习生', company: '腾讯',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tencent%20company%20logo%20green%20minimal&image_size=square',
    salary: '350-500/天', city: '深圳', industry: '互联网', urgent: false, hasOfficer: true,
    officer: { name: '陈学长', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=young%20asian%20professional%20man%20portrait%20glasses&image_size=square', rate: 85 },
    progress: 1, successCount: 28, tags: ['B端产品', '数据分析', 'Axure'],
  },
  {
    id: 4, title: 'Java后端开发', company: '美团',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=meituan%20company%20logo%20yellow%20minimal&image_size=square',
    salary: '300-450/天', city: '北京', industry: '本地生活', urgent: true, hasOfficer: false,
    officer: { name: '待分配', avatar: '', rate: 0 },
    progress: 4, successCount: 56, tags: ['Spring', 'MySQL', '高并发'],
  },
  {
    id: 5, title: '数据分析实习生', company: '蚂蚁集团',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ant%20group%20company%20logo%20blue%20minimal&image_size=square',
    salary: '350-550/天', city: '杭州', industry: '金融科技', urgent: false, hasOfficer: true,
    officer: { name: '刘学姐', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=asian%20business%20woman%20portrait%20professional&image_size=square', rate: 90 },
    progress: 2, successCount: 41, tags: ['SQL', 'Python', 'BI'],
  },
  {
    id: 6, title: 'UI/UX设计实习生', company: '网易',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=netease%20company%20logo%20red%20minimal&image_size=square',
    salary: '250-400/天', city: '杭州', industry: '互联网', urgent: false, hasOfficer: true,
    officer: { name: '林学姐', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20asian%20woman%20designer%20portrait&image_size=square', rate: 83 },
    progress: 1, successCount: 19, tags: ['Figma', '用户研究', '交互'],
  },
  {
    id: 7, title: '商业分析实习生', company: '小红书',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=xiaohongshu%20company%20logo%20red%20minimal&image_size=square',
    salary: '300-450/天', city: '上海', industry: '社交媒体', urgent: true, hasOfficer: true,
    officer: { name: '赵学长', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20asian%20man%20business%20portrait&image_size=square', rate: 78 },
    progress: 3, successCount: 23, tags: ['商业分析', 'SQL', 'Excel'],
  },
  {
    id: 8, title: '客户端开发(iOS)', company: '拼多多',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pinduoduo%20company%20logo%20orange%20red%20minimal&image_size=square',
    salary: '400-600/天', city: '上海', industry: '电商', urgent: true, hasOfficer: false,
    officer: { name: '待分配', avatar: '', rate: 0 },
    progress: 2, successCount: 34, tags: ['Swift', 'Objective-C', '性能优化'],
  },
  {
    id: 9, title: '量化研究实习生', company: '中金公司',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cicc%20finance%20company%20logo%20gold%20blue&image_size=square',
    salary: '500-800/天', city: '上海', industry: '金融', urgent: false, hasOfficer: true,
    officer: { name: '周学长', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=asian%20finance%20professional%20man%20suit&image_size=square', rate: 76 },
    progress: 1, successCount: 12, tags: ['Python', 'C++', '数学建模'],
  },
  {
    id: 10, title: 'DevOps运维实习生', company: '百度',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baidu%20company%20logo%20blue%20paw%20minimal&image_size=square',
    salary: '300-450/天', city: '北京', industry: '互联网', urgent: false, hasOfficer: true,
    officer: { name: '孙学长', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tech%20asian%20man%20engineer%20portrait&image_size=square', rate: 81 },
    progress: 2, successCount: 27, tags: ['K8s', 'Docker', 'Linux'],
  },
];

export default function ReferralPage() {
  const [industryFilter, setIndustryFilter] = useState('全部');
  const [cityFilter, setCityFilter] = useState('全部');
  const [urgentFilter, setUrgentFilter] = useState('全部');
  const [officerFilter, setOfficerFilter] = useState('全部');

  const industries = ['全部', '互联网', '金融', '电商', '本地生活', '金融科技', '社交媒体'];
  const cities = ['全部', '北京', '上海', '杭州', '深圳', '广州', '成都'];

  const filteredJobs = mockJobs.filter((job) => {
    if (industryFilter !== '全部' && job.industry !== industryFilter) return false;
    if (cityFilter !== '全部' && job.city !== cityFilter) return false;
    if (urgentFilter === '紧急' && !job.urgent) return false;
    if (urgentFilter === '普通' && job.urgent) return false;
    if (officerFilter === '已分配' && !job.hasOfficer) return false;
    if (officerFilter === '未分配' && job.hasOfficer) return false;
    return true;
  });

  const progressNodes = ['投递', '初筛', '面试', 'Offer', '入职'];

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        <div className="grid md:grid-cols-3 gap-4 animate-fade-in-up">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-gradient text-white flex items-center justify-center shadow-float">
                <Briefcase size={26} />
              </div>
              <div>
                <p className="text-xs text-ink-500 mb-0.5">本月可内推岗位</p>
                <p className="text-3xl font-bold text-ink-900 font-num">128<span className="text-base text-ink-400 ml-1">个</span></p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-gradient text-white flex items-center justify-center shadow-[0_8px_24px_-10px_rgba(46,196,182,0.5)]">
                <UserCheck size={26} />
              </div>
              <div>
                <p className="text-xs text-ink-500 mb-0.5">我的专属服务官</p>
                <p className="text-lg font-bold text-ink-900 flex items-center gap-2">
                  <span>张学长</span>
                  <Badge variant="verified" size="xs" dot>在线</Badge>
                </p>
                <p className="text-xs text-ink-500 mt-0.5">内推成功率 92%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-brand-500 text-white flex items-center justify-center shadow-float">
                <TrendingUp size={26} />
              </div>
              <div>
                <p className="text-xs text-ink-500 mb-0.5">我的历史成功率</p>
                <p className="text-3xl font-bold text-ink-900 font-num flex items-baseline gap-1">
                  86<span className="text-base text-ink-400">%</span>
                  <span className="text-xs text-teal-600 font-medium ml-1 flex items-center gap-0.5">
                    <TrendingUp size={12} />+4%
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="搜索岗位、企业名称..."
                leftIcon={<Search size={16} className="text-ink-400" />}
                wrapperClassName="sm:max-w-sm"
              />
              <div className="flex-1 flex flex-wrap gap-2">
                <FilterSelect label="行业" value={industryFilter} options={industries} onChange={setIndustryFilter} />
                <FilterSelect label="城市" value={cityFilter} options={cities} onChange={setCityFilter} />
                <FilterSelect label="紧急度" value={urgentFilter} options={['全部', '紧急', '普通']} onChange={setUrgentFilter} icon={<Flame size={14} />} />
                <FilterSelect label="服务官" value={officerFilter} options={['全部', '已分配', '未分配']} onChange={setOfficerFilter} icon={<Users size={14} />} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredJobs.map((job, idx) => (
            <Card
              key={job.id}
              hoverable
              className="animate-fade-in-up"
              style={{ animationDelay: `${0.12 + idx * 0.05}s` }}
            >
              <CardContent>
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-ink-900 truncate">{job.title}</h3>
                      {job.urgent && (
                        <Badge variant="danger" size="xs" dot>
                          <Zap size={10} />
                          急招
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                      <span className="flex items-center gap-1.5 text-ink-700 font-medium">
                        <img src={job.logo} alt="" className="w-5 h-5 rounded" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1.5 text-brand-600 font-bold font-num">
                        <DollarSign size={15} />
                        {job.salary}
                      </span>
                      <span className="flex items-center gap-1.5 text-ink-500">
                        <MapPin size={15} className="text-sky-500" />
                        {job.city}
                      </span>
                      <Badge variant="info">{job.industry}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {job.tags.map((t) => (
                        <span key={t} className="text-xs px-2.5 py-1 rounded-lg bg-cream-100 text-ink-600 border border-ink-100">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-sm">
                        <div className="flex justify-between text-[10px] text-ink-400 mb-1.5 font-medium">
                          {progressNodes.map((n, i) => (
                            <span key={n} className={i <= job.progress - 1 ? 'text-teal-600' : ''}>{n}</span>
                          ))}
                        </div>
                        <div className="relative h-1.5 bg-ink-100 rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-teal-400 to-brand-400 rounded-full transition-all"
                            style={{ width: `${(job.progress / 4) * 100}%` }}
                          />
                          <div className="absolute top-1/2 -translate-y-1/2 flex justify-between w-full px-0">
                            {progressNodes.map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-full border-2 -ml-1.5 ${
                                  i < job.progress
                                    ? 'bg-teal-500 border-white'
                                    : i === job.progress
                                    ? 'bg-brand-500 border-white animate-pulse-dot'
                                    : 'bg-white border-ink-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-ink-500 shrink-0 flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-teal-500" />
                        成功案例 <b className="text-ink-700 font-num">{job.successCount}</b>
                      </span>
                    </div>
                  </div>

                  <div className="lg:w-56 shrink-0 flex lg:flex-col items-center gap-4">
                    {job.hasOfficer ? (
                      <div className="flex-1 w-full p-3 rounded-xl bg-gradient-to-br from-teal-50 to-brand-50 border border-teal-100">
                        <p className="text-[10px] text-ink-500 mb-2">我的服务官</p>
                        <div className="flex items-center gap-2.5">
                          <img src={job.officer.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-ink-800 truncate">{job.officer.name}</p>
                            <p className="text-[10px] text-teal-600 font-medium flex items-center gap-0.5">
                              <Target size={10} />
                              成功率 {job.officer.rate}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 w-full p-3 rounded-xl bg-ink-50 border border-ink-100 border-dashed">
                        <p className="text-[10px] text-ink-500 mb-1">服务官</p>
                        <p className="text-sm text-ink-500 flex items-center gap-1.5">
                          <Clock size={13} />
                          申请后分配
                        </p>
                      </div>
                    )}
                    <Button variant="primary" size="md" className="w-full lg:w-auto lg:min-w-[120px]">
                      立即申请
                      <ArrowRight size={15} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label, value, options, onChange, icon,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; icon?: any;
}) {
  return (
    <div className="relative min-w-[120px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 pl-3.5 pr-9 rounded-xl2 bg-white border border-ink-200 text-sm text-ink-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all appearance-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {icon ? '' : `${label}：`}{o}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
    </div>
  );
}
