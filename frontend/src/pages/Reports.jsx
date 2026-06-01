import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Button, message, Select, DatePicker, Tabs } from 'antd';
import { ExportOutlined, BarChartOutlined, PieChartOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../utils/api';
import dayjs from 'dayjs';

function Reports() {
  const [overview, setOverview] = useState(null);
  const [taskTrend, setTaskTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [detailData, setDetailData] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, trendRes] = await Promise.all([
        api.get('/reports/overview'),
        api.get('/reports/task-trend', { params: { days: 30 } })
      ]);
      setOverview(overviewRes.data);
      setTaskTrend(trendRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (reportType) => {
    try {
      const response = await api.get(`/reports/export/${reportType}`, { params: filters });
      const { data, filename } = response.data;
      
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const getTrendOption = () => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['成功', '失败', '进行中'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: taskTrend.map(d => d.date) },
    yAxis: { type: 'value' },
    series: [
      { name: '成功', type: 'line', data: taskTrend.map(d => d.success), smooth: true, itemStyle: { color: '#52c41a' } },
      { name: '失败', type: 'line', data: taskTrend.map(d => d.failed), smooth: true, itemStyle: { color: '#ff4d4f' } },
      { name: '进行中', type: 'line', data: taskTrend.map(d => d.running), smooth: true, itemStyle: { color: '#1890ff' } }
    ]
  });

  const getStatusPieOption = () => ({
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: overview?.tasks_completed || 0, name: '已完成', itemStyle: { color: '#52c41a' } },
        { value: overview?.tasks_failed || 0, name: '失败', itemStyle: { color: '#ff4d4f' } },
        { value: overview?.tasks_running || 0, name: '进行中', itemStyle: { color: '#1890ff' } },
        { value: overview?.tasks_pending || 0, name: '待执行', itemStyle: { color: '#faad14' } }
      ]
    }]
  });

  const getTypePieOption = () => ({
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: overview?.backups || 0, name: '备份任务', itemStyle: { color: '#1890ff' } },
        { value: overview?.restores || 0, name: '恢复任务', itemStyle: { color: '#52c41a' } }
      ]
    }]
  });

  const detailColumns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '应用', dataIndex: 'app_name', key: 'app_name' },
    { title: '环境', dataIndex: 'env_name', key: 'env_name', width: 100 },
    { title: '任务类型', dataIndex: 'task_type', key: 'task_type', width: 100,
      render: (v) => ({ backup: '备份', restore: '恢复' }[v])
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v) => {
        const colors = { completed: 'green', failed: 'red', running: 'blue', cancelled: 'default' };
        return <span style={{ color: colors[v] }}>{v}</span>;
      }
    },
    { title: '执行人', dataIndex: 'operator_name', key: 'operator_name', width: 100 },
    { title: '执行时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm')
    }
  ];

  return (
    <div>
      <div className="table-toolbar">
        <h1 className="page-title">报表中心</h1>
        <Select 
          placeholder="报表类型" 
          style={{ width: 150 }} 
          defaultValue="tasks"
          onChange={(v) => handleExport(v)}
        >
          <Select.Option value="tasks">任务报表</Select.Option>
          <Select.Option value="audit">审计报表</Select.Option>
          <Select.Option value="change">变更报表</Select.Option>
        </Select>
      </div>

      {overview && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" hoverable>
              <div className="stat-card-content">
                <div>
                  <div className="stat-value" style={{ color: '#1890ff' }}>{overview.total_tasks}</div>
                  <div className="stat-label">总任务数</div>
                </div>
                <div className="stat-icon" style={{ background: '#e6f7ff', color: '#1890ff' }}>
                  <BarChartOutlined />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" hoverable>
              <div className="stat-card-content">
                <div>
                  <div className="stat-value" style={{ color: '#52c41a' }}>{overview.backups}</div>
                  <div className="stat-label">备份任务</div>
                </div>
                <div className="stat-icon" style={{ background: '#f6ffed', color: '#52c41a' }}>
                  <PieChartOutlined />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" hoverable>
              <div className="stat-card-content">
                <div>
                  <div className="stat-value" style={{ color: '#722ed1' }}>{overview.restores}</div>
                  <div className="stat-label">恢复任务</div>
                </div>
                <div className="stat-icon" style={{ background: '#f9f0ff', color: '#722ed1' }}>
                  <PieChartOutlined />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" hoverable>
              <div className="stat-card-content">
                <div>
                  <div className="stat-value" style={{ color: '#fa8c16' }}>{overview.applications}</div>
                  <div className="stat-label">应用总数</div>
                </div>
                <div className="stat-icon" style={{ background: '#fff7e6', color: '#fa8c16' }}>
                  <BarChartOutlined />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Tabs
        items={[
          {
            key: 'trend',
            label: '任务趋势',
            children: (
              <Card>
                <ReactECharts option={getTrendOption()} style={{ height: 400 }} />
              </Card>
            )
          },
          {
            key: 'status',
            label: '任务状态分布',
            children: (
              <Row gutter={16}>
                <Col xs={24} lg={12}>
                  <Card title="状态分布">
                    <ReactECharts option={getStatusPieOption()} style={{ height: 350 }} />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="任务类型分布">
                    <ReactECharts option={getTypePieOption()} style={{ height: 350 }} />
                  </Card>
                </Col>
              </Row>
            )
          }
        ]}
      />
    </div>
  );
}

export default Reports;
