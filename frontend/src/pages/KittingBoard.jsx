import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Select, Button, Card, Row, Col, Statistic } from 'antd';
import { getKittingBoard, getWorkOrders } from '../api';

const { Option } = Select;

function KittingBoard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    production_line: '',
    status: '',
    sort_by: ''
  });
  const [stats, setStats] = useState({ total: 0, ready: 0, shortage: 0, pending: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getKittingBoard(filters);
      setData(res.data);
      
      const allRes = await getWorkOrders();
      const allOrders = allRes.data;
      setStats({
        total: allOrders.length,
        ready: allOrders.filter(o => o.kitting_status === 'ready').length,
        shortage: allOrders.filter(o => o.kitting_status === 'shortage').length,
        pending: allOrders.filter(o => o.kitting_status === 'pending').length
      });
    } catch (error) {
      console.error('获取数据失败:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const getStatusTag = (status) => {
    const statusMap = {
      ready: { color: 'success', text: '齐套' },
      shortage: { color: 'error', text: '缺料' },
      pending: { color: 'default', text: '待检查' }
    };
    const s = statusMap[status] || statusMap.pending;
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const columns = [
    { title: '工单号', dataIndex: 'wo_no', key: 'wo_no', width: 140 },
    { title: '产品', dataIndex: 'product_name', key: 'product_name' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '产线', dataIndex: 'production_line', key: 'production_line', width: 100 },
    { title: '计划开工', dataIndex: 'planned_start_date', key: 'planned_start_date', width: 120 },
    { title: '齐套状态', dataIndex: 'kitting_status', key: 'kitting_status', width: 100,
      render: (text) => getStatusTag(text)
    },
    { title: '缺料项', dataIndex: 'shortage_items', key: 'shortage_items', width: 80,
      render: (text) => text > 0 ? <Tag color="error">{text}项</Tag> : '-'
    },
    { title: '缺料明细', key: 'shortages',
      render: (_, record) => {
        const shortages = record.kitting_items?.filter(item => item.status === 'shortage') || [];
        if (shortages.length === 0) return '-';
        return (
          <Space direction="vertical" size="small">
            {shortages.map((item, idx) => (
              <div key={idx}>
                <Tag color="error">{item.material_code}</Tag>
                缺 {item.short_qty} {item.material_unit}
                {item.earliest_arrival && <Tag color="blue">预计{item.earliest_arrival?.slice(0, 10)}</Tag>}
                {item.affected_process && <Tag>影响:{item.affected_process}</Tag>}
              </div>
            ))}
          </Space>
        );
      }
    }
  ];

  return (
    <div>
      <h2 className="page-title">齐套看板</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总工单" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已齐套" value={stats.ready} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="缺料" value={stats.shortage} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待检查" value={stats.pending} valueStyle={{ color: '#8c8c8c' }} />
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <span>产线筛选:</span>
        <Select
          style={{ width: 150 }}
          allowClear
          placeholder="全部产线"
          value={filters.production_line || undefined}
          onChange={(v) => setFilters({ ...filters, production_line: v })}
        >
          <Option value="Line-A">Line-A</Option>
          <Option value="Line-B">Line-B</Option>
          <Option value="Line-C">Line-C</Option>
        </Select>
        <span>状态筛选:</span>
        <Select
          style={{ width: 120 }}
          allowClear
          placeholder="全部状态"
          value={filters.status || undefined}
          onChange={(v) => setFilters({ ...filters, status: v })}
        >
          <Option value="ready">齐套</Option>
          <Option value="shortage">缺料</Option>
          <Option value="pending">待检查</Option>
        </Select>
        <span>排序:</span>
        <Select
          style={{ width: 150 }}
          allowClear
          placeholder="默认排序"
          value={filters.sort_by || undefined}
          onChange={(v) => setFilters({ ...filters, sort_by: v })}
        >
          <Option value="shortage">缺料优先</Option>
          <Option value="arrival">到料时间</Option>
        </Select>
        <Button onClick={fetchData}>刷新</Button>
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => (
            <Table
              size="small"
              columns={[
                { title: '物料编码', dataIndex: 'material_code', key: 'code', width: 120 },
                { title: '物料名称', dataIndex: 'material_name', key: 'name' },
                { title: '需求数量', dataIndex: 'required_qty', key: 'req', width: 100 },
                { title: '库存数量', dataIndex: 'stock_qty', key: 'stock', width: 100 },
                { title: '在途数量', dataIndex: 'in_transit_qty', key: 'transit', width: 100 },
                { title: '已领数量', dataIndex: 'issued_qty', key: 'issued', width: 100 },
                { title: '缺料数量', dataIndex: 'short_qty', key: 'short', width: 100 },
                { title: '状态', dataIndex: 'status', key: 'status',
                  render: (text) => getStatusTag(text)
                },
                { title: '影响工序', dataIndex: 'affected_process', key: 'process' }
              ]}
              dataSource={record.kitting_items}
              rowKey="id"
              pagination={false}
            />
          )
        }}
      />
    </div>
  );
}

export default KittingBoard;
