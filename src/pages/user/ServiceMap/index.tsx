import React, { useEffect, useState, useMemo } from 'react';
import {
  Card, Select, Input, Modal, Form, Button, Badge, Spin, List, Tag, Statistic, Descriptions,
  Progress, Steps, Tooltip, Divider, Row, Col, Rate, Empty, Timeline, Alert,
} from 'antd';
import {
  SearchOutlined, EnvironmentOutlined, ClockCircleOutlined, PhoneOutlined, UserOutlined,
  StarOutlined, TeamOutlined, BankOutlined, SafetyOutlined, CalendarOutlined,
  TrophyOutlined, HistoryOutlined, HomeOutlined, RightOutlined, CheckCircleOutlined,
  WifiOutlined, CoffeeOutlined, RocketOutlined,
} from '@ant-design/icons';
import { outletApi } from '@/services/outlet';
import type { ServiceOutlet, QueueStatus } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

interface QueueMap { [key: string]: QueueStatus & { windows?: any[]; loadPercent?: number; servedToday?: number; currentNumbers?: number[]; shortName?: string } }

const districtMap: Record<string, string> = {
  '510104': '锦江区', '510105': '青羊区', '510106': '金牛区',
  '510107': '武侯区', '510108': '成华区', '510114': '高新区', '510109': '高新区',
};

const serviceTypeColorMap: Record<string, string> = {
  water: '#00B8D9', electricity: '#FF8800', gas: '#00B42A', all: '#165DFF',
};
const serviceTypeNameMap: Record<string, string> = {
  water: '水费', electricity: '电费', gas: '燃气', all: '综合',
};

const facilityIconMap: Record<string, React.ReactNode> = {
  '自助缴费机': <BankOutlined />, '24小时': <ClockCircleOutlined />, '母婴室': <SafetyOutlined />,
  '无障碍': <SafetyOutlined />, 'WiFi': <WifiOutlined />, '休息': <CoffeeOutlined />,
  'VIP': <TrophyOutlined />, '充电桩': <RocketOutlined />, '咖啡': <CoffeeOutlined />,
  '儿童': <StarOutlined />, '会议': <TeamOutlined />, '智能': <RocketOutlined />,
  '饮用水': <CoffeeOutlined />,
};

const getFacilityIcon = (f: string) => {
  const key = Object.keys(facilityIconMap).find((k) => f.includes(k));
  return key ? facilityIconMap[key] : <CheckCircleOutlined />;
};
const getFacilityColor = (f: string) => {
  if (f.includes('缴费')) return 'blue';
  if (f.includes('24小时') || f.includes('智能')) return 'geekblue';
  if (f.includes('母婴') || f.includes('儿童')) return 'pink';
  if (f.includes('VIP') || f.includes('咖啡') || f.includes('充电')) return 'gold';
  if (f.includes('无障碍')) return 'green';
  return 'default';
};

