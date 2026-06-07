import React, { useState, useEffect, useCallback } from 'react';
import { trackingAPI, pickupAPI, exceptionAPI, orderAPI, companyAPI } from '../services/api';

const COMPANY_MAP = {
  SF: '顺丰速运', ZTO: '中通快递', YTO: '圆通速递',
  YD: '韵达快递', STO: '申通快递', EMS: 'EMS',
  JD: '京东物流', DBL: '德邦快递', JTSD: '极兔速递', CHP: '邮政小包'
};

function recognizeCompany(trackingNo) {
  const upper = trackingNo.toUpperCase();
  for (const [prefix, name] of Object.entries(COMPANY_MAP)) {
    if (upper.startsWith(prefix)) return name;
  }
  return '未知快递公司';
}

const STATUS_MAP = { delivered: '已送达', transit: '运输中', pending: '待揽收', exception: '异常' };
const STATUS_CLASS = {
  delivered: 'bg-green-100 text-green-800',
  transit: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  exception: 'bg-red-100 text-red-800'
};

const NODE_COLORS = {
  '揽收': 'bg-blue-500', '运输': 'bg-indigo-500', '派送': 'bg-orange-500',
  '签收': 'bg-green-600', '异常': 'bg-red-500'
};

function getNodeColor(status) {
  for (const [key, cls] of Object.entries(NODE_COLORS)) {
    if (status.includes(key)) return cls + ' text-white';
  }
  return 'bg-gray-400 text-white';
}

