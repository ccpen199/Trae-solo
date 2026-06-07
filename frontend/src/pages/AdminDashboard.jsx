import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, message } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  RiseOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [trendData, setTrendData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, trendRes, heatmapRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/stats/withdrawal-trend?days=7'),
        api.get('/admin/stats/heatmap')
      ]);
      setStats(statsRes.data);
      setTrendData(trendRes.data);
      setHeatmapData(heatmapRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const trendOption = {
    title: { text: '近7日提取趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: trendData.map(d => d.date)
    },
    yAxis: [
      { type: 'value', name: '笔数' },
      { type: 'value', name: '金额(万元)' }
    ],
    series: [
      {
        name: '提取笔数',
        type: 'bar',
        data: trendData.map(d => d.count)
      },
      {
        name: '提取金额',
        type: 'line',
        yAxisIndex: 1,
        data: trendData.map(d => (d.amount / 10000).toFixed(2))
      }
    ]
  };

  const rateOption = {
    title: { text: '提取成功率', left: 'center' },
    series: [{
      type: 'gauge',
      progress: { show: true },
      detail: { formatter: '{value}%' },
      data: [{ value: stats.successRate || 0 }]
    }]
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>数据看板</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4.8}>
          <Card loading={loading}>
            <Statistic
              title="缴存用户数"
              value={stats.totalUsers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={4.8}>
          <Card loading={loading}>
            <Statistic
              title="资金总余额"
              value={(stats.totalBalance || 0) / 100000000}
              precision={2}
              suffix="亿元"
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={4.8}>
          <Card loading={loading}>
            <Statistic
              title="待审批申请"
              value={stats.pendingWithdrawals || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={4.8}>
          <Card loading={loading}>
            <Statistic
              title="今日提取笔数"
              value={stats.todayWithdrawals || 0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4.8}>
          <Card loading={loading}>
            <Statistic
              title="今日提取金额"
              value={(stats.todayAmount || 0) / 10000}
              precision={2}
              suffix="万元"
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card loading={loading}>
            <ReactECharts option={trendOption} style={{ height: 400 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card loading={loading}>
            <ReactECharts option={rateOption} style={{ height: 400 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
