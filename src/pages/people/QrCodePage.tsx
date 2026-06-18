import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Share2, RefreshCw, Copy, Check, QrCode } from 'lucide-react';
import { getPersonalQRCode, generateShareLink } from '../../services/api';
import type { PersonalQRCode } from '../../../shared/types';

export default function QrCodePage() {
  const [qrCode, setQrCode] = useState<PersonalQRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'product' | 'store'>('personal');

  useEffect(() => {
    fetchQRCode();
  }, []);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      const res = await getPersonalQRCode();
      if (res.code === 0) {
        setQrCode(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch QR code:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchQRCode();
  };

  const handleCopyLink = async () => {
    if (qrCode?.url) {
      await navigator.clipboard.writeText(qrCode.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const canvas = document.querySelector('#personal-qrcode canvas') as HTMLCanvasElement | null;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `我的展业二维码_${new Date().toLocaleDateString()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const tabs = [
    { key: 'personal', label: '个人名片', desc: '分享您的个人展业名片' },
    { key: 'product', label: '产品推广', desc: '推广指定产品链接' },
    { key: 'store', label: '门店引流', desc: '引导客户到店体验' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <QrCode className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">我的展业二维码</h2>
        <p className="text-gray-500">生成专属二维码，一键分享展业内容，自动追踪传播效果</p>
      </div>

      <div className="flex gap-4 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 p-4 rounded-xl text-left transition-all ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-white border border-gray-200 hover:border-primary-300'
            }`}
          >
            <p className={`font-semibold ${activeTab === tab.key ? 'text-white' : 'text-gray-900'}`}>
              {tab.label}
            </p>
            <p className={`text-sm mt-1 ${activeTab === tab.key ? 'text-primary-100' : 'text-gray-500'}`}>
              {tab.desc}
            </p>
          </button>
        ))}
      </div>

      <div className="card p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-primary-500/20 to-brand-500/20 rounded-3xl blur-xl"></div>
            <div id="personal-qrcode" className="relative bg-white p-6 rounded-2xl shadow-lg border-4 border-white">
              {qrCode && (
                <QRCodeCanvas
                  value={qrCode.url}
                  size={240}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#065f46"
                />
              )}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-medium">
              扫码识别
            </div>
          </div>

          <div className="flex-1 w-full space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">个人名片二维码</h3>
              <p className="text-gray-500 text-sm mb-4">
                客户扫码后将看到您的个人展业主页，包含您的介绍、产品推荐和联系方式
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-500 mb-1">分享链接</p>
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-sm text-gray-700 font-mono truncate">
                    {qrCode?.url}
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="复制链接"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-500" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">有效期至</p>
                  <p className="font-semibold text-gray-900">
                    {qrCode?.expireAt ? new Date(qrCode.expireAt).toLocaleDateString() : '长期有效'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">扫码次数</p>
                  <p className="font-semibold text-gray-900">128 次</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleDownload} className="btn btn-primary flex-1">
                <Download className="w-4 h-4 mr-2" />
                下载二维码
              </button>
              <button onClick={handleRefresh} className="btn btn-secondary flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                重新生成
              </button>
              <button onClick={handleCopyLink} className="btn btn-secondary">
                <Share2 className="w-4 h-4 mr-2" />
                分享
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-sm text-amber-800">
          💡 <strong>使用提示：</strong>将二维码打印在名片上或分享到朋友圈，客户扫码后系统将自动记录并归属到您的名下，助您精准获客。
        </p>
      </div>
    </div>
  );
}
