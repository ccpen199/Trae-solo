import { useEffect, useRef, useState } from 'react';
import { Card, Spin, Row, Col, Statistic, Tag, Modal, Button, App as AntdApp, Empty } from 'antd';
import { EnvironmentOutlined, ReloadOutlined } from '@ant-design/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DeviceMapItem } from '../services/investorApi';
import DeviceStatusBadge from '../components/DeviceStatusBadge';
import { useNavigate } from 'react-router-dom';

const mockDevices: DeviceMapItem[] = [
  {
    id: 'DEV001',
    name: '浦东商业中心-1号机组',
    lat: 31.2304,
    lng: 121.4737,
    status: 'online',
    projectName: '上海浦东新区商业综合体供水项目',
    lastHeartbeat: '2分钟前',
    temperature: 28.5,
    todayYield: 18560,
  },
  {
    id: 'DEV002',
    name: '浦东商业中心-2号机组',
    lat: 31.2315,
    lng: 121.4752,
    status: 'online',
    projectName: '上海浦东新区商业综合体供水项目',
    lastHeartbeat: '1分钟前',
    temperature: 27.8,
    todayYield: 17230,
  },
  {
    id: 'DEV003',
    name: '朝阳写字楼-A栋',
    lat: 39.9042,
    lng: 116.4074,
    status: 'fault',
    projectName: '北京朝阳区写字楼群供水改造',
    lastHeartbeat: '15分钟前',
    temperature: 42.3,
    todayYield: 5600,
  },
  {
    id: 'DEV004',
    name: '朝阳写字楼-B栋',
    lat: 39.9056,
    lng: 116.4088,
    status: 'online',
    projectName: '北京朝阳区写字楼群供水改造',
    lastHeartbeat: '30秒前',
    temperature: 26.2,
    todayYield: 8920,
  },
  {
    id: 'DEV005',
    name: '南山科技园-A区',
    lat: 22.5431,
    lng: 114.0579,
    status: 'online',
    projectName: '深圳南山区科技园供水系统',
    lastHeartbeat: '1分钟前',
    temperature: 30.1,
    todayYield: 22450,
  },
  {
    id: 'DEV006',
    name: '南山科技园-B区',
    lat: 22.5445,
    lng: 114.0595,
    status: 'online',
    projectName: '深圳南山区科技园供水系统',
    lastHeartbeat: '45秒前',
    temperature: 29.8,
    todayYield: 19800,
  },
  {
    id: 'DEV007',
    name: '西湖酒店-主楼',
    lat: 30.2741,
    lng: 120.1551,
    status: 'offline',
    projectName: '杭州西湖区酒店供水工程',
    lastHeartbeat: '2小时前',
    temperature: 0,
    todayYield: 0,
  },
  {
    id: 'DEV008',
    name: '天河医院-住院部',
    lat: 23.1291,
    lng: 113.2644,
    status: 'online',
    projectName: '广州天河区医院供水项目',
    lastHeartbeat: '2分钟前',
    temperature: 28.0,
    todayYield: 15680,
  },
  {
    id: 'DEV009',
    name: '高新区-厂房A',
    lat: 30.5728,
    lng: 104.0668,
    status: 'fault',
    projectName: '成都高新区工业园区供水',
    lastHeartbeat: '30分钟前',
    temperature: 55.2,
    todayYield: 1200,
  },
  {
    id: 'DEV010',
    name: '浦东商业中心-3号机组',
    lat: 31.2295,
    lng: 121.4725,
    status: 'online',
    projectName: '上海浦东新区商业综合体供水项目',
    lastHeartbeat: '1分钟前',
    temperature: 27.5,
    todayYield: 16890,
  },
];