const ServiceMap: React.FC = () => {
  const [outlets, setOutlets] = useState<any[]>([]);
  const [queueMap, setQueueMap] = useState<QueueMap>({});
  const [loading, setLoading] = useState(false);
  const [districtFilter, setDistrictFilter] = useState<string>('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [appointmentResult, setAppointmentResult] = useState<any>(null);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentForm] = Form.useForm();

  useEffect(() => {
    loadData();
    loadAllQueueStatus();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await outletApi.getOutletList({});
      const list: any[] = Array.isArray(res) ? res : (res?.data || res?.list || []);
      setOutlets(list);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadAllQueueStatus = async () => {
    try {
      const res: any = await outletApi.getAllQueueStatus();
      const list: any[] = Array.isArray(res) ? res : (res?.data || res?.list || []);
      const map: QueueMap = {};
      list.forEach((item: any) => { map[String(item.outletId)] = item; });
      setQueueMap(map);
    } catch (e) { console.error(e); }
  };

  const getMarkerColor = (queue?: QueueMap[string]) => {
    if (!queue) return { bg: '#165DFF', color: '#165DFF', text: '畅通' };
    if (queue.waitingCount > 15) return { bg: '#ef4444', color: '#ef4444', text: '繁忙' };
    if (queue.waitingCount > 5) return { bg: '#f97316', color: '#f97316', text: '适中' };
    return { bg: '#165dff', color: '#165dff', text: '畅通' };
  };

  const getMapPosition = (lng: number, lat: number) => {
    const left = ((lng - 104.0) / 0.15) * 100;
    const top = ((30.7 - lat) / 0.15) * 100;
    return { left: `${Math.max(5, Math.min(95, left))}%`, top: `${Math.max(5, Math.min(95, top))}%` };
  };

  const filteredOutlets = useMemo(() => {
    return outlets.filter((o) => {
      if (districtFilter && o.district !== districtFilter && districtMap[districtFilter] !== o.district) return false;
      if (serviceTypeFilter && serviceTypeFilter !== 'all' && !(o.serviceTypes || []).includes(serviceTypeFilter)) return false;
      if (keyword && !o.name.includes(keyword) && !o.address.includes(keyword) && !o.shortName?.includes(keyword)) return false;
      return true;
    });
  }, [outlets, districtFilter, serviceTypeFilter, keyword]);

  const selectedOutlet = outlets.find((o) => o.id === selectedOutletId);
  const selectedQueue = selectedOutletId ? queueMap[String(selectedOutletId)] : undefined;

  const totalWaiting = Object.values(queueMap).reduce((s, q) => s + (q.waitingCount || 0), 0);
  const totalServed = Object.values(queueMap).reduce((s, q) => s + (q.servedToday || 0), 0);
  const avgWait = Object.values(queueMap).length > 0
    ? Math.round(Object.values(queueMap).reduce((s, q) => s + (q.avgWaitTime || 0), 0) / Object.values(queueMap).length)
    : 0;

  const getQueueTag = (count: number) => {
    if (count <= 5) return <Tag color="green">畅通</Tag>;
    if (count <= 15) return <Tag color="orange">适中</Tag>;
    return <Tag color="red">繁忙</Tag>;
  };

  const handleOpenDetail = (outlet: any) => {
    setSelectedOutletId(outlet.id);
    setDetailVisible(true);
  };

  const handleOpenAppointment = (outlet: any) => {
    setSelectedOutletId(outlet.id);
    setAppointmentResult(null);
    appointmentForm.resetFields();
    setAppointmentModalVisible(true);
  };

  const handleSubmitAppointment = async () => {
    try {
      const values = await appointmentForm.validateFields();
      setAppointmentLoading(true);
      const res: any = await outletApi.createAppointment({
        outletId: selectedOutletId!,
        serviceType: values.serviceType,
        appointmentTime: `${values.appointmentDate} ${values.appointmentTime}`,
        name: values.name,
        phone: values.phone,
        remark: values.remark,
      });
      const result = res?.data || res;
      setAppointmentResult(result);
    } catch (e) { console.error(e); } finally { setAppointmentLoading(false); }
  };

  const generateDateOptions = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = dayjs().add(i, 'day');
      const isWeekend = d.day() === 0;
      dates.push({ value: d.format('YYYY-MM-DD'), label: `${d.format('MM月DD日')} ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.day()]}`, disabled: isWeekend });
    }
    return dates;
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let h = 8; h <= 17; h++) {
      times.push({ value: `${String(h).padStart(2, '0')}:00`, label: `${String(h).padStart(2, '0')}:00` });
      times.push({ value: `${String(h).padStart(2, '0')}:30`, label: `${String(h).padStart(2, '0')}:30` });
    }
    return times;
  };

  const windowTypeColorMap: Record<string, string> = {
    '水费': '#00B8D9', '电费': '#FF8800', '燃气': '#00B42A', '综合': '#165DFF', 'VIP': '#722ED1',
  };

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]} className="mb-2">
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center shadow-sm">
            <Statistic title="服务网点" value={outlets.length} suffix="个" valueStyle={{ color: '#165DFF', fontSize: 22 }} prefix={<EnvironmentOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center shadow-sm">
            <Statistic title="今日累计办理" value={totalServed} suffix="件" valueStyle={{ color: '#00B42A', fontSize: 22 }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center shadow-sm">
            <Statistic title="当前等待" value={totalWaiting} suffix="人" valueStyle={{ color: '#FF8800', fontSize: 22 }} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center shadow-sm">
            <Statistic title="平均等待" value={avgWait} suffix="分钟" valueStyle={{ color: '#F53F3F', fontSize: 22 }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card className="shadow-md">
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <Select value={districtFilter || undefined} onChange={setDistrictFilter} placeholder="全部区域" allowClear style={{ width: 140 }}>
            {Object.entries(districtMap).map(([code, name]) => <Option key={code} value={name}>{name}</Option>)}
          </Select>
          <Select value={serviceTypeFilter || undefined} onChange={setServiceTypeFilter} placeholder="全部类型" allowClear style={{ width: 140 }}>
            <Option value="water">水费服务</Option>
            <Option value="electricity">电费服务</Option>
            <Option value="gas">燃气服务</Option>
            <Option value="all">综合服务</Option>
          </Select>
          <Search placeholder="搜索网点名称/地址" allowClear onSearch={setKeyword} style={{ width: 240 }} />
          <Button key="queue" type="default" onClick={() => loadAllQueueStatus()} icon={<HistoryOutlined />}>
            刷新排队
          </Button>
          <div className="ml-auto flex gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />畅通</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />适中</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />繁忙</span>
          </div>
        </div>

        <div className="flex gap-4" style={{ minHeight: 680 }}>
          <div className="w-2/5 overflow-y-auto pr-2" style={{ maxHeight: 720 }}>
            <Spin spinning={loading}>
              {filteredOutlets.length === 0 ? (
                <Empty description="暂无匹配网点" className="py-20" />
              ) : (
                <List
                  dataSource={filteredOutlets}
                  renderItem={(outlet: any) => {
                    const q = queueMap[String(outlet.id)];
                    const markerInfo = getMarkerColor(q);
                    return (
                      <Card
                        key={outlet.id}
                        size="small"
                        className={`mb-3 cursor-pointer transition-all hover:shadow-md ${selectedOutletId === outlet.id ? 'ring-2 ring-blue-400' : ''}`}
                        onClick={() => setSelectedOutletId(outlet.id)}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-sm text-gray-800">{outlet.name}</span>
                              {outlet.shortName?.includes('旗舰') && <Tag color="gold" className="text-xs">旗舰店</Tag>}
                              {getQueueTag(q?.waitingCount || 0)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <StarOutlined className="text-yellow-500 text-xs" />
                            <span className="text-sm font-semibold">{outlet.rating}</span>
                            <span className="text-xs text-gray-400">({outlet.reviewCount})</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1 mb-2">
                          <div><EnvironmentOutlined className="mr-1" />{outlet.address}</div>
                          <div><ClockCircleOutlined className="mr-1" />{outlet.businessHours}</div>
                          <div><PhoneOutlined className="mr-1" />{outlet.contactPhone}</div>
                          <div><TeamOutlined className="mr-1" />团队{outlet.staffCount}人 · {outlet.windowCount}个窗口</div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(outlet.serviceTypes || []).map((st: string) => (
                            <Tag key={st} color={serviceTypeColorMap[st]} style={{ fontSize: 11 }}>{serviceTypeNameMap[st]}</Tag>
                          ))}
                        </div>
                        {q && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>今日负载</span>
                              <span>{q.servedToday}/{outlet.dailyCapacity}</span>
                            </div>
                            <Progress
                              percent={q.loadPercent || 0}
                              size="small"
                              strokeColor={(q.loadPercent || 0) > 80 ? '#F53F3F' : (q.loadPercent || 0) > 50 ? '#FF8800' : '#00B42A'}
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="small" type="primary" ghost onClick={(e) => { e.stopPropagation(); handleOpenDetail(outlet); }}>详情</Button>
                          <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); handleOpenAppointment(outlet); }}>预约</Button>
                        </div>
                      </Card>
                    );
                  }}
                />
              )}
            </Spin>
          </div>

          <div className="flex-1 relative rounded-xl overflow-hidden border border-gray-200" style={{ height: 720 }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, #e8f4f8 0%, #d4ebf2 20%, #c3e0d6 40%, #d9e8c5 60%, #e5dcc8 80%, #f0e6d3 100%)',
            }}>
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(100,150,180,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,150,180,0.08) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />

              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }}>
                <line x1="10%" y1="35%" x2="90%" y2="35%" stroke="rgba(150,150,150,0.3)" strokeWidth="3" />
                <line x1="15%" y1="60%" x2="85%" y2="60%" stroke="rgba(150,150,150,0.25)" strokeWidth="2" />
                <line x1="30%" y1="5%" x2="30%" y2="95%" stroke="rgba(150,150,150,0.25)" strokeWidth="2" />
                <line x1="55%" y1="10%" x2="55%" y2="90%" stroke="rgba(150,150,150,0.3)" strokeWidth="3" />
                <line x1="75%" y1="15%" x2="75%" y2="85%" stroke="rgba(150,150,150,0.2)" strokeWidth="2" />
                <path d="M 10,65% Q 30,58% 55,62% T 95,55%" fill="none" stroke="rgba(64,164,220,0.4)" strokeWidth="4" />
              </svg>

              <div className="absolute" style={{ top: '12%', left: '20%', zIndex: 3 }}>
                <span className="text-xs font-semibold text-gray-500 bg-white/60 px-1.5 py-0.5 rounded">锦江区</span>
              </div>
              <div className="absolute" style={{ top: '30%', left: '45%', zIndex: 3 }}>
                <span className="text-xs font-semibold text-gray-500 bg-white/60 px-1.5 py-0.5 rounded">武侯区</span>
              </div>
              <div className="absolute" style={{ top: '18%', left: '65%', zIndex: 3 }}>
                <span className="text-xs font-semibold text-gray-500 bg-white/60 px-1.5 py-0.5 rounded">成华区</span>
              </div>
              <div className="absolute" style={{ top: '55%', left: '30%', zIndex: 3 }}>
                <span className="text-xs font-semibold text-gray-500 bg-white/60 px-1.5 py-0.5 rounded">青羊区</span>
              </div>
              <div className="absolute" style={{ top: '70%', left: '55%', zIndex: 3 }}>
                <span className="text-xs font-semibold text-gray-500 bg-white/60 px-1.5 py-0.5 rounded">高新区</span>
              </div>
              <div className="absolute" style={{ top: '42%', left: '35%', zIndex: 3 }}>
                <span className="text-xs font-semibold text-gray-500 bg-white/60 px-1.5 py-0.5 rounded">金牛区</span>
              </div>

              <div className="absolute" style={{ top: '48%', left: '48%', zIndex: 3 }}>
                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-md" />
                <span className="text-xs text-gray-600 font-medium ml-1 whitespace-nowrap">市中心</span>
              </div>

              {filteredOutlets.map((outlet: any) => {
                const pos = getMapPosition(outlet.lng, outlet.lat);
                const q = queueMap[String(outlet.id)];
                const markerInfo = getMarkerColor(q);
                const isSelected = selectedOutletId === outlet.id;
                return (
                  <Tooltip key={outlet.id} title={`${outlet.shortName || outlet.name} · 等待${q?.waitingCount || 0}人`}>
                    <div
                      className={`absolute cursor-pointer transition-all duration-300 ${isSelected ? 'z-20 scale-125' : 'z-10'}`}
                      style={{ ...pos, transform: isSelected ? 'translate(-50%, -100%) scale(1.25)' : 'translate(-50%, -100%)' }}
                      onClick={() => { setSelectedOutletId(outlet.id); handleOpenDetail(outlet); }}
                    >
                      <div className="relative">
                        <svg width="32" height="42" viewBox="0 0 32 42">
                          <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill={markerInfo.bg} />
                          <circle cx="16" cy="15" r="7" fill="white" />
                          <text x="16" y="19" textAnchor="middle" fill={markerInfo.bg} fontSize="11" fontWeight="bold">{q?.waitingCount || 0}</text>
                        </svg>
                        {isSelected && (
                          <div className="absolute -inset-2 rounded-full border-2 border-blue-400 animate-ping opacity-30" />
                        )}
                      </div>
                    </div>
                  </Tooltip>
                );
              })}

              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg shadow px-3 py-2 text-xs space-y-1 z-10">
                <p className="font-medium text-gray-700 mb-1">排队图例</p>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />畅通 (≤5人)</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />适中 (6-15人)</div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />繁忙 (＞15人)</div>
              </div>

              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded shadow px-3 py-1 text-xs text-gray-600 z-10">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    <div className="w-6 h-2 border-t-2 border-l-2 border-b-2 border-gray-600" />
                    <div className="w-6 h-2 border-t-2 border-r-2 border-b-2 border-gray-600 bg-gray-800" />
                  </div>
                  <span>1公里</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        title={selectedOutlet ? (
          <div className="flex items-center gap-2">
            <EnvironmentOutlined style={{ color: '#165DFF' }} />
            <span>{selectedOutlet.name}</span>
            {selectedOutlet.shortName?.includes('旗舰') && <Tag color="gold">旗舰店</Tag>}
          </div>
        ) : '网点详情'}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={820}
        footer={[
          <Button key="back" onClick={() => setDetailVisible(false)}>关闭</Button>,
          <Button key="appt" type="primary" onClick={() => { setDetailVisible(false); handleOpenAppointment(selectedOutlet); }}>预约办理</Button>,
        ]}
      >
        {selectedOutlet && (
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={16}>
                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="所属区域"><Tag color="blue">{selectedOutlet.district}</Tag></Descriptions.Item>
                  <Descriptions.Item label="店长">{selectedOutlet.managerName}</Descriptions.Item>
                  <Descriptions.Item label="联系电话">
                    <PhoneOutlined className="mr-1" />{selectedOutlet.contactPhone}
                  </Descriptions.Item>
                  <Descriptions.Item label="详细地址" span={2}>
                    <EnvironmentOutlined className="mr-1" />{selectedOutlet.address}
                  </Descriptions.Item>
                  <Descriptions.Item label="营业时间" span={2}>
                    <ClockCircleOutlined className="mr-1" />{selectedOutlet.businessHours}
                  </Descriptions.Item>
                  <Descriptions.Item label="服务范围" span={2}>{selectedOutlet.serviceScope}</Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={8}>
                <Card size="small" className="mb-3 shadow-sm" title="基本信息">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">服务面积</span><span>{selectedOutlet.serviceArea}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">窗口数量</span><span>{selectedOutlet.windowCount}个</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">团队规模</span><span>{selectedOutlet.staffCount}人</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">日接待量</span><span>{selectedOutlet.dailyCapacity}人</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">用户评分</span><span><StarOutlined className="text-yellow-500 mr-1" />{selectedOutlet.rating} ({selectedOutlet.reviewCount}评)</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">成立时间</span><span>{selectedOutlet.established}</span></div>
                  </div>
                </Card>
                {selectedQueue && (
                  <Card size="small" className="shadow-sm" title="实时排队" extra={<Tag color="blue" onClick={() => loadAllQueueStatus()} className="cursor-pointer">刷新</Tag>}>
                    <Row gutter={8}>
                      <Col span={8}><Statistic title="等待" value={selectedQueue.waitingCount || 0} suffix="人" valueStyle={{ fontSize: 18, color: '#FF8800' }} /></Col>
                      <Col span={8}><Statistic title="办理中" value={selectedQueue.processingCount || 0} suffix="窗" valueStyle={{ fontSize: 18, color: '#165DFF' }} /></Col>
                      <Col span={8}><Statistic title="平均" value={selectedQueue.avgWaitTime || 0} suffix="分" valueStyle={{ fontSize: 18, color: '#F53F3F' }} /></Col>
                    </Row>
                    <div className="mt-2 text-xs text-gray-500 flex justify-between">
                      <span>今日已办：{selectedQueue.servedToday || 0}</span>
                      <span>负载率：{selectedQueue.loadPercent || 0}%</span>
                    </div>
                    <Progress percent={selectedQueue.loadPercent || 0} size="small" strokeColor={(selectedQueue.loadPercent || 0) > 80 ? '#F53F3F' : '#00B42A'} className="mt-1" />
                  </Card>
                )}
              </Col>
            </Row>

            {selectedQueue?.windows && selectedQueue.windows.length > 0 && (
              <div>
                <Divider orientation="left" orientationMargin={0} className="text-sm font-semibold">
                  <ClockCircleOutlined className="mr-1" />窗口实时状态
                </Divider>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedQueue.windows.map((w: any) => (
                    <Card key={w.no} size="small" className={`shadow-sm ${w.status === 'working' ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-gray-300'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Tag color={windowTypeColorMap[w.type] || '#165DFF'} style={{ margin: 0, minWidth: 36, textAlign: 'center' }}>{w.no}号</Tag>
                        <Tag style={{ margin: 0 }}>{w.type}</Tag>
                        <Tag color={w.status === 'working' ? 'green' : 'default'} style={{ margin: 0 }}>{w.status === 'working' ? '服务中' : '暂停'}</Tag>
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <div>柜员：{w.staff}</div>
                        {w.status === 'working' && (
                          <>
                            <div>当前办理：<span className="font-mono font-bold text-blue-600">{w.current}</span></div>
                            <div>前方等待：<span className={w.waiting > 5 ? 'text-red-500 font-bold' : 'text-green-600'}>{w.waiting}人</span></div>
                          </>
                        )}
                        <div>今日已办：{w.servedToday}件</div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Divider orientation="left" orientationMargin={0} className="text-sm font-semibold">
                <SafetyOutlined className="mr-1" />设施 & 可办业务
              </Divider>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2"><WifiOutlined className="mr-1" />服务设施</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedOutlet.facilities || []).map((f: string, i: number) => {
                      const fi = Object.entries(facilityIconMap).find(([k]) => f.includes(k));
                      return (
                        <Tag key={i} color={getFacilityColor(f)} icon={fi ? fi[1] as React.ReactNode : <CheckCircleOutlined />}>
                          {f}
                        </Tag>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2"><BankOutlined className="mr-1" />可办业务</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedOutlet.services || []).map((s: string, i: number) => (
                      <Tag key={i} color="blue" style={{ padding: '4px 10px' }}>{s}</Tag>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Divider orientation="left" orientationMargin={0} className="text-sm font-semibold">
                <EnvironmentOutlined className="mr-1" />到达指引
              </Divider>
              <Steps
                current={3}
                size="small"
                items={[
                  { title: '公共交通', description: `乘坐地铁/公交至${selectedOutlet.district}附近站点` },
                  { title: '自驾停车', description: '网点周边设有公共停车场，前2小时免费' },
                  { title: '线上预约', description: '提前预约可减少现场等待时间' },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={<div className="flex items-center gap-2"><CalendarOutlined style={{ color: '#165DFF' }} />预约办理</div>}
        open={appointmentModalVisible}
        onCancel={() => setAppointmentModalVisible(false)}
        width={560}
        footer={null}
      >
        {appointmentResult ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircleOutlined className="text-5xl text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">预约成功</h2>
            <p className="text-gray-500 mb-6">请按时前往办理，超时将自动取消预约</p>
            <div className="bg-gray-50 rounded-xl p-5 text-left max-w-md mx-auto mb-6">
              <Timeline
                items={[
                  { color: 'green', children: <span>预约成功</span> },
                  {
                    color: 'green',
                    children: (
                      <span>预约单号：<span className="font-mono font-bold">{appointmentResult.appointmentNo}</span></span>
                    ),
                  },
                  {
                    color: 'green',
                    children: (
                      <span>排队号码：<span className="font-mono font-bold text-lg text-blue-600">{appointmentResult.queueNumber}</span></span>
                    ),
                  },
                  {
                    color: 'green',
                    children: (
                      <span>办理网点：{selectedOutlet?.name}</span>
                    ),
                  },
                  {
                    color: 'green',
                    children: (
                      <span>预计办理时间：{appointmentResult.estimatedTime}</span>
                    ),
                  },
                ]}
              />
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setAppointmentModalVisible(false)}>关闭</Button>
              <Button type="primary" onClick={() => { setAppointmentModalVisible(false); setDetailVisible(true); }}>查看网点详情</Button>
            </div>
          </div>
        ) : (
          <Form form={appointmentForm} layout="vertical" className="mt-4">
            {selectedOutlet && (
              <Card size="small" className="mb-4 bg-blue-50 border-blue-100">
                <div className="flex items-center gap-3">
                  <EnvironmentOutlined className="text-blue-500 text-lg" />
                  <div>
                    <div className="font-medium text-sm">{selectedOutlet.name}</div>
                    <div className="text-xs text-gray-500">{selectedOutlet.address}</div>
                    {selectedQueue && <div className="text-xs text-gray-500">当前等待：{selectedQueue.waitingCount}人</div>}
                  </div>
                </div>
              </Card>
            )}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="serviceType" label="业务类型" rules={[{ required: true, message: '请选择业务类型' }]}>
                  <Select placeholder="请选择">
                    <Option value="water">水费缴纳</Option>
                    <Option value="electricity">电费缴纳</Option>
                    <Option value="gas">燃气费缴纳</Option>
                    <Option value="other">其他业务</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="appointmentDate" label="预约日期" rules={[{ required: true, message: '请选择日期' }]}>
                  <Select placeholder="请选择日期">
                    {generateDateOptions().map((d) => (
                      <Option key={d.value} value={d.value} disabled={d.disabled}>{d.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="appointmentTime" label="预约时段" rules={[{ required: true, message: '请选择时段' }]}>
                  <Select placeholder="请选择时段">
                    {generateTimeOptions().map((t) => (
                      <Option key={t.value} value={t.value}>{t.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                  <Input prefix={<UserOutlined />} placeholder="请输入您的姓名" maxLength={20} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="phone" label="手机号" rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}>
              <Input prefix={<PhoneOutlined />} placeholder="请输入您的手机号" maxLength={11} />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} placeholder="备注说明（选填，最多200字）" maxLength={200} showCount />
            </Form.Item>
            <Alert
              message="预约须知"
              description={(
                <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1 mt-1">
                  <li>请在预约时段前10分钟到达网点，凭预约号或手机号取号</li>
                  <li>超时15分钟未到系统将自动取消，爽约3次将限制预约功能</li>
                  <li>VIP用户、老人、孕妇、残障人士可享绿色通道优先办理</li>
                  <li>如需取消，请提前1小时拨打网点电话</li>
                </ul>
              )}
              type="info"
              showIcon
              className="mb-4"
            />
            <Form.Item className="mb-0">
              <div className="flex gap-3 justify-end">
                <Button onClick={() => setAppointmentModalVisible(false)}>取消</Button>
                <Button type="primary" size="large" className="h-10 px-8" onClick={handleSubmitAppointment} loading={appointmentLoading}>
                  确认预约
                </Button>
              </div>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ServiceMap;
