import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, Button, Tag, Spin, message, Row, Col, Statistic, 
  List, Modal, Input, Select, Empty, Divider, Badge, Space,
  Popconfirm, Timeline, Descriptions
} from 'antd';
import { 
  WarningOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, UserOutlined, EyeOutlined, CheckOutlined,
  ArrowLeftOutlined, ReloadOutlined
} from '@ant-design/icons';
import { RiskAlert } from '../types';
import { riskApi, patientApi } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

const RiskAlerts: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [doctorName, setDoctorName] = useState<string>('医生');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await riskApi.getActiveAlerts();
      setAlerts(data);
    } catch (error) {
      message.error('获取告警列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      const result = await riskApi.acknowledgeAlert(alertId, doctorName);
      if (result) {
        message.success('已确认告警');
        fetchAlerts();
        setDetailModalVisible(false);
      }
    } catch (error) {
      message.error('确认告警失败');
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const result = await riskApi.resolveAlert(alertId, doctorName);
      if (result) {
        message.success('已解决告警');
        fetchAlerts();
        setDetailModalVisible(false);
      }
    } catch (error) {
      message.error('解决告警失败');
    }
  };

  const handleAutoGenerate = async () => {
    setLoading(true);
    try {
      const result = await riskApi.autoGenerateAlerts();
      message.success(result.message);
      fetchAlerts();
    } catch (error) {
      message.error('生成告警失败');
    } finally {
      setLoading(false);
    }
  };

  const viewAlertDetail = (alert: RiskAlert) => {
    setSelectedAlert(alert);
    setDetailModalVisible(true);
  };

  const getLevelColor = (level: RiskAlert['level']) => {
    switch (level) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'green';
    }
  };

  const getLevelText = (level: RiskAlert['level']) => {
    switch (level) {
      case 'high': return '高危';
      case 'medium': return '中危';
      case 'low': return '低危';
      default: return '低危';
    }
  };

  const getTypeText = (type: RiskAlert['type']) => {
    const typeMap: Record<string, string> = {
      'health': '健康指标',
      'medication': '用药',
      'lifestyle': '生活方式',
      'other': '其他'
    };
    return typeMap[type] || type;
  };

  const getStatusColor = (status: RiskAlert['status']) => {
    switch (status) {
      case 'active': return 'red';
      case 'acknowledged': return 'orange';
      case 'resolved': return 'green';
      default: return 'default';
    }
  };

  const getStatusText = (status: RiskAlert['status']) => {
    switch (status) {
      case 'active': return '待处理';
      case 'acknowledged': return '已确认';
      case 'resolved': return '已解决';
      default: return '未知';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const statusMatch = filterStatus === 'all' || alert.status === filterStatus;
    const levelMatch = filterLevel === 'all' || alert.level === filterLevel;
    return statusMatch && levelMatch;
  });

  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    high: alerts.filter(a => a.level === 'high').length,
    medium: alerts.filter(a => a.level === 'medium').length
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          style={{ marginBottom: 16 }}
        >
          返回
        </Button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            <WarningOutlined style={{ marginRight: 8 }} />
            风险告警中心
          </h1>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={handleAutoGenerate}
            loading={loading}
          >
            自动检测风险
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="告警总数"
              value={stats.total}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="待处理"
              value={stats.active}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="高危告警"
              value={stats.high}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="中危告警"
              value={stats.medium}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>状态筛选</div>
            <Select
              style={{ width: '100%' }}
              value={filterStatus}
              onChange={setFilterStatus}
            >
              <Option value="all">全部</Option>
              <Option value="active">待处理</Option>
              <Option value="acknowledged">已确认</Option>
              <Option value="resolved">已解决</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>风险等级</div>
            <Select
              style={{ width: '100%' }}
              value={filterLevel}
              onChange={setFilterLevel}
            >
              <Option value="all">全部等级</Option>
              <Option value="high">高危</Option>
              <Option value="medium">中危</Option>
              <Option value="low">低危</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>操作人</div>
            <Input
              placeholder="请输入医生姓名"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : filteredAlerts.length > 0 ? (
          <List
            dataSource={filteredAlerts}
            renderItem={(alert) => (
              <List.Item
                className={`alert-card alert-${alert.level}`}
                style={{ 
                  borderLeft: `4px solid ${
                    alert.level === 'high' ? '#ff4d4f' : 
                    alert.level === 'medium' ? '#faad14' : '#52c41a'
                  }`,
                  borderRadius: 4,
                  background: '#fafafa'
                }}
                actions={[
                  <Button 
                    type="link" 
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => viewAlertDetail(alert)}
                  >
                    详情
                  </Button>,
                  alert.status === 'active' && (
                    <Popconfirm
                      title="确认要处理该告警吗？"
                      onConfirm={() => handleAcknowledge(alert.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button 
                        type="link" 
                        size="small"
                        icon={<CheckOutlined />}
                      >
                        确认
                      </Button>
                    </Popconfirm>
                  ),
                  (alert.status === 'active' || alert.status === 'acknowledged') && (
                    <Popconfirm
                      title="确认该告警已解决？"
                      onConfirm={() => handleResolve(alert.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button 
                        type="link" 
                        size="small"
                        icon={<CheckCircleOutlined />}
                        style={{ color: '#52c41a' }}
                      >
                        解决
                      </Button>
                    </Popconfirm>
                  )
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 24, 
                      background: getLevelColor(alert.level),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 20
                    }}>
                      {alert.level === 'high' ? <CloseCircleOutlined /> : 
                       alert.level === 'medium' ? <WarningOutlined /> : 
                       <CheckCircleOutlined />}
                    </div>
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag color={getLevelColor(alert.level)}>
                        {getLevelText(alert.level)}
                      </Tag>
                      <Tag color={getStatusColor(alert.status)}>
                        {getStatusText(alert.status)}
                      </Tag>
                      <span style={{ fontWeight: 600 }}>{alert.title}</span>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ color: '#8c8c8c', marginBottom: 4 }}>
                        类型: {getTypeText(alert.type)} | 
                        触发时间: {new Date(alert.triggeredAt).toLocaleString()}
                      </div>
                      <div>{alert.description}</div>
                      {alert.status === 'acknowledged' && alert.acknowledgedBy && (
                        <div style={{ marginTop: 8, color: '#faad14' }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          已由 {alert.acknowledgedBy} 于 {new Date(alert.acknowledgedAt!).toLocaleString()} 确认
                        </div>
                      )}
                      {alert.status === 'resolved' && alert.resolvedBy && (
                        <div style={{ marginTop: 8, color: '#52c41a' }}>
                          <CheckCircleOutlined style={{ marginRight: 4 }} />
                          已由 {alert.resolvedBy} 于 {new Date(alert.resolvedAt!).toLocaleString()} 解决
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无风险告警" />
        )}
      </Card>

      <Modal
        title="告警详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedAlert && selectedAlert.status === 'active' && (
            <Button 
              key="acknowledge" 
              onClick={() => handleAcknowledge(selectedAlert.id)}
            >
              确认处理
            </Button>
          ),
          selectedAlert && (selectedAlert.status === 'active' || selectedAlert.status === 'acknowledged') && (
            <Button 
              key="resolve" 
              type="primary"
              onClick={() => handleResolve(selectedAlert.id)}
            >
              标记为已解决
            </Button>
          )
        ]}
        width={700}
      >
        {selectedAlert && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="告警标题" span={2}>
                {selectedAlert.title}
              </Descriptions.Item>
              <Descriptions.Item label="风险等级">
                <Tag color={getLevelColor(selectedAlert.level)}>
                  {getLevelText(selectedAlert.level)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={getStatusColor(selectedAlert.status)}>
                  {getStatusText(selectedAlert.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="告警类型">
                {getTypeText(selectedAlert.type)}
              </Descriptions.Item>
              <Descriptions.Item label="触发时间">
                {new Date(selectedAlert.triggeredAt).toLocaleString()}
              </Descriptions.Item>
              {selectedAlert.acknowledgedBy && (
                <>
                  <Descriptions.Item label="确认人">
                    {selectedAlert.acknowledgedBy}
                  </Descriptions.Item>
                  <Descriptions.Item label="确认时间">
                    {selectedAlert.acknowledgedAt && new Date(selectedAlert.acknowledgedAt).toLocaleString()}
                  </Descriptions.Item>
                </>
              )}
              {selectedAlert.resolvedBy && (
                <>
                  <Descriptions.Item label="解决人">
                    {selectedAlert.resolvedBy}
                  </Descriptions.Item>
                  <Descriptions.Item label="解决时间">
                    {selectedAlert.resolvedAt && new Date(selectedAlert.resolvedAt).toLocaleString()}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            <Divider />

            <div>
              <h4 style={{ marginBottom: 12 }}>详细描述：</h4>
              <Card size="small" style={{ background: '#fafafa' }}>
                {selectedAlert.description}
              </Card>
            </div>

            <Divider />

            <div>
              <h4 style={{ marginBottom: 12 }}>处理建议：</h4>
              <Timeline>
                <Timeline.Item color="blue">
                  立即查看患者详细健康数据
                </Timeline.Item>
                <Timeline.Item color="blue">
                  确认告警信息的准确性
                </Timeline.Item>
                <Timeline.Item color="blue">
                  联系患者了解当前状况
                </Timeline.Item>
                <Timeline.Item color="blue">
                  根据情况调整康复计划或用药方案
                </Timeline.Item>
                <Timeline.Item color="green">
                  记录处理过程并标记告警为已解决
                </Timeline.Item>
              </Timeline>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RiskAlerts;
