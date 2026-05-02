import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, message } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  TeamOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import type { TableProps } from 'antd';

interface CourierStat {
  id: string;
  name: string;
  assignedPackages: number;
  signedPackages: number;
  exceptionPackages: number;
  signRate: number;
}

interface AreaStat {
  id: string;
  name: string;
  code: string;
  packageCount: number;
}

interface DashboardData {
  totalInStation: number;
  totalSignedToday: number;
  totalExceptions: number;
  signRateToday: number;
  couriers: CourierStat[];
  areas: AreaStat[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/dashboard');
      setData(response.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const courierColumns: TableProps<CourierStat>['columns'] = [
    {
      title: '快递员',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分配包裹',
      dataIndex: 'assignedPackages',
      key: 'assignedPackages',
      render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>,
    },
    {
      title: '已签收',
      dataIndex: 'signedPackages',
      key: 'signedPackages',
      render: (val) => <Tag color="green">{val}</Tag>,
    },
    {
      title: '异常件',
      dataIndex: 'exceptionPackages',
      key: 'exceptionPackages',
      render: (val) => val > 0 ? <Tag color="red">{val}</Tag> : <span>{val}</span>,
    },
    {
      title: '签收率',
      dataIndex: 'signRate',
      key: 'signRate',
      render: (val) => (
        <span style={{ color: val >= 80 ? '#52c41a' : val >= 50 ? '#fa8c16' : '#ff4d4f' }}>
          {val.toFixed(1)}%
        </span>
      ),
    },
  ];

  const areaColumns: TableProps<AreaStat>['columns'] = [
    {
      title: '区域代码',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (code) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '区域名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '待处理包裹',
      dataIndex: 'packageCount',
      key: 'packageCount',
      render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>,
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="在站包裹"
              value={data?.totalInStation || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日签收"
              value={data?.totalSignedToday || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="异常件"
              value={data?.totalExceptions || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日签收率"
              value={data?.signRateToday || 0}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title={<span><TeamOutlined style={{ marginRight: 8 }} />快递员绩效</span>}>
            <Table
              columns={courierColumns}
              dataSource={data?.couriers || []}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span><EnvironmentOutlined style={{ marginRight: 8 }} />区域包裹分布</span>}>
            <Table
              columns={areaColumns}
              dataSource={data?.areas || []}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
