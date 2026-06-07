import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';

const categories = ['家用电器', '数码产品', '家具家居', '母婴儿童', '图书文具', '运动户外', '其他'];
const conditions = [
  { value: 'new', label: '全新', desc: '未使用，包装完好' },
  { value: 'like-new', label: '几乎全新', desc: '使用次数少，外观无磨损' },
  { value: 'good', label: '成色良好', desc: '正常使用，有轻微磨损' },
  { value: 'fair', label: '有使用痕迹', desc: '外观有明显使用痕迹，功能正常' },
];

const ItemCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '家用电器',
    condition: 'good',
    location: '',
    phone: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert('闲置物品发布成功！');
    navigate('/marketplace');
  };

  const handleImageUpload = () => {
    const newImages = [...images, `https://picsum.photos/seed/${Date.now()}/400/300`];
    setImages(newImages.slice(0, 9));
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/marketplace')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">发布闲置</h1>
          <p className="text-gray-500 mt-1">让闲置物品找到新主人</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">物品图片</h3>
          <p className="text-sm text-gray-500 mb-4">最多可上传9张图片，第一张作为封面</p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square">
                <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {images.length < 9 && (
              <button
                type="button"
                onClick={handleImageUpload}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors"
              >
                <Upload className="w-8 h-8 mb-1" />
                <span className="text-xs">添加图片</span>
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <div className="space-y-4">
            <div>
              <label className="label">物品标题 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input text-lg"
                placeholder="请输入物品名称，如：小米空气净化器"
                required
                maxLength={50}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">转让价格 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input pl-8"
                    placeholder="0.00"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="label">原价</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="input pl-8"
                    placeholder="选填"
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="label">物品分类 <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      formData.category === cat
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">新旧程度 <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {conditions.map((cond) => (
                  <button
                    key={cond.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, condition: cond.value })}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      formData.condition === cond.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`font-medium ${
                      formData.condition === cond.value ? 'text-primary-700' : 'text-gray-900'
                    }`}>{cond.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{cond.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">物品描述 <span className="text-red-500">*</span></label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input min-h-[150px] resize-none"
                placeholder="请详细描述物品的使用情况、购买时间、转让原因等..."
                required
                maxLength={2000}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 font-serif">联系方式</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">所在楼栋 <span className="text-red-500">*</span></label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input"
                required
              >
                <option value="">请选择楼栋</option>
                <option value="1号楼">1号楼</option>
                <option value="2号楼">2号楼</option>
                <option value="3号楼">3号楼</option>
                <option value="5号楼">5号楼</option>
                <option value="6号楼">6号楼</option>
                <option value="8号楼">8号楼</option>
              </select>
            </div>
            <div>
              <label className="label">联系电话 <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                placeholder="请输入联系电话"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-accent-yellow-50 border border-accent-yellow-200 rounded-lg p-4">
          <p className="text-sm text-accent-yellow-800">
            <strong>温馨提示：</strong>请如实描述物品情况，交易时请双方当面验货。平台仅提供信息发布，不承担交易责任。
          </p>
        </div>

        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            className="btn-outline"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.title || !formData.price || !formData.description}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '发布中...' : '发布物品'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemCreate;
