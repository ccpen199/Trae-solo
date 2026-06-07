import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AdminFirmware() {
  const [firmware, setFirmware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newFirmware, setNewFirmware] = useState({
    device_category: 'ac',
    version: '',
    description: '',
    download_url: '',
  });

  useEffect(() => {
    loadFirmware();
  }, []);

  const loadFirmware = async () => {
    try {
      const res = await api.get('/firmware');
      setFirmware(res.data.firmware || []);
    } finally {
      setLoading(false);
    }
  };

  const submitFirmware = async (e) => {
    e.preventDefault();
    try {
      await api.post('/firmware', newFirmware);
      alert('固件上传成功');
      setShowModal(false);
      loadFirmware();
    } catch (err) {
      alert(err.response?.data?.error || '上传失败');
    }
  };

  const setGray = async (id, percent) => {
    try {
      await api.put(`/firmware/${id}/gray`, { gray_percent: percent });
      loadFirmware();
    } catch (err) {
      alert('设置失败');
    }
  };

  const publish = async (id) => {
    try {
      await api.put(`/firmware/${id}/publish`);
      loadFirmware();
    } catch (err) {
      alert('发布失败');
    }
  };

  const categoryLabels = {
    ac: '空调', fridge: '冰箱', washer: '洗衣机',
    tv: '电视', light: '灯具', water: '热水器',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">固件管理</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + 上传固件
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : firmware.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {firmware.map((fw) => (
              <div key={fw.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                      💾
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {categoryLabels[fw.device_category]} · v{fw.version}
                      </div>
                      <div className="text-sm text-gray-500">{fw.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        上传于 {fw.created_at?.slice(0, 16)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        fw.status === 'gray' ? 'bg-yellow-100 text-yellow-700' :
                        fw.status === 'published' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {fw.status === 'gray' ? `灰度 ${fw.gray_percent}%` :
                         fw.status === 'published' ? '全量发布' : '待发布'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        升级数：{fw.upgrade_count || 0}
                      </div>
                    </div>
                    {fw.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setGray(fw.id, 10)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm"
                        >
                          灰度10%
                        </button>
                        <button
                          onClick={() => publish(fw.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm"
                        >
                          全量发布
                        </button>
                      </div>
                    )}
                    {fw.status === 'gray' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setGray(fw.id, Math.min(100, fw.gray_percent + 20))}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm"
                        >
                          扩大灰度
                        </button>
                        <button
                          onClick={() => publish(fw.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm"
                        >
                          全量发布
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-4">💾</div>
            <p>暂无固件版本</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">上传新固件</h3>
            <form onSubmit={submitFirmware} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">设备类型</label>
                <select
                  value={newFirmware.device_category}
                  onChange={(e) => setNewFirmware({ ...newFirmware, device_category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">版本号</label>
                <input
                  type="text"
                  value={newFirmware.version}
                  onChange={(e) => setNewFirmware({ ...newFirmware, version: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="如: 1.2.3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">更新说明</label>
                <textarea
                  value={newFirmware.description}
                  onChange={(e) => setNewFirmware({ ...newFirmware, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg"
                >
                  上传
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
