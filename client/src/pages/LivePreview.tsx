import React, { useEffect, useMemo, useState } from 'react';
import {
  Card, Select, Row, Col, Button, Space, Tag, Modal,
  Form, Input, message, Tooltip, Empty, Spin, Switch, Radio
} from 'antd';
import {
  VideoCameraOutlined, FullscreenOutlined,
  AudioOutlined, PlayCircleOutlined, CalendarOutlined,
  PictureOutlined, Grid3x3Outlined, UnorderedListOutlined,
  SendOutlined, DownloadOutlined
} from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { deviceApi, streamApi } from '@/services/api';
import VideoPlayer from '@/components/VideoPlayer';
import { formatTime, getPermissionText } from '@/utils/format';
import { Device, StreamSession } from '@/types';

const { Option } = Select;

type LayoutMode = '1' | '4' | '9' | '16';

const LivePreview: React.FC = observer(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initDevice = searchParams.get('device');

  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>(initDevice ? [+initDevice] : []);
  const [layout, setLayout] = useState<LayoutMode>(initDevice ? '1' : '4');
  const [sessions, setSessions] = useState<Record<number, StreamSession>>({});
  const [snapshotModal, setSnapshotModal] = useState(false);
  const [recordModal, setRecordModal] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [recording, setRecording] = useState<Set<number>>(new Set());
  const [recordForm] = Form.useForm();

  const gridCount = useMemo(() => parseInt(layout), [layout]);
  const colSpan = useMemo(() => {
    switch (layout) {
      case '1': return 24;
      case '4': return 12;
      case '9': return 8;
      case '16': return 6;
      default: return 12;
    }
  }, [layout]);

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    selectedIds.forEach(async (id) => {
      if (!sessions[id]) {
        try {
          const session = await streamApi.getStreamInfo(id);
          setSessions(prev => ({ ...prev, [id]: session }));
        } catch (e) {}
      }
    });
  }, [selectedIds]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await deviceApi.listDevices({ pageSize: 200, status: 1 });
      setDevices(res.list || []);
      if (selectedIds.length === 0 && res.list?.length > 0) {
        setSelectedIds([res.list[0].id]);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const toggleDevice = (deviceId: number) => {
    if (selectedIds.includes(deviceId)) {
      setSelectedIds(selectedIds.filter(id => id !== deviceId));
      const newSessions = { ...sessions };
      delete newSessions[deviceId];
      setSessions(newSessions);
    } else {
      if (selectedIds.length >= gridCount) {
        message.warning(`当前布局最多支持 ${gridCount} 路，请调整布局或移除已有画面`);
        return;
      }
      setSelectedIds([...selectedIds, deviceId]);
    }
  };

  const handlePTZ = async (deviceId: number, command: string) => {
    try {
      await deviceApi.controlPTZ(deviceId, { command, speed: 1 });
    } catch (e) {}
  };

  const startRecording = async () => {
    if (!currentDevice) return;
    try {
      const values = await recordForm.validateFields();
      await streamApi.startRecording(currentDevice.id, {
        duration: (values.durationMinutes || 5) * 60,
        recordType: values.type || 'manual'
      });
      setRecording(prev => new Set(prev).add(currentDevice.id));
      message.success('已开始录制');
      setRecordModal(false);
      setTimeout(() => {
        setRecording(prev => {
          const next = new Set(prev);
          next.delete(currentDevice.id);
          return next;
        });
        message.info('录制已自动完成');
      }, (values.durationMinutes || 5) * 60 * 1000);
    } catch (e: any) {
      if (e?.errorFields) return;
    }
  };

  const takeSnapshot = (device: Device) => {
    setCurrentDevice(device);
    setSnapshotModal(true);
    setTimeout(() => setSnapshotModal(false), 3000);
  };

  const displayDevices = selectedIds.slice(0, gridCount);

  const renderPlayer = (deviceId: number, index: number) => {
    const device = devices.find(d => d.id === deviceId);
    const session = sessions[deviceId];
    if (!device) {
      return (
        <div className="h-full bg-gray-900 rounded-lg flex items-center justify-center text-gray-400">
          <Empty description="未选择设备" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      );
    }
    if (!session) {
      return (
        <div className="h-full bg-gray-900 rounded-lg flex items-center justify-center">
          <Spin tip="建立连接中..." />
        </div>
      );
    }
    return (
      <div className="relative h-full">
        <VideoPlayer
          wsUrl={session.wsUrl}
          permission={session.permission || device.my_permission}
          deviceName={device.name}
          height="100%"
          onPTZCommand={(cmd) => handlePTZ(deviceId, cmd)}
        />
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <Tooltip title="截图">
            <Button size="small" icon={<PictureOutlined />} className="!bg-black/50 !text-white !border-none hover:!bg-black/70" onClick={() => takeSnapshot(device)} />
          </Tooltip>
          <Tooltip title={recording.has(deviceId) ? '录制中...' : '录制视频'}>
            <Button
              size="small"
              danger={recording.has(deviceId)}
              icon={recording.has(deviceId) ? <PlayCircleOutlined className="animate-pulse" /> : <PlayCircleOutlined />}
              className="!border-none"
              onClick={() => { setCurrentDevice(device); setRecordModal(true); }}
            />
          </Tooltip>
          <Tooltip title="全屏">
            <Button size="small" icon={<FullscreenOutlined />} className="!bg-black/50 !text-white !border-none hover:!bg-black/70" onClick={() => setLayout('1') || setSelectedIds([deviceId])} />
          </Tooltip>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      <Card
        className="!rounded-xl !mb-4"
        title={<span className="font-semibold"><VideoCameraOutlined /> 实时监控预览</span>}
        extra={
          <Space wrap>
            <span className="text-gray-500 text-sm">布局：</span>
            <Radio.Group value={layout} onChange={(e) => setLayout(e.target.value)}>
              <Radio.Button value="1"><Grid3x3Outlined /> 单画面</Radio.Button>
              <Radio.Button value="4">2×2</Radio.Button>
              <Radio.Button value="9">3×3</Radio.Button>
              <Radio.Button value="16">4×4</Radio.Button>
            </Radio.Group>
            <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/devices')}>设备列表</Button>
            <Button icon={<CalendarOutlined />} onClick={() => navigate('/playback')}>录像回放</Button>
          </Space>
        }
      >
        <Row gutter={[12, 12]} className="!mb-4">
          <Col xs={24} lg={18}>
            <Row gutter={[12, 12]}>
              {Array.from({ length: gridCount }).map((_, index) => (
                <Col key={index} xs={24} md={colSpan}>
                  <div style={{ aspectRatio: '16/9' }}>
                    {index < displayDevices.length
                      ? renderPlayer(displayDevices[index], index)
                      : (
                        <div className="h-full bg-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-700">
                          <div className="text-center text-gray-500">
                            <Grid3x3Outlined className="text-4xl mb-2 opacity-50" />
                            <div className="text-sm">从右侧选择设备加入画面</div>
                          </div>
                        </div>
                      )
                    }
                  </div>
                </Col>
              ))}
            </Row>
          </Col>
          <Col xs={24} lg={6}>
            <div className="bg-white border rounded-lg p-3 h-full max-h-[calc(100vh-280px)] overflow-y-auto">
              <div className="font-medium mb-3 flex items-center justify-between">
                <span>设备列表 ({devices.filter(d => d.online_status === 1).length}/{devices.length})</span>
                <span className="text-xs text-gray-500">已选 {selectedIds.length}/{gridCount}</span>
              </div>
              {devices.length === 0 ? (
                <Empty description="暂无设备" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <div className="space-y-2">
                  {devices.map((dev) => (
                    <div
                      key={dev.id}
                      onClick={() => toggleDevice(dev.id)}
                      className={`p-2.5 rounded-lg cursor-pointer transition-all border-2 ${
                        selectedIds.includes(dev.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                      } ${!dev.online_status ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                          dev.online_status ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate flex items-center gap-1">
                            {dev.name}
                            {!dev.online_status && <Tag color="default" className="!text-xs !py-0 !px-1 !m-0">离线</Tag>}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
                            <span>{dev.group_name || '未分组'}</span>
                            <Tag color={dev.my_permission === 'owner' ? 'purple' : dev.my_permission === 'config' ? 'blue' : dev.my_permission === 'talk' ? 'orange' : 'green'} className="!text-xs !py-0 !m-0">
                              {getPermissionText(dev.my_permission)}
                            </Tag>
                          </div>
                          {dev.last_heartbeat_at && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              心跳：{formatTime(dev.last_heartbeat_at, 'HH:mm:ss')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      <Modal
        title="确认截图"
        open={snapshotModal}
        onCancel={() => setSnapshotModal(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => { setSnapshotModal(false); message.success('已保存截图'); }}>确定</Button>
        ]}
      >
        <div className="bg-gray-100 h-60 rounded-lg flex items-center justify-center">
          <PictureOutlined className="text-5xl text-gray-400" />
        </div>
        <div className="text-center text-sm text-gray-500 mt-2">
          设备：{currentDevice?.name} | 时间：{formatTime(new Date())}
        </div>
      </Modal>

      <Modal title="手动录制" open={recordModal} onOk={startRecording} onCancel={() => setRecordModal(false)} okText="开始录制">
        <Form form={recordForm} layout="vertical" initialValues={{ durationMinutes: 5, type: 'manual' }}>
          <div className="mb-4 text-sm text-gray-500">当前设备：<strong>{currentDevice?.name}</strong></div>
          <Form.Item name="durationMinutes" label="录制时长（分钟）" rules={[{ required: true, message: '请设置时长' }]}>
            <Select>
              <Option value={1}>1 分钟</Option>
              <Option value={5}>5 分钟</Option>
              <Option value={15}>15 分钟</Option>
              <Option value={30}>30 分钟</Option>
              <Option value={60}>1 小时</Option>
            </Select>
          </Form.Item>
          <Form.Item name="type" label="录制类型">
            <Select>
              <Option value="manual">手动录制</Option>
              <Option value="event">事件录制</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

export default LivePreview;
