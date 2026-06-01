import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Space, Button, Input, Select, Form, message } from 'antd';
import { PlusOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getReports, getDisasters } from '../../utils/api.js';

const disasterLabels = { DROUGHT: '旱灾', FLOOD: '洪涝', HAIL: '冰雹', TYPHOON: '台风', FREEZE: '冻害', PEST: '病虫害', FIRE: '火灾', OTHER: '其他' };
const statusColors = {
  pending: 'orange',
  surveying: 'blue',
  surveyed: 'cyan',
  approved: 'green',
  rejected: 'red',
  paid: 'purple'
};

const statusLabels = {
  pending: '待查勘',
  surveying: '查勘中',
  surveyed: '已查勘',
  approved: '已通过',
  rejected: '已拒赔',
  paid: '已赔付'
};

function ReportList() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [reports, setReports] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    loadDisasters();
    loadReports();
  }, [pagination.current, pagination.pageSize]);

  const loadDisasters = async () => {
    try {
      const res = await getDisasters();
      setDisasters(res.data || []);
    } catch (e) {
      console.error('Load disasters failed:', e);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const values = form.getFieldsValue();
      const params = {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        ...values
      };
      const res = await getReports(params);
      setReports(res.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: res.data.total || 0
      }));
    } catch (e) {
      console.error('Load reports failed:', e);
      message.error('加载报案列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadReports();
  };

  const handleReset = () => {
    form.resetFields();
    setPagination(prev => ({ ...prev, current: 1 }));
    loadReports();
  };

  const handleTableChange = (page, pageSize) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize
    }));
  };

  const handleSurvey = (record) => {
    navigate(`/surveys/create?report_id=${record.id}`);
  };

  const columns = [
    {
      title: '报案号',
      dataIndex: 'report_no',
      key: 'report_no',
      render: (text, record) => (
        <a onClick={() => navigate(`/reports/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '保单号',
      dataIndex: 'policy_no',
      key: 'policy_no'
    },
    {
      title: '灾害类型',
      dataIndex: 'disaster_type',
      key: 'disaster_type',
      render: v => disasterLabels[v] || v
    },
    {
      title: '受损面积(亩)',
      dataIndex: 'damaged_area',
      key: 'damaged_area'
    },
    {
      title: '农户',
      dataIndex: 'farmer_name',
      key: 'farmer_name'
    },
    {
      title: '紧急联系人',
      dataIndex: 'emergency_contact',
      key: 'emergency_contact'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
    },
    {
      title: '报案时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm')
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
            onClick={() => navigate(`/reports/${record.id}`)}
          >
            查看详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleSurvey(record)}
            >
              查勘
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-title">报案管理</div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Form.Item name="report_no" label="报案号">
            <Input placeholder="请输入报案号" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="policy_no" label="保单号">
            <Input placeholder="请输入保单号" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="disaster_type" label="灾害类型">
            <Select placeholder="请选择灾害类型" style={{ width: 160 }} allowClear>
              {Object.entries(disasterLabels).map(([value, label]) => (
                <Select.Option key={value} value={value}>{label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" style={{ width: 160 }} allowClear>
              {Object.entries(statusLabels).map(([value, label]) => (
                <Select.Option key={value} value={value}>{label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/reports/create')}
          >
            新增报案
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={reports}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handleTableChange
          }}
        />
      </Card>
    </div>
  );
}

export default ReportList;
