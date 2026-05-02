import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Select, Modal, Form, message, Space, Input } from 'antd';
import { STATUS_MAP } from '../../utils/constants';
import api from '../../services/api';
import type { TableProps } from 'antd';

interface Package {
  id: string;
  trackingNumber: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  status: string;
  areaId?: string;
  areaName?: string;
  courierId?: string;
  courierName?: string;
  pickupCode?: string;
  createdAt: string;
}

interface Area {
  id: string;
  name: string;
  code: string;
}

interface Courier {
  id: string;
  name: string;
}

export default function PackageManagePage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [assignAreaModal, setAssignAreaModal] = useState(false);
  const [assignCourierModal, setAssignCourierModal] = useState(false);
  const [form] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      
      const response = await api.get('/packages/search', { params });
      let data = response.data;
      
      if (searchText) {
        data = data.filter((p: Package) => 
          p.trackingNumber.includes(searchText) ||
          p.receiverName.includes(searchText) ||
          p.receiverPhone.includes(searchText)
        );
      }
      
      setPackages(data);
    } catch (error) {
      message.error('获取包裹列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const response = await api.get('/packages/areas');
      setAreas(response.data);
    } catch (error) {
      message.error('获取区域列表失败');
    }
  };

  const fetchCouriers = async () => {
    try {
      const response = await api.get('/packages/couriers');
      setCouriers(response.data);
    } catch (error) {
      message.error('获取快递员列表失败');
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchAreas();
    fetchCouriers();
  }, [statusFilter, searchText]);

  const handleAssignArea = async (values: { areaId: string }) => {
    if (!selectedPackage) return;
    try {
      await api.post('/packages/assign-area', {
        packageId: selectedPackage.id,
        areaId: values.areaId
      });
      message.success('分配区域成功');
      setAssignAreaModal(false);
      form.resetFields();
      fetchPackages();
    } catch (error: any) {
      message.error(error.response?.data?.error || '分配失败');
    }
  };

  const handleAssignCourier = async (values: { courierId: string }) => {
    if (!selectedPackage) return;
    try {
      await api.post('/packages/assign-courier', {
        packageId: selectedPackage.id,
        courierId: values.courierId
      });
      message.success('分配快递员成功');
      setAssignCourierModal(false);
      form.resetFields();
      fetchPackages();
    } catch (error: any) {
      message.error(error.response?.data?.error || '分配失败');
    }
  };

  const columns: TableProps<Package>['columns'] = [
    {
      title: '运单号',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      width: 160,
      fixed: 'left',
    },
    {
      title: '收件人',
      key: 'receiver',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.receiverName}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.receiverPhone}</div>
        </div>
      ),
    },
    {
      title: '收件地址',
      dataIndex: 'receiverAddress',
      key: 'receiverAddress',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const info = STATUS_MAP[status] || { label: status, color: 'default' };
        return <Tag color={info.color as any}>{info.label}</Tag>;
      },
    },
    {
      title: '区域',
      dataIndex: 'areaName',
      key: 'areaName',
      width: 80,
      render: (name) => name || <Tag color="default">未分配</Tag>,
    },
    {
      title: '快递员',
      dataIndex: 'courierName',
      key: 'courierName',
      width: 80,
      render: (name) => name || <Tag color="default">未分配</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const actions = [];
        
        if (['in_station'].includes(record.status)) {
          actions.push(
            <Button
              type="link"
              size="small"
              onClick={() => {
                setSelectedPackage(record);
                setAssignAreaModal(true);
              }}
            >
              分配区域
            </Button>
          );
        }
        
        if (['sorted', 'in_station'].includes(record.status)) {
          actions.push(
            <Button
              type="link"
              size="small"
              onClick={() => {
                setSelectedPackage(record);
                setAssignCourierModal(true);
              }}
            >
              分配快递员
            </Button>
          );
        }
        
        return <Space>{actions}</Space>;
      },
    },
  ];

  return (
    <div>
      <Card
        title="包裹管理"
        extra={
          <Space>
            <Input.Search
              placeholder="搜索运单号/收件人/电话"
              style={{ width: 250 }}
              onSearch={(value) => setSearchText(value)}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              style={{ width: 150 }}
              placeholder="状态筛选"
              allowClear
              value={statusFilter || undefined}
              onChange={setStatusFilter}
            >
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val.label}</Select.Option>
              ))}
            </Select>
            <Button onClick={fetchPackages}>刷新</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={packages}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="分配区域"
        open={assignAreaModal}
        onCancel={() => setAssignAreaModal(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAssignArea}>
          <Form.Item
            name="areaId"
            label="选择区域"
            rules={[{ required: true, message: '请选择区域' }]}
          >
            <Select placeholder="请选择区域">
              {areas.map((area) => (
                <Select.Option key={area.id} value={area.id}>
                  {area.code} - {area.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认分配
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分配快递员"
        open={assignCourierModal}
        onCancel={() => setAssignCourierModal(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAssignCourier}>
          <Form.Item
            name="courierId"
            label="选择快递员"
            rules={[{ required: true, message: '请选择快递员' }]}
          >
            <Select placeholder="请选择快递员">
              {couriers.map((courier) => (
                <Select.Option key={courier.id} value={courier.id}>
                  {courier.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认分配
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
