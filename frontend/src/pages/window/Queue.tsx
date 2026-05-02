import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Modal,
  Form,
  Input,
  Descriptions,
  Divider,
  Empty,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { windowApi, caseApi } from '../../api';

export const QueuePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [queueList, setQueueList] = useState<any[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const response = await windowApi.getQueue();
      setQueueList(response.data || []);
    } catch (error) {
      console.error('加载队列失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (record: any) => {
    try {
      await windowApi.checkIn(record.id);
      message.success('取号成功');
      loadQueue();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '取号失败');
    }
  };

  const handleStartProcess = (record: any) => {
    setSelectedCase(record);
    setProcessModalVisible(true);
  };

  const handleComplete = async (values: any) => {
    if (!selectedCase) return;
    setSubmitting(true);
    try {
      await windowApi.completeCase(selectedCase.case_id, {
        result_content: values.result_content,
        result_notes: values.result_notes,
      });
      message.success('办件已办结');
      setProcessModalVisible(false);
      form.resetFields();
      loadQueue();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '办结失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (record: any) => {
    try {
      const response = await caseApi.getById(record.case_id);
      setSelectedCase(response.data);
      setDetailVisible(true);
    } catch (error) {
      message.error('加载办件详情失败');
    }
  };

  const columns = [
    {
      title: '排队号',
      dataIndex: 'queue_number',
      key: 'queue_number',
      width: 120,
      render: (num: string) => (
        <Tag color="blue" style={{ fontSize: 16, padding: '4px 12px' }}>
          {num}
        </Tag>
      ),
    },
    {
      title: '服务事项',
      dataIndex: ['case', 'service_item_name'],
      key: 'service_item_name',
    },
    {
      title: '申请人',
      dataIndex: ['case', 'applicant_name'],
      key: 'applicant_name',
      render: (name: string) => name || '-',
    },
    {
      title: '取号时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          WAITING: 'blue',
          PROCESSING: 'orange',
          COMPLETED: 'green',
          CANCELLED: 'default',
        };
        const textMap: Record<string, string> = {
          WAITING: '等待中',
          PROCESSING: '办理中',
          COMPLETED: '已完成',
          CANCELLED: '已取消',
        };
        return (
          <Tag color={colorMap[status] || 'default'}>
            {textMap[status] || status}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'RESERVED' && (
            <Button type="primary" onClick={() => handleCheckIn(record)}>
              取号
            </Button>
          )}
          {record.status === 'CHECKED_IN' && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartProcess(record)}
            >
              办结
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Card title="叫号队列">
        {queueList.length === 0 && !loading ? (
          <Empty description="暂无排队记录" />
        ) : (
          <Table
            columns={columns}
            dataSource={queueList}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        )}
      </Card>

      <Modal
        title="办件详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedCase && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="办件编号">
                {selectedCase.case_number}
              </Descriptions.Item>
              <Descriptions.Item label="服务事项">
                {selectedCase.service_item_name}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {selectedCase.applicant_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color="blue">{selectedCase.status}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            {selectedCase.reservation && (
              <div>
                <h4>预约信息</h4>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="预约日期">
                    {selectedCase.reservation.reservation_date}
                  </Descriptions.Item>
                  <Descriptions.Item label="预约时间">
                    {selectedCase.reservation.time_slot?.start_time} -{' '}
                    {selectedCase.reservation.time_slot?.end_time}
                  </Descriptions.Item>
                  <Descriptions.Item label="窗口">
                    {selectedCase.reservation.time_slot?.window_number}号窗口
                  </Descriptions.Item>
                  <Descriptions.Item label="预约状态">
                    {selectedCase.reservation.status}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="办结办件"
        open={processModalVisible}
        onCancel={() => setProcessModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedCase && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <p>
                <strong>办件事项：</strong>
                {selectedCase.case?.service_item_name || selectedCase.service_item_name}
              </p>
              <p>
                <strong>办件编号：</strong>
                {selectedCase.case?.case_number}
              </p>
            </Card>

            <Form form={form} onFinish={handleComplete} layout="vertical">
              <Form.Item
                name="result_content"
                label="办理结果内容"
                rules={[{ required: true, message: '请输入办理结果内容' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="请详细输入办理结果内容"
                />
              </Form.Item>

              <Form.Item name="result_notes" label="备注说明">
                <Input.TextArea rows={2} placeholder="请输入备注说明（选填）" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setProcessModalVisible(false)}>取消</Button>
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    确认办结
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </Spin>
  );
};
