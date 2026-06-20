import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Play, Search, Clock, GraduationCap } from 'lucide-react';
import { jobs } from '../data/mockData';

const JobsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [salaryRange, setSalaryRange] = useState('全部');

  const salaryRanges = ['全部', '5k以下', '5k-10k', '10k-20k', '20k-30k', '30k以上'];

  const filteredJobs = jobs.filter(job => {
    const matchSearch = job.title.includes(searchTerm) ||
      job.companyName.includes(searchTerm) ||
      job.tags.some(tag => tag.includes(searchTerm));
    return matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">热门岗位</h1>
          <p className="text-gray-500">视频看岗，更真实的工作体验</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索职位、公司或技能..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <Link
            to="/map"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors"
          >
            <MapPin className="w-5 h-5" />
            地图找岗
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {salaryRanges.map(range => (
            <button
              key={range}
              onClick={() => setSalaryRange(range)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                salaryRange === range
                  ? 'bg-accent-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-accent-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredJobs.map(job => (
            <Link
              key={job.id}
              to={`/company/${job.companyId}`}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all card-hover border border-gray-100 block"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 text-lg">{job.title}</h3>
                    <p className="text-accent-600 font-bold text-xl">{job.salary}</p>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5">
                      <img src={job.companyLogo} alt="" className="w-5 h-5 rounded-full" />
                      <span className="text-sm text-gray-600">{job.companyName}</span>
                    </div>
                    {job.verified && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">
                        已认证
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {job.experience}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <GraduationCap className="w-4 h-4" />
                      {job.education}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {job.tags.map(tag => (
                      <span key={tag} className="tag tag-blue">{tag}</span>
                    ))}
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2">{job.description}</p>
                </div>

                {job.videoThumbnail && (
                  <div className="w-full sm:w-32 h-44 sm:h-24 rounded-xl overflow-hidden relative flex-shrink-0">
                    <img
                      src={job.videoThumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" fill="white" />
                    </div>
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 text-white text-xs rounded">
                      视频
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{job.type}</span>
                  <span>·</span>
                  <span>{job.applications}人投递</span>
                  <span>·</span>
                  <span>{job.postedDate}发布</span>
                </div>
                <button className="px-5 py-2 bg-primary-500 text-white text-sm font-medium rounded-full hover:bg-primary-600 transition-colors">
                  立即投递
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
