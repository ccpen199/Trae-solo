import React, { useState, useEffect } from 'react';
import { intlAPI } from '../services/api';

function International() {
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState({});
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    destination_country: '美国',
    item_name: '电子产品',
    item_value: 500,
    weight: 2,
    hs_code: '8471.30.01',
    sender_info: {
      name: 'Zhang San',
      address: '88 Jianguo Road, Chaoyang, Beijing',
      phone: '13800138000'
    },
    receiver_info: {
      name: 'John Smith',
      address: '123 Main St, New York, NY 10001',
      phone: '12125551234'
    }
  });

  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: ''
  });

  const loadTemplates = async () => {
    try {
      const [invoice, packingList, customsDecl] = await Promise.all([
        intlAPI.getDocTemplate('invoice'),
        intlAPI.getDocTemplate('packing_list'),
        intlAPI.getDocTemplate('customs_decl')
      ]);
      setTemplates({ invoice, packing_list: packingList, customs_decl: customsDecl });
    } catch (e) {
      setError('加载文档模板失败');
    }
  };

  const loadTickets = async () => {
    try {
      const data = await intlAPI.getTickets(1);
      setTickets(data || []);
    } catch (e) {}
  };

  useEffect(() => {
    loadTemplates();
    loadTickets();
  }, []);

  const handleSubmit = async () => {
    if (!formData.destination_country) {
      setError('请填写目的地国家');
      return;
    }
    if (!formData.item_name) {
      setError('请填写物品名称');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const order = await intlAPI.createOrder({
        user_id: 1,
        destination_country: formData.destination_country,
        item_name: formData.item_name,
        item_value: formData.item_value,
        weight: formData.weight,
        hs_code: formData.hs_code,
        sender_info: formData.sender_info,
        receiver_info: formData.receiver_info
      });
      setCreatedOrder(order);
      setSuccess('国际订单创建成功！');
      setStep(2);
      await loadTemplates();
    } catch (e) {
      setError('创建订单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketForm.subject) {
      setError('请填写工单主题');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await intlAPI.createTicket(createdOrder?.id || 0, {
        user_id: 1,
        subject: ticketForm.subject,
        description: ticketForm.description
      });
      setSuccess('工单创建成功，顾问将在24小时内回复');
      setTicketForm({ subject: '', description: '' });
      await loadTickets();
    } catch (e) {
      setError('创建工单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (status) => {
    const map = { resolved: '已解决', pending: '待处理', open: '处理中', closed: '已关闭' };
    return map[status] || status;
  };

  const statusStyle = (status) => {
    const map = {
      resolved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      open: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-600'
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  const statusDot = (status) => {
    const map = { resolved: 'bg-green-500', pending: 'bg-yellow-500', open: 'bg-blue-500', closed: 'bg-gray-400' };
    return map[status] || 'bg-gray-400';
  };

  const templateKeyLabel = (key) => {
    const map = { invoice: '商业发票', packing_list: '装箱单', customs_decl: '报关单' };
    return map[key] || key;
  };

  const templateIcon = (key) => {
    if (key === 'invoice') return (
      <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
    if (key === 'packing_list') return (
      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    );
    return (
      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">国际寄件服务台</h1>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
      {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex space-x-4 mb-6 border-b pb-4">
              <button onClick={() => setStep(1)} className={`px-6 py-2 rounded-lg font-medium transition-colors ${step === 1 ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}>创建国际订单</button>
              {createdOrder && <button onClick={() => setStep(2)} className={`px-6 py-2 rounded-lg font-medium transition-colors ${step === 2 ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}>订单结果</button>}
              <button onClick={() => setStep(3)} className={`px-6 py-2 rounded-lg font-medium transition-colors ${step === 3 ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}>顾问工单</button>
            </div>

            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold mb-6">填写寄件信息</h2>
                <div className="space-y-6">
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="font-bold mb-4">目的地信息</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">国家</label>
                        <select value={formData.destination_country} onChange={(e) => setFormData(prev => ({ ...prev, destination_country: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
                          <option value="">请选择国家</option>
                          <option value="美国">美国</option>
                          <option value="英国">英国</option>
                          <option value="德国">德国</option>
                          <option value="法国">法国</option>
                          <option value="日本">日本</option>
                          <option value="韩国">韩国</option>
                          <option value="澳大利亚">澳大利亚</option>
                          <option value="加拿大">加拿大</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">物品价值 (USD)</label>
                        <input type="number" value={formData.item_value} onChange={(e) => setFormData(prev => ({ ...prev, item_value: parseFloat(e.target.value) || 0 }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="font-bold mb-4">物品信息</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">物品名称</label>
                        <input type="text" value={formData.item_name} onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" placeholder="物品名称" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">重量 (kg)</label>
                        <input type="number" value={formData.weight} onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" min="0.1" step="0.1" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">HS编码</label>
                        <input type="text" value={formData.hs_code} onChange={(e) => setFormData(prev => ({ ...prev, hs_code: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" placeholder="海关商品编码" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="font-bold mb-4">发件人信息</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                        <input type="text" value={formData.sender_info.name} onChange={(e) => setFormData(prev => ({ ...prev, sender_info: { ...prev.sender_info, name: e.target.value } }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" placeholder="发件人姓名" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">电话</label>
                        <input type="text" value={formData.sender_info.phone} onChange={(e) => setFormData(prev => ({ ...prev, sender_info: { ...prev.sender_info, phone: e.target.value } }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" placeholder="发件人电话" />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">地址</label>
                        <input type="text" value={formData.sender_info.address} onChange={(e) => setFormData(prev => ({ ...prev, sender_info: { ...prev.sender_info, address: e.target.value } }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" placeholder="发件人英文地址" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-6">
                    <h3 className="font-bold mb-4">收件人信息</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                        <input type="text" value={formData.receiver_info.name} onChange={(e) => setFormData(prev => ({ ...prev, receiver_info: { ...prev.receiver_info, name: e.target.value } }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" placeholder="收件人姓名" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">电话</label>
                        <input type="text" value={formData.receiver_info.phone} onChange={(e) => setFormData(prev => ({ ...prev, receiver_info: { ...prev.receiver_info, phone: e.target.value } }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" placeholder="收件人电话" />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">地址</label>
                        <input type="text" value={formData.receiver_info.address} onChange={(e) => setFormData(prev => ({ ...prev, receiver_info: { ...prev.receiver_info, address: e.target.value } }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" placeholder="收件人英文地址" />
                      </div>
                    </div>
                  </div>

                  <button onClick={handleSubmit} disabled={loading} className="w-full bg-purple-600 text-white py-4 rounded-lg hover:bg-purple-700 transition-colors font-bold text-lg disabled:opacity-50">{loading ? '提交中...' : '提交国际订单'}</button>
                </div>
              </div>
            )}

            {step === 2 && createdOrder && (
              <div>
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">订单提交成功</h2>
                  <p className="text-gray-600">请查看以下清关文档模板，完成后上传</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="font-bold mb-4">订单信息</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">订单号：</span><span className="font-mono font-bold">{createdOrder.order_no}</span></div>
                    <div><span className="text-gray-500">状态：</span><span className="font-medium">{createdOrder.status}</span></div>
                    <div><span className="text-gray-500">目的地：</span><span className="font-medium">{createdOrder.destination_country}</span></div>
                    <div><span className="text-gray-500">物品：</span><span className="font-medium">{createdOrder.item_name}</span></div>
                    <div><span className="text-gray-500">物品价值：</span><span className="font-medium">${createdOrder.item_value}</span></div>
                    <div><span className="text-gray-500">重量：</span><span className="font-medium">{createdOrder.weight} kg</span></div>
                    <div><span className="text-gray-500">HS编码：</span><span className="font-mono">{createdOrder.hs_code}</span></div>
                    <div><span className="text-gray-500">发件人：</span><span className="font-medium">{createdOrder.sender_info?.name}</span></div>
                    <div><span className="text-gray-500">收件人：</span><span className="font-medium">{createdOrder.receiver_info?.name}</span></div>
                  </div>
                </div>

                <h3 className="font-bold mb-4">清关文档模板</h3>
                <div className="space-y-4 mb-8">
                  {Object.entries(templates).map(([key, template]) => (
                    <div key={key} className="border rounded-lg p-5 hover:border-purple-400 transition-colors">
                      <div className="flex items-center space-x-3 mb-3">
                        {templateIcon(key)}
                        <div>
                          <div className="font-bold text-lg">{template.name || templateKeyLabel(key)}</div>
                          <div className="text-xs text-gray-400">{templateKeyLabel(key)} · {template.fields?.length || 0} 个字段</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {template.fields?.map(field => (
                          <div key={field.name} className="flex items-center space-x-2 text-sm bg-white rounded px-3 py-2">
                            <span className="text-gray-700">{field.label}</span>
                            {field.required && <span className="text-red-500 text-xs font-bold">*</span>}
                            <span className="text-gray-300 text-xs ml-auto">{field.type}</span>
                          </div>
                        ))}
                      </div>
                      {template.fields?.some(f => f.required) && (
                        <div className="mt-2 text-xs text-gray-400">* 为必填字段</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4">
                  <button onClick={() => setStep(1)} className="text-purple-600 hover:text-purple-700 font-medium">返回修改</button>
                  <button onClick={() => setStep(3)} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 font-medium">联系顾问</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold mb-6">1v1 顾问服务台</h2>
                <p className="text-gray-600 mb-6">如有国际寄件相关问题，可创建工单联系专属顾问</p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-yellow-800">顾问将在24小时内回复您的工单</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">工单主题</label>
                    <input type="text" value={ticketForm.subject} onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" placeholder="请简要描述您的问题" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">详细描述</label>
                    <textarea value={ticketForm.description} onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary h-32" placeholder="请详细描述您的问题或需求" />
                  </div>
                  <button onClick={handleCreateTicket} disabled={loading} className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50">{loading ? '提交中...' : '提交工单'}</button>
                </div>

                <div>
                  <h3 className="font-bold mb-4">我的工单 ({tickets.length})</h3>
                  {tickets.length > 0 ? (
                    <div className="space-y-3">
                      {tickets.map(ticket => (
                        <div key={ticket.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{ticket.subject}</span>
                            <span className={`px-2 py-1 rounded text-xs ${statusStyle(ticket.status)}`}>{statusLabel(ticket.status)}</span>
                          </div>
                          {ticket.description && <div className="text-sm text-gray-600 mb-2">{ticket.description}</div>}
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>{new Date(ticket.created_at).toLocaleString()}</span>
                            {ticket.consultant_name && <span>顾问：{ticket.consultant_name}</span>}
                          </div>
                          {ticket.status === 'resolved' && ticket.updated_at && (
                            <div className="text-xs text-green-500 mt-1">解决时间：{new Date(ticket.updated_at).toLocaleString()}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-8">暂无工单记录</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-bold mb-4">清关文档模板</h3>
            <div className="space-y-3">
              {Object.entries(templates).map(([key, template]) => (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    {templateIcon(key)}
                    <div className="font-medium">{template.name || templateKeyLabel(key)}</div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    {template.fields?.map(field => (
                      <div key={field.name} className="flex items-center space-x-1">
                        <span>•</span>
                        <span>{field.label}</span>
                        {field.required && <span className="text-red-400">*</span>}
                        <span className="text-gray-300 ml-auto">{field.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(templates).length === 0 && (
                <div className="text-sm text-gray-400 text-center py-4">加载中...</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-bold mb-4">1v1 顾问服务台</h3>
            <div className="space-y-3">
              {tickets.length > 0 ? tickets.slice(0, 5).map(ticket => (
                <div key={ticket.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(ticket.status)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{ticket.subject}</div>
                    <div className="text-xs text-gray-400">{statusLabel(ticket.status)}{ticket.consultant_name ? ` · ${ticket.consultant_name}` : ''}</div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-gray-500 text-center py-4">暂无工单记录</div>
              )}
              {tickets.length > 5 && (
                <button onClick={() => setStep(3)} className="text-purple-600 text-sm hover:text-purple-700 w-full text-center">查看全部 {tickets.length} 个工单</button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold mb-4">清关须知</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <div className="font-medium text-gray-900 mb-1">1. 申报价值</div>
                <p>每个国家有不同的免税额度，建议如实申报</p>
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">2. 禁寄物品</div>
                <p>液体、粉末、食品等可能需要特殊许可</p>
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">3. HS编码</div>
                <p>正确填写可加快清关速度</p>
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">4. 处理时间</div>
                <p>国际快递清关通常需要1-3个工作日</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default International;
