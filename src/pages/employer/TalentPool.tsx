import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useStore } from '@/store';
import { mockJobs, mockResumes, mockApplications, mockInterviews, mockAnalyticsData, mockCompanies, mockVerificationRecords } from '@/mock/data';
import TalentCard from '@/components/business/TalentCard';
import Tag from '@/components/ui/Tag';
import type { Resume, Certificate } from '@/../shared/types';

const industries = [
  { id: 'restaurant', name: '餐饮' },
  { id: 'retail', name: '零售' },
  { id: 'housekeeping', name: '家政' },
  { id: 'logistics', name: '物流' },
  { id: 'security', name: '安保' },
  { id: 'other', name: '其他' },
];

const skillCategories = [
  { name: '行业技能', color: 'blue' },
  { name: '软技能', color: 'green' },
  { name: '身体素质', color: 'orange' },
  { name: '生活技能', color: 'purple' },
];

const certificateTypes = [
  { id: 'health', name: '健康证' },
  { id: 'food_safety', name: '食品安全证' },
  { id: 'nanny', name: '育婴师证' },
  { id: 'housekeeping', name: '家政服务员证' },
  { id: 'security', name: '保安员证' },
];

const colorMap: Record<string, 'blue' | 'green' | 'orange' | 'purple' | 'red'> = {
  '行业技能': 'blue',
  '软技能': 'green',
  '身体素质': 'orange',
  '生活技能': 'purple',
};

function generateSmartTags(resume: Resume): string[] {
  const tags: string[] = [];

  const hasRestaurantExp = resume.workExperience?.some(
    exp => exp.position.includes('餐饮') || exp.position.includes('服务员') || exp.position.includes('后厨')
  );
  if (hasRestaurantExp) tags.push('有餐饮经验');

  const hasHealthCert = resume.certificates?.some(
    cert => cert.name.includes('健康证')
  );
  if (hasHealthCert) tags.push('持健康证');

  const hasFoodSafetyCert = resume.certificates?.some(
    cert => cert.name.includes('食品安全')
  );
  if (hasFoodSafetyCert) tags.push('持食品安全证');

  const hasNannyCert = resume.certificates?.some(
    cert => cert.name.includes('育婴师') || cert.name.includes('母婴护理')
  );
  if (hasNannyCert) tags.push('持育婴师证');

  const hasHousekeepingCert = resume.certificates?.some(
    cert => cert.name.includes('家政')
  );
  if (hasHousekeepingCert) tags.push('持家政服务证');

  const totalExperience = resume.workExperience?.length || 0;
  if (totalExperience >= 3) tags.push('3年以上经验');

  const hasLogisticsExp = resume.workExperience?.some(
    exp => exp.position.includes('物流') || exp.position.includes('分拣') || exp.position.includes('快递')
  );
  if (hasLogisticsExp) tags.push('有物流经验');

  const hasRetailExp = resume.workExperience?.some(
    exp => exp.position.includes('零售') || exp.position.includes('收银') || exp.position.includes('理货')
  );
  if (hasRetailExp) tags.push('有零售经验');

  return tags;
}

function calculateExperienceYears(resume: Resume): number {
  if (!resume.workExperience || resume.workExperience.length === 0) return 0;
  let totalMonths = 0;
  resume.workExperience.forEach(exp => {
    const start = new Date(exp.startDate);
    const end = exp.endDate ? new Date(exp.endDate) : new Date();
    totalMonths += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  });
  return Math.round(totalMonths / 12);
}

function hasCertificate(resume: Resume, certName: string): boolean {
  return resume.certificates?.some(cert => cert.name.includes(certName)) || false;
}

