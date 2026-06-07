import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Spin, message, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { JobPosting } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const JobList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobPosting[]>([]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.jobs.getMy();
      setJobs(res.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取岗位列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      await api.jobs.update(id, { status: newStatus });
      message.success(newStatus === 'active' ? '岗位已上架' : '岗位已下架');
      fetchJobs();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

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

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      active: '已上架',
      closed: '已下架',
      filled: '已招满'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      active: 'green',
      closed: 'default',
      filled: 'orange'
    };
    return map[status] || 'default';
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
      title: '所属项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 150,
      render: (text) => text || '-'
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
          {record.safetyTrainingRequired ? <Tag color="orange">需培训</Tag> : null}
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
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
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/jobs/${record.id}`)}
          >
            查看
          </Button>
          {record.status !== 'filled' && (
            <Popconfirm
              title={record.status === 'active' ? '确认下架该岗位？' : '确认上架该岗位？'}
              onConfirm={() => handleToggleStatus(record.id, record.status)}
              okText="确认"
              cancelText="取消"
            >
              <Button
                type="link"
                icon={record.status === 'active' ? <StopOutlined /> : <PlayCircleOutlined />}
                danger={record.status === 'active'}
              >
                {record.status === 'active' ? '下架' : '上架'}
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card
      title="岗位管理"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/enterprise/jobs/create')}
        >
          发布岗位
        </Button>
      }
    >
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={jobs}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Spin>
    </Card>
  );
};

export default JobList;
