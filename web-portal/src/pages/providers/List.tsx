import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Space, message } from 'antd';
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { routingApi } from '../../services/api';

const ProviderList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await routingApi.getProviders();
      setData(result.data.list);
    } catch (error) {
      console.error('获取通道列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      title: '通道编号',
      dataIndex: 'providerCode',
      key: 'providerCode',
    },
    {
      title: '通道名称',
      dataIndex: 'providerName',
      key: 'providerName',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '单价',
      dataIndex: 'pricePerSms',
      key: 'pricePerSms',
      render: (v: number) => `¥${v}/条`,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
    },
    {
      title: '支持模板类型',
      dataIndex: 'supportedTemplateTypes',
      key: 'supportedTemplateTypes',
      render: (types: string[]) => (
        <>
          {types?.map((type, index) => (
            <Tag key={index} color="blue">{type}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '可用' : '不可用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="通道管理"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              添加通道
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  );
};

export default ProviderList;
