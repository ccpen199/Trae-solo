import { useState, useEffect } from 'react';
import { Card, Row, Col, Steps, Tag, Button, Modal, Form, Input, message, Tabs, Descriptions, Alert, Statistic, Table, Space, Badge, Empty, List, Avatar } from 'antd';
import { SafetyCertificateOutlined, UserSwitchOutlined, FileSearchOutlined, PhoneOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined, FileProtectOutlined } from '@ant-design/icons';
import api from '../utils/request';

interface Props {
  user: any;
}

export default function Governance({ user }: Props) {
  const [verifyModal, setVerifyModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [form] = Form.useForm();
  const [confirmForm] = Form.useForm();
  const [verifyCode, setVerifyCode] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [agentRecords, setAgentRecords] = useState<any[]>([]);
  const [priceWarnings, setPriceWarnings] = useState<any[]>([]);
  const [ownerConfirmations, setOwnerConfirmations] = useState<any[]>([]);
  const [imageDuplicates, setImageDuplicates] = useState<any[]>([]);
  const [regulatoryRecords, setRegulatoryRecords] = useState<any[]>([]);
  const [verifyStatus, setVerifyStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('system');

  useEffect(() => {
    loadStats();
    loadPriceWarnings();
    loadImageDuplicates();
    if (user?.role === 'agent') {
      loadAgentVerifyStatus();
      loadAgentRecords();
    }
    if (user?.role === 'user' || user?.role === 'agent' || user?.role === 'admin') {
      loadOwnerConfirmations();
    }
    if (user?.role === 'admin') {
      loadRegulatoryRecords();
      loadAgentRecords();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'agent' && user?.role === 'agent') {
      loadAgentVerifyStatus();
      loadAgentRecords();
    }
    if (activeTab === 'warning') {
      loadPriceWarnings();
    }
    if (activeTab === 'duplicate') {
      loadImageDuplicates();
    }
    if (activeTab === 'owner' && user) {
      loadOwnerConfirmations();
    }
    if (activeTab === 'compliance' && user?.role === 'admin') {
      loadRegulatoryRecords();
      loadAgentRecords();
    }
  }, [activeTab, user]);

  const loadStats = async () => {
    try {
      const res: any = await api.get('/governance/stats');
      setStats(res);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAgentVerifyStatus = async () => {
    try {
      const res: any = await api.get('/governance/agent/verify-status');
      setVerifyStatus(res.agent);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAgentRecords = async () => {
    try {
      const res: any = await api.get('/governance/agent/verify-records');
      setAgentRecords(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPriceWarnings = async () => {
    try {
      const res: any = await api.get('/governance/price-warnings');
      setPriceWarnings(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadOwnerConfirmations = async () => {
    try {
      const res: any = await api.get('/governance/owner-confirmations');
      setOwnerConfirmations(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadImageDuplicates = async () => {
    try {
      const res: any = await api.get('/governance/image-duplicates');
      setImageDuplicates(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadRegulatoryRecords = async () => {
    try {
      const res: any = await api.get('/governance/regulatory-records?pageSize=10');
      setRegulatoryRecords(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAgentVerify = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/governance/agent/verify', values);
      message.success('认证信息已提交，等待审核');
      setVerifyModal(false);
      loadAgentVerifyStatus();
      loadAgentRecords();
    } catch (e: any) {
      message.error(e.message || '提交失败');
    }
  };

  const handleOwnerConfirmRequest = async () => {
    try {
      const values = await confirmForm.validateFields();
      const res: any = await api.post('/governance/owner-confirm', values);
      setVerifyCode(res.code);
      message.success(`验证码已发送（模拟）: ${res.code}`);
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleOwnerConfirmVerify = async () => {
    try {
      const values = await confirmForm.validateFields();
      await api.post('/governance/owner-confirm/verify', values);
      message.success('业主确认成功');
      setConfirmModal(false);
      setVerifyCode('');
      confirmForm.resetFields();
      loadOwnerConfirmations();
    } catch (e: any) {
      message.error(e.message || '验证失败');
    }
  };

  const steps = [
    { title: '经纪人实名绑定', description: '身份证+从业资格证双重验证', icon: <UserSwitchOutlined /> },
    { title: '房源图片AI去重', description: '智能识别重复图片，防止一房多发', icon: <FileSearchOutlined /> },
    { title: '挂牌价偏离度预警', description: '对比区域均价，异常价格自动预警', icon: <SafetyCertificateOutlined /> },
    { title: '业主直连确认机制', description: '验证码验证业主身份，确保房源真实', icon: <PhoneOutlined /> },
  ];

  const getStatusBadge = (status: number) => {
    if (status === 1) return <Badge status="success" text="已认证" />;
    if (status === 0) return <Badge status="processing" text="审核中" />;
    return <Badge status="warning" text="待提交" />;
  };

  const getConfirmBadge = (confirmed: number) => {
    if (confirmed === 1) return <Badge status="success" text="已确认" />;
    return <Badge status="warning" text="待确认" />;
  };

  const statsCardStyle = { borderRadius: 8, textAlign: 'center' as const };

  const tabItems = [
    {
      key: 'system',
      label: '治理总览',
      children: (
        <div>
          {stats && (
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card style={{ ...statsCardStyle, borderLeft: '4px solid #52c41a' }}>
                  <Statistic 
                    title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><UserSwitchOutlined /> 认证经纪人</div>}
                    value={stats.agents.verified} 
                    suffix={`/ ${stats.agents.total}`} 
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <Button type="link" size="small" onClick={() => setActiveTab('agent')} style={{ padding: 0, marginTop: 8 }}>
                    查看审核记录 →
                  </Button>
                </Card>
              </Col>
              <Col span={6}>
                <Card style={{ ...statsCardStyle, borderLeft: '4px solid #1890ff' }}>
                  <Statistic 
                    title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><SafetyCertificateOutlined /> 真房源认证</div>}
                    value={stats.properties.verified} 
                    suffix={`/ ${stats.properties.total}`}
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Button type="link" size="small" onClick={() => setActiveTab('owner')} style={{ padding: 0, marginTop: 8 }}>
                    查看确认记录 →
                  </Button>
                </Card>
              </Col>
              <Col span={6}>
                <Card style={{ ...statsCardStyle, borderLeft: '4px solid #faad14' }}>
                  <Statistic 
                    title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><WarningOutlined /> 价格预警</div>}
                    value={stats.properties.priceWarnings} 
                    valueStyle={{ color: '#faad14' }}
                  />
                  <Button type="link" size="small" onClick={() => setActiveTab('warning')} style={{ padding: 0, marginTop: 8 }}>
                    查看预警名单 →
                  </Button>
                </Card>
              </Col>
              <Col span={6}>
                <Card style={{ ...statsCardStyle, borderLeft: '4px solid #722ed1' }}>
                  <Statistic 
                    title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileProtectOutlined /> 监管备案</div>}
                    value={stats.transactions.synced} 
                    suffix={`/ ${stats.transactions.total}`}
                    valueStyle={{ color: '#722ed1' }}
                  />
                  <Button type="link" size="small" onClick={() => setActiveTab('compliance')} style={{ padding: 0, marginTop: 8 }}>
                    查看备案记录 →
                  </Button>
                </Card>
              </Col>
            </Row>
          )}

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Card 
                title={<span><UserSwitchOutlined style={{ color: '#1890ff' }} /> 经纪人实名认证动态</span>} 
                style={{ borderRadius: 8 }}
                extra={<Button type="link" size="small" onClick={() => setActiveTab('agent')}>更多 →</Button>}
              >
                {agentRecords.length > 0 && (user?.role === 'agent' || user?.role === 'admin') ? (
                  <List
                    size="small"
                    dataSource={agentRecords.slice(0, 5)}
                    renderItem={(item: any) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar size="small" style={{ background: '#e6f7ff', color: '#1890ff' }}>{item.real_name?.charAt(0) || 'A'}</Avatar>}
                          title={<span style={{ fontSize: 13 }}>{item.real_name} · {item.agency}</span>}
                          description={<span style={{ fontSize: 12 }}>{item.license_no} · {item.created_at}</span>}
                        />
                        {getStatusBadge(item.verified)}
                      </List.Item>
                    )}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', fontSize: 13 }}>
                    <UserSwitchOutlined style={{ fontSize: 28, color: '#d9d9d9', marginBottom: 8 }} />
                    <div>登录后可查看详细认证记录</div>
                  </div>
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card 
                title={<span><WarningOutlined style={{ color: '#faad14' }} /> 价格预警房源</span>} 
                style={{ borderRadius: 8 }}
                extra={<Button type="link" size="small" onClick={() => setActiveTab('warning')}>更多 →</Button>}
              >
                {priceWarnings.length > 0 ? (
                  <List
                    size="small"
                    dataSource={priceWarnings.slice(0, 5)}
                    renderItem={(item: any) => (
                      <List.Item style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/#/property/${item.id}`}>
                        <List.Item.Meta
                          title={<span style={{ fontSize: 13 }}>{item.title}</span>}
                          description={<span style={{ fontSize: 12, color: '#999' }}>{item.district} · {item.area}㎡</span>}
                        />
                        <Space direction="vertical" size={0} style={{ textAlign: 'right' }}>
                          <span style={{ color: '#fa8c16', fontWeight: 500, fontSize: 14 }}>{item.price}万</span>
                          <Tag color="orange" style={{ margin: 0 }}>
                            偏离 {item.deviation > 0 ? '+' : ''}{item.deviation || 0}%
                          </Tag>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', fontSize: 13 }}>
                    <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a', marginBottom: 8 }} />
                    <div>暂无价格预警房源，市场价格稳定</div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Card 
                title={<span><FileSearchOutlined style={{ color: '#52c41a' }} /> 图片AI去重检测</span>} 
                style={{ borderRadius: 8 }}
                extra={<Button type="link" size="small" onClick={() => setActiveTab('duplicate')}>更多 →</Button>}
              >
                {imageDuplicates.length > 0 ? (
                  <List
                    size="small"
                    dataSource={imageDuplicates.slice(0, 5)}
                    renderItem={(item: any) => (
                      <List.Item>
                        <List.Item.Meta
                          title={<span style={{ fontSize: 13 }}>{item.title}</span>}
                          description={<span style={{ fontSize: 12, color: '#999' }}>{item.district} · {item.total_images}张图片</span>}
                        />
                        <Tag color="red">{item.duplicate_count}张重复</Tag>
                      </List.Item>
                    )}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', fontSize: 13 }}>
                    <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a', marginBottom: 8 }} />
                    <div>图片查重合格，未发现重复图片房源</div>
                  </div>
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card 
                title={<span><PhoneOutlined style={{ color: '#722ed1' }} /> 业主直连确认</span>} 
                style={{ borderRadius: 8 }}
                extra={<Button type="link" size="small" onClick={() => setActiveTab('owner')}>更多 →</Button>}
              >
                {ownerConfirmations.length > 0 && user ? (
                  <List
                    size="small"
                    dataSource={ownerConfirmations.slice(0, 5)}
                    renderItem={(item: any) => (
                      <List.Item>
                        <List.Item.Meta
                          title={<span style={{ fontSize: 13 }}>{item.property_title}</span>}
                          description={<span style={{ fontSize: 12, color: '#999' }}>{item.owner_name} · {item.created_at}</span>}
                        />
                        {getConfirmBadge(item.confirmed)}
                      </List.Item>
                    )}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', fontSize: 13 }}>
                    <PhoneOutlined style={{ fontSize: 28, color: '#d9d9d9', marginBottom: 8 }} />
                    <div>{user ? '暂无业主确认记录' : '登录后可查看确认记录'}</div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <Alert
            message="四重真房源治理机制"
            description="经纪人实名绑定 → 房源图片AI去重 → 挂牌价偏离度预警 → 业主直连确认，层层把关确保房源真实可靠。"
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Row gutter={16}>
            <Col span={6}>
              <Card style={{ textAlign: 'center', borderRadius: 8, background: 'linear-gradient(180deg, #e6f7ff 0%, #fff 100%)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1890ff20', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserSwitchOutlined style={{ fontSize: 28, color: '#1890ff' }} />
                </div>
                <h3 style={{ marginTop: 12, marginBottom: 4 }}>经纪人实名绑定</h3>
                <Tag color="green">已认证 {stats?.agents.verified || 0} 人</Tag>
                <p style={{ color: '#666', fontSize: 12, marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
                  身份证+从业资格证双重验证
                </p>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ textAlign: 'center', borderRadius: 8, background: 'linear-gradient(180deg, #f6ffed 0%, #fff 100%)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#52c41a20', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSearchOutlined style={{ fontSize: 28, color: '#52c41a' }} />
                </div>
                <h3 style={{ marginTop: 12, marginBottom: 4 }}>房源图片AI去重</h3>
                <Tag color="blue">已检测 {imageDuplicates.length} 套</Tag>
                <p style={{ color: '#666', fontSize: 12, marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
                  智能识别重复图片，防一房多发
                </p>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ textAlign: 'center', borderRadius: 8, background: 'linear-gradient(180deg, #fff7e6 0%, #fff 100%)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#faad1420', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <WarningOutlined style={{ fontSize: 28, color: '#faad14' }} />
                </div>
                <h3 style={{ marginTop: 12, marginBottom: 4 }}>挂牌价偏离度预警</h3>
                <Tag color="orange">预警 {stats?.properties.priceWarnings || 0} 套</Tag>
                <p style={{ color: '#666', fontSize: 12, marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
                  对比区域均价，异常价格自动预警
                </p>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ textAlign: 'center', borderRadius: 8, background: 'linear-gradient(180deg, #f9f0ff 0%, #fff 100%)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#722ed120', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneOutlined style={{ fontSize: 28, color: '#722ed1' }} />
                </div>
                <h3 style={{ marginTop: 12, marginBottom: 4 }}>业主直连确认</h3>
                <Tag color="purple">已确认 {stats?.properties.ownerConfirmed || 0} 套</Tag>
                <p style={{ color: '#666', fontSize: 12, marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
                  验证码验证业主身份，确保真实
                </p>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'agent',
      label: '经纪人实名认证',
      children: (
        <div>
          {user?.role === 'agent' && verifyStatus && (
            <Card style={{ marginBottom: 16, borderRadius: 8, background: verifyStatus.verified ? '#f6ffed' : '#fff7e6' }}>
              <Row gutter={16} align="middle">
                <Col span={18}>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="真实姓名">{verifyStatus.real_name}</Descriptions.Item>
                    <Descriptions.Item label="身份证号">{verifyStatus.id_card?.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')}</Descriptions.Item>
                    <Descriptions.Item label="资格证号">{verifyStatus.license_no}</Descriptions.Item>
                    <Descriptions.Item label="所属机构">{verifyStatus.agency}</Descriptions.Item>
                    <Descriptions.Item label="联系电话">{verifyStatus.phone}</Descriptions.Item>
                    <Descriptions.Item label="认证状态">{getStatusBadge(verifyStatus.verified)}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={6} style={{ textAlign: 'right' }}>
                  <Button type="primary" onClick={() => setVerifyModal(true)}>更新认证信息</Button>
                </Col>
              </Row>
            </Card>
          )}

          {user?.role === 'agent' && !verifyStatus && (
            <Card style={{ marginBottom: 16, borderRadius: 8 }}>
              <Alert
                message="尚未提交实名认证"
                description="请完成实名认证后才能发布房源和进行交易。"
                type="warning"
                showIcon
                action={<Button type="primary" onClick={() => setVerifyModal(true)}>立即认证</Button>}
              />
            </Card>
          )}

          {user?.role !== 'agent' && user?.role !== 'admin' && (
            <Alert
              message="请以经纪人身份登录"
              description="经纪人实名认证仅限经纪人账号使用，请先注册或切换至经纪人账号。"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {agentRecords.length > 0 && (user?.role === 'agent' || user?.role === 'admin') && (
            <Card title="认证审核记录" style={{ borderRadius: 8 }}>
              <Table
                dataSource={agentRecords}
                rowKey="id"
                size="small"
                columns={[
                  { title: '经纪人', dataIndex: 'real_name', key: 'real_name' },
                  { title: '所属机构', dataIndex: 'agency', key: 'agency' },
                  { title: '联系电话', dataIndex: 'phone', key: 'phone' },
                  { title: '资格证号', dataIndex: 'license_no', key: 'license_no' },
                  {
                    title: '认证状态',
                    key: 'verified',
                    render: (_, record: any) => getStatusBadge(record.verified),
                  },
                  { title: '提交时间', dataIndex: 'created_at', key: 'created_at' },
                ]}
              />
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'duplicate',
      label: '图片AI去重',
      children: (
        <div>
          <Alert
            message="AI图片去重系统"
            description="平台采用深度学习图像识别技术，自动检测重复房源图片，防止一房多发、盗用图片等违规行为。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Card title={`去重检测记录（${imageDuplicates.length}套）`} style={{ borderRadius: 8 }}>
            {imageDuplicates.length > 0 ? (
              <Table
                dataSource={imageDuplicates}
                rowKey="property_id"
                size="small"
                columns={[
                  { title: '房源ID', dataIndex: 'property_id', key: 'property_id' },
                  { title: '房源标题', dataIndex: 'title', key: 'title' },
                  { title: '区域', dataIndex: 'district', key: 'district' },
                  { title: '图片总数', dataIndex: 'total_images', key: 'total_images' },
                  {
                    title: '重复图片',
                    dataIndex: 'duplicate_count',
                    key: 'duplicate_count',
                    render: (val: number) => <Tag color="red">{val}张</Tag>,
                  },
                  {
                    title: '处理状态',
                    key: 'status',
                    render: () => <Tag color="orange">待处理</Tag>,
                  },
                ]}
              />
            ) : (
              <Empty description="暂无重复图片记录" />
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'warning',
      label: '价格偏离预警',
      children: (
        <div>
          <Alert
            message="价格偏离度预警机制"
            description="系统自动对比区域市场均价，挂牌价偏离超过±15%的房源将被标记预警，保护买卖双方利益。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Card title={`价格预警房源（${priceWarnings.length}套）`} style={{ borderRadius: 8 }}>
            {priceWarnings.length > 0 ? (
              <Table
                dataSource={priceWarnings}
                rowKey="id"
                size="small"
                columns={[
                  { title: '房源ID', dataIndex: 'id', key: 'id' },
                  { title: '房源标题', dataIndex: 'title', key: 'title' },
                  { title: '区域', dataIndex: 'district', key: 'district' },
                  {
                    title: '挂牌价',
                    key: 'price',
                    render: (_, record: any) => (
                      <span>{record.price}万</span>
                    ),
                  },
                  {
                    title: '区域均价',
                    key: 'avg_price',
                    render: (_, record: any) => (
                      <span>{record.avg_price?.toLocaleString() || '-'}元/㎡</span>
                    ),
                  },
                  {
                    title: '房源单价',
                    key: 'unit_price',
                    render: (_, record: any) => (
                      <span>{record.unitPrice?.toLocaleString() || '-'}元/㎡</span>
                    ),
                  },
                  {
                    title: '偏离度',
                    key: 'deviation',
                    render: (_, record: any) => (
                      <Tag color={Math.abs(record.deviation) > 20 ? 'red' : 'orange'}>
                        {record.deviation > 0 ? '+' : ''}{record.deviation}%
                      </Tag>
                    ),
                  },
                  {
                    title: '真房源认证',
                    key: 'verified',
                    render: (_, record: any) => (
                      record.is_verified ? <Tag color="green">已认证</Tag> : <Tag color="default">未认证</Tag>
                    ),
                  },
                ]}
              />
            ) : (
              <Empty description="暂无价格预警房源" />
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'owner',
      label: '业主直连确认',
      children: (
        <div>
          <Alert
            message="业主直连确认机制"
            description="为确保房源真实有效，业主需通过手机验证码确认房源信息，验证通过后将获得「真房源」认证标识。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          {user ? (
            <div>
              <Card title="发起业主确认" style={{ marginBottom: 16, borderRadius: 8 }}>
                <Form form={confirmForm} layout="vertical" style={{ maxWidth: 500 }}>
                  <Form.Item name="propertyId" label="房源ID" rules={[{ required: true, message: '请输入房源ID' }]}>
                    <Input placeholder="请输入需要确认的房源ID" />
                  </Form.Item>
                  <Form.Item label="验证码">
                    <Input.Group compact>
                      <Form.Item name="code" noStyle rules={[{ required: true, message: '请输入验证码' }]}>
                        <Input style={{ width: '60%' }} placeholder="请输入验证码" />
                      </Form.Item>
                      <Button type="primary" onClick={handleOwnerConfirmRequest}>
                        获取验证码
                      </Button>
                    </Input.Group>
                  </Form.Item>
                  <Button type="primary" onClick={handleOwnerConfirmVerify}>
                    确认房源
                  </Button>
                </Form>
                {verifyCode && (
                  <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', borderRadius: 4 }}>
                    <Tag color="green">模拟验证码: {verifyCode}</Tag>
                    <span style={{ color: '#52c41a', fontSize: 13 }}>（实际项目中会发送短信到业主手机）</span>
                  </div>
                )}
              </Card>

              {ownerConfirmations.length > 0 && (
                <Card title="业主确认记录" style={{ borderRadius: 8 }}>
                  <List
                    dataSource={ownerConfirmations}
                    renderItem={(item: any) => (
                      <List.Item
                        actions={[getConfirmBadge(item.confirmed)]}
                      >
                        <List.Item.Meta
                          title={item.property_title}
                          description={
                            <div>
                              <span style={{ color: '#999' }}>
                                业主: {item.owner_name} · {item.owner_phone} · {item.property_price}万 · {item.property_area}㎡ · {item.district}
                              </span>
                              <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                                申请时间: {item.created_at}
                                {item.confirmed_at && ` · 确认时间: ${item.confirmed_at}`}
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}
            </div>
          ) : (
            <Alert
              message="请先登录"
              description="业主确认需要登录账号，请先登录后再进行操作。"
              type="warning"
              showIcon
            />
          )}
        </div>
      ),
    },
    {
      key: 'compliance',
      label: '合规监管',
      children: (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <SafetyCertificateOutlined style={{ fontSize: 64, color: '#52c41a' }} />
            <h2 style={{ marginTop: 16 }}>地方住建监管平台对接</h2>
            <p style={{ color: '#666' }}>所有交易数据实时同步至地方住建部门，确保网签备案合规</p>
          </div>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {[
              { title: '网签备案', desc: '交易合同实时网签备案，自动生成备案号' },
              { title: '资金监管', desc: '交易资金全程监管，保障资金安全' },
              { title: '税费缴纳', desc: '税费自动测算，线上缴纳方便快捷' },
              { title: '产权过户', desc: '过户进度全程可追踪，透明公开' },
              { title: '数据上报', desc: '交易数据实时上报监管部门' },
              { title: '信用体系', desc: '建立经纪人信用评价体系' },
            ].map((item, idx) => (
              <Col span={8} key={idx}>
                <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 6, textAlign: 'center' }}>
                  <FileProtectOutlined style={{ fontSize: 28, color: '#1890ff' }} />
                  <h4 style={{ marginBottom: 8, marginTop: 12 }}>{item.title}</h4>
                  <p style={{ color: '#666', fontSize: 13, marginBottom: 0 }}>{item.desc}</p>
                </div>
              </Col>
            ))}
          </Row>

          {user?.role === 'admin' ? (
            <Card title="监管备案记录" style={{ borderRadius: 8 }}>
              {regulatoryRecords.length > 0 ? (
                <Table
                  dataSource={regulatoryRecords}
                  rowKey="id"
                  size="small"
                  columns={[
                    { title: '备案号', dataIndex: 'platform_ref_no', key: 'platform_ref_no' },
                    { title: '房源', dataIndex: 'property_title', key: 'property_title' },
                    { title: '交易编号', dataIndex: 'order_no', key: 'order_no' },
                    { title: '记录类型', dataIndex: 'record_type', key: 'record_type' },
                    { title: '买方', dataIndex: 'buyer_name', key: 'buyer_name' },
                    { title: '卖方', dataIndex: 'seller_name', key: 'seller_name' },
                    {
                      title: '同步状态',
                      key: 'status',
                      render: (_, record: any) => (
                        record.status === 'synced' ?
                          <Tag color="success">已同步</Tag> :
                          record.status === 'pending' ?
                            <Tag color="orange">同步中</Tag> :
                            <Tag color="red">同步失败</Tag>
                      ),
                    },
                    { title: '同步时间', dataIndex: 'created_at', key: 'created_at' },
                  ]}
                />
              ) : (
                <Empty description="暂无监管备案记录" />
              )}
            </Card>
          ) : (
            <Alert
              message="监管备案记录仅限管理员查看"
              description="请使用管理员账号登录查看详细的监管备案记录。"
              type="info"
              showIcon
            />
          )}

          <div style={{ marginTop: 24, padding: 16, background: '#e6f7ff', borderRadius: 6 }}>
            <h4 style={{ color: '#1890ff', marginTop: 0 }}>监管合规承诺</h4>
            <ul style={{ color: '#0050b3', lineHeight: 2, marginBottom: 0 }}>
              <li>严格遵守《城市房地产管理法》等法律法规</li>
              <li>所有房源信息真实有效，接受社会监督</li>
              <li>交易资金纳入监管账户，专款专用</li>
              <li>交易合同网签备案，保障双方权益</li>
              <li>定期向住建部门报送交易统计数据</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card
        title={
          <span>
            <SafetyCertificateOutlined style={{ color: '#52c41a' }} /> 真房源治理体系
          </span>
        }
        style={{ borderRadius: 8 }}
        extra={<Tag color="green">已通过住建部门备案</Tag>}
      >
        <Tabs
          items={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      </Card>

      <Modal
        title="经纪人实名认证"
        open={verifyModal}
        onOk={handleAgentVerify}
        onCancel={() => setVerifyModal(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="realName" label="真实姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item name="idCard" label="身份证号" rules={[{ required: true }]}>
            <Input placeholder="请输入18位身份证号" />
          </Form.Item>
          <Form.Item name="licenseNo" label="经纪资格证编号" rules={[{ required: true }]}>
            <Input placeholder="请输入经纪人资格证书编号" />
          </Form.Item>
          <Form.Item name="agency" label="所属经纪机构" rules={[{ required: true }]}>
            <Input placeholder="请输入所属房产经纪机构名称" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