function Tracking() {
  const [inputMode, setInputMode] = useState('tracking');
  const [trackingNo, setTrackingNo] = useState('SF1234567890');
  const [phone, setPhone] = useState('13800138000');
  const [smsContent, setSmsContent] = useState('【菜鸟驿站】您有一个包裹已到站，取件码：6-8-2031，请尽快前往菜鸟驿站(朝阳SOHO店)取件。');
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [exceptionData, setExceptionData] = useState(null);
  const [exceptionLogs, setExceptionLogs] = useState([]);
  const [pickupCodes, setPickupCodes] = useState([]);
  const [parsedSms, setParsedSms] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    orderAPI.getByUser(1).then(setUserOrders).catch(() => {});
    companyAPI.list().then(setCompanies).catch(() => {});
    handleTrack('SF1234567890');
    loadPickupCodes();
  }, []);

  const loadPickupCodes = async () => {
    try {
      const data = await pickupAPI.getByPhone('13800138000');
      if (data && data.length > 0) setPickupCodes(data);
    } catch {}
  };

  const handleTrack = useCallback(async (overrideNo) => {
    const no = overrideNo || trackingNo;
    if (!no.trim()) { setError('请输入快递单号'); return; }
    setLoading(true);
    setError('');
    setTrackingData(null);
    setPrediction(null);
    setExceptionData(null);
    setExceptionLogs([]);
    try {
      const data = await trackingAPI.get(no);
      setTrackingData(data);
      try {
        const pred = await trackingAPI.predict(no);
        setPrediction(pred);
      } catch {}
      if (data.status === 'exception') {
        const orderId = data.id;
        try {
          const analysis = await exceptionAPI.autoAnalyze(orderId);
          setExceptionData(analysis);
        } catch {}
        try {
          const logs = await exceptionAPI.getByOrder(orderId);
          setExceptionLogs(logs || []);
        } catch {}
      }
    } catch (err) {
      setError('未找到该运单，请检查单号是否正确');
    } finally {
      setLoading(false);
    }
  }, [trackingNo]);

  const handlePhoneSearch = async () => {
    if (!phone.trim()) { setError('请输入手机号'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await pickupAPI.getByPhone(phone);
      if (data && data.length > 0) {
        setPickupCodes(data);
        setError('');
      } else {
        setError('未找到该手机号关联的取件码');
      }
    } catch { setError('查询失败，请重试'); }
    finally { setLoading(false); }
  };

  const handleSmsParse = async () => {
    if (!smsContent.trim()) { setError('请输入短信内容'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await pickupAPI.parse(smsContent);
      setParsedSms(data);
    } catch { setError('解析失败，请重试'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">查快递</h1>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <div className="font-bold text-blue-700 mb-1">快速查询</div>
          <div className="text-sm text-gray-600">点击直接查询种子数据中的运单</div>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => { setTrackingNo('SF1234567890'); setInputMode('tracking'); handleTrack('SF1234567890'); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm">SF1234567890(已签收)</button>
          <button onClick={() => { setTrackingNo('ZTO9876543210'); setInputMode('tracking'); handleTrack('ZTO9876543210'); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm">ZTO9876543210(运输中)</button>
          <button onClick={() => { setTrackingNo('SF9998887776'); setInputMode('tracking'); handleTrack('SF9998887776'); }} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-medium text-sm">SF9998887776(异常)</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex space-x-4 mb-4">
          <button onClick={() => setInputMode('tracking')} className={`px-6 py-2 rounded-lg font-medium transition-colors ${inputMode === 'tracking' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>单号查询</button>
          <button onClick={() => setInputMode('phone')} className={`px-6 py-2 rounded-lg font-medium transition-colors ${inputMode === 'phone' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>手机号查询</button>
          <button onClick={() => setInputMode('sms')} className={`px-6 py-2 rounded-lg font-medium transition-colors ${inputMode === 'sms' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>短信解析</button>
        </div>

        {inputMode === 'tracking' && (
          <div className="flex space-x-4">
            <input type="text" value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} placeholder="请输入快递单号" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg" onKeyDown={(e) => e.key === 'Enter' && handleTrack()} />
            <button onClick={() => handleTrack()} disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">{loading ? '查询中...' : '查快递'}</button>
          </div>
        )}

        {inputMode === 'phone' && (
          <div className="flex space-x-4">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入手机号" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" onKeyDown={(e) => e.key === 'Enter' && handlePhoneSearch()} />
            <button onClick={handlePhoneSearch} disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">{loading ? '查询中...' : '查询'}</button>
          </div>
        )}

        {inputMode === 'sms' && (
          <div>
            <textarea value={smsContent} onChange={(e) => setSmsContent(e.target.value)} placeholder="粘贴驿站短信内容" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24" />
            <button onClick={handleSmsParse} disabled={loading} className="mt-3 bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">{loading ? '解析中...' : '自动解析'}</button>
          </div>
        )}

        {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
      </div>

      {trackingData && (
        <div className="space-y-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">运单详情</h2>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-lg text-gray-700">{trackingData.tracking_no}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">{trackingData.company?.name || recognizeCompany(trackingData.tracking_no)}</span>
                  <span className="text-sm text-gray-500">订单号：{trackingData.order_no}</span>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full font-medium ${STATUS_CLASS[trackingData.status] || 'bg-gray-100 text-gray-800'}`}>
                {STATUS_MAP[trackingData.status] || trackingData.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div><div className="text-xs text-gray-500">寄件人</div><div className="font-medium">{trackingData.sender_info?.name || '-'}</div><div className="text-xs text-gray-400">{trackingData.sender_info?.phone || ''}</div></div>
              <div><div className="text-xs text-gray-500">收件人</div><div className="font-medium">{trackingData.receiver_info?.name || '-'}</div><div className="text-xs text-gray-400">{trackingData.receiver_info?.phone || ''}</div></div>
              <div><div className="text-xs text-gray-500">物品</div><div className="font-medium">{trackingData.item_info?.name || '-'}</div><div className="text-xs text-gray-400">{trackingData.weight}kg</div></div>
              <div><div className="text-xs text-gray-500">运费</div><div className="font-medium text-blue-600">¥{trackingData.price || '-'}</div><div className="text-xs text-gray-400">预计{trackingData.estimated_delivery ? new Date(trackingData.estimated_delivery).toLocaleDateString('zh-CN') + '送达' : '-'}</div></div>
            </div>

            {prediction && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 mb-6 border border-indigo-200">
                <div className="flex items-center space-x-2 mb-3">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  <h3 className="text-lg font-bold text-indigo-800">AI预测送达时间</h3>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div><div className="text-sm text-indigo-600">预计送达</div><div className="text-xl font-bold text-indigo-900">{new Date(prediction.predicted_time).toLocaleString('zh-CN')}</div></div>
                  <div><div className="text-sm text-indigo-600">置信度</div><div className="text-xl font-bold text-indigo-900">{prediction.confidence}%</div></div>
                  <div><div className="text-sm text-indigo-600">影响因素</div><div className="text-sm text-indigo-700">距离{prediction.factors?.distance}km · 天气{prediction.factors?.weather_factor} · 路况{prediction.factors?.traffic_factor}</div></div>
                </div>
              </div>
            )}

            {exceptionData && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                  <h3 className="text-lg font-bold text-red-800">异常归因分析</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4"><div className="text-sm text-gray-500 mb-1">异常类型</div><div className="text-lg font-bold text-red-600">{exceptionData.exception_type}</div></div>
                  <div className="bg-white rounded-lg p-4"><div className="text-sm text-gray-500 mb-1">原因分析</div><div className="text-sm font-medium text-gray-800">{exceptionData.cause}</div></div>
                  <div className="bg-white rounded-lg p-4"><div className="text-sm text-gray-500 mb-1">处理建议</div><div className="text-sm font-medium text-orange-700">{exceptionData.suggestion}</div></div>
                </div>
                {exceptionLogs.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-red-700">异常记录</h4>
                    {exceptionLogs.map(log => (
                      <div key={log.id} className="bg-white rounded-lg p-3 flex items-center justify-between text-sm">
                        <div><span className="font-medium text-red-600">[{log.exception_type}]</span> <span className="text-gray-700">{log.cause}</span></div>
                        <span className={`px-2 py-1 rounded text-xs ${log.handling_status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{log.handling_status === 'resolved' ? '已处理' : '待处理'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <h3 className="text-lg font-bold mb-4">物流轨迹</h3>
            <div className="pl-8 relative">
              {trackingData.nodes?.length > 0 ? trackingData.nodes.map((node, index) => (
                <div key={node.id || index} className="relative mb-6 last:mb-0">
                  <div className="absolute -left-8 top-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${index === 0 ? 'ring-4 ring-green-100' : ''} ${getNodeColor(node.status)}`}>●</div>
                  </div>
                  {index < trackingData.nodes.length - 1 && <div className="absolute -left-[14px] top-7 w-0.5 h-full bg-gray-200" />}
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">{node.status}</div>
                    <div className="text-sm text-gray-600">{node.location} · {node.description}</div>
                    <div className="text-xs text-gray-400">{new Date(node.timestamp).toLocaleString('zh-CN')}</div>
                  </div>
                </div>
              )) : <div className="text-center py-8 text-gray-500">暂无物流轨迹</div>}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">取件码聚合</h2>
          <p className="text-sm text-gray-500 mb-4">手机号 13800138000 绑定的取件码</p>
          {pickupCodes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pickupCodes.map((code) => (
                <div key={code.id} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{code.station_name}</span>
                    <span className="text-xs text-gray-400">{new Date(code.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-3xl font-bold font-mono text-blue-600 mb-1">{code.code}</div>
                  <div className="text-xs text-gray-500">有效期至：{new Date(code.expire_time).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">切换到手机号查询模式获取取件码</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">短信解析结果</h2>
          {parsedSms ? (
            <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-lg p-6 border border-gray-200">
              <div className="grid grid-cols-2 gap-6">
                <div><div className="text-sm text-gray-600 mb-1">取件码</div><div className="text-3xl font-bold font-mono text-blue-600">{parsedSms.code}</div></div>
                <div><div className="text-sm text-gray-600 mb-1">驿站名称</div><div className="text-xl font-medium">{parsedSms.station_name}</div></div>
                <div><div className="text-sm text-gray-600 mb-1">快递公司</div><div className="font-medium">{parsedSms.company}</div></div>
                <div><div className="text-sm text-gray-600 mb-1">解析时间</div><div className="text-sm text-gray-500">{parsedSms.created_at ? new Date(parsedSms.created_at).toLocaleString('zh-CN') : '刚刚'}</div></div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">切换到短信解析模式，点击自动解析获取结果</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">支持快递公司 · 三方协同</h2>
        <p className="text-sm text-gray-500 mb-4">平台已接入 {companies.length} 家快递公司元数据，覆盖个人、商家、快递公司三方协同场景</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {companies.map(company => {
            const meta = company.metadata && typeof company.metadata === 'string' ? JSON.parse(company.metadata) : company.metadata || {};
            return (
              <div key={company.id} className="border rounded-lg p-3 hover:border-blue-400 transition-colors">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xs">{company.code}</span>
                  </div>
                  <div className="font-medium text-sm">{company.name}</div>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <div>基准费率：¥{meta.baseRate || '-'}/kg</div>
                  <div>接入状态：<span className="text-green-600">已接入</span></div>
                  <div>企业网关：{meta.website || '-'}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{companies.length}+</div>
            <div className="text-sm text-gray-600">已接入快递公司</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">99.9%</div>
            <div className="text-sm text-gray-600">轨迹准确率</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">实时</div>
            <div className="text-sm text-gray-600">企业API网关</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tracking;
