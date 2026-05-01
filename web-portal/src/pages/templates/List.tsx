import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Popconfirm, message, Card, Select, Input, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { templateApi } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const TemplateList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [filters, setFilters] = useState({
    status: undefined as number | undefined,
    templateType: undefined as string | undefined,
    keyword: undefined as string | undefined,
  });

  const statusMap: { [key: number]: { color: string; text: string } } = {
    0: { color: 'default', text: '草稿' },
    1: { color: 'processing', text: '审核中' },
    2: { color: 'success', text: '已激活' },
    3: { color: 'default', text: '已禁用' },
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await templateApi.getList({
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
      console.error('获取模板列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

  const handleActivate = async (id: number) => {
    try {
      await templateApi.activate(id);
      message.success('模板已激活');
      fetchData();
    } catch (error) {
      console.error('激活模板失败:', error);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await templateApi.deactivate(id);
      message.success('模板已禁用');
      fetchData();
    } catch (error) {
      console.error('禁用模板失败:', error);
    }
  };

  const columns = [
    {
      title: '模板编号',
      dataIndex: 'templateCode',
      key: 'templateCode',
    },
    {
      title: '模板名称',
      dataIndex: 'templateName',
      key: 'templateName',
    },
    {
      title: '模板类型',
      dataIndex: 'templateType',
      key: 'templateType',
      render: (type: string) => (
        <Tag color="blue">{type}</Tag>
      ),
    },
    {
      title: '签名',
      dataIndex: 'signName',
      key: 'signName',
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
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/templates/edit/${record.id}`)}
          >
            编辑
          </Button>
          {record.status !== 2 && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleActivate(record.id)}
            >
              激活
            </Button>
          )}
          {record.status === 2 && (
            <Popconfirm
              title="确定要禁用此模板吗？"
              onConfirm={() => handleDeactivate(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<StopOutlined />}
              >
                禁用
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="模板管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/templates/create')}
          >
            创建模板
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              style={{ width: 150 }}
              placeholder="模板状态"
              allowClear
              onChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}
            >
              <Select.Option value={0}>草稿</Select.Option>
              <Select.Option value={2}>已激活</Select.Option>
              <Select.Option value={3}>已禁用</Select.Option>
            </Select>
            <Select
              style={{ width: 150 }}
              placeholder="模板类型"
              allowClear
              onChange={(v) => setFilters((prev) => ({ ...prev, templateType: v }))}
            >
              <Select.Option value="验证码">验证码</Select.Option>
              <Select.Option value="通知">通知</Select.Option>
              <Select.Option value="营销">营销</Select.Option>
            </Select>
            <Input.Search
              placeholder="搜索模板名称/编号"
              style={{ width: 200 }}
              onSearch={(v) => setFilters((prev) => ({ ...prev, keyword: v }))}
              allowClear
            />
            <Button type="primary" onClick={fetchData}>
              搜索
            </Button>
            <Button onClick={() => {
              setFilters({ status: undefined, templateType: undefined, keyword: undefined });
            }}>
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
    </div>
  );
};

export default TemplateList;
