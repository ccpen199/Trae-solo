import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Button, Tag, Space, Row, Col, Spin, message } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/auth';
import { items as itemsApi, departments as deptApi } from '../api';

const { Option } = Select;

const statusMap = {
  active: { text: '已发布', color: 'green' },
  inactive: { text: '已停用', color: 'red' },
  draft: { text: '草稿', color: 'default' },
};

export default function Items() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [department, setDepartment] = useState(undefined);
  const [category, setCategory] = useState(undefined);
  const [status, setStatus] = useState(undefined);
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const fetchDepartments = async () => {
    try {
      const res = await deptApi.getDepartments();
      const d = res.data?.data || res.data || [];
      setDepartments(Array.isArray(d) ? d : []);
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (department) params.department_id = department;
      if (category) params.category = category;
      if (status) params.status = status;
      const res = await itemsApi.getItems(params);
      const d = res.data?.data || res.data || {};
      setData(d.items || d.list || []);
      setPagination((prev) => ({ ...prev, total: d.total || 0 }));
    } catch {
      message.error('获取事项列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleToggleStatus = async (id) => {
    try {
      await itemsApi.toggleItemStatus(id);
      message.success('操作成功');
      fetchData();
    } catch {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '事项编码', dataIndex: 'code', key: 'code', width: 140 },
    {
      title: '事项名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text, record) => (
        <a onClick={() => navigate(`/items/${record.id}`)}>{text}</a>
      ),
    },
    { title: '所属部门', dataIndex: 'department_name', key: 'department_name', width: 120 },
    { title: '事项类型', dataIndex: 'item_type', key: 'item_type', width: 100 },
    {
      title: '法定时限',
      dataIndex: 'time_limit',
      key: 'time_limit',
      width: 100,
      render: (v) => (v ? `${v}个工作日` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s) => {
        const st = statusMap[s] || { text: s, color: 'default' };
        return <Tag color={st.color}>{st.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/items/${record.id}`)}>
            查看
          </Button>
          {isAdmin && (
            <Button type="link" size="small" onClick={() => navigate(`/items/${record.id}`)}>
              编辑
            </Button>
          )}
          {isAdmin && (
            <Button
              type="link"
              size="small"
              danger={record.status === 'active'}
              onClick={() => handleToggleStatus(record.id)}
            >
              {record.status === 'active' ? '停用' : '启用'}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="请输入关键词"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="所属部门"
              value={department}
              onChange={setDepartment}
              allowClear
              style={{ width: '100%' }}
            >
              {departments.map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="事项类别"
              value={category}
              onChange={setCategory}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="administrative">行政许可</Option>
              <Option value="public_service">公共服务</Option>
              <Option value="administrative_confirmation">行政确认</Option>
              <Option value="administrative_penalty">行政处罚</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="状态"
              value={status}
              onChange={setStatus}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="active">已发布</Option>
              <Option value="inactive">已停用</Option>
              <Option value="draft">草稿</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setDepartment(undefined); setCategory(undefined); setStatus(undefined); }}>
                重置
              </Button>
              {isAdmin && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/items/create')}>
                  新增事项
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          onChange={(pag) =>
            setPagination({ current: pag.current, pageSize: pag.pageSize, total: pag.total })
          }
        />
      </Card>
    </div>
  );
}
