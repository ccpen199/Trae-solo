import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function ChannelSubordinates() {
  const [subordinates, setSubordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    loadSubordinates();
    loadInviteCode();
  }, []);

  const loadSubordinates = async () => {
    try {
      const res = await api.get('/channels/subordinates');
      setSubordinates(res.data.subordinates || []);
    } finally {
      setLoading(false);
    }
  };

  const loadInviteCode = async () => {
    try {
      const res = await api.get('/channels/invite-code');
      setInviteCode(res.data.invite_code || '');
    } catch (err) {
      console.error(err);
    }
  };

  const generateInviteCode = async () => {
    try {
      const res = await api.post('/channels/invite-code');
      setInviteCode(res.data.invite_code);
    } catch (err) {
      alert(err.response?.data?.error || '生成失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">下级渠道管理</h2>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          生成邀请码
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">下级数量</div>
          <div className="text-3xl font-bold text-purple-600 mt-1">{subordinates.length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">本月贡献</div>
          <div className="text-3xl font-bold text-green-600 mt-1">
            ¥{(subordinates.reduce((sum, s) => sum + (s.total_sales || 0), 0) / 100).toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">我的佣金</div>
          <div className="text-3xl font-bold text-orange-600 mt-1">
            ¥{(subordinates.reduce((sum, s) => sum + (s.commission || 0), 0) / 100).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold">下级列表</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : subordinates.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {subordinates.map((sub) => (
              <div key={sub.id} className="p-5 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                    {(sub.name || sub.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{sub.name || sub.username}</div>
                    <div className="text-sm text-gray-500">{sub.tier_name || '普通经销商'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ¥{((sub.total_sales || 0) / 100).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">累计销售</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-4">👥</div>
            <p>暂无下级渠道商</p>
            <p className="text-sm mt-1">生成邀请码发展下级，赚取佣金</p>
          </div>
        )}
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">渠道邀请码</h3>
            {inviteCode ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <div className="text-3xl font-mono font-bold text-blue-600 tracking-widest">
                    {inviteCode}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    将此邀请码分享给您的合作伙伴
                  </div>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(inviteCode)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg"
                >
                  复制邀请码
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 text-center py-4">
                  您还没有邀请码，点击生成
                </p>
                <button
                  onClick={generateInviteCode}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-lg"
                >
                  生成邀请码
                </button>
              </div>
            )}
            <button
              onClick={() => setShowInvite(false)}
              className="w-full mt-3 border border-gray-300 text-gray-700 py-2.5 rounded-lg"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
