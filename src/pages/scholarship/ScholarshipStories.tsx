import { useState } from 'react';
import { mockScholarshipStories, mockScholarships } from '../../data/mockData';
import { Heart, MessageCircle, Filter, Search, User } from 'lucide-react';

const ScholarshipStories = () => {
  const [selectedScholarship, setSelectedScholarship] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStories = mockScholarshipStories.filter((story) => {
    const matchesScholarship =
      selectedScholarship === 'all' || story.scholarshipId === selectedScholarship;
    const matchesSearch =
      story.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.studentAlias.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesScholarship && matchesSearch;
  });

  const totalLikes = mockScholarshipStories.reduce(
    (sum, s) => sum + s.likes,
    0
  );

  const stats = [
    {
      label: '励志故事',
      value: mockScholarshipStories.length,
      icon: MessageCircle,
      color: 'pink',
    },
    {
      label: '累计点赞',
      value: totalLikes,
      icon: Heart,
      color: 'red',
    },
    {
      label: '匿名分享者',
      value: mockScholarshipStories.length,
      icon: User,
      color: 'blue',
    },
  ];

  const colorClasses: Record<string, string> = {
    pink: 'bg-pink-100 text-pink-600',
    red: 'bg-red-100 text-red-500',
    blue: 'bg-blue-100 text-blue-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索故事内容、昵称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedScholarship}
              onChange={(e) => setSelectedScholarship(e.target.value)}
              className="h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部奖学金</option>
              {mockScholarships.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[stat.color]}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {filteredStories.map((story) => (
          <div
            key={story.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {story.studentAlias}
                </p>
                <p className="text-xs text-gray-400">{story.date}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                {story.scholarshipName}
              </span>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
              {story.content}
            </p>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors">
                <Heart className="w-4 h-4" />
                <span>{story.likes}</span>
              </button>
              <button className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors">
                阅读全文
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScholarshipStories;
