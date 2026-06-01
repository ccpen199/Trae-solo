import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Button } from 'antd';
import { 
  FileTextOutlined, CheckCircleOutlined, WarningOutlined, ClockCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { bidsApi, ledgerApi, exceptionsApi } from '../utils/api';
import dayjs from 'dayjs';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, warning: 0 });
  const [exceptionStats, setExceptionStats] = useState({ pending: 0, resolved: 0 });
  const [recentBids, setRecentBids] = useState([]);
  const [recentLedger, setRecentLedger] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ledgerRes, exceptionRes, bidsRes] = await Promise.all([
        ledgerApi.getStats(),
        exceptionsApi.getStats(),
        bidsApi.getList({ pageSize: 5 })
      ]);
      setStats(ledgerRes.data);
      setExceptionStats(exceptionRes.data);
      setRecentBids(bidsRes.data.list);

      const ledgerListRes = await ledgerApi.getList({ pageSize: 10 });
      setRecentLedger(ledgerListRes.data.list);
    } catch (error) {
      console.error('加载数据失败', error);
    }
  };

  const statusMap = {
    draft: { text: '草稿', color: 'default' },
    uploaded: { text: '已上传', color: 'blue' },
    parsed: { text: '已解析', color: 'cyan' },
    matched: { text: '已匹配', color: 'green' },
    generated: { text: '已生成', color: 'purple' },
    reviewed: { text: '已审核', color: 'orange' },
    exported: { text: '已导出', color: 'success' }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">工作台</h1>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="标书总数"
              value={recentBids.length || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="操作成功"
              value={stats.success}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理异常"
              value={exceptionStats.pending}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="操作警告"
              value={stats.warning}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card 
            title="最近标书" 
            extra={<Button type="link" onClick={() => navigate('/bids')}>查看全部 <ArrowRightOutlined /></Button>}
          >
            <List
              dataSource={recentBids}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Tag color={statusMap[item.status]?.color || 'default'}>
                      {statusMap[item.status]?.text || item.status}
                    </Tag>
                  ]}
                >
                  <List.Item.Meta
                    title={<a onClick={() => navigate(`/bids/${item.id}`)}>{item.project_name}</a>}
                    description={`${item.bid_no} · 负责人: ${item.owner_name || '-'} · ${dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card 
            title="操作日志" 
            extra={<Button type="link" onClick={() => navigate('/ledger')}>查看全部 <ArrowRightOutlined /></Button>}
          >
            <List
              size="small"
              dataSource={recentLedger}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <span>
                        {item.action_type}
                        <Tag style={{ marginLeft: 8 }} color={item.status === 'success' ? 'green' : item.status === 'failed' ? 'red' : 'orange'}>
                          {item.status}
                        </Tag>
                      </span>
                    }
                    description={`${item.operator_name || '-'} · ${dayjs(item.created_at).format('MM-DD HH:mm')}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
