import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  List,
  Space,
  Typography,
  Button,
  Tag,
  Input,
  Modal,
  Skeleton,
  Empty,
  Tooltip,
  Alert,
  Divider,
  Switch,
} from 'antd';
import {
  QrcodeOutlined,
  BulbOutlined as FlashlightOutlined,
  PictureOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ScanOutlined,
  EnterOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { deviceApi } from '@/api';
import type { Device } from '@/types';
import { DEVICE_TYPE_MAP, DEVICE_TYPE_COLORS, DEVICE_TYPE_ICONS } from '@/utils/constants';
import { formatDateTime, formatRelativeTime } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';

const { Title, Text } = Typography;

interface ScanHistoryItem {
  id: string;
  deviceCode: string;
  device?: Device;
  scanTime: string;
  success: boolean;
  message?: string;
}

const ResidentScan: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [deviceCode, setDeviceCode] = useState('');
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [foundDevice, setFoundDevice] = useState<Device | null>(null);
  const [scanResultVisible, setScanResultVisible] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    loadScanHistory();
    if (scanning) {
      startScanningAnimation();
    }
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (scanning) {
      startScanningAnimation();
    } else {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    }
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [scanning]);

  const startScanningAnimation = () => {
    setScanProgress(0);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    scanIntervalRef.current = window.setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 2;
      });
    }, 50);
  };

  const loadScanHistory = () => {
    try {
      const history = localStorage.getItem('scanHistory');
      if (history) {
        setScanHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
  };

  const saveScanHistory = (item: ScanHistoryItem) => {
    try {
      const newHistory = [item, ...scanHistory].slice(0, 20);
      setScanHistory(newHistory);
      localStorage.setItem('scanHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save scan history:', error);
    }
  };

  const handleScanSuccess = async (deviceCode: string) => {
    try {
      setLoading(true);
      const response = await deviceApi.getDeviceByCode(deviceCode);
      
      if (response.success && response.data) {
        const device = response.data;
        setFoundDevice(device);
        setScanResultVisible(true);
        
        saveScanHistory({
          id: Date.now().toString(),
          deviceCode,
          device,
          scanTime: new Date().toISOString(),
          success: true,
        });

        showNotification('success', `扫描成功，已找到设备: ${device.name}`);
      }
    } catch (error: any) {
      setFoundDevice(null);
      setScanResultVisible(true);
      
      saveScanHistory({
        id: Date.now().toString(),
        deviceCode,
        scanTime: new Date().toISOString(),
        success: false,
        message: error.response?.data?.message || '未找到该设备',
      });

      showNotification('error', error.response?.data?.message || '未找到该设备');
    } finally {
      setLoading(false);
    }
  };

  const simulateScan = () => {
    const mockCode = 'DEV' + Math.floor(Math.random() * 1000).toString().padStart(4, '0');
    setScanning(false);
    handleScanSuccess(mockCode);
  };

  const handleManualInput = async () => {
    if (!deviceCode.trim()) {
      showNotification('warning', '请输入设备编号');
      return;
    }
    setManualModalVisible(false);
    handleScanSuccess(deviceCode.trim());
    setDeviceCode('');
  };

  const handleGoToDevice = () => {
    if (foundDevice) {
      navigate(`/resident/devices/${foundDevice._id}`);
    }
  };

  const handleHistoryClick = (item: ScanHistoryItem) => {
    if (item.success && item.device) {
      navigate(`/resident/devices/${item.device._id}`);
    } else {
      showNotification('info', '该设备未找到，请重新扫描');
    }
  };

  const clearHistory = () => {
    Modal.confirm({
      title: '确认清除',
      content: '确定要清除所有扫码历史记录吗？',
      okText: '确认清除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setScanHistory([]);
        localStorage.removeItem('scanHistory');
        showNotification('success', '历史记录已清除');
      },
    });
  };

  const toggleFlashlight = () => {
    setFlashlightOn(!flashlightOn);
    showNotification('info', flashlightOn ? '闪光灯已关闭' : '闪光灯已开启');
  };

  const handleAlbumSelect = () => {
    showNotification('info', '请选择包含设备二维码的图片');
  };

  const rescan = () => {
    setScanResultVisible(false);
    setFoundDevice(null);
    setScanning(true);
  };

  return (
    <div className="page-container">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card
          className="card-shadow"
          style={{
            background: scanning ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
            color: scanning ? '#fff' : '#262626',
            transition: 'all 0.5s ease',
          }}
          bodyStyle={{ padding: '32px 24px' }}
        >
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              style={{
                background: scanning ? 'rgba(255,255,255,0.2)' : '#f5f5f5',
                color: scanning ? '#fff' : '#262626',
                border: 'none',
              }}
            />
            <Title
              level={4}
              style={{
                margin: 0,
                color: scanning ? '#fff' : '#262626',
              }}
            >
              扫码启动设备
            </Title>
            <div style={{ width: 40 }} />
          </Space>

          <div className="scan-container">
            <div
              className="scan-frame"
              style={{
                borderColor: scanning ? '#1890ff' : '#52c41a',
                background: scanning
                  ? 'linear-gradient(135deg, rgba(24,144,255,0.1) 0%, rgba(24,144,255,0.2) 100%)'
                  : 'linear-gradient(135deg, rgba(82,196,26,0.1) 0%, rgba(82,196,26,0.2) 100%)',
              }}
            >
              {scanning ? (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      top: `${scanProgress}%`,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent, #1890ff, transparent)',
                      boxShadow: '0 0 10px #1890ff',
                      transition: 'top 0.05s linear',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}
                  >
                    <ScanOutlined
                      style={{
                        fontSize: '64px',
                        color: 'rgba(24,144,255,0.6)',
                        animation: 'pulse 2s infinite',
                      }}
                    />
                    <Text
                      style={{
                        display: 'block',
                        marginTop: 16,
                        color: scanning ? 'rgba(255,255,255,0.85)' : '#8c8c8c',
                      }}
                    >
                      将二维码放入框内
                    </Text>
                  </div>
                </>
              ) : foundDevice ? (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <CheckCircleOutlined
                    style={{
                      fontSize: '64px',
                      color: '#52c41a',
                    }}
                  />
                  <Text
                    style={{
                      display: 'block',
                      marginTop: 16,
                      color: '#52c41a',
                      fontWeight: 600,
                    }}
                  >
                    扫描成功
                  </Text>
                </div>
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <ExclamationCircleOutlined
                    style={{
                      fontSize: '64px',
                      color: '#ff4d4f',
                    }}
                  />
                  <Text
                    style={{
                      display: 'block',
                      marginTop: 16,
                      color: '#ff4d4f',
                      fontWeight: 600,
                    }}
                  >
                    未找到设备
                  </Text>
                </div>
              )}

              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  width: 24,
                  height: 24,
                  borderTop: `3px solid ${scanning ? '#1890ff' : '#52c41a'}`,
                  borderLeft: `3px solid ${scanning ? '#1890ff' : '#52c41a'}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 24,
                  height: 24,
                  borderTop: `3px solid ${scanning ? '#1890ff' : '#52c41a'}`,
                  borderRight: `3px solid ${scanning ? '#1890ff' : '#52c41a'}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  width: 24,
                  height: 24,
                  borderBottom: `3px solid ${scanning ? '#1890ff' : '#52c41a'}`,
                  borderLeft: `3px solid ${scanning ? '#1890ff' : '#52c41a'}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  width: 24,
                  height: 24,
                  borderBottom: `3px solid ${scanning ? '#1890ff' : '#52c41a'}`,
                  borderRight: `3px solid ${scanning ? '#1890ff' : '#52c41a'}`,
                }}
              />
            </div>

            <Space align="center" style={{ width: '100%', justifyContent: 'space-around' }}>
              <Tooltip title={flashlightOn ? '关闭闪光灯' : '开启闪光灯'}>
                <Button
                  type="text"
                  icon={<FlashlightOutlined />}
                  onClick={toggleFlashlight}
                  style={{
                    color: scanning ? '#fff' : flashlightOn ? '#faad14' : '#8c8c8c',
                    fontSize: '24px',
                    height: 'auto',
                    padding: '8px 16px',
                  }}
                >
                  <div style={{ fontSize: '12px', marginTop: 4 }}>
                    {flashlightOn ? '已开启' : '闪光灯'}
                  </div>
                </Button>
              </Tooltip>

              <Tooltip title="从相册选择">
                <Button
                  type="text"
                  icon={<PictureOutlined />}
                  onClick={handleAlbumSelect}
                  style={{
                    color: scanning ? '#fff' : '#8c8c8c',
                    fontSize: '24px',
                    height: 'auto',
                    padding: '8px 16px',
                  }}
                >
                  <div style={{ fontSize: '12px', marginTop: 4 }}>相册</div>
                </Button>
              </Tooltip>

              <Tooltip title="手动输入编号">
                <Button
                  type="text"
                  icon={<EnterOutlined />}
                  onClick={() => setManualModalVisible(true)}
                  style={{
                    color: scanning ? '#fff' : '#8c8c8c',
                    fontSize: '24px',
                    height: 'auto',
                    padding: '8px 16px',
                  }}
                >
                  <div style={{ fontSize: '12px', marginTop: 4 }}>手动输入</div>
                </Button>
              </Tooltip>
            </Space>

            {scanning && (
              <Button
                type="primary"
                block
                size="large"
                onClick={simulateScan}
                style={{
                  marginTop: 16,
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                }}
              >
                模拟扫描（演示）
              </Button>
            )}
          </div>
        </Card>

        {scanResultVisible && foundDevice && (
          <Card
            className="card-shadow"
            style={{
              borderLeft: `4px solid ${DEVICE_TYPE_COLORS[foundDevice.deviceType] || '#1890ff'}`,
            }}
            title={
              <Space align="center">
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Title level={5} style={{ margin: 0 }}>扫描结果</Title>
              </Space>
            }
            extra={
              <Button icon={<ReloadOutlined />} onClick={rescan}>
                重新扫描
              </Button>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space align="center" size={16}>
                <div
                  style={{
                    fontSize: '48px',
                    background: `${DEVICE_TYPE_COLORS[foundDevice.deviceType] || '#1890ff'}15`,
                    borderRadius: '12px',
                    padding: '12px',
                  }}
                >
                  {DEVICE_TYPE_ICONS[foundDevice.deviceType]}
                </div>
                <div style={{ flex: 1 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {foundDevice.name}
                  </Title>
                  <Space size="middle" style={{ marginTop: 4 }}>
                    <Tag color="blue">
                      {DEVICE_TYPE_MAP[foundDevice.deviceType]}
                    </Tag>
                    <Text type="secondary">{foundDevice.deviceCode}</Text>
                    <StatusBadge type="device" status={foundDevice.status} />
                    <StatusBadge type="working" status={foundDevice.workingStatus} />
                  </Space>
                </div>
              </Space>

              {foundDevice.location && (
                <Space align="center">
                  <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
                  <Text type="secondary">
                    {foundDevice.location.building} {foundDevice.location.floor}{foundDevice.location.room}
                  </Text>
                </Space>
              )}

              <Alert
                type="info"
                showIcon
                message={
                  foundDevice.status === 'online' && foundDevice.workingStatus === 'idle'
                    ? '设备状态正常，可以立即使用'
                    : foundDevice.status !== 'online'
                    ? '设备当前离线，请稍后再试'
                    : '设备正在使用中，请等待或选择其他设备'
                }
              />

              <Button
                type="primary"
                size="large"
                block
                onClick={handleGoToDevice}
                disabled={foundDevice.status !== 'online'}
              >
                {foundDevice.status === 'online' && foundDevice.workingStatus === 'idle'
                  ? '立即使用'
                  : '查看设备详情'}
              </Button>
            </Space>
          </Card>
        )}

        <Card
          className="card-shadow"
          title={
            <Space align="center">
              <ClockCircleOutlined style={{ color: '#1890ff' }} />
              <Title level={5} style={{ margin: 0 }}>扫码历史</Title>
            </Space>
          }
          extra={
            scanHistory.length > 0 && (
              <Button type="link" onClick={clearHistory} danger>
                清除历史
              </Button>
            )
          }
        >
          {scanHistory.length > 0 ? (
            <List
              dataSource={scanHistory}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleHistoryClick(item)}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: item.success
                            ? `${item.device ? DEVICE_TYPE_COLORS[item.device.deviceType] : '#52c41a'}15`
                            : '#fff2f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                        }}
                      >
                        {item.success ? (
                          item.device ? (
                            DEVICE_TYPE_ICONS[item.device.deviceType]
                          ) : (
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          )
                        ) : (
                          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                        )}
                      </div>
                    }
                    title={
                      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <Text strong>
                            {item.device?.name || item.deviceCode}
                          </Text>
                          {item.success ? (
                            <Tag color="green">成功</Tag>
                          ) : (
                            <Tag color="red">失败</Tag>
                          )}
                        </Space>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space>
                          <Text type="secondary">设备编号: {item.deviceCode}</Text>
                          {item.device && (
                            <Tag color="blue">
                              {DEVICE_TYPE_MAP[item.device.deviceType]}
                            </Tag>
                          )}
                        </Space>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {formatRelativeTime(item.scanTime)}
                        </Text>
                        {!item.success && item.message && (
                          <Text type="danger" style={{ fontSize: '12px' }}>
                            {item.message}
                          </Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty
              description="暂无扫码记录"
              style={{ padding: '20px 0' }}
            />
          )}
        </Card>

        <Card
          className="card-shadow"
          title={
            <Space align="center">
              <ExclamationCircleOutlined style={{ color: '#faad14' }} />
              <Title level={5} style={{ margin: 0 }}>使用提示</Title>
            </Space>
          }
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space align="start">
              <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 4 }} />
              <Text type="secondary">
                请确保设备二维码清晰、完整，光线充足
              </Text>
            </Space>
            <Space align="start">
              <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 4 }} />
              <Text type="secondary">
                扫描时请保持手机与二维码距离约10-20厘米
              </Text>
            </Space>
            <Space align="start">
              <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 4 }} />
              <Text type="secondary">
                如扫描失败，可尝试手动输入设备编号
              </Text>
            </Space>
            <Space align="start">
              <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 4 }} />
              <Text type="secondary">
                设备编号位于设备机身的标签上，通常以DEV开头
              </Text>
            </Space>
          </Space>
        </Card>
      </Space>

      <Modal
        title="手动输入设备编号"
        open={manualModalVisible}
        onCancel={() => {
          setManualModalVisible(false);
          setDeviceCode('');
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setManualModalVisible(false);
              setDeviceCode('');
            }}
          >
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleManualInput}
            disabled={!deviceCode.trim()}
          >
            确认
          </Button>,
        ]}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text type="secondary">
            请输入设备编号，可在设备机身标签上找到
          </Text>
          <Input
            size="large"
            placeholder="请输入设备编号，如 DEV0001"
            value={deviceCode}
            onChange={(e) => setDeviceCode(e.target.value)}
            onPressEnter={handleManualInput}
            prefix={<QrcodeOutlined />}
            maxLength={20}
          />
          <Alert
            type="info"
            message="设备编号格式"
            description="设备编号通常以 DEV 开头，后跟4-6位数字，例如 DEV0001"
          />
        </Space>
      </Modal>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default ResidentScan;
