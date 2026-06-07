import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Select, Modal, Form, Input, message, Space } from 'antd';
import { adminAPI } from '../../services/api';

function AdminApplications() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, status]);

  const loadData = async () => {
    try {
      const res = await adminAPI.getApplications({ page, pageSize: 10, status });
      setData(res.data.list);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReview = async (action) => {
    const values = await form.validateFields();
    try {
      await adminAPI.reviewApplication(currentApp.id, { action, remark: values.remark });
      message.success('操作成功');
      setDetailVisible(false);
      loadData();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const openReview = (record) => {
    setCurrentApp(record);
    form.resetFields();
    setDetailVisible(true);
  };

  const getStatusColor = (status) => {
    const map = {
      submitted: 'blue',
      reviewing: 'orange',
      approved: 'green',
      paid: 'green',
      rejected: 'red',
      cancelled: 'default'
    };
    return map[status] || 'default';
  };

  const getStatusText = (status) => {
    const map = {
      submitted: '已提交',
      reviewing: '审核中',
      approved: '已通过',
      paid: '已兑付',
      rejected: '已拒绝',
      cancelled: '已取消'
    };
    return map[status] || status;
  };

  const getNextActions = (status) => {
    switch (status) {
      case 'submitted':
        return [
          { key: 'approve', label: '初审通过', danger: false },
          { key: 'reject', label: '驳回', danger: true }
        ];
      case 'reviewing':
        return [
          { key: 'approve_final', label: '终审通过', danger: false },
          { key: 'reject', label: '驳回', danger: true }
        ];
      case 'approved':
        return [
          { key: 'pay', label: '确认兑付', danger: false }
        ];
      default:
        return [];
    }
  };

  const columns = [
    { title: '政策名称', dataIndex: 'policy_title', key: 'title' },
    { title: '申报企业', dataIndex: 'enterprise_name', key: 'enterprise' },
    { title: '申请人', dataIndex: 'applicant_name', key: 'applicant' },
    { title: '联系电话', dataIndex: 'applicant_phone', key: 'phone' },
    { title: '提交时间', dataIndex: 'submitted_at', key: 'time' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: status => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {getNextActions(record.status).map(action => (
            <Button 
              key={action.key} 
              size="small"
              danger={action.danger}
              type={action.danger ? 'default' : 'primary'}
              onClick={() => openReview(record)}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card title="政策申报审核">
        <div style={{ marginBottom: 16 }}>
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            allowClear
            value={status}
            onChange={setStatus}
          >
            <Select.Option value="submitted">已提交</Select.Option>
            <Select.Option value="reviewing">审核中</Select.Option>
            <Select.Option value="approved">已通过</Select.Option>
            <Select.Option value="paid">已兑付</Select.Option>
            <Select.Option value="rejected">已拒绝</Select.Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            total,
            current: page,
            onChange: setPage
          }}
        />
      </Card>

      <Modal
        title="审核处理"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
      >
        {currentApp && (
          <div>
            <p><strong>政策名称：</strong>{currentApp.policy_title}</p>
            <p><strong>申报企业：</strong>{currentApp.enterprise_name}</p>
            <p><strong>当前状态：</strong>
              <Tag color={getStatusColor(currentApp.status)}>
                {getStatusText(currentApp.status)}
              </Tag>
            </p>
            
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item name="remark" label="审核意见">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Form>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {getNextActions(currentApp.status).map(action => (
                <Button 
                  key={action.key}
                  type={action.danger ? 'default' : 'primary'}
                  danger={action.danger}
                  onClick={() => handleReview(action.key)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminApplications;
