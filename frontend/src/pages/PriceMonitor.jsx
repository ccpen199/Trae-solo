import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Statistic, Row, Col } from 'antd';
import { RiseOutlined, FallOutlined, MinusOutlined } from '@ant-design/icons';
import { priceHistory, competitors } from '../api.js';

const PriceMonitor = ({ currentUser }) => {
  const [prices, setPrices] = useState([]);
  const [competitorList, setCompetitorList] = useState([]);
  const [stats, setStats] = useState({ increase: 0, decrease: 0, stable: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [priceData, compData] = await Promise.all([
        priceHistory.getAll(),
        competitors.getAll()
      ]);
      setPrices(priceData);
      setCompetitorList(compData);
      
      const increase = priceData.filter(p => p.change_type === 'increase').length;
      const decrease = priceData.filter(p => p.change_type === 'decrease').length;
      const stable = priceData.filter(p => p.change_type === 'stable').length;
      setStats({ increase, decrease, stable });
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const columns = [
    {
      title: '竞品',
      dataIndex: 'competitor_id',
      key: 'competitor_id',
      render: (id) => {
        const comp = competitorList.find(c => c.id === id);
        return comp ? comp.name : '-';
      }
    },
    {
      title: '套餐名称',
      dataIndex: 'plan_name',
      key: 'plan_name'
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (p, r) => `${r.currency} ${p}`
    },
    {
      title: '计价单位',
      dataIndex: 'price_unit',
      key: 'price_unit'
    },
    {
      title: '变动类型',
      dataIndex: 'change_type',
      key: 'change_type',
      render: (type) => {
        const colors = { increase: 'red', decrease: 'green', stable: 'default', new: 'blue' };
        const icons = { increase: <RiseOutlined />, decrease: <FallOutlined />, stable: <MinusOutlined />, new: '新增' };
        return (
          <Tag color={colors[type]} icon={icons[type]}>
            {type === 'increase' ? '上涨' : type === 'decrease' ? '下降' : type === 'stable' ? '持平' : '新增'}
          </Tag>
        );
      }
    },
    {
      title: '上次价格',
      dataIndex: 'previous_price',
      key: 'previous_price',
      render: (p) => p || '-'
    },
    {
      title: '记录时间',
      dataIndex: 'recorded_at',
      key: 'recorded_at'
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>价格监控</h2>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="价格上涨"
              value={stats.increase}
              valueStyle={{ color: '#f5222d' }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="价格下降"
              value={stats.decrease}
              valueStyle={{ color: '#52c41a' }}
              prefix={<FallOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="价格持平"
              value={stats.stable}
              valueStyle={{ color: '#1890ff' }}
              prefix={<MinusOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={prices}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
};

export default PriceMonitor;
