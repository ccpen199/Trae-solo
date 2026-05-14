import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Briefcase, GraduationCap, Heart } from 'lucide-react';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const user = {
    id: userId,
    nickname: '小雨',
    age: 24,
    gender: '女',
    graduationStatus: '已毕业',
    industry: '互联网/科技',
    profession: '产品',
    hometown: '杭州',
    currentCity: '北京',
    avatar: 'https://picsum.photos/seed/girl1/400/400',
    question: {
      content: '你理想的周末是怎样度过的？',
    },
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
          <h1 className="text-xl font-bold text-gray-800">个人资料</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          <div className="relative h-72 bg-gradient-to-br from-pink-100 to-red-100">
            <img
              src={user.avatar}
              alt={user.nickname}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {user.nickname}, {user.age}
            </h2>
            <p className="text-sm text-pink-500 font-medium">{user.gender}</p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <GraduationCap className="w-5 h-5" />
                <span>{user.graduationStatus}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Briefcase className="w-5 h-5" />
                <span>{user.industry} · {user.profession}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span>现居 {user.currentCity} · 家乡 {user.hometown}</span>
              </div>
            </div>

            {user.question && (
              <div className="mt-6 bg-red-50 rounded-xl p-4">
                <p className="text-sm text-red-600 mb-2">TA 的破冰问题：</p>
                <p className="text-gray-800 font-medium">"{user.question.content}"</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => alert('发送好友申请')}
          className="w-full py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
        >
          <Heart className="w-5 h-5" />
          发送好友申请
        </button>
      </div>
    </div>
  );
};

export default UserProfile;