import React, { useState, useEffect } from 'react';
import { Button, Table, Tag, Spin, Empty, message, Card, Tabs } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { evaluationApi } from '../services/api';
import { useUserStore } from '../store/userStore';
import dayjs from 'dayjs';

const getTypeText = (type) => {
  const typeMap = {
    MORAL: '思想品德',
    INTELLLECTUAL: '学业成绩',
    PHYSICAL: '身心健康',
    AESTHETIC: '艺术素养',
    LABOR: '社会实践'
  };
  return typeMap[type] || type;
};

const Evaluations = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState([]);
  const { isTeacher } = useUserStore();
  const canManage = isTeacher();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listResult, summaryResult] = await Promise.all([
        evaluationApi.getList({}),
        evaluationApi.getSummary({})
      ]);
      setData(listResult.data.list);
      setSummary(summaryResult.data);
    } catch (error) {
      console.error('Failed to fetch evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      title: '学期',
      dataIndex: 'semester',
      key: 'semester'
    },
    {
      title: '测评类型',
      dataIndex: 'type',
      key: 'type',
      render: getTypeText
    },
    {
      title: '学生',
      dataIndex: ['student', 'name'],
      key: 'student',
      render: (text) => text || '-'
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      render: (score, record) => (
        <span>
          {score} / {record.maxScore}
        </span>
      )
    },
    {
      title: '评价人',
      dataIndex: ['evaluator', 'name'],
      key: 'evaluator',
      render: (text) => text || '-'
    },
    {
      title: '评价时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
    }
  ];

  const summaryColumns = [
    {
      title: '学期',
      dataIndex: 'semester',
      key: 'semester'
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore'
    },
    {
      title: '满分',
      dataIndex: 'maxScore',
      key: 'maxScore'
    },
    {
      title: '平均分',
      dataIndex: 'average',
      key: 'average',
      render: (val) => `${val} 分`
    },
    {
      title: '测评项目数',
      dataIndex: 'count',
      key: 'count'
    }
  ];

  const tabItems = [
    {
      key: 'list',
      label: '测评明细',
      children: (
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )
    },
    {
      key: 'summary',
      label: '学期汇总',
      children: (
        <Table
          columns={summaryColumns}
          dataSource={summary}
          rowKey="semester"
          pagination={false}
        />
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>综合测评</h2>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />}>
            新增测评
          </Button>
        )}
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : data.length > 0 || summary.length > 0 ? (
          <Tabs items={tabItems} defaultActiveKey="list" />
        ) : (
          <Empty description="暂无测评数据" />
        )}
      </div>
    </div>
  );
};

export default Evaluations;
