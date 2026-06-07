import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, CheckCircle, QrCode, Clock, FileText, User, Building2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { licenseApi } from '../api';
import { License, LicenseUsageRecord, QrCodeData } from '../types';

const LicenseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [license, setLicense] = useState<License | null>(null);
  const [usageRecords, setUsageRecords] = useState<LicenseUsageRecord[]>([]);
  const [qrData, setQrData] = useState<QrCodeData | null>(null);
  const [showQr, setShowQr] = useState(searchParams.get('showQr') === '1');
  const [loading, setLoading] = useState(true);
  const [generatingQr, setGeneratingQr] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [licenseRes, recordsRes] = await Promise.all([
          licenseApi.getById(parseInt(id)),
          licenseApi.getUsageRecords(parseInt(id)),
        ]);

        if (licenseRes.success) {
          setLicense(licenseRes.data || null);
        }
        if (recordsRes.success) {
          setUsageRecords(recordsRes.data || []);
        }

        if (searchParams.get('showQr') === '1') {
          generateQrCode();
        }
      } catch (e) {
        console.error('Load license detail error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const generateQrCode = async () => {
    if (!id) return;
    setGeneratingQr(true);
    try {
      const res = await licenseApi.generateQrCode(parseInt(id));
      if (res.success && res.data) {
        setQrData(res.data);
        setShowQr(true);
      }
    } catch (e) {
      console.error('Generate QR code error:', e);
    } finally {
      setGeneratingQr(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!license) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">证照不存在</p>
        <button
          onClick={() => navigate('/licenses')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          返回列表
        </button>
      </div>
    );
  }

  const licenseFields = license.data ? Object.entries(license.data) : [];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/licenses')}
        className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回证照列表
      </button>

      {showQr && qrData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">电子证照二维码</h3>
              <p className="text-sm text-gray-500">{license.licenseType}</p>
            </div>
            <div className="bg-white border-2 border-primary-200 rounded-xl p-6 mb-6">
              <div className="flex justify-center">
                <QRCodeSVG value={qrData.qrCode} size={200} level="H" includeMargin />
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">持有人</span>
                <span className="text-gray-900 font-medium">{qrData.holderName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">证照编号</span>
                <span className="text-gray-900 font-mono">{qrData.licenseNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">有效期至</span>
                <span className="text-primary-600 font-medium">
                  {new Date(qrData.expiresAt).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-yellow-700">
                <Clock className="w-4 h-4 inline mr-1" />
                本二维码仅用于政务服务场景验证，5分钟内有效，请勿截图转发给他人。
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowQr(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={generateQrCode}
                disabled={generatingQr}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                {generatingQr ? '刷新中...' : '刷新二维码'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <CreditCard className="w-8 h-8" />
            </div>
            <div className="ml-6">
              <h1 className="text-2xl font-bold mb-1">{license.licenseType}</h1>
              <p className="text-primary-200 font-mono">{license.licenseNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={generateQrCode}
              disabled={generatingQr || license.status !== 'valid'}
              className="flex items-center px-6 py-3 bg-white text-primary-600 font-medium rounded-xl hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <QrCode className="w-5 h-5 mr-2" />
              {generatingQr ? '生成中...' : '亮证'}
            </button>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-4 gap-6">
          <div>
            <p className="text-primary-200 text-sm mb-1">持有人</p>
            <p className="text-lg font-medium">{license.holderName}</p>
          </div>
          <div>
            <p className="text-primary-200 text-sm mb-1">签发机关</p>
            <p className="text-lg font-medium">{license.issuedBy}</p>
          </div>
          <div>
            <p className="text-primary-200 text-sm mb-1">签发日期</p>
            <p className="text-lg font-medium">
              {new Date(license.issueDate).toLocaleDateString('zh-CN')}
            </p>
          </div>
          <div>
            <p className="text-primary-200 text-sm mb-1">有效期至</p>
            <p className="text-lg font-medium">
              {license.expiryDate
                ? new Date(license.expiryDate).toLocaleDateString('zh-CN')
                : '长期有效'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">证照详情</h3>
          <div className="grid grid-cols-2 gap-4">
            {licenseFields.map(([key, value]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">{key}</p>
                <p className="text-sm font-medium text-gray-900">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">证照信息</h3>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">持有人</p>
                <p className="text-sm font-medium text-gray-900">{license.holderName}</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <Building2 className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">签发机关</p>
                <p className="text-sm font-medium text-gray-900">{license.issuedBy}</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">证照状态</p>
                <p
                  className={`text-sm font-medium ${
                    license.status === 'valid' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {license.status === 'valid' ? '有效' : license.status === 'expired' ? '已过期' : '无效'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">使用记录</h3>
        {usageRecords.length === 0 ? (
          <p className="text-center text-gray-500 py-8">暂无使用记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">使用场景</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作人</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">使用地点</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">使用时间</th>
                </tr>
              </thead>
              <tbody>
                {usageRecords.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-gray-900">{record.scenario}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{record.operator}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{record.location}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(record.createdAt).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LicenseDetail;
