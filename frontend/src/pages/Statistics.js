import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Progress } from 'antd';
import axios from 'axios';

const Statistics = () => {
  const [statistics, setStatistics] = useState({
    failureRate: 0,
    mtbf: 0,
    mttr: 0,
    maintenanceCost: 0,
    healthScores: []
  });

  // 获取统计数据
  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 获取设备统计数据
      const response = await axios.get('http://localhost:3001/api/statistics', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '设备名称',
      dataIndex: 'equipmentName',
      key: 'equipmentName'
    },
    {
      title: '健康度评分',
      dataIndex: 'healthScore',
      key: 'healthScore',
      render: (score) => (
        <div>
          <Progress percent={score} status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'} />
          <span style={{ marginTop: 8, display: 'block', textAlign: 'center' }}>{score}%</span>
        </div>
      )
    }
  ];

  return (
    <div>
      <h2>统计分析</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="设备故障率" value={statistics.failureRate} suffix="%" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="平均故障间隔时间" value={statistics.mtbf} suffix="小时" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="平均修复时间" value={statistics.mttr} suffix="小时" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="维保成本" value={statistics.maintenanceCost} suffix="元" />
          </Card>
        </Col>
      </Row>
      <Card title="设备健康度评分">
        <Table columns={columns} dataSource={statistics.healthScores} rowKey="equipmentId" />
      </Card>
    </div>
  );
};

export default Statistics;