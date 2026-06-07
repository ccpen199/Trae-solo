import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function ScenesPage() {
  const [templates, setTemplates] = useState([]);
  const [myScenes, setMyScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newScene, setNewScene] = useState({ name: '', icon: '🎬', devices: [] });

  useEffect(() => {
    loadScenes();
  }, []);

  const loadScenes = async () => {
    try {
      const res = await api.get('/scenes/templates');
      setTemplates(res.data.templates || []);
      const myRes = await api.get('/scenes');
      setMyScenes(myRes.data.scenes || []);
    } finally {
      setLoading(false);
    }
  };

  const triggerScene = async (sceneId) => {
    try {
      await api.post(`/scenes/${sceneId}/trigger`);
      alert('场景执行成功！');
    } catch (err) {
      alert('场景执行失败');
    }
  };

  const createFromTemplate = async (template) => {
    try {
      await api.post('/scenes', {
        name: template.name,
        icon: template.icon,
        description: template.description,
        actions: template.default_actions || [],
      });
      alert('场景创建成功！');
      loadScenes();
    } catch (err) {
      alert('创建失败');
    }
  };

  const deleteScene = async (sceneId) => {
    if (!confirm('确定删除此场景？')) return;
    try {
      await api.delete(`/scenes/${sceneId}`);
      loadScenes();
    } catch (err) {
      alert('删除失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
            我的场景
          </button>
          <button
            onClick={() => setCreating(true)}
            className="bg-white text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium"
          >
            + 创建场景
          </button>
        </div>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">创建场景</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">场景名称</label>
                <input
                  type="text"
                  value={newScene.name}
                  onChange={(e) => setNewScene({ ...newScene, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="如：观影模式"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择图标</label>
                <div className="flex flex-wrap gap-2">
                  {['🎬', '🌙', '☀️', '🏠', '🚪', '🎮', '📚', '🍽️'].map(icon => (
                    <button
                      key={icon}
                      onClick={() => setNewScene({ ...newScene, icon })}
                      className={`w-10 h-10 rounded-lg text-xl ${
                        newScene.icon === icon ? 'bg-blue-500 text-white' : 'bg-gray-100'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setCreating(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (newScene.name) {
                    alert('创建成功（演示）');
                    setCreating(false);
                  }
                }}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">推荐模板</h3>
        <div className="grid grid-cols-4 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
              <div className="text-3xl mb-2">{template.icon}</div>
              <div className="font-medium text-gray-900">{template.name}</div>
              <div className="text-xs text-gray-500 mt-1">{template.description}</div>
              <div className="text-xs text-blue-600 mt-2">{template.device_count} 个设备联动</div>
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => triggerScene(template.id)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
                >
                  立即执行
                </button>
                <button
                  onClick={() => createFromTemplate(template)}
                  className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm"
                >
                  保存到我的场景
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">我的场景</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : myScenes.length > 0 ? (
          <div className="grid grid-cols-4 gap-4">
            {myScenes.map((scene) => (
              <div key={scene.id} className="p-4 bg-gray-50 rounded-xl relative group">
                <button
                  onClick={() => deleteScene(scene.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                >
                  ×
                </button>
                <div className="text-3xl mb-2">{scene.icon}</div>
                <div className="font-medium text-gray-900">{scene.name}</div>
                <div className="text-xs text-gray-500 mt-1">{scene.description}</div>
                <button
                  onClick={() => triggerScene(scene.id)}
                  className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
                >
                  执行
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-4">🎬</div>
            <p>还没有创建场景</p>
            <p className="text-sm mt-1">从上方模板创建或自定义场景</p>
          </div>
        )}
      </div>
    </div>
  );
}
