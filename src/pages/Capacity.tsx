import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tabs, Tag, Button, Space, Card, Modal, Rate, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { capacityApi, type CarrierListItem, type DriverListItem, type VehicleListItem } from '../api/capacity';
import { maskIdCard, maskPhone } from '../utils/format';
import type { AuthStatus } from '../../shared/types';
import type { ColumnsType } from 'antd/es/table';

const authStatusMap: Record<AuthStatus, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'warning' },
  approved: { label: '已认证', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
};

const Capacity: React.FC = () => {
  const [activeTab, setActiveTab] = useState('carriers');

  const [carriers, setCarriers] = useState<CarrierListItem[]>([]);
  const [carrierLoading, setCarrierLoading] = useState(false);
  const [carrierTotal, setCarrierTotal] = useState(0);
  const [carrierPage, setCarrierPage] = useState(1);
  const [carrierPageSize, setCarrierPageSize] = useState(10);

  const [drivers, setDrivers] = useState<DriverListItem[]>([]);
  const [driverLoading, setDriverLoading] = useState(false);
  const [driverTotal, setDriverTotal] = useState(0);
  const [driverPage, setDriverPage] = useState(1);
  const [driverPageSize, setDriverPageSize] = useState(10);

  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleTotal, setVehicleTotal] = useState(0);
  const [vehiclePage, setVehiclePage] = useState(1);
  const [vehiclePageSize, setVehiclePageSize] = useState(10);

  const [updating, setUpdating] = useState(false);

  const fetchCarriers = useCallback(async () => {
    setCarrierLoading(true);
    try {
      const res = await capacityApi.getCarriers({ page: carrierPage, pageSize: carrierPageSize });
      setCarriers(res.data.list);
      setCarrierTotal(res.data.total);
    } catch {
      setCarriers([]);
      setCarrierTotal(0);
    } finally {
      setCarrierLoading(false);
    }
  }, [carrierPage, carrierPageSize]);

  const fetchDrivers = useCallback(async () => {
    setDriverLoading(true);
    try {
      const res = await capacityApi.getDrivers({ page: driverPage, pageSize: driverPageSize });
      setDrivers(res.data.list);
      setDriverTotal(res.data.total);
    } catch {
      setDrivers([]);
      setDriverTotal(0);
    } finally {
      setDriverLoading(false);
    }
  }, [driverPage, driverPageSize]);

  const fetchVehicles = useCallback(async () => {
    setVehicleLoading(true);
    try {
      const res = await capacityApi.getVehicles({ page: vehiclePage, pageSize: vehiclePageSize });
      setVehicles(res.data.list);
      setVehicleTotal(res.data.total);
    } catch {
      setVehicles([]);
      setVehicleTotal(0);
    } finally {
      setVehicleLoading(false);
    }
  }, [vehiclePage, vehiclePageSize]);

  useEffect(() => {
    if (activeTab === 'carriers') fetchCarriers();
    else if (activeTab === 'drivers') fetchDrivers();
    else fetchVehicles();
  }, [activeTab, fetchCarriers, fetchDrivers, fetchVehicles]);

  const handleAuthAction = async (
    type: 'carrier' | 'driver' | 'vehicle',
    id: string,
    authStatus: AuthStatus
  ) => {
    setUpdating(true);
    try {
      if (type === 'carrier') {
        await capacityApi.updateCarrier(id, { authStatus } as Partial<CarrierListItem>);
      } else if (type === 'driver') {
        await capacityApi.updateDriver(id, { authStatus });
      } else {
        await capacityApi.updateVehicle(id, { authStatus });
      }
      message.success(authStatus === 'approved' ? '审核通过' : '已驳回');
      if (activeTab === 'carriers') fetchCarriers();
      else if (activeTab === 'drivers') fetchDrivers();
      else fetchVehicles();
    } catch {
      message.error('操作失败');
    } finally {
      setUpdating(false);
    }
  };

  const carrierColumns: ColumnsType<CarrierListItem> = [
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 180,
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: '营业执照',
      dataIndex: 'businessLicense',
      key: 'businessLicense',
      width: 160,
      ellipsis: true,
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 130,
      render: (val: string) => maskPhone(val),
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 130,
      render: (val: number) => <Rate disabled value={val} allowHalf style={{ fontSize: 14 }} />,
    },
    {
      title: '白名单',
      dataIndex: 'whitelist',
      key: 'whitelist',
      width: 90,
      render: (val: boolean) => (
        <Tag color={val ? 'success' : 'default'}>{val ? '已加入' : '未加入'}</Tag>
      ),
    },
    {
      title: '认证状态',
      dataIndex: 'authStatus',
      key: 'authStatus',
      width: 100,
      render: (status: AuthStatus) => {
        const info = authStatusMap[status];
        return <Tag color={info?.color}>{info?.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: unknown, record: CarrierListItem) => (
        <Space size="small">
          {record.authStatus === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={updating}
                onClick={() => handleAuthAction('carrier', record.id, 'approved')}
                className="text-success-500"
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                loading={updating}
                onClick={() => handleAuthAction('carrier', record.id, 'rejected')}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const driverColumns: ColumnsType<DriverListItem> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (val: string) => maskPhone(val),
    },
    {
      title: '身份证',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 180,
      render: (val: string) => maskIdCard(val),
    },
    {
      title: '驾驶证',
      dataIndex: 'driverLicense',
      key: 'driverLicense',
      width: 140,
      ellipsis: true,
    },
    {
      title: '驾照类型',
      dataIndex: 'driverLicenseType',
      key: 'driverLicenseType',
      width: 100,
    },
    {
      title: '认证状态',
      dataIndex: 'authStatus',
      key: 'authStatus',
      width: 100,
      render: (status: AuthStatus) => {
        const info = authStatusMap[status];
        return <Tag color={info?.color}>{info?.label}</Tag>;
      },
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 130,
      render: (val: number) => <Rate disabled value={val} allowHalf style={{ fontSize: 14 }} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: unknown, record: DriverListItem) => (
        <Space size="small">
          {record.authStatus === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={updating}
                onClick={() => handleAuthAction('driver', record.id, 'approved')}
                className="text-success-500"
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                loading={updating}
                onClick={() => handleAuthAction('driver', record.id, 'rejected')}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const vehicleColumns: ColumnsType<VehicleListItem> = [
    {
      title: '车牌号',
      dataIndex: 'plateNo',
      key: 'plateNo',
      width: 110,
      render: (text: string) => <span className="font-medium text-primary-500">{text}</span>,
    },
    {
      title: '车型',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      width: 100,
    },
    {
      title: '车长(米)',
      dataIndex: 'vehicleLength',
      key: 'vehicleLength',
      width: 100,
      render: (val: number) => val.toFixed(1),
    },
    {
      title: '载重(吨)',
      dataIndex: 'maxLoad',
      key: 'maxLoad',
      width: 100,
      render: (val: number) => val.toFixed(1),
    },
    {
      title: '容积(m³)',
      dataIndex: 'maxVolume',
      key: 'maxVolume',
      width: 100,
      render: (val: number) => val?.toFixed(1) ?? '-',
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 80,
    },
    {
      title: '认证状态',
      dataIndex: 'authStatus',
      key: 'authStatus',
      width: 100,
      render: (status: AuthStatus) => {
        const info = authStatusMap[status];
        return <Tag color={info?.color}>{info?.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: unknown, record: VehicleListItem) => (
        <Space size="small">
          {record.authStatus === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={updating}
                onClick={() => handleAuthAction('vehicle', record.id, 'approved')}
                className="text-success-500"
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                loading={updating}
                onClick={() => handleAuthAction('vehicle', record.id, 'rejected')}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card variant="borderless" className="card-shadow">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'carriers', label: '承运商' },
            { key: 'drivers', label: '司机' },
            { key: 'vehicles', label: '车辆' },
          ]}
        />

        {activeTab === 'carriers' && (
          <Table
            columns={carrierColumns}
            dataSource={carriers}
            rowKey="id"
            loading={carrierLoading}
            scroll={{ x: 1200 }}
            pagination={{
              current: carrierPage,
              pageSize: carrierPageSize,
              total: carrierTotal,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => {
                setCarrierPage(p);
                setCarrierPageSize(ps);
              },
            }}
          />
        )}

        {activeTab === 'drivers' && (
          <Table
            columns={driverColumns}
            dataSource={drivers}
            rowKey="id"
            loading={driverLoading}
            scroll={{ x: 1200 }}
            pagination={{
              current: driverPage,
              pageSize: driverPageSize,
              total: driverTotal,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => {
                setDriverPage(p);
                setDriverPageSize(ps);
              },
            }}
          />
        )}

        {activeTab === 'vehicles' && (
          <Table
            columns={vehicleColumns}
            dataSource={vehicles}
            rowKey="id"
            loading={vehicleLoading}
            scroll={{ x: 1100 }}
            pagination={{
              current: vehiclePage,
              pageSize: vehiclePageSize,
              total: vehicleTotal,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => {
                setVehiclePage(p);
                setVehiclePageSize(ps);
              },
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default Capacity;
