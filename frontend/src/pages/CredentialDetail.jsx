import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Button, Space, Tag, Modal, Form, Input, message,
  Table, Timeline, Alert, Tooltip, Select
} from 'antd';
import {
  ArrowLeftOutlined, EyeOutlined, CopyOutlined, ShareAltOutlined,
  HistoryOutlined, UserOutlined
} from '@ant-design/icons';
import { credentialApi, accessApi, authApi } from '../services/api';
import dayjs from 'dayjs';

function CredentialDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [credential, setCredential] = useState(null);
  const [revealed, setRevealed] = useState(null);
  const [views, setViews] = useState([]);
  const [users, setUsers] = useState([]);
  const [revealModal, setRevealModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [requestForm] = Form.useForm();
  const [shareForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [credRes, viewsRes, usersRes] = await Promise.all([
        credentialApi.get(id),
        credentialApi.getViews(id),
        authApi.getUsers(),
      ]);
      setCredential(credRes.data.credential);
      setViews(viewsRes.data.views);
      setUsers(usersRes.data.users);
    } catch (err) {
      message.error('加载数据失败');
    }
  };

  const handleReveal = async () => {
    try {
      const res = await credentialApi.reveal(id);
      setRevealed(res.data.credential);
      setRevealModal(true);
    } catch (err) {
      message.error(err.response?.data?.error || '查看失败');
    }
  };

  const handleCopy = async (field, value) => {
    navigator.clipboard.writeText(value);
    await credentialApi.copy(id, field);
    message.success('已复制到剪贴板');
  };

  const handleRequestAccess = async (values) => {
    try {
      await accessApi.createRequest({
        credential_id: id,
        ...values,
      });
      message.success('申请已提交');
      setRequestModal(false);
      requestForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.error || '申请失败');
    }
  };

  const handleShare = async (values) => {
    try {
      await accessApi.createGrant({
        credential_id: id,
        ...values,
      });
      message.success('已授权');
      setShareModal(false);
      shareForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.error || '授权失败');
    }
  };

  if (!credential) return <div>加载中...</div>;

  const viewColumns = [
    { title: '查看人', dataIndex: 'viewer_name', key: 'viewer' },
    { title: '查看类型', dataIndex: 'view_type', key: 'type', render: t => <Tag>{t}</Tag> },
    { title: '是否复制', dataIndex: 'copied', key: 'copied', render: c => c ? '是' : '否' },
    { title: '水印', dataIndex: 'watermark', key: 'watermark' },
    { title: '时间', dataIndex: 'created_at', key: 'time', render: d => dayjs(d).format('YYYY-MM-DD HH:mm') },
  ];

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/credentials')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      {credential.is_frozen && (
        <Alert
          message="此凭据已被冻结"
          description="安全事件相关凭据已临时冻结，如需使用请联系管理员"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card title={credential.title} extra={
        <Space>
          <Tag color={credential.is_frozen ? 'red' : 'green'}>
            {credential.is_frozen ? '已冻结' : '正常'}
          </Tag>
          <Tag color="blue">{credential.type}</Tag>
        </Space>
      }>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="团队">{credential.team_name}</Descriptions.Item>
          <Descriptions.Item label="项目">{credential.project_name}</Descriptions.Item>
          <Descriptions.Item label="创建者">{credential.creator_name}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(credential.created_at).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label="用户名">{credential.username}</Descriptions.Item>
          <Descriptions.Item label="轮换周期">{credential.rotation_period_days} 天</Descriptions.Item>
          <Descriptions.Item label="上次轮换">{credential.last_rotated_at ? dayjs(credential.last_rotated_at).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
          <Descriptions.Item label="过期时间">{credential.expires_at ? dayjs(credential.expires_at).format('YYYY-MM-DD') : '永不过期'}</Descriptions.Item>
          {credential.notes && (
            <Descriptions.Item label="备注" span={2}>{credential.notes}</Descriptions.Item>
          )}
        </Descriptions>

        <div style={{ marginTop: 24 }}>
          <Space>
            <Button type="primary" icon={<EyeOutlined />} onClick={handleReveal} disabled={credential.is_frozen}>
              查看明文
            </Button>
            <Button icon={<ShareAltOutlined />} onClick={() => setShareModal(true)}>
              分享授权
            </Button>
            <Button type="primary" icon={<HistoryOutlined />} onClick={() => setRequestModal(true)}>
              申请访问
            </Button>
          </Space>
        </div>
      </Card>

      <Card title="查看历史" style={{ marginTop: 16 }}>
        <Table
          columns={viewColumns}
          dataSource={views}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="查看明文凭据"
        open={revealModal}
        onCancel={() => { setRevealModal(false); setRevealed(null); }}
        footer={null}
        width={600}
      >
        {revealed && (
          <div className="watermark-overlay" data-watermark={revealed.watermark}>
            <Alert
              message="安全提示"
              description="此操作已记录，包含您的身份水印。禁止截图、拍照或外传。"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions column={1} bordered size="small">
              {revealed.username && (
                <Descriptions.Item label="用户名">
                  <Space>
                    <span className="credential-masked">{revealed.username}</span>
                    <Tooltip title="复制">
                      <Button type="text" icon={<CopyOutlined />} size="small"
                        onClick={() => handleCopy('username', revealed.username)} />
                    </Tooltip>
                  </Space>
                </Descriptions.Item>
              )}
              {revealed.password && (
                <Descriptions.Item label="密码">
                  <Space>
                    <span className="credential-masked">{revealed.password}</span>
                    <Tooltip title="复制">
                      <Button type="text" icon={<CopyOutlined />} size="small"
                        onClick={() => handleCopy('password', revealed.password)} />
                    </Tooltip>
                  </Space>
                </Descriptions.Item>
              )}
              {revealed.token && (
                <Descriptions.Item label="Token">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input.TextArea value={revealed.token} readOnly rows={4} />
                    <Button type="text" icon={<CopyOutlined />} size="small"
                      onClick={() => handleCopy('token', revealed.token)}>
                      复制
                    </Button>
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: 'right', color: '#999', fontSize: 12 }}>
              水印标识: {revealed.watermark}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="分享授权"
        open={shareModal}
        onCancel={() => setShareModal(false)}
        footer={null}
      >
        <Form form={shareForm} layout="vertical" onFinish={handleShare}>
          <Form.Item name="user_id" label="选择用户" rules={[{ required: true }]}>
            <Select options={users.map(u => ({ value: u.id, label: `${u.username} (${u.department})` }))} />
          </Form.Item>
          <Form.Item name="role" label="权限角色" initialValue="viewer">
            <Select options={[
              { value: 'viewer', label: '查看者' },
              { value: 'editor', label: '编辑者' },
            ]} />
          </Form.Item>
          <Form.Item name="expires_at" label="有效期">
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">授权</Button>
              <Button onClick={() => setShareModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申请访问权限"
        open={requestModal}
        onCancel={() => setRequestModal(false)}
        footer={null}
      >
        <Form form={requestForm} layout="vertical" onFinish={handleRequestAccess}>
          <Form.Item name="reason" label="申请理由" rules={[{ required: true, message: '请输入申请理由' }]}>
            <Input.TextArea rows={3} placeholder="请说明申请访问此凭据的原因和用途" />
          </Form.Item>
          <Form.Item name="expires_at" label="到期时间" rules={[{ required: true, message: '请选择到期时间' }]}>
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交申请</Button>
              <Button onClick={() => setRequestModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default CredentialDetail;
