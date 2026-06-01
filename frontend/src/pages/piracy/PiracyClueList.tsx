import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, Form, message, Row, Col, Checkbox, Dropdown, MenuProps } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined, AppstoreOutlined, MoreOutlined } from '@ant-design/icons';
import { piracyApi, courseApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Option } = Select;

const PiracyClueList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<any>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [batchAction, setBatchAction] = useState<string>('');
  const [editingClue, setEditingClue] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadCourses = async () => {
    try {
      const res = await courseApi.list({ page_size: 100 });
      setCourses(res.data.data);
    } catch (error) {
      console.error('加载课程列表失败:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await piracyApi.list({
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters,
      });
      setData(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: any) => {
    setFilters(values);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleCreate = () => {
    setEditingClue(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingClue(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingClue) {
        await piracyApi.update(editingClue.id, values);
        message.success('更新成功');
      } else {
        await piracyApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleBatchAction = (action: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的线索');
      return;
    }
    setBatchAction(action);
    batchForm.resetFields();
    setBatchModalVisible(true);
  };

  const handleBatchSubmit = async () => {
    try {
      const values = await batchForm.validateFields();
      await piracyApi.batchUpdate({
        ids: selectedRowKeys,
        action: batchAction,
        ...values,
      });
      message.success('批量操作成功');
      setBatchModalVisible(false);
      setSelectedRowKeys([]);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const priorityMap: Record<string, { color: string; text: string }> = {
    low: { color: 'green', text: '低' },
    medium: { color: 'blue', text: '中' },
    high: { color: 'orange', text: '高' },
    urgent: { color: 'red', text: '紧急' },
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'default', text: '待处理' },
    investigating: { color: 'processing', text: '调查中' },
    confirmed: { color: 'warning', text: '已确认' },
    processing: { color: 'processing', text: '处理中' },
    resolved: { color: 'success', text: '已解决' },
    closed: { color: 'default', text: '已关闭' },
  };

  const sourceMap: Record<string, string> = {
    manual: '手动录入',
    crawl: '爬虫发现',
    report: '用户举报',
    monitoring: '监控发现',
    other: '其他',
  };

  const columns = [
    {
      title: '线索编号',
      dataIndex: 'clue_no',
      key: 'clue_no',
      width: 130,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '相关课程',
      dataIndex: ['course', 'name'],
      key: 'course_name',
      width: 150,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '侵权平台',
      dataIndex: 'infringing_platform',
      key: 'infringing_platform',
      width: 120,
    },
    {
      title: '侵权链接',
      dataIndex: 'infringing_url',
      key: 'infringing_url',
      ellipsis: true,
      render: (url: string) => url ? (
        <Button type="link" href={url} target="_blank" size="small">
          {url.length > 30 ? url.substring(0, 30) + '...' : url}
        </Button>
      ) : '-',
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => sourceMap[source] || source,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => {
        const cfg = priorityMap[priority] || { color: 'default', text: priority };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const cfg = statusMap[status] || { color: 'default', text: status };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '发现时间',
      dataIndex: 'discovered_at',
      key: 'discovered_at',
      width: 160,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/piracy/${record.id}`)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const batchMenuItems: MenuProps['items'] = [
    { key: 'update_status', label: '更新状态', onClick: () => handleBatchAction('update_status') },
    { key: 'update_priority', label: '更新优先级', onClick: () => handleBatchAction('update_priority') },
    { key: 'assign', label: '分配处理人', onClick: () => handleBatchAction('assign') },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">盗版线索管理</h1>
          <p className="page-description">管理和追踪盗版侵权线索</p>
        </div>
        <Space>
          <Dropdown menu={{ items: batchMenuItems }} disabled={selectedRowKeys.length === 0}>
            <Button icon={<AppstoreOutlined />}>
              批量操作 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
            </Button>
          </Dropdown>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增线索
          </Button>
        </Space>
      </div>

      <div className="filter-bar">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="搜索">
            <Input placeholder="线索编号/平台" prefix={<SearchOutlined />} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              {Object.entries(statusMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select placeholder="全部" allowClear style={{ width: 100 }}>
              {Object.entries(priorityMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              {Object.entries(sourceMap).map(([key, value]) => (
                <Option key={key} value={key}>{value}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={() => { setFilters({}); loadData(); }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        rowSelection={rowSelection}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
        }}
        scroll={{ x: 1300 }}
      />

      <Modal
        title={editingClue ? '编辑线索' : '新增线索'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="course_id" label="相关课程">
                <Select placeholder="请选择课程" allowClear showSearch optionFilterProp="children">
                  {courses.map((c: any) => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="infringing_platform" label="侵权平台" rules={[{ required: true }]}>
                <Input placeholder="请输入侵权平台名称" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="infringing_url" label="侵权链接" rules={[{ required: true }]}>
            <Input placeholder="请输入侵权内容链接" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
                <Select placeholder="请选择优先级">
                  {Object.entries(priorityMap).map(([key, value]) => (
                    <Option key={key} value={key}>{value.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="source" label="来源" rules={[{ required: true }]}>
                <Select placeholder="请选择来源">
                  {Object.entries(sourceMap).map(([key, value]) => (
                    <Option key={key} value={key}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="线索描述">
            <Input.TextArea rows={3} placeholder="请描述侵权情况" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          batchAction === 'update_status' ? '批量更新状态' :
          batchAction === 'update_priority' ? '批量更新优先级' :
          '批量分配处理人'
        }
        open={batchModalVisible}
        onOk={handleBatchSubmit}
        onCancel={() => setBatchModalVisible(false)}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          已选择 <Tag color="blue">{selectedRowKeys.length}</Tag> 条线索
        </div>
        <Form form={batchForm} layout="vertical">
          {batchAction === 'update_status' && (
            <Form.Item name="status" label="目标状态" rules={[{ required: true }]}>
              <Select placeholder="请选择状态">
                {Object.entries(statusMap).map(([key, value]) => (
                  <Option key={key} value={key}>{value.text}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          {batchAction === 'update_priority' && (
            <Form.Item name="priority" label="目标优先级" rules={[{ required: true }]}>
              <Select placeholder="请选择优先级">
                {Object.entries(priorityMap).map(([key, value]) => (
                  <Option key={key} value={key}>{value.text}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          {batchAction === 'assign' && (
            <Form.Item name="assignee_id" label="处理人" rules={[{ required: true }]}>
              <Select placeholder="请选择处理人">
                <Option value={1}>管理员</Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="操作备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PiracyClueList;
