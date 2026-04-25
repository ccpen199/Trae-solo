import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tabs,
  List,
  Statistic,
  Row,
  Col,
  Popconfirm,
  message,
  Typography,
  Drawer,
  Divider,
  Descriptions,
  InputNumber,
  Checkbox,
  Timeline
} from 'antd';
import {
  BellOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import type { AlertRecord, AlertRule } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const riskLevelColors = {
  low: '#52c41a',
  medium: '#faad14',
  high: '#ff4d4f',
  critical: '#722ed1'
};

const riskLevelText = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '紧急'
};

const alertStatusColors = {
  unread: '#ff4d4f',
  read: '#faad14',
  processed: '#52c41a'
};

const alertStatusText = {
  unread: '未读',
  read: '已读',
  processed: '已处理'
};

const AlertsManagement: React.FC = () => {
  const {
    alerts,
    alertRules,
    markAlertAsRead,
    processAlert,
    toggleAlertRule,
    addAlertRule,
    updateAlertRule,
    deleteAlertRule
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState('alerts');
  const [alertRuleModalVisible, setAlertRuleModalVisible] = useState(false);
  const [alertDetailVisible, setAlertDetailVisible] = useState(false);
  const [processingAlertVisible, setProcessingAlertVisible] = useState(false);
  const [editingAlertRule, setEditingAlertRule] = useState<AlertRule | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [processNote, setProcessNote] = useState('');
  
  const [alertRuleForm] = Form.useForm();
  
  const unreadAlerts = alerts.filter(a => a.status === 'unread');
  const readAlerts = alerts.filter(a => a.status === 'read');
  const processedAlerts = alerts.filter(a => a.status === 'processed');
  
  const handleAddAlertRule = () => {
    setEditingAlertRule(null);
    alertRuleForm.resetFields();
    setAlertRuleModalVisible(true);
  };
  
  const handleEditAlertRule = (rule: AlertRule) => {
    setEditingAlertRule(rule);
    alertRuleForm.setFieldsValue({
      name: rule.name,
      keywords: rule.keywords,
      riskThreshold: rule.riskThreshold,
      regions: rule.regions,
      notifyMethods: rule.notifyMethods,
      enabled: rule.enabled
    });
    setAlertRuleModalVisible(true);
  };
  
  const handleSubmitAlertRule = () => {
    alertRuleForm.validateFields().then(values => {
      const ruleData = {
        name: values.name,
        keywords: values.keywords || [],
        riskThreshold: values.riskThreshold,
        regions: values.regions || [],
        notifyMethods: values.notifyMethods || [],
        enabled: values.enabled
      };
      
      if (editingAlertRule) {
        updateAlertRule(editingAlertRule.id, ruleData);
        message.success('更新成功');
      } else {
        addAlertRule(ruleData);
        message.success('添加成功');
      }
      
      setAlertRuleModalVisible(false);
    });
  };
  
  const handleViewAlert = (alert: AlertRecord) => {
    setSelectedAlert(alert);
    setAlertDetailVisible(true);
    if (alert.status === 'unread') {
      markAlertAsRead(alert.id);
    }
  };
  
  const handleProcessAlert = () => {
    if (selectedAlert && processNote.trim()) {
      processAlert(selectedAlert.id, processNote);
      message.success('处理完成');
      setProcessingAlertVisible(false);
      setProcessNote('');
    } else {
      message.warning('请输入处理说明');
    }
  };
  
  const alertColumns = [
    {
      title: '预警标题',
      dataIndex: 'newsTitle',
      key: 'newsTitle',
      ellipsis: true,
      width: 300
    },
    {
      title: '触发规则',
      dataIndex: 'ruleName',
      key: 'ruleName',
      width: 150
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: AlertRecord['riskLevel']) => (
        <Tag color={riskLevelColors[level]}>{riskLevelText[level]}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AlertRecord['status']) => {
        const icons = {
          unread: <CloseCircleOutlined />,
          read: <ClockCircleOutlined />,
          processed: <CheckCircleOutlined />
        };
        return (
          <Space>
            {icons[status]}
            <Tag color={alertStatusColors[status]}>{alertStatusText[status]}</Tag>
          </Space>
        );
      }
    },
    {
      title: '预警时间',
      dataIndex: 'alertTime',
      key: 'alertTime',
      width: 180
    },
    {
      title: '处理人',
      dataIndex: 'processedBy',
      key: 'processedBy',
      width: 100,
      render: (name?: string) => name || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: AlertRecord) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewAlert(record)}
          >
            查看
          </Button>
          {record.status !== 'processed' && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setSelectedAlert(record);
                setProcessingAlertVisible(true);
              }}
            >
              处理
            </Button>
          )}
        </Space>
      )
    }
  ];
  
  const alertRuleColumns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '关键词',
      dataIndex: 'keywords',
      key: 'keywords',
      width: 200,
      render: (keywords: string[]) => (
        <Space size={[0, 4]} wrap>
          {keywords.slice(0, 3).map((k, i) => (
            <Tag key={i} color="blue">{k}</Tag>
          ))}
          {keywords.length > 3 && <Tag>+{keywords.length - 3}</Tag>}
        </Space>
      )
    },
    {
      title: '风险阈值',
      dataIndex: 'riskThreshold',
      key: 'riskThreshold',
      render: (level: AlertRule['riskThreshold']) => (
        <Tag color={riskLevelColors[level]}>{riskLevelText[level]}及以上</Tag>
      )
    },
    {
      title: '通知方式',
      dataIndex: 'notifyMethods',
      key: 'notifyMethods',
      render: (methods: AlertRule['notifyMethods']) => (
        <Space>
          {methods.includes('email') && <Tag>邮件</Tag>}
          {methods.includes('sms') && <Tag color="orange">短信</Tag>}
          {methods.includes('app') && <Tag color="purple">APP</Tag>}
          {methods.length === 0 && <Tag>无</Tag>}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: AlertRule) => (
        <Space>
          <Tag color={enabled ? 'green' : 'red'}>
            {enabled ? '启用中' : '已停用'}
          </Tag>
          <Switch
            checked={enabled}
            onChange={() => toggleAlertRule(record.id)}
            size="small"
          />
        </Space>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AlertRule) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditAlertRule(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个预警规则吗？"
            onConfirm={() => {
              deleteAlertRule(record.id);
              message.success('删除成功');
            }}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];
  
  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="未读预警"
              value={unreadAlerts.length}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="已读待处理"
              value={readAlerts.length}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="已处理"
              value={processedAlerts.length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="预警规则"
              value={alertRules.length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <BellOutlined />
              预警列表
            </span>
          }
          key="alerts"
        >
          <Card>
            <Table
              columns={alertColumns}
              dataSource={alerts}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`
              }}
            />
          </Card>
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <WarningOutlined />
              预警规则
            </span>
          }
          key="rules"
        >
          <Card>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddAlertRule}
              >
                添加规则
              </Button>
            </div>
            
            <Table
              columns={alertRuleColumns}
              dataSource={alertRules}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <ClockCircleOutlined />
              处理历史
            </span>
          }
          key="history"
        >
          <Card>
            <Timeline mode="left">
              {processedAlerts.slice().reverse().map((alert, index) => (
                <Timeline.Item
                  key={alert.id}
                  color={riskLevelColors[alert.riskLevel]}
                  dot={<BellOutlined />}
                >
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Text strong>{alert.newsTitle}</Text>
                        <Tag color={riskLevelColors[alert.riskLevel]}>
                          {riskLevelText[alert.riskLevel]}
                        </Tag>
                        <Tag color="green">已处理</Tag>
                      </Space>
                      
                      <Text type="secondary">
                        触发规则：{alert.ruleName}
                      </Text>
                      
                      <Text type="secondary">
                        预警时间：{alert.alertTime}
                      </Text>
                      
                      <Text type="secondary">
                        处理人：{alert.processedBy} | 处理时间：{alert.processedTime}
                      </Text>
                      
                      {alert.processedNote && (
                        <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                          <Text type="secondary">处理说明：</Text>
                          <Paragraph style={{ margin: 0 }}>{alert.processedNote}</Paragraph>
                        </div>
                      )}
                    </Space>
                  </Card>
                </Timeline.Item>
              ))}
              
              {processedAlerts.length === 0 && (
                <Timeline.Item>
                  <Text type="secondary">暂无处理历史</Text>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>
        </TabPane>
      </Tabs>
      
      <Drawer
        title="预警详情"
        width={640}
        open={alertDetailVisible}
        onClose={() => setAlertDetailVisible(false)}
        footer={null}
      >
        {selectedAlert && (
          <div>
            <Title level={4}>{selectedAlert.newsTitle}</Title>
            
            <Space wrap style={{ marginBottom: 24 }}>
              <Tag color={riskLevelColors[selectedAlert.riskLevel]}>
                {riskLevelText[selectedAlert.riskLevel]}
              </Tag>
              <Tag color={alertStatusColors[selectedAlert.status]}>
                {alertStatusText[selectedAlert.status]}
              </Tag>
              <Text type="secondary">预警时间：{selectedAlert.alertTime}</Text>
            </Space>
            
            <Divider />
            
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="触发规则">{selectedAlert.ruleName}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={alertStatusColors[selectedAlert.status]}>
                  {alertStatusText[selectedAlert.status]}
                </Tag>
              </Descriptions.Item>
              {selectedAlert.processedBy && (
                <>
                  <Descriptions.Item label="处理人">{selectedAlert.processedBy}</Descriptions.Item>
                  <Descriptions.Item label="处理时间">{selectedAlert.processedTime}</Descriptions.Item>
                  {selectedAlert.processedNote && (
                    <Descriptions.Item label="处理说明">{selectedAlert.processedNote}</Descriptions.Item>
                  )}
                </>
              )}
            </Descriptions>
            
            {selectedAlert.status !== 'processed' && (
              <div style={{ marginTop: 24 }}>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    setAlertDetailVisible(false);
                    setProcessingAlertVisible(true);
                  }}
                >
                  处理预警
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
      
      <Modal
        title="处理预警"
        open={processingAlertVisible}
        onOk={handleProcessAlert}
        onCancel={() => {
          setProcessingAlertVisible(false);
          setProcessNote('');
        }}
        okText="提交处理"
        cancelText="取消"
      >
        {selectedAlert && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Text strong>{selectedAlert.newsTitle}</Text>
              <br />
              <Space style={{ marginTop: 8 }}>
                <Tag color={riskLevelColors[selectedAlert.riskLevel]}>
                  {riskLevelText[selectedAlert.riskLevel]}
                </Tag>
                <Text type="secondary">{selectedAlert.alertTime}</Text>
              </Space>
            </Card>
            
            <Form.Item label="处理说明" required>
              <Input.TextArea
                rows={4}
                placeholder="请输入处理说明..."
                value={processNote}
                onChange={(e) => setProcessNote(e.target.value)}
              />
            </Form.Item>
          </div>
        )}
      </Modal>
      
      <Modal
        title={editingAlertRule ? '编辑预警规则' : '添加预警规则'}
        open={alertRuleModalVisible}
        onOk={handleSubmitAlertRule}
        onCancel={() => setAlertRuleModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={alertRuleForm}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          
          <Form.Item
            name="keywords"
            label="触发关键词"
          >
            <Select
              mode="tags"
              placeholder="请输入或选择关键词"
              style={{ width: '100%' }}
            >
              <Option value="安全事故">安全事故</Option>
              <Option value="产品质量问题">产品质量问题</Option>
              <Option value="化工泄漏">化工泄漏</Option>
              <Option value="消费者投诉">消费者投诉</Option>
              <Option value="负面报道">负面报道</Option>
              <Option value="危机">危机</Option>
              <Option value="暴雨">暴雨</Option>
              <Option value="台风">台风</Option>
              <Option value="地震">地震</Option>
              <Option value="高温">高温</Option>
              <Option value="紧急">紧急</Option>
              <Option value="突发">突发</Option>
              <Option value="重大事故">重大事故</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="riskThreshold"
            label="风险阈值"
            rules={[{ required: true, message: '请选择风险阈值' }]}
            help="当舆情风险等级达到或超过此阈值时触发预警"
          >
            <Select placeholder="请选择风险阈值">
              <Option value="low">低风险及以上</Option>
              <Option value="medium">中风险及以上</Option>
              <Option value="high">高风险及以上</Option>
              <Option value="critical">仅紧急</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="regions"
            label="监控地区"
          >
            <Select
              mode="multiple"
              placeholder="请选择监控地区（不选则为全部）"
              style={{ width: '100%' }}
            >
              <Option value="000000">全国</Option>
              <Option value="110000">北京市</Option>
              <Option value="310000">上海市</Option>
              <Option value="440000">广东省</Option>
              <Option value="320000">江苏省</Option>
              <Option value="330000">浙江省</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="notifyMethods"
            label="通知方式"
          >
            <Checkbox.Group>
              <Space>
                <Checkbox value="email">邮件通知</Checkbox>
                <Checkbox value="sms">短信通知</Checkbox>
                <Checkbox value="app">APP推送</Checkbox>
              </Space>
            </Checkbox.Group>
          </Form.Item>
          
          <Form.Item
            name="enabled"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AlertsManagement;
