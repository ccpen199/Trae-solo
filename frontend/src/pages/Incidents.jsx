import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Tag, Space, Button, Modal, Form, Input, message,
  Tabs, Select, Row, Col, Alert
} from 'antd';
import { PlusOutlined, AlertOutlined, WarningOutlined } from '@ant-design/icons';
import { incidentApi, credentialApi } from '../services/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

function Incidents({ user }) {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [anomalies, setAnomalies] = useState({});
  const [credentials, setCredentials] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [incRes, credRes] = await Promise.all([
        incidentApi.list(),
        credentialApi.list(),
      ]);
      setIncidents(incRes.data.incidents);
      setCredentials(credRes.data.credentials);
      
      if (user?.role === 'admin') {
        const anomRes = await incidentApi.getAnomalies();
        setAnomalies(anomRes.data);
      }
    } catch (err) {
      message.error('加载失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      await incidentApi.create(values);
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '创建失败');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await incidentApi.update(id, { status });
      message.success('更新成功');
      loadData();
    } catch (err) {
      message.error('更新失败');
    }
  };

  const incidentColumns = [
    { title: '标题', dataIndex: 'title', key: 'title',
      render: (t, r) => <a onClick={() => navigate(`/incidents/${r.id}`)}>{t}</a> },
    { title: '类型', dataIndex: 'incident_type', key: 'type', render: t => <Tag color="red">{t}</Tag> },
    { title: '严重程度', dataIndex: 'severity', key: 'severity',
      render: s => <Tag color={s === 'critical' ? 'red' : s === 'high' ? 'orange' : s === 'medium' ? 'warning' : 'blue'}>{s}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status',
      render: s => <Tag color={s === 'open' ? 'orange' : s === 'resolved' ? 'green' : 'blue'}>{s}</Tag> },
    { title: '影响凭据', dataIndex: 'affected_credentials', key: 'affected' },
    { title: '报告人', dataIndex: 'reporter_name', key: 'reporter' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created', render: d => dayjs(d).format('YYYY-MM-DD') },
    { title: '操作', key: 'actions', render: (_, r) => (
      r.status === 'open' && (
        <Button type="text" onClick={() => handleUpdateStatus(r.id, 'resolved')}>
          标记解决
        </Button>
      )
    )},
  ];

  const incidentTypes = [
    { value: 'credential_leak', label: '凭据泄露' },
    { value: 'abnormal_access', label: '异常访问' },
    { value: 'mass_export', label: '批量导出' },
    { value: 'other', label: '其他' },
  ];

  return (
    <div>
      <Card title="安全事件" extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          报告事件
        </Button>
      }>
        <Tabs defaultActiveKey="all">
          <TabPane tab="全部事件" key="all">
            <Table
              columns={incidentColumns}
              dataSource={incidents}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          {user?.role === 'admin' && (
            <TabPane tab="异常检测" key="anomalies">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card title="高频查看" extra={<Tag color="red">{anomalies.high_frequency_views?.length || 0}</Tag>}>
                    {anomalies.high_frequency_views?.length > 0 ? (
                      <Alert
                        message={`${anomalies.high_frequency_views[0]?.viewer_name} 1小时内查看了 ${anomalies.high_frequency_views[0]?.view_count} 个凭据`}
                        type="warning"
                        showIcon
                      />
                    ) : (
                      <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无异常</p>
                    )}
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="非工作时间访问" extra={<Tag color="orange">{anomalies.after_hours_access?.length || 0}</Tag>}>
                    {anomalies.after_hours_access?.length > 0 ? (
                      anomalies.after_hours_access.slice(0, 3).map(a => (
                        <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <Space>
                            <Tag color="orange">异常时间</Tag>
                            <span>{a.viewer_name}</span>
                            <span style={{ color: '#999' }}>查看了 {a.credential_title}</span>
                          </Space>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无异常</p>
                    )}
                  </Card>
                </Col>
              </Row>
            </TabPane>
          )}
        </Tabs>
      </Card>

      <Modal
        title="报告安全事件"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="incident_type" label="事件类型" rules={[{ required: true }]}>
                <Select options={incidentTypes} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="severity" label="严重程度" rules={[{ required: true }]}>
                <Select>
                  <Option value="critical">严重</Option>
                  <Option value="high">高</Option>
                  <Option value="medium">中</Option>
                  <Option value="low">低</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="事件标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="credential_ids" label="关联凭据">
            <Select mode="multiple" style={{ width: '100%' }}
              options={credentials.map(c => ({ value: c.id, label: c.title }))} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Incidents;
