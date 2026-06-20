import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, Play, Search, Filter, GraduationCap } from 'lucide-react';
import { jobSeekers } from '../data/mockData';

const SeekersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSeekers = jobSeekers.filter(seeker =>
    seeker.name.includes(searchTerm) ||
    seeker.title.includes(searchTerm) ||
    seeker.skills.some(skill => skill.includes(searchTerm))
  );

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">发现优秀人才</h1>
          <p className="text-gray-500">视频简历，更直观地了解候选人</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索姓名、职位或技能..."
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSeekers.map(seeker => (
            <Link
              key={seeker.id}
              to={`/seeker/${seeker.id}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all card-hover border border-gray-100"
            >
              <div className="relative h-48 bg-gradient-to-br from-primary-400 to-purple-400">
                {seeker.resumeVideo && (
                  <div className="absolute inset-0">
                    <img
                      src={seeker.resumeVideo.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}
                {seeker.resumeVideo && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-white text-xs">
                    <Play className="w-3 h-3" fill="white" />
                    视频简历
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="flex items-end gap-3">
                    <img
                      src={seeker.avatar}
                      alt={seeker.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md"
                    />
                    <div className="text-white">
                      <h3 className="font-bold text-lg">{seeker.name}</h3>
                      <p className="text-sm text-white/80">{seeker.title}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {seeker.experience}
                  </span>
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" />
                    {seeker.education}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {seeker.location}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {seeker.skills.slice(0, 4).map(skill => (
                    <span key={skill} className="tag tag-blue">{skill}</span>
                  ))}
                  {seeker.skills.length > 4 && (
                    <span className="tag tag-gray text-gray-500">+{seeker.skills.length - 4}</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-accent-600 font-semibold">
                    期望 {seeker.expectedSalary}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{formatNumber(seeker.views)} 浏览</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeekersPage;
