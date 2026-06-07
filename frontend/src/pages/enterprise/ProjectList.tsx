import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Spin, message, Tag, Select, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { ConstructionProject } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const fetchProjects = async (status?: string) => {
    setLoading(true);
    try {
      const res = await api.projects.getMy();
      let data = res.data || [];
      if (status) {
        data = data.filter((p: ConstructionProject) => p.status === status);
      }
      setProjects(data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(statusFilter);
  }, [statusFilter]);

  const getNextStatus = (currentStatus: string): string | null => {
    const flow: Record<string, string> = {
      planning: 'approved',
      approved: 'started',
      started: 'under_construction',
      under_construction: 'completed',
      completed: 'closed'
    };
    return flow[currentStatus] || null;
  };

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return;

    try {
      await api.projects.updateStatus(id, nextStatus);
      message.success('项目状态更新成功');
      fetchProjects(statusFilter);
    } catch (error: any) {
      message.error(error.response?.data?.error || '状态更新失败');
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      planning: '规划中',
      approved: '已批准',
      started: '已启动',
      under_construction: '施工中',
      completed: '已完成',
      closed: '已关闭'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      planning: 'default',
      approved: 'blue',
      started: 'cyan',
      under_construction: 'processing',
      completed: 'green',
      closed: 'gray'
    };
    return map[status] || 'default';
  };

  const columns: ColumnsType<ConstructionProject> = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ color: '#8c8c8c', fontSize: '12px' }}>编号：{record.projectCode}</div>
        </div>
      )
    },
    {
      title: '项目类型',
      dataIndex: 'projectType',
      key: 'projectType',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '项目地址',
      dataIndex: 'projectAddress',
      key: 'projectAddress'
    },
    {
      title: '预算（元）',
      dataIndex: 'budget',
      key: 'budget',
      width: 150,
      render: (budget) => budget ? `¥${budget.toLocaleString()}` : '-'
    },
    {
      title: '工人数量',
      dataIndex: 'workerCount',
      key: 'workerCount',
      width: 100,
      render: (count) => `${count || 0}人`
    },
    {
      title: '计划周期',
      key: 'period',
      width: 200,
      render: (_, record) => (
        <div>
          <div>开始：{record.startDate || '-'}</div>
          <div>结束：{record.endDate || '-'}</div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const nextStatus = getNextStatus(record.status);
        return (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/projects/${record.id}`)}
            >
              查看
            </Button>
            {nextStatus && (
              <Popconfirm
                title={`确认将项目状态更新为"${getStatusText(nextStatus)}"？`}
                onConfirm={() => handleUpdateStatus(record.id, record.status)}
                okText="确认"
                cancelText="取消"
              >
                <Button
                  type="link"
                  icon={<ReloadOutlined />}
                >
                  {getStatusText(nextStatus)}
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <Card
      title="项目管理"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/enterprise/projects/create')}
        >
          新建项目
        </Button>
      }
    >
      <div style={{ marginBottom: '16px' }}>
        <Space>
          <span style={{ color: '#666' }}>状态筛选：</span>
          <Select
            placeholder="全部状态"
            style={{ width: 150 }}
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="planning">规划中</Option>
            <Option value="approved">已批准</Option>
            <Option value="started">已启动</Option>
            <Option value="under_construction">施工中</Option>
            <Option value="completed">已完成</Option>
            <Option value="closed">已关闭</Option>
          </Select>
          <span style={{ color: '#8c8c8c' }}>共 {projects.length} 个项目</span>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={projects}
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

export default ProjectList;
