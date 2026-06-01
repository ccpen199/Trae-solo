import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, DollarSign, FileText, Tag } from 'lucide-react';
import { guideAPI, destinationAPI } from '../api';

const CreateGuide = () => {
  const [destinations, setDestinations] = useState([]);
  const [formData, setFormData] = useState({
    destination_id: '',
    title: '',
    content: '',
    itinerary: '',
    budget: '',
    preparation: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const response = await destinationAPI.getDestinations();
      setDestinations(response.data);
    } catch (error) {
      console.error('获取目的地失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.destination_id || !formData.title || !formData.content) {
      alert('请填写目的地、标题和内容');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        tags: formData.tags.split(/[,，]/).filter(tag => tag.trim())
      };
      const response = await guideAPI.createGuide(data);
      navigate(`/guide/${response.data.id}`);
    } catch (error) {
      console.error('发布攻略失败:', error);
      alert('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">发布攻略</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary-500" />
              目的地 <span className="text-red-500">*</span>
            </label>
            <select
              className="input-field"
              value={formData.destination_id}
              onChange={(e) => setFormData({ ...formData, destination_id: e.target.value })}
            >
              <option value="">请选择目的地</option>
              {destinations.map((dest) => (
                <option key={dest.id} value={dest.id}>{dest.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary-500" />
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="请输入攻略标题"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary-500" />
              行程安排
            </label>
            <textarea
              className="input-field min-h-32"
              placeholder="描述您的行程安排..."
              value={formData.itinerary}
              onChange={(e) => setFormData({ ...formData, itinerary: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary-500" />
              预算说明
            </label>
            <textarea
              className="input-field min-h-24"
              placeholder="描述您的预算情况..."
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary-500" />
              出行准备
            </label>
            <textarea
              className="input-field min-h-24"
              placeholder="描述需要的出行准备..."
              value={formData.preparation}
              onChange={(e) => setFormData({ ...formData, preparation: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary-500" />
              标签
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="输入标签，用逗号分隔"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary-500" />
              攻略详情 <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input-field min-h-64"
              placeholder="详细描述您的旅行攻略..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? '发布中...' : '发布攻略'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGuide;
