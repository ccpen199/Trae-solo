import React, { useEffect, useState } from 'react';
import { Table, Card, Row, Col, Statistic } from 'antd';
import { getTaskROIList } from '../services/api';

const TaskROI: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data: any = await getTaskROIList(page, pageSize);
      setList(data.list || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  const totalCoins = list.reduce((s, i) => s + (i.totalCoins || 0), 0);
  const totalUsers = list.reduce((s, i) => s + (i.uniqueUsers || 0), 0);
  const totalCompletions = list.reduce((s, i) => s + (i.completionCount || 0), 0);
  const avgCPA = list.length ? (list.reduce((s, i) => s + parseFloat(i.cpa || 0), 0) / list.length).toFixed(4) : 0;

  const columns = [
    { title: '任务ID', dataIndex: 'taskId', width: 80 },
    { title: '任务名称', dataIndex: 'taskName' },
    { title: '类型', dataIndex: 'taskType' },
    { title: '完成次数', dataIndex: 'completionCount', render: (v: number) => v.toLocaleString(), sorter: (a: any, b: any) => a.completionCount - b.completionCount },
    { title: '参与用户数', dataIndex: 'uniqueUsers', render: (v: number) => v.toLocaleString(), sorter: (a: any, b: any) => a.uniqueUsers - b.uniqueUsers },
    { title: '发放金币', dataIndex: 'totalCoins', render: (v: number) => <span style={{ color: '#f5222d' }}>{v.toLocaleString()}</span> },
    { title: '消耗成本(元)', dataIndex: 'cost', render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: 'CPA单客成本', dataIndex: 'cpa', render: (v: string) => <span style={{ color: v && parseFloat(v) > 0.1 ? '#f5222d' : '#52c41a', fontWeight: 600 }}>¥{v}</span> },
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 24 }}>📈 任务 ROI 分析</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="任务总数" value={total} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="总完成次数" value={totalCompletions.toLocaleString()} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="总发放金币" value={totalCoins.toLocaleString()} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small"><Statistic title="平均CPA" value={`¥${avgCPA}`} /></Card></Col>
      </Row>

      <Table
        rowKey="taskId"
        loading={loading}
        columns={columns}
        dataSource={list}
        pagination={{ current: page, pageSize, total, onChange: setPage, onShowSizeChange: (_, s) => setPageSize(s) }}
      />
    </div>
  );
};

export default TaskROI;
