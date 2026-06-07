import { useState, useEffect, useRef, useCallback } from 'react';
import { companyAPI, priceAPI, orderAPI, addressAPI } from '../services/api';

const SEED_SENDER = { name: '张三', phone: '13800138000', province: '北京', city: '北京市', district: '朝阳区', address: '建国路88号' };
const SEED_RECEIVER = { name: '李四', phone: '13900001111', province: '上海', city: '上海市', district: '浦东新区', address: '陆家嘴1号' };

function Shipping() {
  const [quotes, setQuotes] = useState([]);
  const [sortBy, setSortBy] = useState('price');
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [batchList, setBatchList] = useState([]);
  const [batchResults, setBatchResults] = useState([]);
  const [step, setStep] = useState(1);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    sender: { ...SEED_SENDER },
    receiver: { ...SEED_RECEIVER },
    item: { name: '电子产品', weight: 1, description: '手机配件' },
    serviceType: 'standard',
    userId: 1,
  });

  const fetchQuotes = useCallback(async (sender, receiver, weight) => {
    setLoading(true);
    setError('');
    try {
      const data = await priceAPI.quote({
        from_province: sender.province,
        to_province: receiver.province,
        weight,
      });
      setQuotes(data);
    } catch {
      setError('获取报价失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const [, addressData] = await Promise.all([
          companyAPI.list(),
          addressAPI.getByUser(1).catch(() => []),
        ]);
        setAddresses(addressData || []);
      } catch {
        setError('加载基础数据失败');
      }
      fetchQuotes(SEED_SENDER, SEED_RECEIVER, 1);
    };
    init();
  }, [fetchQuotes]);

  const updateSender = (field, value) => {
    setFormData(prev => ({ ...prev, sender: { ...prev.sender, [field]: value } }));
  };

  const updateReceiver = (field, value) => {
    setFormData(prev => ({ ...prev, receiver: { ...prev.receiver, [field]: value } }));
  };

  const updateItem = (field, value) => {
    setFormData(prev => ({ ...prev, item: { ...prev.item, [field]: value } }));
  };

  const handleRequote = () => {
    fetchQuotes(formData.sender, formData.receiver, formData.item.weight);
    setStep(1);
    setSelectedQuote(null);
  };

  const handleSelectQuote = (quote) => {
    setSelectedQuote(quote);
    setStep(2);
  };

  const handleSubmitOrder = async () => {
    if (!selectedQuote) return;
    setLoading(true);
    setError('');
    try {
      const order = await orderAPI.create({
        user_id: formData.userId,
        company_id: selectedQuote.company_id,
        sender_info: formData.sender,
        receiver_info: formData.receiver,
        item_info: formData.item,
        weight: formData.item.weight,
      });
      setCreatedOrder(order);
      setSuccess('订单创建成功！');
      setStep(3);
    } catch {
      setError('创建订单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async () => {
    if (batchList.length === 0) {
      setError('请添加收件人');
      return;
    }
    setLoading(true);
    setError('');
    const results = [];
    for (const receiver of batchList) {
      try {
        const quoteData = await priceAPI.quote({
          from_province: formData.sender.province,
          to_province: receiver.province,
          weight: formData.item.weight,
        });
        const bestQuote = quoteData.sort((a, b) => a.price - b.price)[0];
        if (bestQuote) {
          const order = await orderAPI.create({
            user_id: formData.userId,
            company_id: bestQuote.company_id,
            sender_info: formData.sender,
            receiver_info: receiver,
            item_info: formData.item,
            weight: formData.item.weight,
          });
          results.push({ receiver: receiver.name, status: 'success', order_no: order.order_no, tracking_no: order.tracking_no, price: bestQuote.price });
        }
      } catch {
        results.push({ receiver: receiver.name, status: 'failed' });
      }
    }
    setBatchResults(results);
    setLoading(false);
  };

  const addBatchItem = () => {
    setBatchList(prev => [...prev, { name: '', phone: '', province: '', city: '', district: '', address: '' }]);
  };

  const updateBatchItem = (index, field, value) => {
    setBatchList(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeBatchItem = (index) => {
    setBatchList(prev => prev.filter((_, i) => i !== index));
  };

  const downloadCSVTemplate = () => {
    const csv = '\uFEFF姓名,电话,省,市,区,详细地址\n李四,13900001111,上海,上海市,浦东新区,陆家嘴1号\n王五,13700002222,广东,广州市,天河区,体育西路100号';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_shipping_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      const items = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length >= 6) {
          items.push({ name: cols[0], phone: cols[1], province: cols[2], city: cols[3], district: cols[4], address: cols[5] });
        }
      }
      setBatchList(prev => [...prev, ...items]);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const sortedQuotes = [...quotes].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'time') return a.estimated_days - b.estimated_days;
    return 0;
  });

  const getCostSplit = (price) => {
    const base = Math.round(price * 0.7 * 100) / 100;
    const fuel = Math.round(price * 0.12 * 100) / 100;
    const insurance = Math.round(price * 0.1 * 100) / 100;
    const service = Math.round((price - base - fuel - insurance) * 100) / 100;
    return [
      { label: '基础运费', amount: base },
      { label: '燃油附加费', amount: fuel },
      { label: '保价费', amount: insurance },
      { label: '服务费', amount: service },
    ];
  };

  const fillFromAddress = (type, addr) => {
    const setter = type === 'sender' ? updateSender : updateReceiver;
    setter('name', addr.name);
    setter('phone', addr.phone);
    setter('province', addr.province);
    setter('city', addr.city);
    setter('district', addr.district);
    setter('address', addr.address);
  };

  const resetOrder = () => {
    setStep(1);
    setSelectedQuote(null);
    setCreatedOrder(null);
    setSuccess('');
    setError('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">寄快递</h1>
        <div className="flex space-x-3">
          <button onClick={() => { setBatchMode(false); resetOrder(); }} className={`px-4 py-2 rounded-lg font-medium text-sm ${!batchMode ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>单个寄件</button>
          <button onClick={() => { setBatchMode(true); resetOrder(); }} className={`px-4 py-2 rounded-lg font-medium text-sm ${batchMode ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>批量寄件</button>
        </div>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
      {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

      {!batchMode ? (
        <>
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">寄件人信息</h2>
                    {addresses.length > 0 && (
                      <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5" onChange={(e) => { const addr = addresses.find(a => a.id === Number(e.target.value)); if (addr) fillFromAddress('sender', addr); }}>
                        <option value="">从地址簿选择</option>
                        {addresses.map(a => <option key={a.id} value={a.id}>{a.name} - {a.province}{a.address}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                        <input type="text" value={formData.sender.name} onChange={(e) => updateSender('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                        <input type="tel" value={formData.sender.phone} onChange={(e) => updateSender('phone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" value={formData.sender.province} onChange={(e) => updateSender('province', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" placeholder="省" />
                      <input type="text" value={formData.sender.city} onChange={(e) => updateSender('city', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" placeholder="市" />
                      <input type="text" value={formData.sender.district} onChange={(e) => updateSender('district', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" placeholder="区" />
                    </div>
                    <input type="text" value={formData.sender.address} onChange={(e) => updateSender('address', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" placeholder="详细地址" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">收件人信息</h2>
                    {addresses.length > 1 && (
                      <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5" onChange={(e) => { const addr = addresses.find(a => a.id === Number(e.target.value)); if (addr) fillFromAddress('receiver', addr); }}>
                        <option value="">从地址簿选择</option>
                        {addresses.map(a => <option key={a.id} value={a.id}>{a.name} - {a.province}{a.address}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                        <input type="text" value={formData.receiver.name} onChange={(e) => updateReceiver('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                        <input type="tel" value={formData.receiver.phone} onChange={(e) => updateReceiver('phone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" value={formData.receiver.province} onChange={(e) => updateReceiver('province', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" placeholder="省" />
                      <input type="text" value={formData.receiver.city} onChange={(e) => updateReceiver('city', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" placeholder="市" />
                      <input type="text" value={formData.receiver.district} onChange={(e) => updateReceiver('district', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" placeholder="区" />
                    </div>
                    <input type="text" value={formData.receiver.address} onChange={(e) => updateReceiver('address', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" placeholder="详细地址" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4">物品信息</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">物品名称</label>
                    <input type="text" value={formData.item.name} onChange={(e) => updateItem('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">重量(kg)</label>
                    <input type="number" value={formData.item.weight} onChange={(e) => updateItem('weight', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" min="0.1" step="0.1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">物品描述</label>
                    <input type="text" value={formData.item.description} onChange={(e) => updateItem('description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={handleRequote} disabled={loading} className="w-full bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 text-sm">{loading ? '查询中...' : '重新报价'}</button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold">快递报价 {quotes.length > 0 && <span className="text-sm font-normal text-gray-500">({quotes.length}家快递公司)</span>}</h2>
                  <div className="flex space-x-2">
                    <button onClick={() => setSortBy('price')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${sortBy === 'price' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>按价格排序</button>
                    <button onClick={() => setSortBy('time')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${sortBy === 'time' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>按时效排序</button>
                  </div>
                </div>

                {loading && quotes.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">正在加载报价...</div>
                ) : sortedQuotes.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">暂无报价数据</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedQuotes.map((quote, idx) => (
                      <div key={quote.company_id || idx} className={`border-2 rounded-xl p-5 cursor-pointer transition-all hover:shadow-md ${selectedQuote?.company_id === quote.company_id ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-primary'}`} onClick={() => handleSelectQuote(quote)}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary font-bold text-xs">{(quote.company_name || '').slice(0, 2)}</span>
                            </div>
                            <div>
                              <div className="font-bold text-sm">{quote.company_name}</div>
                              {idx === 0 && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{sortBy === 'price' ? '最便宜' : '最快'}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="text-xs text-gray-500">预计时效</div>
                            <div className="text-base font-medium">{quote.estimated_days}天</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">报价</div>
                            <div className="text-xl font-bold text-primary">¥{quote.price}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && selectedQuote && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold mb-6">确认订单</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-bold mb-3 text-sm">寄件人</h3>
                  <div className="space-y-1.5 text-sm">
                    <p>{formData.sender.name} {formData.sender.phone}</p>
                    <p className="text-gray-600">{formData.sender.province}{formData.sender.city}{formData.sender.district}{formData.sender.address}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-bold mb-3 text-sm">收件人</h3>
                  <div className="space-y-1.5 text-sm">
                    <p>{formData.receiver.name} {formData.receiver.phone}</p>
                    <p className="text-gray-600">{formData.receiver.province}{formData.receiver.city}{formData.receiver.district}{formData.receiver.address}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold">{(selectedQuote.company_name || '').slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className="font-bold">{selectedQuote.company_name}</div>
                      <div className="text-sm text-gray-500">预计 {selectedQuote.estimated_days} 天送达</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">总计</div>
                    <div className="text-2xl font-bold text-primary">¥{selectedQuote.price}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div><span className="text-gray-500">物品：</span>{formData.item.name}</div>
                  <div><span className="text-gray-500">重量：</span>{formData.item.weight}kg</div>
                  <div><span className="text-gray-500">服务：</span>{formData.serviceType === 'standard' ? '标准快递' : formData.serviceType === 'express' ? '当日达' : '经济快递'}</div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="text-sm font-medium mb-3">费用明细</div>
                  <div className="space-y-2">
                    {getCostSplit(selectedQuote.price).map((item) => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <span>¥{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
                      <span>合计</span>
                      <span className="text-primary">¥{selectedQuote.price}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 justify-end">
                <button onClick={() => { setStep(1); setSelectedQuote(null); }} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm">返回选择</button>
                <button onClick={handleSubmitOrder} disabled={loading} className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 text-sm">{loading ? '提交中...' : '确认下单'}</button>
              </div>
            </div>
          )}

          {step === 3 && createdOrder && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-6">订单创建成功</h2>
              <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto mb-6 text-left">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">订单号</span><span className="font-mono font-bold">{createdOrder.order_no}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">快递单号</span><span className="font-mono font-bold text-primary">{createdOrder.tracking_no}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">快递公司</span><span>{selectedQuote?.company_name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">运费</span><span className="font-bold text-primary">¥{selectedQuote?.price}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">状态</span><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">待揽收</span></div>
                </div>
              </div>
              <div className="flex space-x-4 justify-center">
                <button onClick={() => window.location.href = '/tracking'} className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-700 font-medium text-sm">去查快递</button>
                <button onClick={resetOrder} className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 font-medium text-sm">继续寄件</button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">寄件人信息</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input type="text" value={formData.sender.name} onChange={(e) => updateSender('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                  <input type="tel" value={formData.sender.phone} onChange={(e) => updateSender('phone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="text" value={formData.sender.province} onChange={(e) => updateSender('province', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="省" />
                <input type="text" value={formData.sender.city} onChange={(e) => updateSender('city', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="市" />
                <input type="text" value={formData.sender.district} onChange={(e) => updateSender('district', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="区" />
              </div>
              <input type="text" value={formData.sender.address} onChange={(e) => updateSender('address', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="详细地址" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">物品信息</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物品名称</label>
                <input type="text" value={formData.item.name} onChange={(e) => updateItem('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">重量(kg)</label>
                <input type="number" value={formData.item.weight} onChange={(e) => updateItem('weight', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" min="0.1" step="0.1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物品描述</label>
                <input type="text" value={formData.item.description} onChange={(e) => updateItem('description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">批量收件人</h2>
              <div className="flex space-x-3">
                <button onClick={downloadCSVTemplate} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">下载CSV模板</button>
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100">导入CSV</button>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs text-blue-800">
              CSV格式：姓名,电话,省,市,区,详细地址（首行为表头，将跳过）
            </div>

            <div className="space-y-3">
              {batchList.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-700">收件人 #{index + 1}</span>
                    {batchList.length > 1 && (
                      <button onClick={() => removeBatchItem(index)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <input type="text" value={item.name} onChange={(e) => updateBatchItem(index, 'name', e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="姓名" />
                    <input type="tel" value={item.phone} onChange={(e) => updateBatchItem(index, 'phone', e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="电话" />
                    <input type="text" value={item.province} onChange={(e) => updateBatchItem(index, 'province', e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="省" />
                    <input type="text" value={item.city} onChange={(e) => updateBatchItem(index, 'city', e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="市" />
                    <input type="text" value={item.district} onChange={(e) => updateBatchItem(index, 'district', e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="区" />
                    <input type="text" value={item.address} onChange={(e) => updateBatchItem(index, 'address', e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="详细地址" />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addBatchItem} className="mt-3 border-2 border-dashed border-gray-300 w-full py-2.5 rounded-lg text-gray-500 hover:border-primary hover:text-primary text-sm">+ 添加收件人</button>
          </div>

          <div className="flex justify-end">
            <button onClick={handleBatchSubmit} disabled={loading || batchList.length === 0} className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 text-sm">{loading ? '批量下单中...' : `批量下单 (${batchList.length}个收件人)`}</button>
          </div>

          {batchResults.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">批量下单结果</h2>
              <div className="space-y-2">
                {batchResults.map((r, idx) => (
                  <div key={idx} className={`p-4 rounded-lg text-sm ${r.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{r.receiver}</span>
                      <span className={`text-xs px-2 py-1 rounded ${r.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status === 'success' ? '成功' : '失败'}</span>
                    </div>
                    {r.status === 'success' && (
                      <div className="mt-2 text-xs text-gray-600 space-y-1">
                        <p>订单号：<span className="font-mono">{r.order_no}</span></p>
                        <p>快递单号：<span className="font-mono text-primary">{r.tracking_no}</span></p>
                        <p>运费：<span className="font-bold">¥{r.price}</span></p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span>总计 {batchResults.length} 单</span>
                  <span className="font-bold text-primary">成功 {batchResults.filter(r => r.status === 'success').length} 单 | 总运费 ¥{batchResults.reduce((sum, r) => sum + (r.price || 0), 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Shipping;
