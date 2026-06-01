import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Button, Space, Tag, Table, Modal, Form,
  Input, message, Alert, Select, Row, Col
} from 'antd';
import { ArrowLeftOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { incidentApi, credentialApi } from '../services/api';
import dayjs from 'dayjs';

function IncidentDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [affectedCredentials, setAffectedCredentials] = useState([]);
  const [allCredentials, setAllCredentials] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [incRes, credRes] = await Promise.all([
        incidentApi.get(id),
        credentialApi.list(),
      ]);
      setIncident(incRes.data.incident);
      setAffectedCredentials(incRes.data.affected_credentials);
      setAllCredentials(credRes.data.credentials);
    } catch (err) {
      message.error('加载失败');
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await incidentApi.update(id, { status });
      message.success('更新成功');
      loadData();
    } catch (err) {
      message.error('更新失败');
    }
  };

  const handleAddCredential = async (values) => {
    try {
      await incidentApi.addCredential(id, values);
      message.success('添加成功');
      setAddModal(false);
      form.resetFields();
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '添加失败');
    }
  };

  const handleFreezeAll = async () => {
    Modal.confirm({
      title: '确认批量冻结',
      content: '确定要冻结所有受影响的凭据吗？',
      onOk: async () => {
        try {
          await incidentApi.freezeAll(id);
          message.success('已全部冻结');
          loadData();
        } catch (err) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleUnfreezeAll = async () => {
    Modal.confirm({
      title: '确认批量解冻',
      content: '确定要解冻所有受影响的凭据吗？',
      onOk: async () => {
        try {
          await incidentApi.unfreezeAll(id);
          message.success('已全部解冻');
          loadData();
        } catch (err) {
          message.error('操作失败');
        }
      },
    });
  };

  if (!incident) return <div>加载中...</div>;

  const credColumns = [
    { title: '凭据', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'type', key: 'type', render: t => <Tag>{t}</Tag> },
    { title: '项目', dataIndex: 'project_name', key: 'project' },
    { title: '影响等级', dataIndex: 'impact_level', key: 'impact',
      render: l => <Tag color={l === 'high' ? 'red' : l === 'medium' ? 'orange' : 'blue'}>{l}</Tag> },
    { title: '备注', dataIndex: 'notes', key: 'notes' },
  ];

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/incidents')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      {incident.status === 'open' && (
        <Alert
          message="事件处理中"
          description="请及时处理相关凭据，防止安全风险扩大"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card title={incident.title} extra={
        <Space>
          <Tag color={incident.severity === 'critical' ? 'red' : incident.severity === 'high' ? 'orange' : 'warning'}>
            {incident.severity === 'critical' ? '严重' : incident.severity === 'high' ? '高' : incident.severity === 'medium' ? '中' : '低'}
          </Tag>
          <Tag color={incident.status === 'open' ? 'orange' : incident.status === 'resolved' ? 'green' : 'blue'}>
            {incident.status === 'open' ? '处理中' : incident.status === 'resolved' ? '已解决' : '已关闭'}
          </Tag>
        </Space>
      }>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="事件类型">{incident.incident_type}</Descriptions.Item>
          <Descriptions.Item label="报告人">{incident.reporter_name}</Descriptions.Item>
          <Descriptions.Item label="处理人">{incident.assignee_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(incident.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="详细描述" span={2}>{incident.description || '-'}</Descriptions.Item>
          {incident.resolution_notes && (
            <Descriptions.Item label="处理结果" span={2}>{incident.resolution_notes}</Descriptions.Item>
          )}
        </Descriptions>

        {incident.status === 'open' && (
          <div style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" onClick={() => handleUpdateStatus('resolved')}>
                标记解决
              </Button>
              {user?.role === 'admin' && (
                <>
                  <Button danger icon={<LockOutlined />} onClick={handleFreezeAll}>
                    批量冻结凭据
                  </Button>
                  <Button icon={<UnlockOutlined />} onClick={handleUnfreezeAll}>
                    批量解冻凭据
                  </Button>
                </>
              )}
            </Space>
          </div>
        )}
      </Card>

      <Card title={`受影响凭据 (${affectedCredentials.length})`} style={{ marginTop: 16 }} extra={
        <Button type="primary" onClick={() => setAddModal(true)}>
          添加凭据
        </Button>
      }>
        <Table
          columns={credColumns}
          dataSource={affectedCredentials}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title="添加受影响凭据"
        open={addModal}
        onCancel={() => setAddModal(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddCredential}>
          <Form.Item name="credential_id" label="选择凭据" rules={[{ required: true }]}>
            <Select
              options={allCredentials
                .filter(c => !affectedCredentials.some(a => a.credential_id === c.id))
                .map(c => ({ value: c.id, label: c.title }))}
            />
          </Form.Item>
          <Form.Item name="impact_level" label="影响等级" initialValue="unknown">
            <Select>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="unknown">未知</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">添加</Button>
              <Button onClick={() => setAddModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default IncidentDetail;
