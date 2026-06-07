import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, AlertTriangle, Clock, QrCode, Eye, Search } from 'lucide-react';
import { licenseApi } from '../api';
import { License } from '../types';

const Licenses: React.FC = () => {
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'valid' | 'expired'>('all');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const loadLicenses = async () => {
      setLoading(true);
      try {
        const res = await licenseApi.getMyLicenses();
        if (res.success) {
          setLicenses(res.data || []);
        }
      } catch (e) {
        console.error('Load licenses error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadLicenses();
  }, []);

  const filteredLicenses = licenses.filter((l) => {
    const matchesFilter = filter === 'all' || l.status === filter;
    const matchesKeyword =
      !keyword ||
      l.licenseType.includes(keyword) ||
      l.licenseNumber.includes(keyword) ||
      l.holderName.includes(keyword);
    return matchesFilter && matchesKeyword;
  });

  const statusConfig = {
    valid: {
      label: '有效',
      color: 'bg-green-100 text-green-600',
      icon: CheckCircle,
      borderColor: 'border-green-200',
      bgGradient: 'from-green-500 to-green-600',
    },
    expired: {
      label: '已过期',
      color: 'bg-red-100 text-red-600',
      icon: AlertTriangle,
      borderColor: 'border-red-200',
      bgGradient: 'from-gray-400 to-gray-500',
    },
    invalid: {
      label: '无效',
      color: 'bg-gray-100 text-gray-600',
      icon: Clock,
      borderColor: 'border-gray-200',
      bgGradient: 'from-gray-400 to-gray-500',
    },
  };

  const stats = {
    total: licenses.length,
    valid: licenses.filter((l) => l.status === 'valid').length,
    expired: licenses.filter((l) => l.status === 'expired').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">电子证照亮证中心</h2>
        <p className="text-primary-100 mb-6">
          32类电子证照统一管理，动态二维码亮证，使用记录全程审计
        </p>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-primary-200 text-sm mb-1">全部证照</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-primary-200 text-sm mb-1">有效证照</p>
            <p className="text-3xl font-bold text-green-300">{stats.valid}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-primary-200 text-sm mb-1">已过期</p>
            <p className="text-3xl font-bold text-red-300">{stats.expired}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'valid', label: '有效' },
              { key: 'expired', label: '已过期' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索证照名称、编号..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filteredLicenses.map((license) => {
          const status = statusConfig[license.status];
          const StatusIcon = status.icon;
          return (
            <div
              key={license.id}
              className={`bg-white rounded-xl overflow-hidden shadow-sm border ${status.borderColor} hover:shadow-md transition-shadow`}
            >
              <div className={`bg-gradient-to-r ${status.bgGradient} p-5 text-white`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${status.color} bg-white`}>
                    <StatusIcon className="w-3 h-3 inline mr-1" />
                    {status.label}
                  </span>
                </div>
                <h4 className="text-lg font-semibold mb-1">{license.licenseType}</h4>
                <p className="text-white/80 text-sm font-mono">{license.licenseNumber}</p>
              </div>
              <div className="p-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">持有人</span>
                    <span className="text-gray-900 font-medium">{license.holderName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">签发机关</span>
                    <span className="text-gray-900">{license.issuedBy}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">签发日期</span>
                    <span className="text-gray-900">
                      {new Date(license.issueDate).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  {license.expiryDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">有效期至</span>
                      <span className={`${license.status === 'expired' ? 'text-red-600' : 'text-gray-900'}`}>
                        {new Date(license.expiryDate).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/licenses/${license.id}`)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    查看详情
                  </button>
                  <button
                    onClick={() => navigate(`/licenses/${license.id}?showQr=1`)}
                    className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm text-white transition-colors flex items-center justify-center"
                  >
                    <QrCode className="w-4 h-4 mr-1" />
                    亮证
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLicenses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无相关证照</p>
        </div>
      )}
    </div>
  );
};

export default Licenses;
