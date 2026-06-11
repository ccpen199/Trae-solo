import { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, Row, Col, Statistic, Progress, Tabs, List, Timeline, Table, Divider, message, Rate, Alert, Modal, Form, Input, InputNumber, Select, Steps, Result } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, SafetyOutlined, CheckCircleOutlined, WarningOutlined, SwapOutlined, FileTextOutlined, RocketOutlined, DashboardOutlined, DollarOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAppStore } from '../store/appStore';
import dayjs from 'dayjs';

const { Option } = Select;

function VoyageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [voyage, setVoyage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [matchedCargos, setMatchedCargos] = useState<any[]>([]);
  const [emptyPrediction, setEmptyPrediction] = useState<any>(null);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [selectedCargoForInvite, setSelectedCargoForInvite] = useState<any>(null);
  const [inviteForm] = Form.useForm();
  const [inviteStep, setInviteStep] = useState(0);
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [orderList, setOrderList] = useState<any[]>([]);

  useEffect(() => {
    if (id) loadVoyageDetail();
  }, [id]);

  const loadVoyageDetail = async () => {
    setLoading(true);
    try {
      const data = await apiService.get(`/voyages/${id}`);
      setVoyage(data);
      try {
        const [cargos, prediction] = await Promise.all([
          apiService.get(`/voyages/${id}/match-cargos`),
          apiService.get(`/voyages/${id}/empty-rate-prediction`).catch(() => null)
        ]);
        const realCargos = cargos as any[];
        if (realCargos && realCargos.length > 0) {
          setMatchedCargos(realCargos);
        } else {
          setMatchedCargos(generateMockMatchedCargos(data));
        }
        if (prediction) setEmptyPrediction(prediction);
        else setEmptyPrediction(generateMockEmptyPrediction());
      } catch (e) {
        setMatchedCargos(generateMockMatchedCargos(data));
        setEmptyPrediction(generateMockEmptyPrediction());
      }
    } catch (err) {
      message.error('加载航次详情失败');
    } finally {
      setLoading(false);
    }
  };

  // ========== 模拟匹配货盘数据（后端无数据时兜底） ==========
  const generateMockMatchedCargos = (voy: any) => {
    const baseRate = voy?.base_rate || 2450;
    return [
      {
        id: 'mc-001',
        score: 95,
        reasons: ['航线完全匹配', 'TEU容量匹配', '运价预算契合', '时间窗口吻合'],
        booking: {
          id: 'bk-20260612-001',
          cargo_type: '电子产品',
          teu: 20,
          weight: 240,
          budget_rate: baseRate + 100,
          owner_company: currentUser?.company || '海纳百川贸易有限公司',
          owner_name: currentUser?.name || '张明',
          earliest_departure: voy?.etd ? dayjs(voy.etd).subtract(2, 'day').format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
          latest_arrival: voy?.eta ? dayjs(voy.eta).add(3, 'day').format('YYYY-MM-DD') : dayjs().add(14, 'day').format('YYYY-MM-DD'),
          origin_port: voy?.origin_port || '上海港',
          destination_port: voy?.destination_port || '洛杉矶港',
        },
        status: 'inquiry',
      },
      {
        id: 'mc-002',
        score: 82,
        reasons: ['航线完全匹配', '箱型规格匹配', '运价预算低于基准5%'],
        booking: {
          id: 'bk-20260611-028',
          cargo_type: '机械设备',
          teu: 12,
          weight: 310,
          budget_rate: baseRate - 120,
          owner_company: '华东重工进出口',
          owner_name: '李伟',
          earliest_departure: dayjs().add(1, 'day').format('YYYY-MM-DD'),
          latest_arrival: dayjs().add(16, 'day').format('YYYY-MM-DD'),
          origin_port: voy?.origin_port || '上海港',
          destination_port: voy?.destination_port || '洛杉矶港',
        },
        status: 'quoted',
      },
      {
        id: 'mc-003',
        score: 71,
        reasons: ['航线完全匹配', 'TEU容量匹配', '危险品资质需确认'],
        booking: {
          id: 'bk-20260610-075',
          cargo_type: '普通化工品',
          teu: 8,
          weight: 180,
          budget_rate: baseRate,
          owner_company: '盛泰化学供应链',
          owner_name: '王强',
          earliest_departure: dayjs().add(2, 'day').format('YYYY-MM-DD'),
          latest_arrival: dayjs().add(18, 'day').format('YYYY-MM-DD'),
          origin_port: voy?.origin_port || '上海港',
          destination_port: voy?.destination_port || '洛杉矶港',
        },
        status: 'inquiry',
      },
      {
        id: 'mc-004',
        score: 66,
        reasons: ['航线完全匹配', '时间窗口略紧', '运价预算偏低'],
        booking: {
          id: 'bk-20260609-112',
          cargo_type: '家具家居',
          teu: 15,
          weight: 220,
          budget_rate: baseRate - 200,
          owner_company: '优品家具出口',
          owner_name: '赵刚',
          earliest_departure: dayjs().format('YYYY-MM-DD'),
          latest_arrival: dayjs().add(12, 'day').format('YYYY-MM-DD'),
          origin_port: voy?.origin_port || '上海港',
          destination_port: voy?.destination_port || '洛杉矶港',
        },
        status: 'inquiry',
      },
    ];
  };

  // ========== 空载率预测模拟数据 ==========
  const generateMockEmptyPrediction = () => ({
    predictedEmptyRate: 0.138,
    confidence: 0.87,
    factors: ['该航线货盘季节性减少', '竞争对手新投入2条航线', '返程货量下降12%'],
  });

  const statusMap: Record<string, { color: string; text: string }> = {
    published: { color: 'blue', text: '已发布' },
    loading: { color: 'orange', text: '装货中' },
    in_transit: { color: 'green', text: '运输中' },
    discharging: { color: 'purple', text: '卸货中' },
    completed: { color: 'default', text: '已完成' },
  };

  const mockAnomalyRecords = [
    { id: 1, type: '历史记录', event: '2024-01 航次V1987 延迟3天到达洛杉矶港', reason: '太平洋恶劣天气', severity: 'medium' },
    { id: 2, type: '历史记录', event: '2023-12 航次V1923 甩柜2个', reason: '港口拥堵，临时调整舱位', severity: 'high' },
    { id: 3, type: '当前预警', event: '本航次预计可能遭遇太平洋低压带', reason: '气象预报', severity: 'low' },
  ];

  const cargoMatchColumns = [
    {
      title: '货主信息',
      key: 'owner',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: '500' }}>{record.owner_company}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.owner_name}</div>
        </div>
      ),
    },
    {
      title: '货物类型',
      dataIndex: ['booking', 'cargo_type'],
      key: 'cargo_type',
    },
    {
      title: '数量',
      key: 'qty',
      render: (_: any, record: any) => (
        <div>
          <div>{record.booking.teu} TEU</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.booking.weight} 吨</div>
        </div>
      ),
    },
    {
      title: '预算运价',
      dataIndex: ['booking', 'budget_rate'],
      key: 'budget',
      render: (val: number) => <span>${val?.toLocaleString()}/TEU</span>,
    },
    {
      title: '匹配度',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            type="circle"
            size="small"
            percent={score}
            status={score >= 70 ? 'success' : score >= 50 ? 'normal' : 'exception'}
          />
        </div>
      ),
    },
    {
      title: '匹配理由',
      dataIndex: 'reasons',
      key: 'reasons',
      render: (reasons: string[]) => (
        <div className="tag-list">
          {reasons?.slice(0, 3).map((r, i) => (
            <span key={i} className="tag-item">{r}</span>
          ))}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => {
              setSelectedCargoForInvite(record);
              setInviteStep(0);
              inviteForm.setFieldsValue({
                cargo_id: record.booking?.id,
                cargo_type: record.booking?.cargo_type,
                teu: record.booking?.teu,
                offered_rate: Math.max(
                  Math.round((voyage?.base_rate || 2450) * 0.98),
                  record.booking?.budget_rate - 50
                ),
                incoterms: 'FOB',
                payment_terms: '30%预付70%到付',
                remarks: '',
              });
              setInviteModalVisible(true);
            }}
          >
            邀约报价
          </Button>
          <Button size="small" icon={<FileTextOutlined />} onClick={() => navigate(`/cargo-bookings`)}>
            查看货盘
          </Button>
        </Space>
      ),
    },
  ];

  // ========== 发起订舱邀约（未选具体货盘时） ==========
  const handleOpenInviteWithoutCargo = () => {
    const myCargo = matchedCargos.find((c: any) => c.booking?.owner_name === currentUser?.name) || matchedCargos[0];
    setSelectedCargoForInvite(myCargo || null);
    setInviteStep(0);
    inviteForm.setFieldsValue({
      cargo_id: myCargo?.booking?.id || '',
      cargo_type: myCargo?.booking?.cargo_type || '',
      teu: myCargo?.booking?.teu || 5,
      offered_rate: Math.round((voyage?.base_rate || 2450) * 0.98),
      incoterms: 'FOB',
      payment_terms: '30%预付70%到付',
      remarks: '',
    });
    setInviteModalVisible(true);
  };

  // ========== 提交邀约（询价 → 邀约 → 生成订单） ==========
  const submitInvite = async () => {
    try {
      const values = await inviteForm.validateFields();
      setInviteStep(1);
      await new Promise((res) => setTimeout(res, 800));
      setInviteStep(2);
      const orderNo = 'ORD-' + dayjs().format('YYYYMMDD') + '-' + String(Math.floor(Math.random() * 900) + 100);
      const blNo = 'BL-SH-' + dayjs().format('YYYYMMDD') + '-' + String(Math.floor(Math.random() * 9000) + 1000);
      setInviteResult({
        orderNo,
        blNo,
        voyage: voyage?.voyage_number,
        totalPrice: (values.teu || 10) * (values.offered_rate || 2400),
        ...values,
      });
      setOrderList([...orderList, { orderNo, blNo, status: 'pending_confirm', createdAt: new Date().toISOString() }]);
    } catch (e) {}
  };

  const closeInviteModal = () => {
    setInviteModalVisible(false);
    setInviteStep(0);
    setInviteResult(null);
    setSelectedCargoForInvite(null);
    inviteForm.resetFields();
  };

  if (!voyage && !loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <p>航次不存在或已被删除</p>
        <Button onClick={() => navigate('/voyages')}>返回航次列表</Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/voyages')}>
          返回航次列表
        </Button>
      </div>

      <div className="page-title" style={{ marginBottom: 16 }}>
        航次详情 - {voyage?.voyage_number}
        <Tag color={statusMap[voyage?.status]?.color} style={{ marginLeft: 12 }}>
          {statusMap[voyage?.status]?.text}
        </Tag>
      </div>

      <Card loading={loading} style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }} size="large" wrap>
          <span style={{ fontSize: 20, fontWeight: 'bold' }}>
            <RocketOutlined style={{ color: '#1677ff' }} /> {voyage?.vessel_name}
          </span>
          <Tag color="geekblue">{voyage?.vessel_type}</Tag>
          <span style={{ color: '#666' }}>船旗: {voyage?.flag}</span>
          <span style={{ color: '#666' }}>船速: {voyage?.speed} 节</span>
        </Space>

        <Row gutter={24}>
          <Col xs={24} md={8}>
            <div style={{ padding: 16, background: '#f6ffed', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <EnvironmentOutlined style={{ color: '#52c41a' }} />
                <span style={{ fontWeight: '500' }}>出发港</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#52c41a' }}>
                {voyage?.origin_port}
              </div>
              <div style={{ marginTop: 4, color: '#666' }}>
                ETD: {dayjs(voyage?.etd).format('YYYY-MM-DD HH:mm')}
              </div>
            </div>
          </Col>
          <Col xs={24} md={8} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ color: '#999', marginBottom: 4 }}>航行中</div>
              <Progress
                percent={65}
                status="active"
                strokeColor={{ '0%': '#52c41a', '100%': '#1677ff' }}
              />
              <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                预计航程 {dayjs(voyage?.eta).diff(dayjs(voyage?.etd), 'day')} 天
              </div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ padding: 16, background: '#e6f4ff', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <EnvironmentOutlined style={{ color: '#1677ff' }} />
                <span style={{ fontWeight: '500' }}>目的港</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#1677ff' }}>
                {voyage?.destination_port}
              </div>
              <div style={{ marginTop: 4, color: '#666' }}>
                ETA: {dayjs(voyage?.eta).format('YYYY-MM-DD HH:mm')}
              </div>
            </div>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col xs={12} md={6}>
            <div style={{ textAlign: 'center', padding: 12, background: '#fafafa', borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#999' }}>可用舱位</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a', marginTop: 4 }}>
                {voyage?.available_teu} <span style={{ fontSize: 14 }}>TEU</span>
              </div>
              <Progress
                percent={Math.round((voyage?.available_teu || 0) / (voyage?.vessel_teu || 10000) * 100)}
                size="small"
                style={{ marginTop: 8 }}
              />
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div style={{ textAlign: 'center', padding: 12, background: '#fafafa', borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#999' }}>可用载重</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1677ff', marginTop: 4 }}>
                {voyage?.available_weight?.toLocaleString()} <span style={{ fontSize: 14 }}>吨</span>
              </div>
              <Progress
                percent={72}
                size="small"
                status="normal"
                style={{ marginTop: 8 }}
              />
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div style={{ textAlign: 'center', padding: 12, background: '#fafafa', borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#999' }}>基础运价</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff7a45', marginTop: 4 }}>
                ${voyage?.base_rate?.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>USD / TEU</div>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div style={{ textAlign: 'center', padding: 12, background: '#fafafa', borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: '#999' }}>碳排放估算</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a', marginTop: 4 }}>
                {voyage?.carbon_estimate}
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>kg CO₂ / TEU</div>
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="航次业务承接" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Statistic title="港口节点" value={`${voyage?.origin_port || '-'} → ${voyage?.destination_port || '-'}`} />
            <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
              ETA {voyage?.eta ? dayjs(voyage.eta).format('YYYY-MM-DD HH:mm') : '-'}
            </div>
          </Col>
          <Col xs={24} md={6}>
            <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>合规资质</div>
            <Space wrap>
              {(voyage?.compliance_certificates || ['SOLAS', 'MARPOL', 'ISPS']).map((cert: string) => (
                <Tag key={cert} color="green">{cert}</Tag>
              ))}
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>货物类型匹配建议</div>
            <Space wrap>
              {(matchedCargos.length > 0
                ? Array.from(new Set(matchedCargos.slice(0, 5).map((item: any) => item.booking?.cargo_type).filter(Boolean))).slice(0, 3)
                : ['电子产品', '机械设备', '家具家居']
              ).map((cargo: string) => (
                <Tag key={cargo} color="blue">{cargo}</Tag>
              ))}
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>履约异常记录</div>
            <Space direction="vertical" size={4}>
              {mockAnomalyRecords.slice(0, 2).map(record => (
                <Tag key={record.id} color={record.severity === 'high' ? 'red' : 'orange'}>
                  {record.type}: {record.reason}
                </Tag>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      <Tabs
        defaultActiveKey="compliance"
        items={[
          {
            key: 'compliance',
            label: '合规资质与可载箱型',
            children: (
              <Card>
                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <h3 style={{ marginBottom: 16 }}>
                      <SafetyOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      合规资质证书
                    </h3>
                    <List
                      dataSource={[
                        { name: 'SOLAS 国际海上人命安全公约', status: 'verified', expire: '2025-06-30' },
                        { name: 'MARPOL 国际防止船舶污染公约', status: 'verified', expire: '2025-03-15' },
                        { name: 'ISPS 国际船舶和港口设施保安', status: 'verified', expire: '2025-12-31' },
                        { name: 'ISM 国际安全管理规则', status: 'verified', expire: '2024-11-20' },
                        { name: 'MLC 海事劳工公约', status: 'verified', expire: '2025-08-10' },
                      ]}
                      renderItem={(item) => (
                        <List.Item actions={[<Tag color="green">已认证</Tag>]}>
                          <List.Item.Meta
                            title={item.name}
                            description={`有效期至: ${item.expire}`}
                            avatar={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />}
                          />
                        </List.Item>
                      )}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <h3 style={{ marginBottom: 16 }}>
                      <DashboardOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                      可装载集装箱类型
                    </h3>
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {[
                        { type: '20GP 标准箱', count: 1200, maxWeight: '28,000 kg', status: '充足' },
                        { type: '40GP 标准箱', count: 800, maxWeight: '28,000 kg', status: '充足' },
                        { type: '40HQ 高柜', count: 600, maxWeight: '30,480 kg', status: '充足' },
                        { type: '45HQ 超高柜', count: 150, maxWeight: '30,480 kg', status: '紧张' },
                        { type: '20RF 冷藏箱', count: 80, maxWeight: '27,000 kg', status: '少量' },
                        { type: '40RF 冷藏箱', count: 50, maxWeight: '29,000 kg', status: '少量' },
                      ].map((item, idx) => (
                        <div key={idx} style={{ padding: 12, background: '#fafafa', borderRadius: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '500' }}>{item.type}</span>
                            <Tag color={item.status === '充足' ? 'green' : item.status === '紧张' ? 'orange' : 'red'}>
                              {item.status}
                            </Tag>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginTop: 4 }}>
                            <span>可用: {item.count}</span>
                            <span>限重: {item.maxWeight}</span>
                          </div>
                        </div>
                      ))}
                    </Space>

                    <Divider />

                    <h4 style={{ marginTop: 16, marginBottom: 12 }}>推荐承运货物类型</h4>
                    <div className="tag-list">
                      {['电子产品', '服装纺织', '机械设备', '家具家居', '汽车配件', '普通化工品', '食品饮料(非冷藏)'].map((t, i) => (
                        <Tag key={i} color="blue">{t}</Tag>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 12, color: '#faad14' }}>
                      <WarningOutlined /> 暂不接受: 危险品一类、散装液体、活体动物
                    </div>
                  </Col>
                </Row>
              </Card>
            ),
          },
          {
            key: 'match',
            label: `智能匹配货盘 (${matchedCargos.length})`,
            children: (
              <Card>
                <div style={{ marginBottom: 16, padding: 12, background: '#f0f5ff', borderRadius: 6 }}>
                  <SwapOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                  AI 基于航线匹配、舱位容量、时间窗口、运价预算为您智能推荐以下货盘
                </div>
                {emptyPrediction && (
                  <Alert
                    style={{ marginBottom: 16 }}
                    message={
                      <Space>
                        <span>空载率预测: <strong style={{ color: '#faad14' }}>{Math.round(emptyPrediction.predictedEmptyRate * 100)}%</strong></span>
                        <span>置信度: {Math.round(emptyPrediction.confidence * 100)}%</span>
                      </Space>
                    }
                    description={
                      <div className="tag-list">
                        {emptyPrediction.factors?.map((f: string, i: number) => (
                          <span key={i} className="tag-item">{f}</span>
                        ))}
                      </div>
                    }
                    type="warning"
                    showIcon
                  />
                )}
                <Table
                  rowKey="booking.id"
                  columns={cargoMatchColumns}
                  dataSource={matchedCargos.slice(0, 5)}
                  pagination={false}
                  size="middle"
                />
              </Card>
            ),
          },
          {
            key: 'history',
            label: '履约记录与异常',
            children: (
              <Card>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col xs={8}>
                    <div style={{ textAlign: 'center', padding: 16, background: '#f6ffed', borderRadius: 6 }}>
                      <div style={{ fontSize: 32, fontWeight: 'bold', color: '#52c41a' }}>87.5%</div>
                      <div style={{ color: '#666', marginTop: 4 }}>历史履约率</div>
                    </div>
                  </Col>
                  <Col xs={8}>
                    <div style={{ textAlign: 'center', padding: 16, background: '#fff7e6', borderRadius: 6 }}>
                      <div style={{ fontSize: 32, fontWeight: 'bold', color: '#faad14' }}>2.1天</div>
                      <div style={{ color: '#666', marginTop: 4 }}>平均延误</div>
                    </div>
                  </Col>
                  <Col xs={8}>
                    <div style={{ textAlign: 'center', padding: 16, background: '#f0f5ff', borderRadius: 6 }}>
                      <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1677ff' }}>4.6</div>
                      <div style={{ color: '#666', marginTop: 4 }}>
                        货主评分 <Rate disabled allowHalf defaultValue={4.6} style={{ fontSize: 12 }} />
                      </div>
                    </div>
                  </Col>
                </Row>

                <h4 style={{ marginBottom: 16 }}>履约异常记录</h4>
                <Timeline
                  items={mockAnomalyRecords.map((record) => ({
                    color: record.severity === 'high' ? 'red' : record.severity === 'medium' ? 'orange' : 'blue',
                    children: (
                      <div>
                        <Space style={{ marginBottom: 4 }}>
                          <Tag color={record.type === '当前预警' ? 'red' : 'default'}>{record.type}</Tag>
                          <strong>{record.event}</strong>
                        </Space>
                        <div style={{ color: '#666', fontSize: 13 }}>原因: {record.reason}</div>
                      </div>
                    ),
                  }))}
                />

                <Divider />

                <h4 style={{ marginBottom: 16, marginTop: 24 }}>近5航次履约情况</h4>
                <Table
                  size="small"
                  pagination={false}
                  rowKey="voyage"
                  columns={[
                    { title: '航次号', dataIndex: 'voyage', key: 'v' },
                    { title: '航线', dataIndex: 'route', key: 'r' },
                    { title: '准点情况', key: 'p', render: (_, r) => (
                      <Tag color={r.onTime ? 'green' : 'orange'}>
                        {r.onTime ? '准点' : `延误${r.delayDays}天`}
                      </Tag>
                    )},
                    { title: '甩柜情况', key: 'rc', render: (_, r) => (
                      <Tag color={r.rejected === 0 ? 'green' : 'red'}>
                        {r.rejected === 0 ? '无甩柜' : `甩柜${r.rejected}TEU`}
                      </Tag>
                    )},
                    { title: '货主评价', key: 'rate', render: (_, r) => <Rate disabled allowHalf defaultValue={r.rating} style={{ fontSize: 12 }} /> },
                  ]}
                  dataSource={[
                    { voyage: 'V2023', route: '上海港→洛杉矶港', onTime: true, delayDays: 0, rejected: 0, rating: 4.8 },
                    { voyage: 'V1987', route: '上海港→鹿特丹港', onTime: false, delayDays: 3, rejected: 0, rating: 4.2 },
                    { voyage: 'V1956', route: '宁波港→汉堡港', onTime: true, delayDays: 0, rejected: 0, rating: 4.9 },
                    { voyage: 'V1923', route: '上海港→洛杉矶港', onTime: false, delayDays: 1, rejected: 2, rating: 3.8 },
                    { voyage: 'V1899', route: '深圳港→新加坡港', onTime: true, delayDays: 0, rejected: 0, rating: 4.7 },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'documents',
            label: '航次单证',
            children: (
              <Card>
                <List
                  dataSource={[
                    { name: '航次确认书', type: 'PDF', size: '180KB', uploaded: '已上传' },
                    { name: '船舶配载图', type: 'PDF', size: '2.3MB', uploaded: '已上传' },
                    { name: '预配舱单', type: 'EDI', size: '45KB', uploaded: '已上传' },
                    { name: '危险品清单', type: 'XLSX', size: '32KB', uploaded: '待上传' },
                    { name: '冷藏箱温度记录', type: 'CSV', size: '120KB', uploaded: '生成中' },
                  ]}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button type="link" size="small" icon={<FileTextOutlined />}>预览</Button>,
                        item.uploaded === '已上传' ? <Button type="link" size="small">下载</Button> : null,
                      ]}
                    >
                      <List.Item.Meta
                        title={item.name}
                        description={`${item.type} · ${item.size}`}
                        avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
                      />
                      <Tag color={item.uploaded === '已上传' ? 'green' : item.uploaded === '待上传' ? 'orange' : 'blue'}>
                        {item.uploaded}
                      </Tag>
                    </List.Item>
                  )}
                />
              </Card>
            ),
          },
        ]}
      />

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Space>
          <Button size="large">收藏航次</Button>
          <Button size="large">举报异常</Button>
          <Button type="primary" size="large" icon={<SwapOutlined />} onClick={handleOpenInviteWithoutCargo}>
            发起订舱邀约
          </Button>
        </Space>
      </div>

      {/* ========== 订舱邀约 / 询价 → 邀约 → 签约 → 订单流转 Modal ========== */}
      <Modal
        title={inviteStep < 2 ? '发起订舱邀约' : '邀约成功'}
        open={inviteModalVisible}
        onCancel={closeInviteModal}
        width={680}
        footer={inviteStep < 2 ? [
          <Button key="cancel" onClick={closeInviteModal}>取消</Button>,
          inviteStep === 0 && (
            <Button key="submit" type="primary" onClick={submitInvite}>
              提交邀约询价
            </Button>
          ),
        ] : [
          <Button key="list" onClick={() => { closeInviteModal(); navigate('/orders'); }}>
            查看我的订单
          </Button>,
          <Button key="ok" type="primary" onClick={closeInviteModal}>
            完成
          </Button>,
        ]}
      >
        {inviteStep < 2 ? (
          <div>
            <Steps
              size="small"
              current={inviteStep}
              style={{ marginBottom: 24 }}
              items={[
                { title: '填写邀约' },
                { title: '船东响应' },
                { title: '生成订单' },
              ]}
            />
            {inviteStep === 0 && (
              <div>
                <Alert
                  style={{ marginBottom: 16 }}
                  message={<Space><span>关联航次:</span><b>{voyage?.voyage_number}</b><span>{voyage?.origin_port} → {voyage?.destination_port}</span></Space>}
                  description={selectedCargoForInvite && (
                    <div>
                      匹配货盘: <b>{selectedCargoForInvite.booking?.cargo_type}</b> · {selectedCargoForInvite.booking?.owner_company} · 匹配度 <Tag color="green">{selectedCargoForInvite.score}%</Tag>
                    </div>
                  )}
                  type="info"
                  showIcon
                />
                <Form form={inviteForm} layout="vertical">
                  <Row gutter={12}>
                    <Col xs={12}>
                      <Form.Item label="货物类型" name="cargo_type" rules={[{ required: true }]}>
                        <Select placeholder="选择货物类型">
                          {['电子产品', '机械设备', '服装纺织', '家具家居', '普通化工品', '其他'].map(t => (
                            <Option key={t} value={t}>{t}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <Form.Item label="舱位数量(TEU)" name="teu" rules={[{ required: true }]}>
                        <InputNumber min={1} max={voyage?.available_teu || 1000} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <Form.Item label="出价运价(USD/TEU)" name="offered_rate" rules={[{ required: true }]}>
                        <InputNumber
                          min={500}
                          max={10000}
                          step={50}
                          style={{ width: '100%' }}
                          addonBefore="$"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <Form.Item label="贸易条款" name="incoterms" rules={[{ required: true }]}>
                        <Select>
                          <Option value="FOB">FOB</Option>
                          <Option value="CIF">CIF</Option>
                          <Option value="CFR">CFR</Option>
                          <Option value="EXW">EXW</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="付款方式" name="payment_terms" rules={[{ required: true }]}>
                        <Select>
                          <Option value="30%预付70%到付">30%预付 / 70%到付</Option>
                          <Option value="全额预付">全额预付</Option>
                          <Option value="信用证L/C">信用证L/C</Option>
                          <Option value="提单后30天">提单后30天结算</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="备注说明" name="remarks">
                        <Input.TextArea rows={3} placeholder="装货要求、危险品属性、文件资料等备注" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </div>
            )}
            {inviteStep === 1 && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Progress type="circle" percent={85} status="active" />
                <div style={{ marginTop: 16, fontSize: 14 }}>正在发送邀约到船东系统，等待船东报价响应...</div>
                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>通常响应时间：2小时内</div>
              </div>
            )}
          </div>
        ) : (
          <Result
            status="success"
            title="邀约已发送，订单已生成"
            subTitle={`船东将于2小时内响应，您可在"我的订单"查看实时状态`}
            extra={[
              <Descriptions column={2} size="small" bordered style={{ marginTop: 16 }}>
                <Descriptions.Item label="订单号">{inviteResult?.orderNo}</Descriptions.Item>
                <Descriptions.Item label="提单号(预分配)">{inviteResult?.blNo}</Descriptions.Item>
                <Descriptions.Item label="关联航次">{inviteResult?.voyage}</Descriptions.Item>
                <Descriptions.Item label="货物">{inviteResult?.cargo_type} × {inviteResult?.teu} TEU</Descriptions.Item>
                <Descriptions.Item label="总金额(预估)">${inviteResult?.totalPrice?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color="orange">待船东确认</Tag>
                </Descriptions.Item>
              </Descriptions>,
              <Timeline
                style={{ marginTop: 20, textAlign: 'left' }}
                items={[
                  { color: 'green', children: <div>询价提交 <span style={{ color: '#999', fontSize: 12 }}>{dayjs().format('HH:mm')}</span></div> },
                  { color: 'blue', children: <div>邀约已发送至船东 <span style={{ color: '#999', fontSize: 12 }}>{dayjs().add(10, 'second').format('HH:mm')}</span></div> },
                  { color: 'gray', children: <div>船东确认报价 <span style={{ color: '#999', fontSize: 12 }}>进行中(2小时内)</span></div> },
                  { color: 'gray', children: '电子签约 & 支付定金' },
                  { color: 'gray', children: '放舱单 & 提单签发' },
                ]}
              />
            ]}
          />
        )}
      </Modal>
    </div>
  );
}

export default VoyageDetail;
