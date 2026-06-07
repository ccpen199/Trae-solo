import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, message, Row, Col, Statistic, Timeline, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, DesktopOutlined, MobileOutlined, GlobalOutlined } from '@ant-design/icons';
import { adminAPI } from '../../services/api';

const PLATFORMS = [
  { key: 'web', name: 'Web端系统', icon: <DesktopOutlined />, status: 'online' },
  { key: 'h5', name: 'H5移动端', icon: <MobileOutlined />, status: 'online' },
  { key: 'miniapp', name: '微信小程序', icon: <MobileOutlined />, status: 'online' },
  { key: 'terminal', name: '自助终端', icon: <GlobalOutlined />, status: 'online' },
];

const ITEM_TYPES = [
  { key: 'policy', name: '政策' },
  { key: 'service', name: '服务事项' },
  { key: 'notice', name: '公告通知' },
];

function PublishManage() {
  const [history, setHistory] = useState([]);
  const [services, setServices] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [historyRes, servicesRes] = await Promise.all([
        adminAPI.getPublishHistory(),
        adminAPI.getServices()
      ]);
      setHistory(historyRes.data || []);
      setServices(servicesRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublish = async (values) => {
    setPublishing(true);
    try {
      await adminAPI.publish({
        itemType: values.itemType,
        itemId: values.itemId,
        platform: values.platforms.join(','),
        version: values.version
      });
      message.success('发布成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  const getPlatformStatus = (key) => {
    const platform = PLATFORMS.find(p => p.key === key);
    return platform?.status === 'online' ? 'success' : 'error';
  };

  const historyColumns = [
    { title: '发布时间', dataIndex: 'published_at', key: 'time', width: 180 },
    { title: '内容类型', dataIndex: 'item_type', key: 'type',
      render: v => ITEM_TYPES.find(t => t.key === v)?.name || v
    },
    { title: '内容ID', dataIndex: 'item_id', key: 'itemId' },
    { 
      title: '发布平台', 
      dataIndex: 'platform', 
      key: 'platform',
      render: v => <Tag color="blue">{PLATFORMS.find(p => p.key === v)?.name || v}</Tag>
    },
    { title: '版本号', dataIndex: 'version', key: 'version' },
    { title: '发布人', dataIndex: 'published_by', key: 'by' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: v => v === 'published' 
        ? <Tag color="green"><CheckCircleOutlined /> 已发布</Tag>
        : <Tag color="red"><CloseCircleOutlined /> 已下线</Tag>
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>多端一致性发布管理</h2>
        <Button type="primary" onClick={() => setModalVisible(true)}>
          新增发布
        </Button>
      </div>

      <Card title="终端运行状态" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          {PLATFORMS.map(platform => (
            <Col span={6} key={platform.key}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, color: platform.status === 'online' ? '#52c41a' : '#ff4d4f' }}>
                    {platform.icon}
                  </div>
                  <div style={{ marginTop: 8, fontWeight: 'bold' }}>{platform.name}</div>
                  <Tag color={platform.status === 'online' ? 'green' : 'red'} style={{ marginTop: 8 }}>
                    {platform.status === 'online' ? '在线' : '离线'}
                  </Tag>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                    最后同步: {new Date().toLocaleString()}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic 
              title="今日发布次数" 
              value={history.filter(h => h.published_at?.startsWith(new Date().toISOString().split('T')[0])).length || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="在线终端数" 
              value={PLATFORMS.filter(p => p.status === 'online').length}
              suffix={`/ ${PLATFORMS.length}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="内容同步率" 
              value={100}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="发布历史">
        <Table
          columns={historyColumns}
          dataSource={history}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="多端发布"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handlePublish}>
          <Form.Item name="itemType" label="内容类型" rules={[{ required: true }]}>
            <Select placeholder="请选择">
              {ITEM_TYPES.map(t => (
                <Select.Option key={t.key} value={t.key}>{t.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.itemType !== curr.itemType}>
            {({ getFieldValue }) => {
              const itemType = getFieldValue('itemType');
              if (itemType === 'service') {
                return (
                  <Form.Item name="itemId" label="选择服务事项" rules={[{ required: true }]}>
                    <Select placeholder="请选择">
                      {services.map(s => (
                        <Select.Option key={s.id} value={s.id}>
                          {s.item_code} - {s.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item name="platforms" label="发布平台" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="请选择发布平台">
              {PLATFORMS.map(p => (
                <Select.Option key={p.key} value={p.key} disabled={p.status !== 'online'}>
                  {p.name} {p.status !== 'online' ? '(离线)' : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="version" label="版本号" rules={[{ required: true }]}>
            <Input placeholder="如：v1.0.0" />
          </Form.Item>

          <Form.Item name="remark" label="发布说明">
            <Input.TextArea rows={3} placeholder="请输入发布说明" />
          </Form.Item>

          <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4 }}>
            <SyncOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            <span>发布后将自动同步到所选终端，确保全渠道内容一致</span>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={publishing} block>
              确认发布
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PublishManage;
