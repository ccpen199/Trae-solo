import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, message, Switch, Modal } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';

export default function HRJobManage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/hr/jobs');
      setJobs(data.list || []);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id: number, checked: boolean) => {
    Modal.confirm({
      title: '确认修改',
      content: checked ? '确定要开启这个职位吗？' : '确定要暂停这个职位吗？',
      onOk: async () => {
        try {
          await axios.put(`/jobs/${id}`, { status: checked ? 'active' : 'paused' });
          message.success('修改成功');
          loadJobs();
        } catch (error) {
          message.error('修改失败');
        }
      }
    });
  };

  const statusColors: Record<string, string> = {
    active: 'success',
    paused: 'default',
    closed: 'error',
    rejected: 'error'
  };

  const statusLabels: Record<string, string> = {
    active: '招聘中',
    paused: '已暂停',
    closed: '已关闭',
    rejected: '已拒绝'
  };

  const columns = [
    {
      title: '职位名称',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '薪资',
      dataIndex: 'salary_min',
      key: 'salary',
      render: (_: any, record: any) => (
        <span style={{ color: '#f5222d', fontWeight: 600 }}>
          {record.salary_min}-{record.salary_max}K
        </span>
      )
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city'
    },
    {
      title: '申请数',
      dataIndex: 'application_count',
      key: 'application_count'
    },
    {
      title: '浏览数',
      dataIndex: 'view_count',
      key: 'view_count'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => navigate(`/hr/jobs/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Switch
            checked={record.status === 'active'}
            onChange={(checked) => handleStatusChange(record.id, checked)}
          />
        </Space>
      )
    }
  ];

  return (
    <Card 
      title="职位管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/hr/jobs/new')}>
          发布新职位
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={jobs}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}
