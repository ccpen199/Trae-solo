import { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Space, Button, Modal, Form, Input, message,
  Tabs, Statistic, Row, Col, Progress, Tooltip
} from 'antd';
import { CheckOutlined, ReloadOutlined, WarningOutlined, AlertOutlined, UserOutlined } from '@ant-design/icons';
import { rotationApi, credentialApi } from '../services/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Password } = Input;

function RotationCenter({ user }) {
  const [reminders, setReminders] = useState([]);
  const [stats, setStats] = useState([]);
  const [weakPasswords, setWeakPasswords] = useState([]);
  const [departedUsers, setDepartedUsers] = useState([]);
  const [rotateModal, setRotateModal] = useState(false);
  const [rotatingId, setRotatingId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [remRes, weakRes, depRes] = await Promise.all([
        rotationApi.getReminders({ status: 'unresolved' }),
        user?.role === 'admin' ? rotationApi.getWeakPasswords() : { data: { weak_passwords: [] } },
        user?.role === 'admin' ? rotationApi.getDepartedUsers() : { data: { departed_users: [] } },
      ]);
      setReminders(remRes.data.reminders);
      setStats(remRes.data.stats);
      setWeakPasswords(weakRes.data.weak_passwords);
      setDepartedUsers(depRes.data.departed_users);
    } catch (err) {
      message.error('加载失败');
    }
  };

  const handleResolve = async (id) => {
    try {
      await rotationApi.resolveReminder(id);
      message.success('已标记为已处理');
      loadData();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleRotate = async (values) => {
    try {
      await rotationApi.rotateCredential(rotatingId, values);
      message.success('轮换成功');
      setRotateModal(false);
      form.resetFields();
      setRotatingId(null);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '轮换失败');
    }
  };

  const statMap = {};
  stats.forEach(s => { statMap[s.severity] = s.count; });

  const reminderColumns = [
    { title: '类型', dataIndex: 'reminder_type', key: 'type',
      render: t => <Tag color={t === 'expired' ? 'red' : t === 'long_unrotated' ? 'orange' : 'blue'}>
        {t === 'expired' ? '已过期' : t === 'expiring_soon' ? '即将过期' : '超期未改'}
      </Tag> },
    { title: '严重程度', dataIndex: 'severity', key: 'severity',
      render: s => <Tag color={s === 'critical' ? 'red' : s === 'high' ? 'orange' : 'warning'}>{s}</Tag> },
    { title: '凭据', dataIndex: 'credential_title', key: 'credential' },
    { title: '项目', dataIndex: 'project_name', key: 'project' },
    { title: '消息', dataIndex: 'message', key: 'message' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created', render: d => dayjs(d).format('YYYY-MM-DD') },
    { title: '操作', key: 'actions', render: (_, r) => (
      <Space>
        <Button type="text" icon={<ReloadOutlined />} onClick={() => {
          setRotatingId(r.credential_id);
          setRotateModal(true);
        }}>轮换</Button>
        <Button type="text" icon={<CheckOutlined />} onClick={() => handleResolve(r.id)}>忽略</Button>
      </Space>
    )},
  ];

  const weakColumns = [
    { title: '凭据', dataIndex: 'title', key: 'title' },
    { title: '项目', dataIndex: 'project_name', key: 'project' },
    { title: '创建者', dataIndex: 'creator_name', key: 'creator' },
    { title: '强度评分', dataIndex: 'score', key: 'score',
      render: s => (
        <Space>
          <Progress percent={s * 25} size="small"
            status={s <= 1 ? 'exception' : s <= 2 ? 'normal' : 'success'} />
          <span>{s <= 1 ? '极弱' : s <= 2 ? '较弱' : s <= 3 ? '一般' : '强'}</span>
        </Space>
      )},
    { title: '建议', dataIndex: 'suggestions', key: 'suggestions',
      render: s => s?.join('; ') },
    { title: '操作', key: 'actions', render: (_, r) => (
      <Button type="text" icon={<ReloadOutlined />} onClick={() => {
        setRotatingId(r.id);
        setRotateModal(true);
      }}>轮换</Button>
    )},
  ];

  const departedColumns = [
    { title: '用户', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '部门', dataIndex: 'department', key: 'dept' },
    { title: '拥有凭据', dataIndex: 'credential_count', key: 'cred_count' },
    { title: '被授权数', dataIndex: 'grant_count', key: 'grant_count' },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="严重"
              value={statMap.critical || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高风险"
              value={statMap.high || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="警告"
              value={statMap.warning || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="弱密码"
              value={weakPasswords.length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="轮换中心">
        <Tabs defaultActiveKey="reminders">
          <TabPane tab={`轮换提醒 (${reminders.length})`} key="reminders">
            <Table
              columns={reminderColumns}
              dataSource={reminders}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab={`弱密码 (${weakPasswords.length})`} key="weak" disabled={user?.role !== 'admin'}>
            <Table
              columns={weakColumns}
              dataSource={weakPasswords}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab={`离职人员权限 (${departedUsers.length})`} key="departed" disabled={user?.role !== 'admin'}>
            <Table
              columns={departedColumns}
              dataSource={departedUsers}
              rowKey="user_id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="凭据轮换"
        open={rotateModal}
        onCancel={() => { setRotateModal(false); setRotatingId(null); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleRotate}>
          <Form.Item label="新密码">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="new_password" noStyle>
                <Password />
              </Form.Item>
              <Button onClick={async () => {
                try {
                  const res = await rotationApi.generateValue('password', 20);
                  form.setFieldsValue({ new_password: res.data.value });
                  message.success('已生成强密码');
                } catch (e) {
                  message.error('生成失败');
                }
              }}>
                生成
              </Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item label="新Token">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item name="new_token" noStyle>
                <Input.TextArea rows={3} />
              </Form.Item>
              <Button onClick={async () => {
                try {
                  const res = await rotationApi.generateValue('token', 32);
                  form.setFieldsValue({ new_token: res.data.value });
                  message.success('已生成随机Token');
                } catch (e) {
                  message.error('生成失败');
                }
              }}>
                生成随机Token
              </Button>
            </Space>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认轮换</Button>
              <Button onClick={() => setRotateModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default RotationCenter;
