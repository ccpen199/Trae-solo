import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Select, Card, message, Descriptions } from 'antd';
import { getWorkOrders, checkWorkOrderKitting, getWorkOrderKitting, getKittingLogs } from '../api';

const { Option } = Select;

function WorkOrderKitting() {
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [kittingData, setKittingData] = useState([]);
  const [kittingResult, setKittingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const res = await getWorkOrders();
      setWorkOrders(res.data);
    } catch (error) {
      console.error('获取工单失败:', error);
    }
  };

  const handleWorkOrderChange = async (woId) => {
    setSelectedWorkOrder(workOrders.find(w => w.id === woId));
    setKittingResult(null);
    try {
      const res = await getWorkOrderKitting(woId);
      setKittingData(res.data);
      const logsRes = await getKittingLogs(woId);
      setLogs(logsRes.data);
    } catch (error) {
      setKittingData([]);
    }
  };

  const handleCheckKitting = async () => {
    if (!selectedWorkOrder) {
      message.warning('请先选择工单');
      return;
    }
    setLoading(true);
    try {
      const res = await checkWorkOrderKitting(selectedWorkOrder.id);
      setKittingResult(res.data);
      setKittingData(res.data.items);
      message.success('齐套检查完成');
      fetchWorkOrders();
      const logsRes = await getKittingLogs(selectedWorkOrder.id);
      setLogs(logsRes.data);
    } catch (error) {
      message.error('齐套检查失败: ' + error.response?.data?.error);
    }
    setLoading(false);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      ready: { color: 'success', text: '充足' },
      shortage: { color: 'error', text: '缺料' },
      substituted: { color: 'warning', text: '替代' },
      pending: { color: 'default', text: '待检' }
    };
    const s = statusMap[status] || statusMap.pending;
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const columns = [
    { title: '物料编码', dataIndex: 'material_code', key: 'code', width: 120 },
    { title: '物料名称', dataIndex: 'material_name', key: 'name' },
    { title: '单位', dataIndex: 'material_unit', key: 'unit', width: 60 },
    { title: '需求数量', dataIndex: 'required_qty', key: 'req', width: 100, render: v => v?.toFixed(2) },
    { title: '仓库库存', dataIndex: 'stock_qty', key: 'stock', width: 100, render: v => v?.toFixed(2) },
    { title: '在途数量', dataIndex: 'in_transit_qty', key: 'transit', width: 100, render: v => v?.toFixed(2) },
    { title: '已领数量', dataIndex: 'issued_qty', key: 'issued', width: 100, render: v => v?.toFixed(2) },
    { title: '缺料数量', dataIndex: 'short_qty', key: 'short', width: 100,
      render: (v) => v > 0 ? <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{v.toFixed(2)}</span> : '-'
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (text) => getStatusTag(text)
    },
    { title: '是否替代', dataIndex: 'is_substituted', key: 'sub', width: 80,
      render: (v) => v ? <Tag color="warning">是</Tag> : '否'
    },
    { title: '替代审批', dataIndex: 'substitute_approved', key: 'approved', width: 80,
      render: (v, record) => record.is_substituted ? (v ? <Tag color="success">已批</Tag> : <Tag color="error">未批</Tag>) : '-'
    },
    { title: '影响工序', dataIndex: 'affected_process', key: 'process' }
  ];

  return (
    <div>
      <h2 className="page-title">工单齐套检查</h2>
      
      <Card style={{ marginBottom: 16 }}>
        <Space align="center">
          <span>选择工单:</span>
          <Select
            style={{ width: 300 }}
            placeholder="请选择工单"
            value={selectedWorkOrder?.id}
            onChange={handleWorkOrderChange}
            showSearch
            optionFilterProp="children"
          >
            {workOrders.map(wo => (
              <Option key={wo.id} value={wo.id}>
                {wo.wo_no} - {wo.product_name} ({wo.quantity}台)
              </Option>
            ))}
          </Select>
          <Button type="primary" onClick={handleCheckKitting} loading={loading}>
            执行齐套检查
          </Button>
        </Space>

        {kittingResult && (
          <div style={{ marginTop: 16 }}>
            <Descriptions title="齐套结果" bordered size="small" column={4}>
              <Descriptions.Item label="工单号">{kittingResult.work_order.wo_no}</Descriptions.Item>
              <Descriptions.Item label="产品">{kittingResult.work_order.product_name}</Descriptions.Item>
              <Descriptions.Item label="数量">{kittingResult.work_order.quantity}</Descriptions.Item>
              <Descriptions.Item label="齐套状态">
                {kittingResult.kitting_status === 'ready' ? 
                  <Tag color="success">齐套</Tag> : 
                  <Tag color="error">缺料</Tag>
                }
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Card>

      {selectedWorkOrder && (
        <>
          <Card title="齐套明细" style={{ marginBottom: 16 }}>
            <Table
              columns={columns}
              dataSource={kittingData}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>

          <Card title="操作日志" size="small">
            <Table
              size="small"
              columns={[
                { title: '时间', dataIndex: 'created_at', key: 'time', width: 180 },
                { title: '操作', dataIndex: 'action', key: 'action', width: 120 },
                { title: '原状态', dataIndex: 'old_status', key: 'old' },
                { title: '新状态', dataIndex: 'new_status', key: 'new' },
                { title: '操作人', dataIndex: 'operator', key: 'op' },
                { title: '备注', dataIndex: 'remark', key: 'remark' }
              ]}
              dataSource={logs}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </>
      )}
    </div>
  );
}

export default WorkOrderKitting;
