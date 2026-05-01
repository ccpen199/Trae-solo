import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Space, Button, Select, Input, DatePicker, Modal, Descriptions } from 'antd';
import { ReloadOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { smsApi } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const SmsRecordList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    phoneNumber: undefined as string | undefined,
    status: undefined as number | undefined,
  });
  const [detailModal, setDetailModal] = useState<{ visible: boolean; data: any }>({
    visible: false,
    data: null,
  });

  const statusMap: { [key: number]: { color: string; text: string } } = {
    0: { color: 'default', text: '待发送' },
    1: { color: 'processing', text: '发送中' },
    2: { color: 'success', text: '发送成功' },
    3: { color: 'error', text: '发送失败' },
    4: { color: 'warning', text: '被拦截' },
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await smsApi.getRecords({
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
      console.error('获取记录列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

  const columns = [
    {
      title: '短信编号',
      dataIndex: 'smsCode',
      key: 'smsCode',
    },
    {
      title: '手机号',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      render: (phone: string) => (
        <Input.Search
          placeholder="搜索手机号"
          value={phone}
          onSearch={() => setFilters((prev) => ({ ...prev, phoneNumber: phone }))}
          style={{ width: 150 }}
        />
      ),
    },
    {
      title: '模板名称',
      dataIndex: 'templateName',
      key: 'templateName',
    },
    {
      title: '通道',
      dataIndex: 'providerName',
      key: 'providerName',
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
      title: '发送价格',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount}`,
    },
    {
      title: '发送时间',
      dataIndex: 'requestAt',
      key: 'requestAt',
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '回执时间',
      dataIndex: 'receiveAt',
      key: 'receiveAt',
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setDetailModal({ visible: true, data: record })}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="发送记录"
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
            <Input.Search
              placeholder="搜索手机号"
              style={{ width: 200 }}
              onSearch={(v) => setFilters((prev) => ({ ...prev, phoneNumber: v }))}
              allowClear
            />
            <Select
              style={{ width: 150 }}
              placeholder="状态"
              allowClear
              onChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}
            >
              <Select.Option value={0}>待发送</Select.Option>
              <Select.Option value={1}>发送中</Select.Option>
              <Select.Option value={2}>发送成功</Select.Option>
              <Select.Option value={3}>发送失败</Select.Option>
              <Select.Option value={4}>被拦截</Select.Option>
            </Select>
            <Button type="primary" onClick={fetchData}>
              搜索
            </Button>
            <Button onClick={() => setFilters({ phoneNumber: undefined, status: undefined })}>
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
        title="短信详情"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, data: null })}
        footer={null}
        width={600}
      >
        {detailModal.data && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="短信编号">{detailModal.data.smsCode}</Descriptions.Item>
            <Descriptions.Item label="手机号">{detailModal.data.phoneNumber}</Descriptions.Item>
            <Descriptions.Item label="模板名称">{detailModal.data.templateName}</Descriptions.Item>
            <Descriptions.Item label="通道">{detailModal.data.providerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[detailModal.data.status].color}>
                {statusMap[detailModal.data.status].text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="费用">¥{detailModal.data.amount}</Descriptions.Item>
            {detailModal.data.interceptReason && (
              <Descriptions.Item label="拦截原因" span={2}>
                {detailModal.data.interceptReason}
              </Descriptions.Item>
            )}
            {detailModal.data.failReason && (
              <Descriptions.Item label="失败原因" span={2}>
                {detailModal.data.failReason}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="请求ID" span={2}>
              {detailModal.data.requestId || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {dayjs(detailModal.data.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {detailModal.data.requestAt && (
              <Descriptions.Item label="发送时间" span={2}>
                {dayjs(detailModal.data.requestAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
            {detailModal.data.receiveAt && (
              <Descriptions.Item label="回执时间" span={2}>
                {dayjs(detailModal.data.receiveAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="发送内容" span={2}>
              <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                {detailModal.data.content}
              </div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default SmsRecordList;
