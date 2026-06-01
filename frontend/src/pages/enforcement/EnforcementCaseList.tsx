import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, Form, message, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined, FileProtectOutlined } from '@ant-design/icons';
import { enforcementApi, piracyApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Option } = Select;

const EnforcementCaseList: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCase, setEditingCase] = useState<any>(null);
  const [clues, setClues] = useState<any[]>([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadClues();
  }, []);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadClues = async () => {
    try {
      const res = await piracyApi.list({ page_size: 100, status: 'confirmed' });
      setClues(res.data.data);
    } catch (error) {
      console.error('加载线索列表失败:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await enforcementApi.list({
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
    setEditingCase(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingCase(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCase) {
        message.success('更新成功');
      } else {
        await enforcementApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
        message.error(error.response?.data?.error || '操作失败');
      }
  };

  const caseTypeMap: Record<string, string> = {
    takedown: '下架维权',
    compensation: '赔偿诉讼',
    administrative: '行政投诉',
    criminal: '刑事报案',
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'default', text: '待处理' },
    investigating: { color: 'processing', text: '调查中' },
    negotiating: { color: 'processing', text: '协商中' },
    litigating: { color: 'processing', text: '诉讼中' },
    settled: { color: 'success', text: '已和解' },
    won: { color: 'success', text: '胜诉' },
    lost: { color: 'error', text: '败诉' },
    closed: { color: 'default', text: '已结案' },
  };

  const columns = [
    {
      title: '案件编号',
      dataIndex: 'case_no',
      key: 'case_no',
      width: 150,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '案件类型',
      dataIndex: 'case_type',
      key: 'case_type',
      width: 120,
      render: (type: string) => caseTypeMap[type] || type,
    },
    {
      title: '相关课程',
      dataIndex: ['piracy_clue', 'course', 'name'],
      key: 'course_name',
      width: 150,
      ellipsis: true,
      render: (text: string, record: any) => text || '-',
    },
    {
      title: '侵权平台',
      dataIndex: ['piracy_clue', 'infringing_platform'],
      key: 'platform',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '索赔金额',
      dataIndex: 'claimed_amount',
      key: 'claimed_amount',
      width: 120,
      render: (amount: number) => amount ? `¥${amount.toLocaleString()}` : '-',
    },
    {
      title: '实际赔偿',
      dataIndex: 'compensation_amount',
      key: 'compensation_amount',
      width: 120,
      render: (amount: number) => amount ? `¥${amount.toLocaleString()}` : '-',
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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/enforcement/${record.id}`)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">维权案件管理</h1>
          <p className="page-description">管理版权维权案件的全流程追踪</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增案件
        </Button>
      </div>

      <div className="filter-bar">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="搜索">
            <Input placeholder="案件编号/平台" prefix={<SearchOutlined />} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="case_type" label="案件类型">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              {Object.entries(caseTypeMap).map(([key, value]) => (
                <Option key={key} value={key}>{value}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              {Object.entries(statusMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
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
        title={editingCase ? '编辑案件' : '新增案件'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="piracy_clue_id" label="关联线索" rules={[{ required: true }]}>
                <Select placeholder="请选择线索" showSearch optionFilterProp="children">
                  {clues.map((c: any) => (
                    <Option key={c.id} value={c.id}>
                      {c.clue_no} - {c.course?.name || '未关联课程'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="case_type" label="案件类型" rules={[{ required: true }]}>
                <Select placeholder="请选择案件类型">
                  {Object.entries(caseTypeMap).map(([key, value]) => (
                    <Option key={key} value={key}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="claimed_amount" label="索赔金额(元)">
                <Input type="number" min={0} placeholder="请输入索赔金额" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select placeholder="请选择状态">
                  {Object.entries(statusMap).map(([key, value]) => (
                    <Option key={key} value={key}>{value.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="案件描述">
            <Input.TextArea rows={3} placeholder="请输入案件描述" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnforcementCaseList;
