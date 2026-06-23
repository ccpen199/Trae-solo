import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Mic, MessageSquare, Leaf, TrendingUp, Users, ChevronRight, Info, Recycle, AlertTriangle, Droplets } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { standardsApi } from '@/services/api';
import { City, GarbageCategory } from '../../shared/types';

export default function Home() {
  const navigate = useNavigate();
  const { currentCity, categories, setCategories } = useAppStore();
  const [localCity, setLocalCity] = useState<City | null>(null);
  const [localCategories, setLocalCategories] = useState<GarbageCategory[]>([]);

  useEffect(() => {
    if (currentCity) {
      setLocalCity(currentCity);
      loadCategories(currentCity.id);
    }
  }, [currentCity]);

  const loadCategories = async (cityId: string) => {
    try {
      const res = await standardsApi.getCategories(cityId);
      setLocalCategories(res.categories);
      setCategories(res.categories);
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  };

  const featureCards = [
    {
      icon: Camera,
      title: '拍照识别',
      description: 'AI智能识别垃圾类型，一键获取分类结果',
      path: '/camera',
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    {
      icon: Mic,
      title: '语音查询',
      description: '语音提问，快速了解垃圾分类知识',
      path: '/voice',
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'bg-teal-50',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600'
    },
    {
      icon: MessageSquare,
      title: '错误反馈',
      description: '遇到分类错误？提交反馈帮助我们改进',
      path: '/feedback',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    }
  ];

  const knowledgeItems = [
    { icon: Recycle, title: '可回收物', desc: '废纸、塑料、玻璃、金属等可循环利用的废弃物', color: 'text-blue-500' },
    { icon: AlertTriangle, title: '有害垃圾', desc: '废电池、废药品、废油漆等对人体健康有害的垃圾', color: 'text-red-500' },
    { icon: Droplets, title: '厨余垃圾', desc: '剩菜剩饭、果皮等易腐烂的生物质废弃物', color: 'text-emerald-500' },
    { icon: TrendingUp, title: '其他垃圾', desc: '除上述三类之外的其他生活废弃物', color: 'text-gray-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Leaf className="w-4 h-4" />
            <span>{localCity?.name || '城市'}垃圾分类智能服务</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            让垃圾分类
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              {' '}更简单
            </span>
          </h1>
          <p className="text-gray-500 text-lg">AI驱动的智能识别系统，助您轻松掌握分类知识</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {featureCards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              className={`${card.bgColor} rounded-2xl p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1 group`}
            >
              <div className={`${card.iconBg} w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-5`}>
                <card.icon className={`w-7 h-7 ${card.iconColor}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{card.title}</h3>
              <p className="text-gray-500 mb-4">{card.description}</p>
              <div className="flex items-center gap-1 text-emerald-600 font-medium">
                <span>立即体验</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-green-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Info className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{localCity?.name}垃圾分类标准公告</h2>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-gray-600 leading-relaxed">
              根据《{localCity?.name}市生活垃圾管理条例》，本市生活垃圾分为
              <span className="font-semibold text-emerald-600">可回收物、有害垃圾、厨余垃圾、其他垃圾</span>
              四大类。请市民按照标准分类投放，共同建设绿色美好家园。
            </p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Leaf className="w-6 h-6 text-emerald-600" />
              分类知识普及
            </h2>
            <button
              onClick={() => navigate('/search')}
              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors"
            >
              搜索更多
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {knowledgeItems.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-5 shadow-md border border-gray-100 transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className={`${item.color} mb-3`}>
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {localCategories.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              本地分类标准
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {localCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-xl p-4 text-center transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: cat.color + '15' }}
                >
                  <span className="text-3xl mb-2 block">{cat.icon}</span>
                  <div
                    className="font-semibold text-sm px-3 py-1 rounded-full inline-block text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
