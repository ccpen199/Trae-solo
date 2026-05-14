import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, MapPin, Briefcase, User } from 'lucide-react';

const Search = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([
    { id: 1, nickname: '小雨', age: 24, city: '北京', industry: '互联网', avatar: 'https://picsum.photos/seed/g1/100/100' },
    { id: 2, nickname: '思琪', age: 23, city: '南京', industry: '文化传媒', avatar: 'https://picsum.photos/seed/g2/100/100' },
    { id: 3, nickname: '阿杰', age: 26, city: '上海', industry: '互联网', avatar: 'https://picsum.photos/seed/b1/100/100' },
  ]);

  const handleSearch = () => {
    console.log('搜索:', keyword);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">搜索</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索用户昵称..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-red-500 text-white rounded-lg text-sm"
          >
            搜索
          </button>
        </div>

        <div className="space-y-3">
          {results.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/user/${user.id}`)}
            >
              <img
                src={user.avatar}
                alt={user.nickname}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">
                  {user.nickname}, {user.age}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {user.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {user.industry}
                  </span>
                </div>
              </div>
              <button className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                <User className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Search;