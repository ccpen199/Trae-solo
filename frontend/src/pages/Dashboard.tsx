import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Alert } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { statsApi } from '../api';
import { STATUS_MAP } from '../utils/constants';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>({});
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [bySource, setBySource] = useState<any[]>([]);
  const [overdueList, setOverdueList] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, categoryRes, sourceRes, overdueRes] = await Promise.all([
        statsApi.getSummary(),
        statsApi.getByCategory(),
        statsApi.getBySource(),
        statsApi.getOverdueList()
      ]);
      setSummary(summaryRes.data);
      setByCategory(categoryRes.data);
      setBySource(sourceRes.data);
      setOverdueList(overdueRes.data);
    } catch (error) {
      console.error('加载统计数据失败', error);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>统计看板</h2>
      </div>

      {overdueList.length > 0 && (
        <Alert
          message={`有 ${overdueList.length} 条派发任务已逾期，请及时处理`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="stat-card" onClick={() => navigate('/clues')}>
            <Statistic
              title="线索总数"
              value={summary.total || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" onClick={() => navigate('/clues?status=pending')}>
            <Statistic
              title="待研判"
              value={summary.pending || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" onClick={() => navigate('/clues?status=dispatched')}>
            <Statistic
              title="处置中"
              value={summary.dispatched || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" onClick={() => navigate('/clues?status=completed')}>
            <Statistic
              title="已结案"
              value={summary.completed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="来源分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bySource}
                  dataKey="count"
                  nameKey="source_channel"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: any) => `${entry.source_channel}: ${entry.count}`}
                >
                  {bySource.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="类别分布">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {overdueList.length > 0 && (
        <Card title="逾期任务" style={{ marginTop: 24 }}>
          <List
            dataSource={overdueList}
            renderItem={(item: any) => (
              <List.Item
                actions={[<Tag color="red">逾期{item.overdue_days.toFixed(0)}天</Tag>]}
                onClick={() => navigate(`/clues/${item.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <List.Item.Meta
                  title={`[${item.clue_no}] ${item.title}`}
                  description={`责任单位: ${item.responsible_unit} | 截止时间: ${item.deadline}`}
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
