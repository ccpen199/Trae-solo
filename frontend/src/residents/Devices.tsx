import React, { useEffect, useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Space,
  Typography,
  Input,
  Select,
  Radio,
  Tag,
  Pagination,
  Skeleton,
  Empty,
  Button,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { deviceApi } from '@/api';
import type { Device, DeviceType, DeviceStatus, WorkingStatus } from '@/types';
import {
  DEVICE_TYPE_MAP,
  DEVICE_TYPE_ICONS,
  DEVICE_TYPE_COLORS,
  DEVICE_STATUS_MAP,
  WORKING_STATUS_MAP,
} from '@/utils/constants';
import DeviceCard from '@/components/DeviceCard';
import StatusBadge from '@/components/StatusBadge';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Group: RadioGroup, Button: RadioButton } = Radio;

interface FilterState {
  deviceType: DeviceType | 'all';
  deviceStatus: DeviceStatus | 'all';
  workingStatus: WorkingStatus | 'all';
  keyword: string;
}

const ResidentDevices: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useAppStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  const [filters, setFilters] = useState<FilterState>({
    deviceType: 'all',
    deviceStatus: 'all',
    workingStatus: 'all',
    keyword: '',
  });

  useEffect(() => {
    loadDevices();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };

      if (filters.deviceType !== 'all') {
        params.deviceType = filters.deviceType;
      }
      if (filters.deviceStatus !== 'all') {
        params.status = filters.deviceStatus;
      }
      if (filters.workingStatus !== 'all') {
        params.workingStatus = filters.workingStatus;
      }
      if (filters.keyword) {
        params.keyword = filters.keyword;
      }

      const response = await deviceApi.getDevices(params);
      if (response.success) {
        setDevices(response.data?.list || []);
        setPagination((prev) => ({
          ...prev,
          total: response.data?.pagination?.total || 0,
        }));
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || '加载设备列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceClick = (device: Device) => {
    navigate(`/resident/devices/${device._id}`);
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleSearch = (value: string) => {
    handleFilterChange('keyword', value);
  };

  const handleReset = () => {
    setFilters({
      deviceType: 'all',
      deviceStatus: 'all',
      workingStatus: 'all',
      keyword: '',
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination((prev) => ({ ...prev, current: page, pageSize }));
  };

  const deviceTypeOptions = useMemo(
    () => [
      { value: 'all', label: '全部' },
      ...Object.entries(DEVICE_TYPE_MAP).map(([value, label]) => ({
        value: value as DeviceType,
        label,
        icon: DEVICE_TYPE_ICONS[value as DeviceType],
        color: DEVICE_TYPE_COLORS[value as DeviceType],
      })),
    ],
    []
  );

  const deviceStatusOptions = useMemo(
    () => [
      { value: 'all', label: '全部状态' },
      ...Object.entries(DEVICE_STATUS_MAP).map(([value, label]) => ({
        value: value as DeviceStatus,
        label,
      })),
    ],
    []
  );

  const workingStatusOptions = useMemo(
    () => [
      { value: 'all', label: '全部' },
      ...Object.entries(WORKING_STATUS_MAP).map(([value, label]) => ({
        value: value as WorkingStatus,
        label,
      })),
    ],
    []
  );

  const stats = useMemo(() => {
    const typeStats: Record<string, number> = {};
    const statusStats: Record<string, number> = {};
    
    devices.forEach((device) => {
      typeStats[device.deviceType] = (typeStats[device.deviceType] || 0) + 1;
      statusStats[device.workingStatus] = (statusStats[device.workingStatus] || 0) + 1;
    });

    return { typeStats, statusStats };
  }, [devices]);

  return (
    <div className="page-container">
      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Title level={4} style={{ margin: 0 }}>设备列表</Title>
            <Space>
              <Button
                icon={<QrcodeOutlined />}
                type="primary"
                onClick={() => navigate('/resident/scan')}
              >
                扫码启动
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadDevices}>
                刷新
              </Button>
            </Space>
          </Space>

          <Space wrap size="middle" style={{ width: '100%' }}>
            <Search
              placeholder="搜索设备名称、编号"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              style={{ width: 320 }}
            />

            <Space align="center">
              <FilterOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary">设备类型：</Text>
              <RadioGroup
                value={filters.deviceType}
                onChange={(e) => handleFilterChange('deviceType', e.target.value)}
                size="large"
              >
                {deviceTypeOptions.map((option) => (
                  <RadioButton key={option.value} value={option.value}>
                    {option.icon && <span style={{ marginRight: 4 }}>{option.icon}</span>}
                    {option.label}
                    {stats.typeStats[option.value] !== undefined && option.value !== 'all' && (
                      <Tag color="blue" style={{ marginLeft: 4 }}>
                        {stats.typeStats[option.value]}
                      </Tag>
                    )}
                  </RadioButton>
                ))}
              </RadioGroup>
            </Space>

            <Space align="center">
              <Text type="secondary">设备状态：</Text>
              <Select
                value={filters.deviceStatus}
                onChange={(value) => handleFilterChange('deviceStatus', value)}
                size="large"
                style={{ width: 140 }}
              >
                {deviceStatusOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Space>

            <Space align="center">
              <Text type="secondary">运行状态：</Text>
              <Select
                value={filters.workingStatus}
                onChange={(value) => handleFilterChange('workingStatus', value)}
                size="large"
                style={{ width: 140 }}
              >
                {workingStatusOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Space>

            {(filters.deviceType !== 'all' ||
              filters.deviceStatus !== 'all' ||
              filters.workingStatus !== 'all' ||
              filters.keyword) && (
              <Button onClick={handleReset}>重置筛选</Button>
            )}
          </Space>

          <Space size="middle">
            {Object.entries(WORKING_STATUS_MAP).map(([status, label]) => (
              <Space key={status} align="center" size={4}>
                <StatusBadge type="working" status={status} />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {stats.statusStats[status] || 0} 台
                </Text>
              </Space>
            ))}
          </Space>
        </Space>
      </Card>

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : devices.length > 0 ? (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {devices.map((device) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={device._id}>
                <DeviceCard device={device} onClick={handleDeviceClick} />
              </Col>
            ))}
          </Row>

          <Card className="card-shadow">
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                showSizeChanger
                showQuickJumper
                showTotal={(total) => `共 ${total} 台设备`}
                onChange={handlePageChange}
                onShowSizeChange={handlePageChange}
              />
            </div>
          </Card>
        </>
      ) : (
        <Card className="card-shadow">
          <Empty
            description="暂无符合条件的设备"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={handleReset}>
              重置筛选条件
            </Button>
          </Empty>
        </Card>
      )}
    </div>
  );
};

export default ResidentDevices;
