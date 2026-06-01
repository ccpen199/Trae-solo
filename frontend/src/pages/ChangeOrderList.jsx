import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Modal, Form, Input, Select, 
  message, Typography, Card, Popconfirm, Timeline, Descriptions
} from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, PlayCircleOutlined, RollbackOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { changeOrderApi, applicationApi } from '../services/api.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const statusColors = {
  draft: 'default',
  pending_approval: 'blue',
  approved: 'green',
  rejected: 'red',
  executing: 'processing',
  completed: 'success',
  rolled_back: 'orange',
  cancelled: 'default'
};

function ChangeOrderList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [form] = Form.useForm();
  const [apps, setApps] = useState([]);

  useEffect(() => {
    loadData();
    loadApps();
  }, []);

  const loadData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await changeOrderApi.getList({ page, page_size: pageSize });
      setData(response.data.data);
      setPagination({
        current: page,
        pageSize,
        total: response.data.total
      });
    } catch (error) {
      message.error('加载变更单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadApps = async () => {
    try {
      const response = await applicationApi.getList({ page_size: 100 });
      setApps(response.data.data);
    } catch (error) {
      console.error('Failed to load apps:', error);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await changeOrderApi.create(values);
      message.success('创建成功');
      setModalVisible(false);
      loadData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const handleAction = async (record, action) => {
    try {
      switch(action) {
        case 'submit':
          await changeOrderApi.submit(record.id);
          break;
        case 'approve':
          await changeOrderApi.approve(record.id);
          break;
        case 'reject':
          await changeOrderApi.reject(record.id, { reason: '驳回' });
          break;
        case 'execute':
          await changeOrderApi.execute(record.id);
          break;
        case 'rollback':
          await changeOrderApi.rollback(record.id);
          break;
      }
      message.success('操作成功');
      loadData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const response = await changeOrderApi.getDetail(record.id);
      setCurrentOrder(response.data);
      setDetailVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const columns = [
    {
      title: '变更标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => handleViewDetail(record)} style={{ fontWeight: 500 }}>{text}</a>
      )
    },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t) => <Tag>{t}</Tag> },
    { title: '应用', dataIndex: 'app_name', key: 'app_name' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusColors[s]}>{s}</Tag> },
    { title: '申请人', dataIndex: 'requester_name', key: 'requester_name' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" onClick={() => handleAction(record, 'submit')}>提交</Button>
          )}
          {record.status === 'pending_approval' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleAction(record, 'approve')}>批准</Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleAction(record, 'reject')}>驳回</Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleAction(record, 'execute')}>执行</Button>
          )}
          {record.status === 'completed' && (
            <Button type="link" size="small" icon={<RollbackOutlined />} onClick={() => handleAction(record, 'rollback')}>回滚</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="table-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>变更管理</Title>
          <Text type="secondary">管理配置变更、部署等变更单</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建变更单
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => loadData(page, pageSize)
        }}
      />

      <Modal
        title="新建变更单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="type" label="变更类型" rules={[{ required: true }]}>
            <Select>
              <Option value="config">配置变更</Option>
              <Option value="deployment">部署变更</Option>
              <Option value="key_rotation">密钥轮换</Option>
              <Option value="access">权限变更</Option>
              <Option value="emergency">紧急变更</Option>
            </Select>
          </Form.Item>
          <Form.Item name="title" label="变更标题" rules={[{ required: true }]}>
            <Input placeholder="请输入变更标题" />
          </Form.Item>
          <Form.Item name="description" label="变更描述">
            <TextArea rows={2} placeholder="请描述变更内容" />
          </Form.Item>
          <Form.Item name="app_id" label="关联应用">
            <Select placeholder="请选择应用">
              {apps.map(app => (
                <Option key={app.id} value={app.id}>{app.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="变更原因" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="请说明变更原因" />
          </Form.Item>
          <Form.Item name="impact" label="影响范围">
            <TextArea rows={2} placeholder="请说明变更影响范围" />
          </Form.Item>
          <Form.Item name="recovery_path" label="恢复路径" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="请描述回滚方案和恢复步骤" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentOrder && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>{currentOrder.title}</Title>
              <Tag color={statusColors[currentOrder.status]} style={{ marginTop: 8 }}>{currentOrder.status}</Tag>
            </div>
            <div className="detail-section">
              <div className="detail-section-title">基本信息</div>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="类型">{currentOrder.type}</Descriptions.Item>
                <Descriptions.Item label="应用">{currentOrder.app_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="申请人">{currentOrder.requester_name}</Descriptions.Item>
                <Descriptions.Item label="审批人">{currentOrder.approver_name || '-'}</Descriptions.Item>
              </Descriptions>
            </div>
            <div className="detail-section">
              <div className="detail-section-title">变更描述</div>
              <Text>{currentOrder.description || '无'}</Text>
            </div>
            <div className="detail-section">
              <div className="detail-section-title">变更原因</div>
              <Text>{currentOrder.reason}</Text>
            </div>
            <div className="detail-section">
              <div className="detail-section-title">恢复路径</div>
              <Text>{currentOrder.recovery_path}</Text>
            </div>
            <div className="detail-section">
              <div className="detail-section-title">变更时间线</div>
              <Timeline size="small">
                {currentOrder.timeline?.map((item, index) => (
                  <Timeline.Item key={index}>
                    <Text strong>{item.action}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.user_name} · {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                    </Text>
                    {item.reason && <div style={{ fontSize: 12, color: '#666' }}>{item.reason}</div>}
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ChangeOrderList;
