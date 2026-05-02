import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Select, Input, message, Space } from 'antd';
import { EXCEPTION_TYPE_MAP, STATUS_MAP } from '../../utils/constants';
import api from '../../services/api';
import type { TableProps } from 'antd';

interface Exception {
  id: string;
  packageId: string;
  trackingNumber: string;
  receiverName: string;
  receiverPhone: string;
  type: string;
  reason: string;
  handlerId?: string;
  handlerName?: string;
  solution?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [handleModal, setHandleModal] = useState(false);
  const [form] = Form.useForm();

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/exceptions');
      setExceptions(response.data);
    } catch (error) {
      message.error('获取异常列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleProcess = async (values: { solution: string; newStatus: string }) => {
    if (!selectedException) return;
    try {
      await api.post('/admin/handle-exception', {
        exceptionId: selectedException.id,
        solution: values.solution,
        newStatus: values.newStatus
      });
      message.success('处理成功');
      setHandleModal(false);
      form.resetFields();
      fetchExceptions();
    } catch (error: any) {
      message.error(error.response?.data?.error || '处理失败');
    }
  };

  const columns: TableProps<Exception>['columns'] = [
    {
      title: '运单号',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      width: 160,
    },
    {
      title: '收件人',
      key: 'receiver',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.receiverName}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.receiverPhone}</div>
        </div>
      ),
    },
    {
      title: '异常类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag color="error">{EXCEPTION_TYPE_MAP[type] || type}</Tag>
      ),
    },
    {
      title: '异常原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colorMap: Record<string, string> = {
          pending: 'warning',
          processing: 'processing',
          resolved: 'success'
        };
        const labelMap: Record<string, string> = {
          pending: '待处理',
          processing: '处理中',
          resolved: '已解决'
        };
        return <Tag color={colorMap[status] as any}>{labelMap[status] || status}</Tag>;
      },
    },
    {
      title: '处理人',
      dataIndex: 'handlerName',
      key: 'handlerName',
      width: 80,
      render: (name) => name || '-',
    },
    {
      title: '解决方案',
      dataIndex: 'solution',
      key: 'solution',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => {
        if (record.status === 'resolved') {
          return <Tag color="success">已解决</Tag>;
        }
        return (
          <Button
            type="link"
            size="small"
            onClick={() => {
              setSelectedException(record);
              setHandleModal(true);
            }}
          >
            处理
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <Card
        title="异常件管理"
        extra={
          <Button onClick={fetchExceptions}>刷新</Button>
        }
      >
        <Table
          columns={columns}
          dataSource={exceptions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="处理异常件"
        open={handleModal}
        onCancel={() => setHandleModal(false)}
        footer={null}
        width={500}
      >
        {selectedException && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>运单号：</strong>{selectedException.trackingNumber}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>异常类型：</strong>
              <Tag color="error">{EXCEPTION_TYPE_MAP[selectedException.type] || selectedException.type}</Tag>
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>异常原因：</strong>{selectedException.reason}
            </div>
          </div>
        )}
        
        <Form form={form} layout="vertical" onFinish={handleProcess}>
          <Form.Item
            name="solution"
            label="解决方案"
            rules={[{ required: true, message: '请输入解决方案' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入解决方案"
            />
          </Form.Item>

          <Form.Item
            name="newStatus"
            label="更新状态"
            rules={[{ required: true, message: '请选择状态' }]}
            initialValue="processing"
          >
            <Select>
              <Select.Option value="processing">处理中</Select.Option>
              <Select.Option value="resolved">已解决</Select.Option>
            </Select>
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
