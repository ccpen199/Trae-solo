import { useState } from 'react';
import {
  Upload,
  Search,
  Ruler,
  Home,
  Users,
  Sparkles,
  Building2,
  ArrowRight,
  MapPin,
  Wallet,
  Star,
} from 'lucide-react';
import CaseCard from '@/components/CaseCard';
import { mockCases } from '@/mock/data';

export default function FloorplanMatch() {
  const [uploaded, setUploaded] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matched, setMatched] = useState(false);

  const [formData, setFormData] = useState({
    area: '',
    bedrooms: '',
    bathrooms: '',
    layout: '',
    style: '',
    budgetMin: '',
    budgetMax: '',
  });

  const handleUpload = () => {
    setUploaded(true);
  };

  const handleMatch = () => {
    setMatching(true);
    setTimeout(() => {
      setMatching(false);
      setMatched(true);
    }, 1500);
  };

  const matchedCases = mockCases.slice(0, 6);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full border border-primary-100 mb-4">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span className="text-sm text-primary-700 font-medium">AI 智能匹配</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-heading">
            户型图智能匹配
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            上传户型图或填写户型信息，AI 将从千万级案例库中为你匹配最相似的真实装修方案
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary-600" />
                上传户型图
              </h2>
              <div
                onClick={handleUpload}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  uploaded
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }`}
              >
                {uploaded ? (
                  <div>
                    <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-3">
                      <Building2 className="w-8 h-8 text-primary-600" />
                    </div>
                    <p className="font-medium text-gray-900">floorplan.jpg</p>
                    <p className="text-sm text-gray-500 mt-1">点击重新上传</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-700">点击或拖拽上传户型图</p>
                    <p className="text-sm text-gray-500 mt-1">支持 JPG、PNG、PDF 格式</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-primary-600" />
                填写户型信息
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Ruler className="w-4 h-4 inline mr-1 text-gray-400" />
                    面积 (㎡)
                  </label>
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="请输入面积"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Users className="w-4 h-4 inline mr-1 text-gray-400" />
                    户型
                  </label>
                  <select
                    value={formData.layout}
                    onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
                    className="input-base"
                  >
                    <option value="">请选择户型</option>
                    <option value="一居室">一居室</option>
                    <option value="两居室">两居室</option>
                    <option value="三居室">三居室</option>
                    <option value="四居室">四居室</option>
                    <option value="复式">复式</option>
                    <option value="别墅">别墅</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">卧室数</label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    placeholder="例如：3"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">卫生间数</label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    placeholder="例如：2"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">装修风格</label>
                  <select
                    value={formData.style}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    className="input-base"
                  >
                    <option value="">不限风格</option>
                    <option value="现代简约">现代简约</option>
                    <option value="北欧风格">北欧风格</option>
                    <option value="新中式">新中式</option>
                    <option value="轻奢风格">轻奢风格</option>
                    <option value="日式风格">日式风格</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Wallet className="w-4 h-4 inline mr-1 text-gray-400" />
                    预算范围 (万)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.budgetMin}
                      onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                      placeholder="最低"
                      className="input-base"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      value={formData.budgetMax}
                      onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                      placeholder="最高"
                      className="input-base"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleMatch}
              disabled={matching}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {matching ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI 智能匹配中...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  开始智能匹配
                </>
              )}
            </button>
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-accent-500" />
                {matched ? `匹配结果 (${matchedCases.length}个)` : '匹配结果预览'}
              </h2>
              {matched ? (
                <div className="space-y-4">
                  {matchedCases.map((caseItem) => (
                    <div key={caseItem.id}>
                      <CaseCard caseData={caseItem} variant="compact" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Search className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 mb-2">填写信息后点击匹配</p>
                  <p className="text-sm text-gray-400">AI 将为你推荐最相似的真实装修案例</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
