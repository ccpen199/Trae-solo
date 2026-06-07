import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Spin, message, Tag, Progress } from 'antd';
import { PlayCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { SkillAssessment } from '../types';
import type { ColumnsType } from 'antd/es/table';

const SkillAssessmentList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState<SkillAssessment[]>([]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await api.skills.getMyAssessments();
      setAssessments(res.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取技能评定列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待开始',
      theory_passed: '理论已过',
      practical_passed: '实操已过',
      completed: '已完成',
      failed: '未通过'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'orange',
      theory_passed: 'blue',
      practical_passed: 'cyan',
      completed: 'green',
      failed: 'red'
    };
    return map[status] || 'default';
  };

  const getProgress = (record: SkillAssessment) => {
    if (record.assessmentStatus === 'completed') return 100;
    if (record.assessmentStatus === 'practical_passed') return 75;
    if (record.assessmentStatus === 'theory_passed') return 50;
    return 0;
  };

  const columns: ColumnsType<SkillAssessment> = [
    {
      title: '工种',
      dataIndex: 'gbName',
      key: 'gbName',
      width: 150
    },
    {
      title: '理论成绩',
      dataIndex: 'theoryScore',
      key: 'theoryScore',
      width: 120,
      render: (score) => score !== undefined ? `${score}分` : '-'
    },
    {
      title: '实操成绩',
      dataIndex: 'practicalScore',
      key: 'practicalScore',
      width: 120,
      render: (score) => score !== undefined ? `${score}分` : '-'
    },
    {
      title: '综合等级',
      dataIndex: 'overallLevel',
      key: 'overallLevel',
      width: 120,
      render: (level) => level !== undefined ? `Level ${level}` : '-'
    },
    {
      title: '评定进度',
      key: 'progress',
      width: 200,
      render: (_, record) => (
        <Progress
          percent={getProgress(record)}
          size="small"
          status={record.assessmentStatus === 'failed' ? 'exception' : 'active'}
        />
      )
    },
    {
      title: '状态',
      dataIndex: 'assessmentStatus',
      key: 'assessmentStatus',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '评定时间',
      dataIndex: 'assessedAt',
      key: 'assessedAt',
      width: 180,
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-'
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {(record.assessmentStatus === 'pending' || record.assessmentStatus === 'failed') && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => navigate(`/assessments/exam/${record.tradeId}`)}
            >
              开始评定
            </Button>
          )}
          {record.assessmentStatus === 'theory_passed' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => message.info('实操考试功能开发中')}
            >
              实操考试
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => message.info('详情功能开发中')}
          >
            查看详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card
      title="我的技能评定"
      extra={
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => message.info('请先选择工种进行评定')}
        >
          新建评定
        </Button>
      }
    >
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={assessments}
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
  );
};

export default SkillAssessmentList;
