import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Play, Building2, Search, Filter } from 'lucide-react';
import { companies } from '../data/mockData';

const CompaniesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('全部');

  const industries = ['全部', '互联网科技', '餐饮咖啡', '健身运动', '生活服务', '零售'];

  const filteredCompanies = companies.filter(company => {
    const matchSearch = company.name.includes(searchTerm) || company.description.includes(searchTerm);
    const matchIndustry = selectedIndustry === '全部' || company.industry === selectedIndustry;
    return matchSearch && matchIndustry;
  });

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">发现优质企业</h1>
          <p className="text-gray-500">看视频了解企业，找到心仪的工作环境</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索企业名称或行业..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5" />
            筛选
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {industries.map(industry => (
            <button
              key={industry}
              onClick={() => setSelectedIndustry(industry)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedIndustry === industry
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
              }`}
            >
              {industry}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map(company => (
            <Link
              key={company.id}
              to={`/company/${company.id}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all card-hover border border-gray-100"
            >
              <div className="relative h-36 bg-gradient-to-br from-primary-400 to-accent-400">
                {company.videos.length > 0 && (
                  <div className="absolute inset-0">
                    <img
                      src={company.videos[0].thumbnail}
                      alt=""
                      className="w-full h-full object-cover opacity-50"
                    />
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-end gap-3">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md"
                    />
                    <div className="text-white">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{company.name}</h3>
                        {company.verified && (
                          <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/80">{company.industry}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{company.description}</p>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {company.size}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {company.location}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{formatNumber(company.stats.views)}</p>
                    <p className="text-xs text-gray-500">浏览量</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{formatNumber(company.stats.followers)}</p>
                    <p className="text-xs text-gray-500">关注者</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary-600">{company.jobs.length}</p>
                    <p className="text-xs text-gray-500">在招岗位</p>
                  </div>
                </div>

                {company.videos.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <Play className="w-5 h-5 text-primary-500" fill="currentColor" />
                    <span className="text-sm text-gray-600">
                      <span className="font-medium text-gray-800">{company.videos.length}</span> 个企业视频
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompaniesPage;
