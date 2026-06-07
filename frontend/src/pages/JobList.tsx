import React, { useEffect, useState } from 'react';
import { Table, Card, Select, Button, Space, Spin, message, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { JobPosting, Trade } from '../types';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

const JobList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filters, setFilters] = useState({
    tradeId: undefined as number | undefined,
    salaryType: undefined as string | undefined
  });

  const fetchTrades = async () => {
    try {
      const res = await api.trades.getAll();
      setTrades(res.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取工种列表失败');
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.tradeId) params.tradeId = filters.tradeId;
      if (filters.salaryType) params.salaryType = filters.salaryType;
      const res = await api.jobs.getAll(params);
      setJobs(res.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取岗位列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const getSalaryTypeText = (type: string) => {
    const map: Record<string, string> = {
      daily: '日薪',
      piece: '计件',
      monthly: '月薪'
    };
    return map[type] || type;
  };

  const getSalaryTypeColor = (type: string) => {
    const map: Record<string, string> = {
      daily: 'blue',
      piece: 'green',
      monthly: 'orange'
    };
    return map[type] || 'default';
  };

  const columns: ColumnsType<JobPosting> = [
    {
      title: '岗位名称',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ color: '#8c8c8c', fontSize: '12px' }}>{record.gbName}</div>
        </div>
      )
    },
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200
    },
    {
      title: '薪资范围',
      key: 'salary',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#f5222d' }}>
            ¥{record.salaryMin}
            {record.salaryMax ? ` - ¥${record.salaryMax}` : ''}
          </div>
          <Tag color={getSalaryTypeColor(record.salaryType)}>
            {getSalaryTypeText(record.salaryType)}
          </Tag>
        </div>
      )
    },
    {
      title: '工作地点',
      dataIndex: 'workLocation',
      key: 'workLocation'
    },
    {
      title: '福利待遇',
      key: 'welfare',
      width: 150,
      render: (_, record) => (
        <Space>
          {record.includesBoard ? <Tag color="green">包吃</Tag> : null}
          {record.includesLodging ? <Tag color="blue">包住</Tag> : null}
        </Space>
      )
    },
    {
      title: '招聘人数',
      dataIndex: 'peopleNeeded',
      key: 'peopleNeeded',
      width: 100,
      render: (text) => `${text || 0}人`
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/jobs/${record.id}`)}
        >
          查看详情
        </Button>
      )
    }
  ];

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Space wrap>
          <span style={{ color: '#666' }}>工种筛选：</span>
          <Select
            placeholder="全部工种"
            style={{ width: 200 }}
            allowClear
            value={filters.tradeId}
            onChange={(value) => setFilters({ ...filters, tradeId: value })}
          >
            {trades.map((trade) => (
              <Option key={trade.id} value={trade.id}>
                {trade.gbName}
              </Option>
            ))}
          </Select>
          <span style={{ color: '#666' }}>薪资类型：</span>
          <Select
            placeholder="全部类型"
            style={{ width: 150 }}
            allowClear
            value={filters.salaryType}
            onChange={(value) => setFilters({ ...filters, salaryType: value })}
          >
            <Option value="daily">日薪</Option>
            <Option value="piece">计件</Option>
            <Option value="monthly">月薪</Option>
          </Select>
        </Space>
      </Card>

      <Card title="岗位大厅" extra={<span style={{ color: '#8c8c8c' }}>共 {jobs.length} 个岗位</span>}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={jobs}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default JobList;
