import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Button, Tag, Space, Row, Col, DatePicker, Spin, message } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { cases as casesApi, departments as deptApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const statusMap = {
  submitted: { text: '已提交', color: 'blue' },
  accepted: { text: '已受理', color: 'cyan' },
  reviewing: { text: '审核中', color: 'orange' },
  supplementing: { text: '补正中', color: 'gold' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已退回', color: 'red' },
  completed: { text: '已办结', color: 'green' },
  archived: { text: '已归档', color: 'default' },
  withdrawn: { text: '已撤回', color: 'default' },
};

export default function Cases() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [department, setDepartment] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();

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
      if (statuses.length > 0) params.status = statuses.join(',');
      if (department) params.department_id = department;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await casesApi.getCases(params);
      const d = res.data?.data || res.data || {};
      setData(d.items || d.list || []);
      setPagination((prev) => ({ ...prev, total: d.total || 0 }));
    } catch {
      message.error('获取办件列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleReset = () => {
    setKeyword('');
    setStatuses([]);
    setDepartment(undefined);
    setDateRange(null);
  };

  const columns = [
    { title: '办件编号', dataIndex: 'case_no', key: 'case_no', width: 150 },
    { title: '申请人', dataIndex: 'applicant_name', key: 'applicant_name', width: 100 },
    {
      title: '事项名称',
      dataIndex: 'item_name',
      key: 'item_name',
      ellipsis: true,
    },
    {
      title: '当前环节',
      dataIndex: 'current_step',
      key: 'current_step',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => {
        const st = statusMap[s] || { text: s, color: 'default' };
        return <Tag color={st.color}>{st.text}</Tag>;
      },
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '法定时限',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 110,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => navigate(`/cases/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={5}>
            <Input
              placeholder="请输入关键词"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              mode="multiple"
              placeholder="选择状态"
              value={statuses}
              onChange={setStatuses}
              style={{ width: '100%' }}
              maxTagCount={2}
              allowClear
            >
              {Object.entries(statusMap).map(([key, val]) => (
                <Option key={key} value={key}>{val.text}</Option>
              ))}
            </Select>
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
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
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
