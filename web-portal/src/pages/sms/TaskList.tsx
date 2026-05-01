import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Space, Button, Select, Input, DatePicker, Progress, Descriptions, Modal } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { smsApi } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const SmsTaskList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: undefined as number | undefined,
  });
  const [detailModal, setDetailModal] = useState<{ visible: boolean; data: any }>({
    visible: false,
    data: null,
  });

  const statusMap: { [key: number]: { color: string; text: string } } = {
    0: { color: 'default', text: '待处理' },
    1: { color: 'processing', text: '处理中' },
    2: { color: 'success', text: '已完成' },
    3: { color: 'default', text: '已取消' },
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await smsApi.getTasks({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(result.data.list);
      setPagination((prev) => ({
        ...prev,
        total: result.data.total,
      }));
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

  const handleViewDetail = async (id: number) => {
    try {
      const result = await smsApi.getTaskById(id);
      setDetailModal({
        visible: true,
        data: result.data,
      });
    } catch (error) {
      console.error('获取任务详情失败:', error);
    }
  };

  const columns = [
    {
      title: '任务编号',
      dataIndex: 'taskCode',
      key: 'taskCode',
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
    },
    {
      title: '模板名称',
      dataIndex: 'templateName',
      key: 'templateName',
    },
    {
      title: '发送进度',
      key: 'progress',
      render: (_: any, record: any) => {
        const { totalCount, successCount, failCount, interceptCount, progress } = record;
        const completed = successCount + failCount + interceptCount;
        return (
          <Space direction="vertical" style={{ width: 200 }}>
            <Progress
              percent={parseFloat(progress)}
              format={(percent) => `${completed}/${totalCount} (${percent}%)`}
            />
          </Space>
        );
      },
    },
    {
      title: '成功',
      dataIndex: 'successCount',
      key: 'successCount',
      render: (v: number) => <Tag color="success">{v}</Tag>,
    },
    {
      title: '失败',
      dataIndex: 'failCount',
      key: 'failCount',
      render: (v: number) => <Tag color="error">{v}</Tag>,
    },
    {
      title: '拦截',
      dataIndex: 'interceptCount',
      key: 'interceptCount',
      render: (v: number) => <Tag color="warning">{v}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={statusMap[status].color}>
          {statusMap[status].text}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record.id)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="发送任务列表"
        extra={
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchData}
          >
            刷新
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Select
              style={{ width: 150 }}
              placeholder="任务状态"
              allowClear
              onChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}
            >
              <Select.Option value={0}>待处理</Select.Option>
              <Select.Option value={1}>处理中</Select.Option>
              <Select.Option value={2}>已完成</Select.Option>
              <Select.Option value={3}>已取消</Select.Option>
            </Select>
            <Button type="primary" onClick={fetchData}>
              搜索
            </Button>
            <Button onClick={() => setFilters({ status: undefined })}>
              重置
            </Button>
          </Space>
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
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }));
            },
          }}
        />
      </Card>

      <Modal
        title="任务详情"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, data: null })}
        footer={null}
        width={700}
      >
        {detailModal.data && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="任务编号">{detailModal.data.taskCode}</Descriptions.Item>
              <Descriptions.Item label="任务名称">{detailModal.data.taskName}</Descriptions.Item>
              <Descriptions.Item label="模板名称">{detailModal.data.templateName}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[detailModal.data.status].color}>
                  {statusMap[detailModal.data.status].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="发送总数" span={2}>
                <Progress
                  percent={parseFloat(detailModal.data.progress)}
                  format={() => `${detailModal.data.successCount + detailModal.data.failCount + detailModal.data.interceptCount}/${detailModal.data.totalCount} (${detailModal.data.progress}%)`}
                />
              </Descriptions.Item>
              <Descriptions.Item label="成功数">
                <Tag color="success">{detailModal.data.successCount}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="失败数">
                <Tag color="error">{detailModal.data.failCount}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="拦截数">
                <Tag color="warning">{detailModal.data.interceptCount}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="待发送数">
                <Tag color="default">{detailModal.data.pendingCount}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {dayjs(detailModal.data.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            {detailModal.data.templateContent && (
              <Card title="模板内容" size="small" style={{ marginTop: 16 }}>
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  {detailModal.data.templateContent}
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SmsTaskList;
