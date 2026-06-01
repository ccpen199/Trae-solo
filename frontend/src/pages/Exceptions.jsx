import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  message,
  Typography,
  Card,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  WarningOutlined,
  StopOutlined,
  EyeOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { config } from '../api';

const { Title } = Typography;

const exceptionTypeLabels = {
  field_ambiguity: '字段歧义',
  sql_error: 'SQL错误',
  data_override: '数据越权',
  misjudgment: '异常原因误判'
};

const handlingResultLabels = {
  auto_block: '自动拦截',
  manual_review: '人工复核',
  continue_observe: '继续观察',
  closed: '已关闭'
};

const handlingResultColors = {
  auto_block: 'red',
  manual_review: 'orange',
  continue_observe: 'blue',
  closed: 'green'
};

function Exceptions() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ auto_block: 0, manual_review: 0, continue_observe: 0, closed: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await config.getExceptions({});
      setList(res.data);
      
      const newStats = { auto_block: 0, manual_review: 0, continue_observe: 0, closed: 0 };
      res.data.forEach(item => {
        if (newStats[item.handling_result] !== undefined) {
          newStats[item.handling_result]++;
        }
      });
      setStats(newStats);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '异常类型', dataIndex: 'exception_type', key: 'exception_type', render: (t) => <Tag color="red">{exceptionTypeLabels[t] || t}</Tag> },
    { title: '关联任务', dataIndex: 'task_name', key: 'task_name' },
    { title: '异常详情', dataIndex: 'exception_detail', key: 'exception_detail', ellipsis: true },
    { title: '处理结果', dataIndex: 'handling_result', key: 'handling_result', render: (r) => <Tag color={handlingResultColors[r]}>{handlingResultLabels[r] || r}</Tag> },
    { title: '处理人', dataIndex: 'handler', key: 'handler' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' }
  ];

  return (
    <div>
      <Title level={3}>异常处理</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="自动拦截"
              value={stats.auto_block}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待人工复核"
              value={stats.manual_review}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="继续观察"
              value={stats.continue_observe}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已关闭"
              value={stats.closed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={list}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default Exceptions;
