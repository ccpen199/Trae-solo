import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Space, Typography, Button, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { appealAPI } from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;

function AppealList({ user }) {
  const navigate = useNavigate();
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(false);

  const isTeacher = user.role === 'teacher' || user.role === 'assistant';

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const response = await appealAPI.getAll();
      setAppeals(response.data.appeals || []);
    } catch (error) {
      message.error('加载申诉列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待处理' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已驳回' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '作业',
      dataIndex: 'assignment_title',
      key: 'assignment_title',
      render: (text) => text || '-'
    },
    {
      title: '提交版本',
      dataIndex: 'submission_version',
      key: 'submission_version',
      width: 100,
      render: (v) => `v${v}`
    },
    ...(isTeacher ? [
      {
        title: '申诉学生',
        dataIndex: 'student_name',
        key: 'student_name',
        width: 120
      }
    ] : []),
    {
      title: '申诉原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (text) => (
        <span title={text}>{text}</span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    ...(isTeacher ? [
      {
        title: '审核人',
        dataIndex: 'reviewer_name',
        key: 'reviewer_name',
        width: 100,
        render: (text) => text || '-'
      }
    ] : []),
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/appeals/${record.id}`)}
        >
          查看
        </Button>
      )
    }
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>申诉管理</Title>
      <Table
        columns={columns}
        dataSource={appeals}
        rowKey="id"
        loading={loading}
      />
    </div>
  );
}

export default AppealList;
