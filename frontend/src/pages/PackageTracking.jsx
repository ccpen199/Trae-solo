import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Timeline, Tag, Descriptions, message, Select, Form, Row, Col, Alert, Space, Steps, Divider, Statistic, Empty, Result } from 'antd';
import { SearchOutlined, InboxOutlined, CheckCircleOutlined, ClockCircleOutlined, TruckOutlined, EnvironmentOutlined, PhoneOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const { Option } = Select;

function PackageTracking() {
  const [searchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(searchParams.get('number') || '');
  const [packageInfo, setPackageInfo] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [packageTypes, setPackageTypes] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form] = Form.useForm();
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [createdPackage, setCreatedPackage] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [estimatedFee, setEstimatedFee] = useState(null);

  useEffect(() => {
    loadPackageTypes();
    const num = searchParams.get('number');
    if (num) {
      setTrackingNumber(num);
      doTrack(num);
    }
  }, []);

  const loadPackageTypes = async () => {
    try {
      const response = await api.get('/packages/types');
      setPackageTypes(response.data.types);
    } catch (error) {
      console.error('加载包裹类型失败', error);
    }
  };

  const doTrack = async (number) => {
    if (!number) return;
    setLoading(true);
    setSearchError('');
    setPackageInfo(null);
    setTrackingHistory([]);
    setHasSearched(true);

    try {
      const response = await api.post('/packages/track', { tracking_number: number });
      setPackageInfo(response.data.package);
      setTrackingHistory(response.data.trackingHistory || []);
    } catch (error) {
      setSearchError(error.response?.data?.error || '查询失败');
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!trackingNumber) {
      message.warning('请输入运单号');
      return;
    }
    doTrack(trackingNumber);
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    const weight = form.getFieldValue('weight');
    if (weight && type) {
      calculateFee(type, weight);
    }
  };

  const handleWeightChange = (e) => {
    const weight = parseFloat(e.target.value);
    if (selectedType && weight > 0) {
      calculateFee(selectedType, weight);
    }
  };

  const calculateFee = (type, weight) => {
    const typeInfo = packageTypes.find(t => t.id === type);
    if (typeInfo && weight > 0) {
      const fee = (typeInfo.basePrice + weight * typeInfo.pricePerKg).toFixed(2);
      setEstimatedFee(fee);
    }
  };

  const handleCreatePackage = async (values) => {
    try {
      const response = await api.post('/packages', values);
      setCreatedPackage(response.data);
      message.success('运单创建成功！');
      setShowCreateForm(false);
      form.resetFields();
      setEstimatedFee(null);
      
      setTrackingNumber(response.data.tracking_number);
      setTimeout(() => {
        doTrack(response.data.tracking_number);
      }, 500);
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const getPackageTypeInfo = (type) => {
    const types = {
      regular: { name: '普通包裹', color: 'default', icon: '📦', desc: '经济实惠，时效3-7天' },
      ems: { name: 'EMS特快', color: 'blue', icon: '⚡', desc: '快速送达，时效1-3天' },
      international: { name: '国际邮件', color: 'purple', icon: '🌍', desc: '跨境物流，时效7-30天' }
    };
    return types[type] || { name: type, color: 'default', icon: '📦', desc: '' };
  };

  const getStatusColor = (status) => {
    const colors = {
      '已签收': 'success',
      '派送中': 'processing',
      '运输中': 'blue',
      '已揽收': 'default',
      '待揽收': 'warning'
    };
    return colors[status] || 'default';
  };

  const getStatusSteps = (status) => {
    const allSteps = [
      { title: '待揽收', description: '等待快递员上门' },
      { title: '已揽收', description: '快递员已取件' },
      { title: '运输中', description: '包裹正在运输' },
      { title: '派送中', description: '快递员正在派送' },
      { title: '已签收', description: '包裹已送达' }
    ];
    
    const statusIndex = allSteps.findIndex(s => s.title === status);
    return allSteps.map((step, index) => ({
      ...step,
      status: index < statusIndex ? 'finish' : index === statusIndex ? 'process' : 'wait'
    }));
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>包裹查询</h1>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={16}>
            <Input.Search
              placeholder="请输入运单号，如：EA123456789CN、CP123456789CN、PA12345678911"
              size="large"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onSearch={handleSearch}
              enterButton={<Button type="primary" size="large" icon={<SearchOutlined />}>查询</Button>}
              loading={loading}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col span={8}>
            <Space wrap>
              <Tag color="green">📦 普通包裹</Tag>
              <Tag color="blue">⚡ EMS特快</Tag>
              <Tag color="purple">🌍 国际邮件</Tag>
            </Space>
          </Col>
        </Row>
        <Row style={{ marginTop: 12 }}>
          <Col span={24} style={{ color: '#999', fontSize: 12 }}>
            <Space direction="vertical" size={2}>
              <span>运单号格式：普通包裹 PA/KA+11位数字 | EMS E+9位数字+2位字母 | 国际件 CP/RA+9位数字+2位字母</span>
            </Space>
          </Col>
        </Row>
      </Card>

      {searchError && (
        <Alert
          message="查询失败"
          description={
            <div>
              <p><strong>{searchError}</strong></p>
              <Divider style={{ margin: '12px 0' }} />
              <p>可能的原因：</p>
              <ul style={{ marginTop: 8 }}>
                <li>运单号输入错误，请核对后重新查询</li>
                <li>包裹刚刚寄出，物流信息尚未录入</li>
                <li>该运单号不属于中国邮政承运范围</li>
              </ul>
              <p style={{ marginTop: 12 }}>客服热线：<strong>11185</strong></p>
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {createdPackage && (
        <Result
          status="success"
          title="运单创建成功"
          subTitle={`您的${createdPackage.type}运单号：${createdPackage.tracking_number}`}
          extra={[
            <div key="info" style={{ marginBottom: 16 }}>
              <Descriptions column={3} size="small" bordered>
                <Descriptions.Item label="运单号">
                  <Tag color="blue" style={{ fontSize: 14 }}>{createdPackage.tracking_number}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="包裹类型">{createdPackage.type}</Descriptions.Item>
                <Descriptions.Item label="预估运费">
                  <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{createdPackage.estimatedFee}</span>
                </Descriptions.Item>
                <Descriptions.Item label="重量">{createdPackage.weight} kg</Descriptions.Item>
                <Descriptions.Item label="当前状态">待揽收</Descriptions.Item>
                <Descriptions.Item label="下一步">等待快递员上门揽收</Descriptions.Item>
              </Descriptions>
            </div>,
            <Button type="primary" key="track" onClick={() => doTrack(createdPackage.tracking_number)}>
              查看物流详情
            </Button>,
            <Button key="close" onClick={() => setCreatedPackage(null)}>关闭</Button>,
          ]}
          style={{ marginBottom: 24, background: '#fff', borderRadius: 8, padding: 24 }}
        />
      )}

      {packageInfo && (
        <>
          <Card 
            title={
              <Space>
                <span>运单详情</span>
                <Tag color={getPackageTypeInfo(packageInfo.type).color}>
                  {getPackageTypeInfo(packageInfo.type).icon} {getPackageTypeInfo(packageInfo.type).name}
                </Tag>
                <Tag color={getStatusColor(packageInfo.status)}>{packageInfo.status}</Tag>
              </Space>
            } 
            style={{ marginBottom: 24 }}
          >
            <Row gutter={24}>
              <Col span={16}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="运单号">
                    <Tag color="blue" style={{ fontSize: 14 }}>{packageInfo.tracking_number}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="承运状态">
                    <Tag color={packageInfo.status === '已签收' ? 'success' : 'processing'}>
                      {packageInfo.status === '已签收' ? '已完成' : '运输中'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="当前位置">
                    <Space><EnvironmentOutlined />{packageInfo.current_location || '运输途中'}</Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="包裹重量">{packageInfo.weight} kg</Descriptions.Item>
                </Descriptions>

                <Divider style={{ margin: '16px 0' }} />

                <Descriptions column={2} size="small" title="收件人信息">
                  <Descriptions.Item label="收件人">
                    <Space><UserOutlined />{packageInfo.receiver}</Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="联系电话">
                    <Space><PhoneOutlined />{packageInfo.receiver_phone || '未填写'}</Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="收件地址" span={2}>
                    {packageInfo.receiver_address || '未填写'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={8}>
                <Card size="small" title="投递进度">
                  <Steps
                    direction="vertical"
                    size="small"
                    current={(() => {
                      const steps = ['待揽收', '已揽收', '运输中', '派送中', '已签收'];
                      return steps.indexOf(packageInfo.status);
                    })()}
                    items={getStatusSteps(packageInfo.status)}
                  />
                </Card>
              </Col>
            </Row>
          </Card>

          <Card title="物流轨迹" style={{ marginBottom: 24 }}>
            {trackingHistory.length > 0 ? (
              <Timeline
                mode="left"
                items={trackingHistory.map((item, index, arr) => ({
                  dot: index === 0 ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} /> : 
                       index === arr.length - 1 ? <ClockCircleOutlined style={{ color: '#ccc', fontSize: 16 }} /> :
                       <TruckOutlined style={{ color: '#1890ff', fontSize: 16 }} />,
                  color: index === 0 ? '#52c41a' : '#1890ff',
                  label: <span style={{ color: '#666' }}>{item.created_at}</span>,
                  children: (
                    <div style={{ padding: '8px 0' }}>
                      <div style={{ 
                        fontWeight: index === 0 ? 600 : 400, 
                        color: index === 0 ? '#52c41a' : '#333',
                        fontSize: 15
                      }}>
                        {item.status}
                        {index === 0 && <Tag color="green" style={{ marginLeft: 8 }}>最新</Tag>}
                      </div>
                      <div style={{ color: '#666', marginTop: 4 }}>
                        <Space><EnvironmentOutlined />{item.location}</Space>
                      </div>
                      <div style={{ color: '#999', fontSize: 13, marginTop: 4 }}>
                        {item.description}
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无物流轨迹信息" />
            )}
          </Card>

          <Card title="网点流转信息" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Card size="small"><Statistic title="已经过网点" value={trackingHistory.length} suffix="个" /></Card>
              </Col>
              <Col span={6}>
                <Card size="small"><Statistic title="当前所在" value={packageInfo.current_location || '运输途中'} valueStyle={{ fontSize: 14 }} /></Card>
              </Col>
              <Col span={6}>
                <Card size="small"><Statistic title="预计剩余" value={packageInfo.status === '已签收' ? 0 : '1-3'} suffix="天" /></Card>
              </Col>
              <Col span={6}>
                <Card size="small"><Statistic title="客服电话" value="11185" valueStyle={{ fontSize: 16, color: '#1890ff' }} /></Card>
              </Col>
            </Row>
          </Card>
        </>
      )}

      <Card 
        title="我要寄件" 
        extra={<Button onClick={() => { setShowCreateForm(!showCreateForm); setCreatedPackage(null); }} type={showCreateForm ? 'default' : 'primary'}>
          {showCreateForm ? '收起表单' : '新建运单'}
        </Button>}
      >
        {showCreateForm && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreatePackage}
            style={{ maxWidth: 700, marginTop: 16 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="type" label="包裹类型" rules={[{ required: true, message: '请选择包裹类型' }]}>
                  <Select placeholder="请选择包裹类型" onChange={handleTypeChange}>
                    {packageTypes.map(type => (
                      <Option key={type.id} value={type.id}>
                        {type.name} - {type.description}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="weight" label="重量(kg)" rules={[{ required: true, message: '请输入重量' }]}>
                  <Input type="number" step="0.1" min="0.1" max="30" placeholder="请输入重量（0.1-30kg）" onChange={handleWeightChange} />
                </Form.Item>
              </Col>
            </Row>

            {estimatedFee && (
              <Alert
                message={
                  <Space>
                    <DollarOutlined />
                    <span>预估运费：<strong style={{ color: '#ff4d4f', fontSize: 18 }}>¥{estimatedFee}</strong></span>
                    <span style={{ color: '#999', fontSize: 12 }}>(基础运费 + 重量×单价，实际以揽收为准)</span>
                  </Space>
                }
                type="info"
                style={{ marginBottom: 16 }}
              />
            )}

            <Form.Item name="receiver" label="收件人姓名" rules={[{ required: true, message: '请输入收件人' }]}>
              <Input placeholder="请输入收件人姓名" prefix={<UserOutlined />} />
            </Form.Item>
            <Form.Item name="receiver_phone" label="收件电话" rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^1\d{10}$/, message: '请输入有效的手机号' }
            ]}>
              <Input placeholder="请输入收件人手机号" prefix={<PhoneOutlined />} />
            </Form.Item>
            <Form.Item name="receiver_address" label="收件地址" rules={[{ required: true, message: '请输入收件地址' }]}>
              <Input.TextArea rows={3} placeholder="请输入详细收件地址（省/市/区/街道/门牌号）" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" size="large" disabled={!estimatedFee}>
                  确认创建运单
                </Button>
                <Button onClick={() => { form.resetFields(); setEstimatedFee(null); }} size="large">重置</Button>
              </Space>
              {!estimatedFee && selectedType && (
                <span style={{ marginLeft: 16, color: '#fa8c16', fontSize: 12 }}>
                  请先输入重量以计算预估运费
                </span>
              )}
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
}

export default PackageTracking;