const DeviceMap = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<DeviceMapItem[]>(mockDevices);
  const [selectedDevice, setSelectedDevice] = useState<DeviceMapItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setDevices(mockDevices);
      } catch {
        message.error('获取设备地图数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [message]);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([32.0, 110.0], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(mapInstance.current);
    }
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const statusColors = {
      online: '#52c41a',
      offline: '#8c8c8c',
      fault: '#ff4d4f',
    };
    const bounds: L.LatLngTuple[] = [];
    devices.forEach((device) => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background: ${statusColors[device.status]};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: white;
            ${device.status === 'online' ? 'animation: pulse 2s infinite;' : ''}
          ">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([device.lat, device.lng], { icon })
        .addTo(mapInstance.current!)
        .on('click', () => {
          setSelectedDevice(device);
          setModalOpen(true);
        });
      markersRef.current.push(marker);
      bounds.push([device.lat, device.lng]);
    });
    if (bounds.length > 0) {
      mapInstance.current.fitBounds(L.latLngBounds(bounds), { padding: [60, 60] });
    }
  }, [devices]);

  const stats = {
    online: devices.filter((d) => d.status === 'online').length,
    offline: devices.filter((d) => d.status === 'offline').length,
    fault: devices.filter((d) => d.status === 'fault').length,
    total: devices.length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="设备总数"
              value={stats.total}
              suffix="台"
              prefix={<EnvironmentOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1f1f1f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="在线设备"
              value={stats.online}
              suffix="台"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="故障设备"
              value={stats.fault}
              suffix="台"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="离线设备"
              value={stats.offline}
              suffix="台"
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span className="card-title">设备集群分布地图</span>}
        bordered={false}
        style={{ borderRadius: 12 }}
        extra={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <Tag color="green">在线</Tag>
              <Tag color="red">故障</Tag>
              <Tag color="default">离线</Tag>
            </div>
            <Button icon={<ReloadOutlined />} onClick={() => message.success('地图已刷新')}>
              刷新
            </Button>
          </div>
        }
      >
        <Spin spinning={loading}>
          <div ref={mapRef} style={{ width: '100%', height: 560, borderRadius: 8, overflow: 'hidden' }} />
        </Spin>
        {devices.length === 0 && !loading && (
          <Empty description="暂无设备数据" />
        )}
      </Card>

      <Modal
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>设备详情</span>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setModalOpen(false)}>
            关闭
          </Button>,
          <Button
            key="detail"
            type="primary"
            onClick={() => {
              if (selectedDevice) {
                navigate('/device/' + selectedDevice.id);
                setModalOpen(false);
              }
            }}
          >
            查看完整详情
          </Button>,
        ]}
        width={520}
      >
        {selectedDevice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                padding: 16,
                background: 'linear-gradient(135deg, rgba(24,144,255,0.06), rgba(114,46,209,0.06))',
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1f1f1f', marginBottom: 4 }}>
                    {selectedDevice.name}
                  </div>
                  <div style={{ fontSize: 13, color: '#8c8c8c' }}>
                    编号: {selectedDevice.id}
                  </div>
                </div>
                <DeviceStatusBadge status={selectedDevice.status} />
              </div>
              <div style={{ fontSize: 13, color: '#595959' }}>
                <EnvironmentOutlined style={{ marginRight: 4 }} />
                {selectedDevice.projectName}
              </div>
            </div>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ padding: 12, background: '#fafafa', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>温度</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: selectedDevice.temperature > 40 ? '#ff4d4f' : '#1f1f1f' }}>
                    {selectedDevice.temperature > 0 ? selectedDevice.temperature.toFixed(1) : '--'}
                    <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 2 }}>°C</span>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ padding: 12, background: '#fafafa', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>今日产水</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#1890ff' }}>
                    {(selectedDevice.todayYield / 1000).toFixed(1)}
                    <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 2 }}>m³</span>
                  </div>
                </div>
              </Col>
            </Row>

            <div style={{ padding: 12, background: '#fafafa', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>最后心跳</div>
              <div style={{ fontSize: 14, color: '#1f1f1f' }}>{selectedDevice.lastHeartbeat}</div>
            </div>
          </div>
        )}
      </Modal>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 2px 8px rgba(82,196,26,0.4); }
          50% { box-shadow: 0 2px 20px rgba(82,196,26,0.8); }
          100% { box-shadow: 0 2px 8px rgba(82,196,26,0.4); }
        }
      `}</style>
    </div>
  );
};

export default DeviceMap;