export default function TalentPool() {
  const { setTalentPool, talentPool, setCompany, setVerificationRecord } = useStore();
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [experienceRange, setExperienceRange] = useState([0, 10]);
  const [commuteRadius, setCommuteRadius] = useState(20);
  const [sortBy, setSortBy] = useState('match');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setTalentPool(mockResumes);
    setCompany(mockCompanies[0]);
    setVerificationRecord(mockVerificationRecords[0]);
  }, [setTalentPool, setCompany, setVerificationRecord]);

  const toggleIndustry = (industryId: string) => {
    setSelectedIndustries(prev =>
      prev.includes(industryId) ? prev.filter(i => i !== industryId) : [...prev, industryId]
    );
  };

  const toggleSkill = (skillName: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillName) ? prev.filter(s => s !== skillName) : [...prev, skillName]
    );
  };

  const toggleCertificate = (certId: string) => {
    setSelectedCertificates(prev =>
      prev.includes(certId) ? prev.filter(c => c !== certId) : [...prev, certId]
    );
  };

  const allSkills = Array.from(
    new Set(mockResumes.flatMap(r => r.skillTags?.map(t => t.name) || []))
  );

  const filteredTalents = talentPool.filter(resume => {
    if (selectedIndustries.length > 0) {
      const matchesIndustry = resume.preferences?.industries?.some(
        ind => selectedIndustries.includes(ind)
      );
      if (!matchesIndustry) return false;
    }

    if (selectedSkills.length > 0) {
      const hasSkill = resume.skillTags?.some(
        tag => selectedSkills.includes(tag.name)
      );
      if (!hasSkill) return false;
    }

    if (selectedCertificates.length > 0) {
      const hasAllCerts = selectedCertificates.every(certId => {
        const certType = certificateTypes.find(c => c.id === certId);
        return certType && hasCertificate(resume, certType.name);
      });
      if (!hasAllCerts) return false;
    }

    const expYears = calculateExperienceYears(resume);
    if (expYears < experienceRange[0] || expYears > experienceRange[1]) return false;

    if (resume.preferences?.commuteRadius && resume.preferences.commuteRadius > commuteRadius) {
      return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesName = resume.basicInfo.name.toLowerCase().includes(term);
      const matchesSkill = resume.skillTags?.some(t => t.name.toLowerCase().includes(term));
      const matchesExp = resume.workExperience?.some(
        exp => exp.position.toLowerCase().includes(term) || exp.companyName.toLowerCase().includes(term)
      );
      if (!matchesName && !matchesSkill && !matchesExp) return false;
    }

    return true;
  });

  const sortedTalents = [...filteredTalents].sort((a, b) => {
    if (sortBy === 'match') {
      const aScore = generateSmartTags(a).length;
      const bScore = generateSmartTags(b).length;
      return bScore - aScore;
    } else if (sortBy === 'latest') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else if (sortBy === 'experience') {
      return calculateExperienceYears(b) - calculateExperienceYears(a);
    }
    return 0;
  });

  const clearFilters = () => {
    setSelectedIndustries([]);
    setSelectedSkills([]);
    setSelectedCertificates([]);
    setExperienceRange([0, 10]);
    setCommuteRadius(20);
    setSearchTerm('');
  };

  const sortOptions = [
    { value: 'match', label: '匹配度' },
    { value: 'latest', label: '最新' },
    { value: 'experience', label: '经验' },
  ];

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">人才库</h1>

      <div className="flex gap-6">
        <div className="w-72 flex-shrink-0">
          <div className="glass rounded-2xl p-5 sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-gray-900">筛选条件</h3>
              </div>
              <button
                onClick={clearFilters}
                className="text-xs text-primary hover:underline"
              >
                清空
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  行业筛选
                </label>
                <div className="space-y-2">
                  {industries.map(industry => (
                    <label key={industry.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIndustries.includes(industry.id)}
                        onChange={() => toggleIndustry(industry.id)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{industry.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  技能标签
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allSkills.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedSkills.includes(skill)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  证书筛选
                </label>
                <div className="space-y-2">
                  {certificateTypes.map(cert => (
                    <label key={cert.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCertificates.includes(cert.id)}
                        onChange={() => toggleCertificate(cert.id)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{cert.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  工作经验: {experienceRange[0]}-{experienceRange[1] === 10 ? '10+' : experienceRange[1]}年
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={experienceRange[0]}
                    onChange={e => setExperienceRange([Math.min(Number(e.target.value), experienceRange[1]), experienceRange[1]])}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={experienceRange[1]}
                    onChange={e => setExperienceRange([experienceRange[0], Math.max(Number(e.target.value), experienceRange[0])])}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0年</span>
                  <span>10+年</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通勤半径: {commuteRadius}km
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={commuteRadius}
                  onChange={e => setCommuteRadius(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0km</span>
                  <span>20km</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索人才..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
                />
              </div>
              <p className="text-gray-600">
                找到 <span className="font-semibold text-primary">{sortedTalents.length}</span> 位匹配人才
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-700">
                  排序：{sortOptions.find(o => o.value === sortBy)?.label}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              {showSortDropdown && (
                <div className="absolute top-full right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        sortBy === option.value ? 'text-primary bg-primary/5' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedTalents.map((resume: Resume) => {
              const smartTags = generateSmartTags(resume);
              return (
                <div key={resume.id}>
                  <TalentCard
                    resume={resume}
                    onView={() => console.log('View resume:', resume.id)}
                    onRequestContact={() => console.log('Request contact:', resume.id)}
                  />
                  {smartTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 px-1">
                      {smartTags.map((tag, index) => (
                        <Tag
                          key={index}
                          label={tag}
                          color={index % 2 === 0 ? 'orange' : 'green'}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {sortedTalents.length === 0 && (
            <div className="text-center py-16 glass rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">没有找到匹配的人才</p>
              <button
                onClick={clearFilters}
                className="text-primary text-sm hover:underline"
              >
                清除筛选条件
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
