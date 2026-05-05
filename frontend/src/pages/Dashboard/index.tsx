import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import {
  ShoppingCartOutlined,
  ShoppingOutlined,
  InboxOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { get } from '../../utils/request';

interface StockRecord {
  id: string;
  orderNo: string;
  type: string;
  totalQty: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface InventoryItem {
  id: string;
  material: {
    code: string;
    name: string;
    unit: string;
  };
  warehouse: {
    name: string;
  };
  quantity: number;
  availableQty: number;
  totalAmount: number;
}

const statusColorMap: Record<string, string> = {
  DRAFT: 'default',
  PENDING: 'orange',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

const statusTextMap: Record<string, string> = {
  DRAFT: '草稿',
  PENDING: '待审核',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

const fetchWithFallback = async <T,>(url: string, fallback: T): Promise<T> => {
  try {
    const response = await get<T>(url);
    return response;
  } catch {
    return fallback;
  }
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    materials: 0,
    suppliers: 0,
    customers: 0,
    warehouses: 0,
  });
  const [recentStockIns, setRecentStockIns] = useState<StockRecord[]>([]);
  const [recentStockOuts, setRecentStockOuts] = useState<StockRecord[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [materialsRes, suppliersRes, customersRes, warehousesRes] = await Promise.all([
        fetchWithFallback<{ total: number }>('/materials?pageSize=1', { total: 0 }),
        fetchWithFallback<{ total: number }>('/suppliers?pageSize=1', { total: 0 }),
        fetchWithFallback<{ total: number }>('/customers?pageSize=1', { total: 0 }),
        fetchWithFallback<{ total: number }>('/warehouses?pageSize=1', { total: 0 }),
      ]);

      setStats({
        materials: materialsRes.total || 0,
        suppliers: suppliersRes.total || 0,
        customers: customersRes.total || 0,
        warehouses: warehousesRes.total || 0,
      });

      const [stockInsRes, stockOutsRes, inventoryRes] = await Promise.all([
        fetchWithFallback<{ list: StockRecord[] }>('/inventory/stock-in?pageSize=5', { list: [] }),
        fetchWithFallback<{ list: StockRecord[] }>('/inventory/stock-out?pageSize=5', { list: [] }),
        fetchWithFallback<{ list: InventoryItem[] }>('/inventory/stock?pageSize=10', { list: [] }),
      ]);

      setRecentStockIns(stockInsRes.list || []);
      setRecentStockOuts(stockOutsRes.list || []);
      setInventoryList(inventoryRes.list || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stockInColumns = [
    {
      title: '单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '数量',
      dataIndex: 'totalQty',
      key: 'totalQty',
      render: (val: number) => `${val}`,
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val: number) => `¥${val?.toFixed(2) || '0.00'}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColorMap[status] || 'default'}>{statusTextMap[status] || status}</Tag>
      ),
    },
  ];

  const inventoryColumns = [
    {
      title: '物料编码',
      dataIndex: ['material', 'code'],
      key: 'materialCode',
    },
    {
      title: '物料名称',
      dataIndex: ['material', 'name'],
      key: 'materialName',
    },
    {
      title: '仓库',
      dataIndex: ['warehouse', 'name'],
      key: 'warehouseName',
    },
    {
      title: '库存数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val: number, record: InventoryItem) => `${val} ${record.material.unit}`,
    },
    {
      title: '可用数量',
      dataIndex: 'availableQty',
      key: 'availableQty',
      render: (val: number) => `${val}`,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>仪表盘</h2>
      </div>

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="物料数量"
              value={stats.materials}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="供应商数量"
              value={stats.suppliers}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="客户数量"
              value={stats.customers}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="仓库数量"
              value={stats.warehouses}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Card title="最近入库单" loading={loading}>
            <Table
              dataSource={recentStockIns}
              columns={stockInColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近出库单" loading={loading}>
            <Table
              dataSource={recentStockOuts}
              columns={stockInColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col span={24}>
          <Card title="库存概览" loading={loading}>
            <Table
              dataSource={inventoryList}
              columns={inventoryColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
