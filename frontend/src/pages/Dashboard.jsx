import React, { useState, useEffect } from 'react';
import { Row, Col, Statistic, Card, Table, Tag, Alert } from 'antd';
import { UserOutlined, CalendarOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

function Dashboard({ storeId }) {
  const [dashboard, setDashboard] = useState({});
  const [warnings, setWarnings] = useState([]);
  const [abnormalLoss, setAbnormalLoss] = useState([]);

  useEffect(() => {
    loadDashboard();
    loadWarnings();
    loadAbnormalLoss();
  }, [storeId]);

  const loadDashboard = async () => {
    const res = await api.get(`/stores/${storeId}/dashboard?date=${dayjs().format('YYYY-MM-DD')}`);
    if (res.success) {
      setDashboard(res.data);
    }
  };

  const loadWarnings = async () => {
    const res = await api.get(`/materials/batches/warning?store_id=${storeId}`);
    if (res.success) {
      setWarnings(res.data);
    }
  };

  const loadAbnormalLoss = async () => {
    const res = await api.get(`/loss/abnormal?store_id=${storeId}`);
    if (res.success) {
      setAbnormalLoss(res.data);
    }
  };

  const warningColumns = [
    { title: '原料名称', dataIndex: 'material_name', key: 'material_name' },
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no' },
    { title: '剩余数量', dataIndex: 'quantity', key: 'quantity', render: (v, r) => `${v} ${r.unit}` },
    { title: '距过期天数', dataIndex: 'days_to_expiry', key: 'days_to_expiry',
      render: (v) => <Tag color={v <= 3 ? 'red' : 'orange'}>{Math.round(v)}天</Tag>
    }
  ];

  const lossColumns = [
    { title: '日期', dataIndex: 'loss_date', key: 'loss_date' },
    { title: '原料', dataIndex: 'material_name', key: 'material_name' },
    { title: '损耗数量', dataIndex: 'quantity', key: 'quantity', render: (v, r) => `${v} ${r.unit}` },
    { title: '损耗类型', dataIndex: 'loss_type', key: 'loss_type',
      render: (v) => {
        const map = { expired: '过期', production_fail: '制作失败', inventory_diff: '盘点差异', activity: '活动消耗' };
        return map[v] || v;
      }
    },
    { title: '门店', dataIndex: 'store_name', key: 'store_name' }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>运营仪表盘</h2>
      
      {warnings.length > 0 && (
        <Alert
          message="原料临期预警"
          description={`有 ${warnings.length} 批原料即将过期，请及时处理`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {abnormalLoss.length > 0 && (
        <Alert
          message="异常损耗待跟进"
          description={`有 ${abnormalLoss.length} 条异常损耗记录需要营运跟进`}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日排班人数"
              value={dashboard.schedule_count || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日请假人数"
              value={dashboard.leave_count || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="临期原料批次"
              value={dashboard.warning_batches || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日损耗数量"
              value={dashboard.loss_today_qty || 0}
              suffix="单位"
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="临期原料预警">
            <Table
              dataSource={warnings}
              columns={warningColumns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="异常损耗待跟进">
            <Table
              dataSource={abnormalLoss}
              columns={lossColumns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
