import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyApi } from '../utils/api';
import {
  PROPERTY_TYPE_MAP, PROPERTY_STATUS_MAP, PROPERTY_STATUS_COLOR,
  DECORATION_MAP, formatPrice, formatDateTime
} from '../utils/constants';
import {
  Building2, MapPin, Ruler, BedDouble, Bath, Layers, Palette,
  User, Phone, Calendar, Eye, FileText, Calculator, PenTool,
  ChevronLeft, Share2, Edit2, Trash2, CheckCircle2, AlertCircle
} from 'lucide-react';

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'vr' | 'floorplan' | 'valuation' | 'contract'>('info');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await propertyApi.get(parseInt(id!));
      setData(res);
    } catch (e) {
      console.error('Load property detail error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleValuation = async () => {
    setActionLoading(true);
    try {
      await propertyApi.valuation(parseInt(id!));
      loadDetail();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignContract = async () => {
    if (!confirm('确认生成并签署委托合同吗？')) return;
    setActionLoading(true);
    try {
      const templateType = data.property.type === 'second_hand' ? 'sale_commission' : 'rent_commission';
      const res = await propertyApi.contract(parseInt(id!), templateType);
      navigate(`/contracts/${res.contractId}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定删除此房源吗？此操作不可撤销。')) return;
    try {
      await propertyApi.delete(parseInt(id!));
      navigate('/properties');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const renderFloorPlan = () => {
    if (!data.property.floor_plan_json) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-xl">
          <Layers className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 mb-2">暂无户型图结构化标注</p>
          <p className="text-sm text-gray-400">请录入户型图并标注房间结构</p>
        </div>
      );
    }

    let fp: any;
    try {
      fp = JSON.parse(data.property.floor_plan_json);
    } catch {
      return <div className="p-8 text-center text-red-500">户型图数据格式错误</div>;
    }

    const colors = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe', '#e0f2fe'];
    const scale = 8;
    const maxW = Math.max(...fp.rooms.map((r: any) => r.x + r.width)) * scale + 40;
    const maxH = Math.max(...fp.rooms.map((r: any) => r.y + r.height)) * scale + 40;

    return (
      <div className="bg-white rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">户型图结构化标注</h4>
        <div className="overflow-x-auto">
          <svg width={maxW} height={maxH} className="mx-auto">
            <rect x="10" y="10" width={maxW - 20} height={maxH - 20} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" rx="4" />
            {fp.rooms.map((room: any, idx: number) => (
              <g key={room.id}>
                <rect
                  x={room.x * scale + 20}
                  y={room.y * scale + 20}
                  width={room.width * scale}
                  height={room.height * scale}
                  fill={colors[idx % colors.length]}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  rx="2"
                />
                <text
                  x={room.x * scale + 20 + room.width * scale / 2}
                  y={room.y * scale + 20 + room.height * scale / 2 - 4}
                  textAnchor="middle"
                  className="text-xs font-medium"
                  fill="#334155"
                >
                  {room.name}
                </text>
                <text
                  x={room.x * scale + 20 + room.width * scale / 2}
                  y={room.y * scale + 20 + room.height * scale / 2 + 12}
                  textAnchor="middle"
                  className="text-[10px]"
                  fill="#64748b"
                >
                  {room.area}㎡
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          {fp.rooms.map((room: any, idx: number) => (
            <div key={room.id} className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[idx % colors.length] }} />
              <span className="text-gray-700">{room.name}</span>
              <span className="text-gray-500">{room.area}㎡</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t text-center text-sm text-gray-600">
          总建筑面积：<span className="font-semibold text-primary-600">{fp.totalArea} ㎡</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">加载中...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-gray-500">房源不存在或已被删除</div>;
  }

  const { property, valuation, contract } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/properties')}
          className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800">{property.name}</h2>
            <span className={`px-3 py-1 text-sm rounded-full ${PROPERTY_STATUS_COLOR[property.status]}`}>
              {PROPERTY_STATUS_MAP[property.status]}
            </span>
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {property.address}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
          <button
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            编辑
          </button>
          <button
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            分享
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-100 px-6">
          <div className="flex gap-6">
            {[
              { key: 'info', label: '房源信息', icon: Building2 },
              { key: 'vr', label: 'VR全景', icon: Eye },
              { key: 'floorplan', label: '户型图标注', icon: Layers },
              { key: 'valuation', label: '智能估价', icon: Calculator },
              { key: 'contract', label: '委托合同', icon: FileText },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600 font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-8">
              {/* Price */}
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary-50 to-primary-50/50 rounded-xl">
                <div>
                  <div className="text-sm text-gray-500 mb-1">挂牌价</div>
                  <div className="text-4xl font-bold text-primary-600">
                    {formatPrice(property.price, property.type)}
                  </div>
                  {valuation && (
                    <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      智能估价 {formatPrice(valuation.estimated_price, property.type)}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleValuation}
                    disabled={actionLoading}
                    className="px-5 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Calculator className="w-5 h-5" />
                    {valuation ? '重新估价' : '智能估价'}
                  </button>
                  <button
                    onClick={handleSignContract}
                    disabled={actionLoading || contract?.status === 'signed'}
                    className="px-5 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <PenTool className="w-5 h-5" />
                    {contract?.status === 'signed' ? '已签约' : '电子签约'}
                  </button>
                </div>
              </div>

              {/* Basic info */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">基本信息</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">房源类型</div>
                      <div className="font-medium text-gray-800">{PROPERTY_TYPE_MAP[property.type]}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <Ruler className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">建筑面积</div>
                      <div className="font-medium text-gray-800">{property.area} ㎡</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <BedDouble className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">户型</div>
                      <div className="font-medium text-gray-800">{property.rooms}室{property.halls}厅</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">楼层</div>
                      <div className="font-medium text-gray-800">{property.floor}/{property.total_floor}层</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center">
                      <Palette className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">装修</div>
                      <div className="font-medium text-gray-800">{DECORATION_MAP[property.decoration_level] || '-'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">所在小区</div>
                      <div className="font-medium text-gray-800">{property.community || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">房源描述</h4>
                <p className="text-gray-600 leading-relaxed">{property.description || '暂无描述'}</p>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-gray-50 rounded-xl">
                  <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> 业主信息
                  </h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-16">姓名：</span>
                      <span className="text-gray-800">{property.owner_name || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-800">{property.owner_phone || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-gray-50 rounded-xl">
                  <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> 负责经纪人
                  </h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-16">姓名：</span>
                      <span className="text-gray-800">{property.agent_name || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-800">{property.agent_phone || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> 时间线
                </h4>
                <div className="flex items-start gap-3">
                  <div className="w-1 h-full bg-gray-200 rounded-full self-stretch mt-2" />
                  <div className="space-y-4 flex-1">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">录入时间</div>
                        <div className="text-sm text-gray-500">{formatDateTime(property.created_at)}</div>
                      </div>
                    </div>
                    {contract && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">签约时间</div>
                          <div className="text-sm text-gray-500">{formatDateTime(contract.signed_at)}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">更新时间</div>
                        <div className="text-sm text-gray-500">{formatDateTime(property.updated_at)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vr' && (
            <div>
              {property.vr_url ? (
                <div className="aspect-video rounded-xl overflow-hidden border border-gray-200">
                  <iframe
                    src={property.vr_url}
                    className="w-full h-full"
                    title="VR全景"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-xl">
                  <Eye className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">暂无VR全景</p>
                  <p className="text-sm text-gray-400">请录入VR链接以展示房源全景</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'floorplan' && renderFloorPlan()}

          {activeTab === 'valuation' && (
            <div>
              {valuation ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-8 text-white text-center">
                    <div className="text-primary-200 mb-2">智能估价结果</div>
                    <div className="text-5xl font-bold mb-2">
                      ¥ {(valuation.estimated_price / 10000).toFixed(2)} 万
                    </div>
                    <div className="text-primary-200">
                      单价：¥ {Math.round(valuation.estimated_price / property.area).toLocaleString()} 元/㎡
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200">
                    <h4 className="font-semibold text-gray-800 px-6 py-4 border-b">估价明细</h4>
                    <div className="divide-y divide-gray-100">
                      <div className="flex justify-between px-6 py-3">
                        <span className="text-gray-600">小区参考均价</span>
                        <span className="font-medium text-gray-800">¥ {valuation.community_avg.toLocaleString()} 元/㎡</span>
                      </div>
                      <div className="flex justify-between px-6 py-3">
                        <span className="text-gray-600">房屋面积</span>
                        <span className="font-medium text-gray-800">{property.area} ㎡</span>
                      </div>
                      <div className="flex justify-between px-6 py-3">
                        <span className="text-gray-600">基础总价</span>
                        <span className="font-medium text-gray-800">¥ {valuation.base_price.toLocaleString()} 元</span>
                      </div>
                      <div className="flex justify-between px-6 py-3">
                        <span className="text-gray-600">装修指数</span>
                        <span className="font-medium text-primary-600">× {valuation.decoration_index}</span>
                      </div>
                      <div className="flex justify-between px-6 py-3">
                        <span className="text-gray-600">楼层系数</span>
                        <span className="font-medium text-primary-600">× {valuation.floor_coefficient.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between px-6 py-4 bg-primary-50">
                        <span className="font-semibold text-gray-800">最终估价</span>
                        <span className="text-xl font-bold text-primary-600">¥ {valuation.estimated_price.toLocaleString()} 元</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleValuation}
                      disabled={actionLoading}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <Calculator className="w-5 h-5" />
                      重新估价
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-xl">
                  <Calculator className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">暂无估价记录</p>
                  <p className="text-sm text-gray-400 mb-4">点击下方按钮执行智能估价</p>
                  <button
                    onClick={handleValuation}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Calculator className="w-5 h-5" />
                    智能估价
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contract' && (
            <div>
              {contract ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">委托合同</h4>
                        <p className="text-sm text-gray-500">合同编号：CT-{contract.id.toString().padStart(6, '0')}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        contract.status === 'signed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {contract.status === 'signed' ? '已签署' : '待签署'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">合同类型</div>
                        <div className="font-medium text-gray-800">
                          {({ rent_commission: '出租委托合同', sale_commission: '出售委托合同', lease: '租赁合同' } as any)[contract.template_type]}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">签署时间</div>
                        <div className="font-medium text-gray-800">{formatDateTime(contract.signed_at)}</div>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <span className="font-medium text-amber-800">区块链存证哈希</span>
                      </div>
                      <div className="font-mono text-sm text-amber-900 break-all bg-white/50 p-3 rounded border border-amber-200">
                        {contract.sign_hash}
                      </div>
                      <p className="text-xs text-amber-700 mt-2">
                        本合同已完成电子签名并存证，哈希值可用于验证合同完整性与签署时间。
                      </p>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        下载合同
                      </button>
                      <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        查看原文
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-xl">
                  <FileText className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">暂无委托合同</p>
                  <p className="text-sm text-gray-400 mb-4">点击下方按钮生成并签署委托合同</p>
                  <button
                    onClick={handleSignContract}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <PenTool className="w-5 h-5" />
                    签署委托合同
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
