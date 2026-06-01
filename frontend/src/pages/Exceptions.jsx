import React, { useState, useEffect } from 'react';
import { Table, Select, Space, Tag, Button, message, Modal, Form, Input, Card, Descriptions } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { canHandle, getCurrentRole } from '../utils/permissions';
import dayjs from 'dayjs';

function Exceptions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [filters, setFilters] = useState({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [handleVisible, setHandleVisible] = useState(false);
  const [currentException, setCurrentException] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  useEffect(() => {
    setUserRole(getCurrentRole());
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.current, pageSize: pagination.pageSize, ...filters };
      const response = await api.get('/exceptions', { params });
      setData(response.data.list);
      setPagination(p => ({ ...p, total: response.data.total }));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const response = await api.get(`/exceptions/${record.id}`);
      setCurrentException(response.data);
      setDetailVisible(true);
    } catch (error) {
      message.error('加载失败');
    }
  };

  const handleHandle = (record) => {
    setCurrentException(record);
    form.setFieldsValue(record);
    setHandleVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await api.post(`/exceptions/${currentException.id}/handle`, values);
      message.success('处理成功');
      setHandleVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const exceptionTypeNames = {
    network_error: '网络错误',
    permission_denied: '权限拒绝',
    config_error: '配置错误',
    data_error: '数据错误',
    timeout: '超时',
    unknown: '未知错误'
  };

  const columns = [
    { title: '异常编号', dataIndex: 'exception_no', key: 'exception_no', width: 160 },
    { title: '类型', dataIndex: 'exception_type', key: 'exception_type', width: 120,
      render: (v) => <Tag>{exceptionTypeNames[v] || v}</Tag>
    },
    { title: '级别', dataIndex: 'severity', key: 'severity', width: 100,
      render: (v) => <Tag color={{ low: 'blue', medium: 'orange', high: 'red', critical: 'red' }[v]}>
        {v.toUpperCase()}
      </Tag>
    },
    { title: '错误详情', dataIndex: 'error_details', key: 'error_details' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 120,
      render: (v) => {
        const colors = { open: 'red', investigating: 'orange', resolved: 'green', closed: 'default' };
        const names = { open: '待处理', investigating: '处理中', resolved: '已解决', closed: '已关闭' };
        return <Tag color={colors[v]}>{names[v]}</Tag>;
      }
    },
    { title: '关联任务', dataIndex: 'task_no', key: 'task_no', width: 120 },
    { title: '处理人', dataIndex: 'handler_name', key: 'handler_name', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {canHandle(userRole, 'exception') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleHandle(record)}>
              处理
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <h1 className="page-title">异常处理</h1>

      <div className="table-filters" style={{ marginBottom: 16 }}>
        <Select 
          placeholder="异常类型" 
          style={{ width: 150 }} 
          allowClear
          onChange={(v) => setFilters(f => ({ ...f, exception_type: v }))}
        >
          {Object.entries(exceptionTypeNames).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v}</Select.Option>
          ))}
        </Select>
        <Select 
          placeholder="严重级别" 
          style={{ width: 120 }} 
          allowClear
          onChange={(v) => setFilters(f => ({ ...f, severity: v }))}
        >
          <Select.Option value="low">LOW</Select.Option>
          <Select.Option value="medium">MEDIUM</Select.Option>
          <Select.Option value="high">HIGH</Select.Option>
          <Select.Option value="critical">CRITICAL</Select.Option>
        </Select>
        <Select 
          placeholder="状态" 
          style={{ width: 120 }} 
          allowClear
          onChange={(v) => setFilters(f => ({ ...f, status: v }))}
        >
          <Select.Option value="open">待处理</Select.Option>
          <Select.Option value="investigating">处理中</Select.Option>
          <Select.Option value="resolved">已解决</Select.Option>
          <Select.Option value="closed">已关闭</Select.Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))
        }}
      />

      <Modal
        title="异常详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentException && (
          <Card size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="异常编号">{currentException.exception_no}</Descriptions.Item>
              <Descriptions.Item label="异常类型">{exceptionTypeNames[currentException.exception_type]}</Descriptions.Item>
              <Descriptions.Item label="严重级别">{currentException.severity?.toUpperCase()}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {{ open: '待处理', investigating: '处理中', resolved: '已解决', closed: '已关闭' }[currentException.status]}
              </Descriptions.Item>
              <Descriptions.Item label="错误详情">{currentException.error_details}</Descriptions.Item>
              {currentException.stack_trace && (
                <Descriptions.Item label="堆栈信息">
                  <pre style={{ fontSize: 11, maxHeight: 150, overflow: 'auto' }}>{currentException.stack_trace}</pre>
                </Descriptions.Item>
              )}
              {currentException.compensation_action && (
                <Descriptions.Item label="补偿动作">{currentException.compensation_action}</Descriptions.Item>
              )}
              {currentException.manual_note && (
                <Descriptions.Item label="人工备注">{currentException.manual_note}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}
      </Modal>

      <Modal
        title="处理异常"
        open={handleVisible}
        onCancel={() => setHandleVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="investigating">处理中</Select.Option>
              <Select.Option value="resolved">已解决</Select.Option>
              <Select.Option value="closed">已关闭</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="compensation_action" label="补偿动作">
            <Input.TextArea rows={3} placeholder="请描述补偿措施" />
          </Form.Item>
          <Form.Item name="manual_note" label="处理备注">
            <Input.TextArea rows={3} placeholder="请输入处理备注" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交处理
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Exceptions;
