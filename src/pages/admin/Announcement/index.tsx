import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  Modal,
  message,
  Tag,
  Popconfirm,
  Steps,
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  DownOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { announcementApi } from '@/services/announcement';
import { formatDateTime, serviceTypeMap } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

const Announcement: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [auditForm] = Form.useForm();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [auditVisible, setAuditVisible] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const res: any = await announcementApi.getAnnouncementList({
        ...values,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      if (res.code === 0) {
        setData(res.data.list);
        setTotal(res.data.total);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pagination]);

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    loadData();
  };

  const handleReset = () => {
    form.resetFields();
    setPagination({ ...pagination, current: 1 });
    loadData();
  };

  const handleEdit = (record: any) => {
    navigate(`/admin/announcements/create?id=${record.id}`);
  };

  const handleAudit = (record: any) => {
    setCurrentAnnouncement(record);
    auditForm.resetFields();
    setAuditVisible(true);
  };

  const handleAuditSubmit = async () => {
    try {
      const values = await auditForm.validateFields();
      const res: any = await announcementApi.auditAnnouncement(currentAnnouncement.id, values);
      if (res.code === 0) {
        message.success('审核成功');
        setAuditVisible(false);
        loadData();
      }
    } catch (error) {
      console.error('审核失败');
    }
  };

  const handlePublish = async (record: any) => {
    try {
      const res: any = await announcementApi.publishAnnouncement(record.id);
      if (res.code === 0) {
        message.success('发布成功');
        loadData();
      }
    } catch (error) {
      console.error('发布失败');
    }
  };

  const handleOffline = async (record: any) => {
    try {
      const res: any = await announcementApi.offlineAnnouncement(record.id);
      if (res.code === 0) {
        message.success('下架成功');
        loadData();
      }
    } catch (error) {
      console.error('下架失败');
    }
  };

  const handleDelete = async (record: any) => {
    try {
      const res: any = await announcementApi.deleteAnnouncement(record.id);
      if (res.code === 0) {
        message.success('删除成功');
        loadData();
      }
    } catch (error) {
      console.error('删除失败');
    }
  };

  const renderAuditFlow = (status: number) => {
    const steps = [
      { title: '草稿' },
      { title: '待审核' },
      { title: '已发布' },
    ];
    let current = 0;
    if (status === 1 || status === 3) current = 1;
    if (status === 2) current = 2;

    return (
      <Steps
        size="small"
        current={current}
        items={steps}
        className="w-48"
      />
    );
  };

  const columns: ColumnsType<any> = [
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (t) => <span className="text-gray-700 font-medium">{t}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (t) => <StatusTag type="announcementType" status={t} />,
    },
    {
      title: '服务类型',
      dataIndex: 'serviceType',
      width: 100,
      render: (t) => (
        <Tag color={serviceTypeMap[t]?.color}>{serviceTypeMap[t]?.name}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => <StatusTag type="announcement" status={s} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 160,
      render: (t) => formatDateTime(t),
    },
    {
      title: '审核流程',
      key: 'flow',
      width: 200,
      render: (_, record) => renderAuditFlow(record.status),
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status === 1 && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleAudit(record)}>
              审核
            </Button>
          )}
          {(record.status === 0 || record.status === 3) && (
            <Button type="link" size="small" icon={<UploadOutlined />} onClick={() => handlePublish(record)}>
              发布
            </Button>
          )}
          {record.status === 2 && (
            <Button type="link" size="small" icon={<DownOutlined />} onClick={() => handleOffline(record)}>
              下架
            </Button>
          )}
          <Popconfirm
            title="确定删除此公告？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear style={{ width: 120 }}>
              <Option value={0}>草稿</Option>
              <Option value={1}>待审核</Option>
              <Option value={2}>已发布</Option>
              <Option value={3}>已驳回</Option>
              <Option value={4}>已下架</Option>
            </Select>
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Select placeholder="请选择类型" allowClear style={{ width: 120 }}>
              <Option value="outage">停供公告</Option>
              <Option value="repair">抢修公告</Option>
              <Option value="notice">通知公告</Option>
            </Select>
          </Form.Item>
          <Form.Item name="serviceType" label="服务类型">
            <Select placeholder="请选择服务类型" allowClear style={{ width: 120 }}>
              <Option value="water">水费</Option>
              <Option value="electricity">电费</Option>
              <Option value="gas">燃气费</Option>
              <Option value="all">全部</Option>
            </Select>
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="搜索关键词" prefix={<SearchOutlined />} allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card className="shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">公告列表</h3>
          <Space>
            <span className="text-gray-500 text-sm">共 {total} 条记录</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/announcements/create')}>
              新建公告
            </Button>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (current, pageSize) => setPagination({ current, pageSize }),
          }}
        />
      </Card>

      <Modal
        title="审核公告"
        open={auditVisible}
        onOk={handleAuditSubmit}
        onCancel={() => setAuditVisible(false)}
        okText="确认审核"
      >
        <Form form={auditForm} layout="vertical">
          <Form.Item
            name="result"
            label="审核结果"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Select placeholder="请选择审核结果">
              <Option value={1}>通过</Option>
              <Option value={0}>驳回</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="opinion"
            label="审核意见"
            rules={[{ required: true, message: '请输入审核意见' }]}
          >
            <TextArea rows={4} placeholder="请输入审核意见" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Announcement;
