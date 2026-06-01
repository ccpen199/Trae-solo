import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Space, Button, Input, Select, Form, message } from 'antd';
import { SearchOutlined, PlusOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getSurveys } from '../../utils/api.js';

const disasterLabels = { DROUGHT: '旱灾', FLOOD: '洪涝', HAIL: '冰雹', TYPHOON: '台风', FREEZE: '冻害', PEST: '病虫害', FIRE: '火灾', OTHER: '其他' };
const statusColors = {
  pending: 'orange',
  surveying: 'blue',
  surveyed: 'cyan',
  approved: 'green',
  rejected: 'red',
  paid: 'purple',
  reviewing: 'orange'
};

const statusLabels = {
  pending: '待查勘',
  surveying: '查勘中',
  surveyed: '已查勘',
  approved: '已通过',
  rejected: '已拒赔',
  paid: '已赔付',
  reviewing: '审核中'
};

const roleLabels = {
  insurer: '保险公司',
  township: '乡镇',
  regulator: '监管方'
};

function SurveyList({ currentUser }) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadSurveys();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const res = await getSurveys({
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        ...filters
      });
      setSurveys(res.data.data || []);
      setPagination(prev => ({ ...prev, total: res.data.total || 0 }));
    } catch (e) {
      console.error('Load surveys failed:', e);
      message.error('加载查勘列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    setFilters(values);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (pag) => {
    setPagination(prev => ({
      ...prev,
      current: pag.current,
      pageSize: pag.pageSize
    }));
  };

  const columns = [
    {
      title: '查勘号',
      dataIndex: 'survey_no',
      key: 'survey_no',
      render: (text, record) => (
        <a onClick={() => navigate(`/surveys/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '报案号',
      dataIndex: 'report_no',
      key: 'report_no',
      render: (text, record) => (
        <a onClick={() => navigate(`/reports/${record.report_id}`)}>{text}</a>
      )
    },
    { title: '灾害类型', dataIndex: 'disaster_type', key: 'disaster_type', render: v => disasterLabels[v] || v },
    {
      title: '损失比例',
      dataIndex: 'loss_ratio',
      key: 'loss_ratio',
      render: (val) => val ? `${(val * 100).toFixed(1)}%` : '-'
    },
    { title: '查勘员', dataIndex: 'surveyor_name', key: 'surveyor_name' },
    {
      title: '查勘时间',
      dataIndex: 'survey_time',
      key: 'survey_time',
      render: (t) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/surveys/${record.id}`)}
          >
            查看
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-title">查勘定损</div>

      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          onReset={handleReset}
        >
          <Form.Item name="survey_no" label="查勘号">
            <Input placeholder="请输入查勘号" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="report_no" label="报案号">
            <Input placeholder="请输入报案号" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="surveyor" label="查勘员">
            <Input placeholder="请输入查勘员" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button htmlType="reset" icon={<ReloadOutlined />}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/surveys/create')}
          >
            新增查勘
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={surveys}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
}

export default SurveyList;
