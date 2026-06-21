import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, ShieldCheck, Star, Send, Filter, Briefcase } from 'lucide-react';
import { mockJobs, mockEnterprises } from '@/mock/data';

export default function ApplicantHome() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [employmentType, setEmploymentType] = useState('all');
  const [minSalary, setMinSalary] = useState(0);

  const locations = ['all', '昆明市', '曲靖市', '玉溪市', '大理州', '红河州'];
  const typeLabels: Record<string, string> = {
    fulltime: '全职',
    parttime: '兼职',
    project: '项目制',
  };
  const typeBadges: Record<string, string> = {
    fulltime: 'bg-terracotta-100 text-terracotta-700',
    parttime: 'bg-spruce-100 text-spruce-700',
    project: 'bg-sand-100 text-sand-700',
  };

  const filteredJobs = mockJobs.filter((job) => {
    if (job.status !== 'active') return false;
    if (search && !job.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (location !== 'all' && !job.location.includes(location)) return false;
    if (employmentType !== 'all' && job.employmentType !== employmentType) return false;
    if (minSalary > 0 && job.salaryMax < minSalary) return false;
    return true;
  });

  const getEnterprise = (entId: string) => mockEnterprises.find((e) => e.id === entId) || mockEnterprises[0];

  const handleApply = (jobId: string) => {
    alert('简历投递成功！企业HR会尽快与您联系。');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6 bg-gradient-to-r from-terracotta-500 to-spruce-500 text-white">
        <h2 className="font-serif text-2xl font-bold mb-2">为您推荐的云南优质岗位</h2>
        <p className="text-white/80">基于您的求职意向和简历，为您精选以下岗位</p>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ash-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索职位名称、公司..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input-field w-36"
          >
            <option value="all">全部地区</option>
            {locations.slice(1).map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="input-field w-36"
          >
            <option value="all">全部类型</option>
            <option value="fulltime">全职</option>
            <option value="parttime">兼职</option>
            <option value="project">项目制</option>
          </select>
          <select
            value={minSalary}
            onChange={(e) => setMinSalary(Number(e.target.value))}
            className="input-field w-36"
          >
            <option value={0}>薪资不限</option>
            <option value={5000}>5K以上</option>
            <option value={8000}>8K以上</option>
            <option value={12000}>12K以上</option>
            <option value={20000}>20K以上</option>
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Filter size={16} />
            高级筛选
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {filteredJobs.map((job) => {
          const enterprise = getEnterprise('ent-001');
          return (
            <div key={job.id} className="card p-6 hover:shadow-elevated transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-spruce-400 to-spruce-600 flex items-center justify-center text-white font-serif text-xl font-bold"
                  >
                    {enterprise.name[2]}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-ash-700 group-hover:text-terracotta-600 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/applicant/enterprise/${enterprise.id}`);
                        }}
                        className="text-sm text-ash-500 hover:text-terracotta-600 cursor-pointer transition-colors"
                      >
                        {enterprise.name}
                      </span>
                      {enterprise.certified && (
                        <ShieldCheck size={14} className="text-sand-500" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-serif text-terracotta-600">
                    {job.salaryMin / 1000}K-{job.salaryMax / 1000}K
                  </p>
                  <p className="text-xs text-ash-400">月薪</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`badge ${typeBadges[job.employmentType]}`}>
                  <Briefcase size={12} className="mr-1" />
                  {typeLabels[job.employmentType]}
                </span>
                <span className="badge bg-ash-100 text-ash-600 flex items-center gap-1">
                  <MapPin size={12} />
                  {job.location}
                </span>
                <span className="badge bg-ash-100 text-ash-600 flex items-center gap-1">
                  <Clock size={12} />
                  到岗 {job.arrivalTime}
                </span>
              </div>

              <p className="text-sm text-ash-500 line-clamp-2 mb-4 leading-relaxed">
                {job.jd.split('\n').slice(0, 2).join(' ')}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-ash-100">
                <div className="flex items-center gap-4 text-xs text-ash-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={12} className={enterprise.certified ? 'text-sand-500' : 'text-ash-300'} />
                    {enterprise.certified ? '已认证' : '未认证'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={12} className="text-sand-500" />
                    响应率 {enterprise.responseRate}%
                  </span>
                </div>
                <button
                  onClick={() => handleApply(job.id)}
                  className="btn-primary text-sm px-5 flex items-center gap-1.5"
                >
                  <Send size={14} />
                  一键投递
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-16 text-ash-400">
          <Briefcase size={48} className="mx-auto mb-4 opacity-40" />
          <p>暂无符合条件的职位，试试调整筛选条件</p>
        </div>
      )}
    </div>
  );
}
