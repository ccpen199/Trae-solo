import { useState } from 'react';
import { Card, Slider, Tag, Switch, message } from 'antd';
import {
  EnvironmentOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  BellOutlined,
  PauseCircleOutlined,
  EnvironmentFilled,
  SafetyOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/PageHeader';

interface ServiceArea {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
}

interface ForbiddenZone {
  id: string;
  name: string;
  type: 'school' | 'hospital' | 'highway' | 'station' | 'other';
  description: string;
}

const initialServiceAreas: ServiceArea[] = [
  { id: '1', name: '朝阳区', code: '110105', enabled: true },
  { id: '2', name: '海淀区', code: '110108', enabled: true },
  { id: '3', name: '东城区', code: '110101', enabled: true },
  { id: '4', name: '西城区', code: '110102', enabled: false },
  { id: '5', name: '丰台区', code: '110106', enabled: true },
  { id: '6', name: '石景山区', code: '110107', enabled: false },
  { id: '7', name: '通州区', code: '110112', enabled: false },
  { id: '8', name: '大兴区', code: '110115', enabled: false },
];

const forbiddenZones: ForbiddenZone[] = [
  { id: '1', name: '北京市第一中学', type: 'school', description: '上下学时段禁止进入' },
  { id: '2', name: '协和医院', type: 'hospital', description: '医院核心区域禁入' },
  { id: '3', name: '京藏高速', type: 'highway', description: '全路段禁止非机动车进入' },
  { id: '4', name: '北京西站', type: 'station', description: '站内禁止骑行' },
];

const zoneTypeColors: Record<ForbiddenZone['type'], string> = {
  school: 'orange',
  hospital: 'red',
  highway: 'geekblue',
  station: 'purple',
  other: 'default',
};

const zoneTypeLabels: Record<ForbiddenZone['type'], string> = {
  school: '学校',
  hospital: '医院',
  highway: '高速',
  station: '车站',
  other: '其他',
};

const GeofencePage: React.FC = () => {
  const [radius, setRadius] = useState(5);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>(initialServiceAreas);
  const [entryAlert, setEntryAlert] = useState(true);
  const [exitAlert, setExitAlert] = useState(true);
  const [autoPause, setAutoPause] = useState(false);

  const toggleArea = (id: string) => {
    setServiceAreas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
    message.success('服务区域已更新');
  };

  const enabledCount = serviceAreas.filter((a) => a.enabled).length;

  return (
    <div className="page-container pb-20">
      <PageHeader title="地理围栏" />

      <div className="px-4 pt-3 space-y-4">
        <Card size="small" title="我的配送范围" className="shadow-sm">
          <div className="flex flex-col items-center py-4">
            <div className="relative w-48 h-48 mb-4">
              <div
                className="absolute inset-0 rounded-full bg-blue-100/40 border-2 border-dashed border-blue-300 flex items-center justify-center"
                style={{
                  transform: `scale(${radius / 10})`,
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full bg-blue-50/60 flex items-center justify-center border border-blue-200">
                  <div className="text-center">
                    <EnvironmentFilled className="text-blue-500 text-3xl mb-1" />
                    <p className="text-xs text-gray-500">配送中心</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full px-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">配送半径</span>
                <span className="text-lg font-bold text-blue-600">{radius} km</span>
              </div>
              <Slider
                min={1}
                max={20}
                value={radius}
                onChange={setRadius}
                marks={{
                  1: '1km',
                  5: '5km',
                  10: '10km',
                  15: '15km',
                  20: '20km',
                }}
                tooltip={{ formatter: (val) => `${val}公里` }}
              />
            </div>
          </div>
        </Card>

        <Card
          size="small"
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EnvironmentOutlined className="text-blue-500" />
                <span>服务区域</span>
              </div>
              <span className="text-xs text-gray-400">已开启 {enabledCount} 个</span>
            </div>
          }
          className="shadow-sm"
        >
          <div className="flex flex-wrap gap-2">
            {serviceAreas.map((area) => (
              <Tag.CheckableTag
                key={area.id}
                checked={area.enabled}
                onChange={() => toggleArea(area.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  borderColor: area.enabled ? '#3B82F6' : '#d9d9d9',
                  backgroundColor: area.enabled ? '#EFF6FF' : '#fff',
                  color: area.enabled ? '#1D4ED8' : '#595959',
                }}
              >
                {area.enabled && <CheckCircleOutlined className="mr-1" />}
                {area.name}
              </Tag.CheckableTag>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            点击区域名称可开关该区域的接单权限，关闭后系统不会向您派发该区域的订单
          </p>
        </Card>

        <Card
          size="small"
          title={
            <div className="flex items-center gap-2">
              <SafetyOutlined className="text-red-500" />
              <span>禁止进入区域</span>
            </div>
          }
          className="shadow-sm"
        >
          <div className="space-y-2">
            {forbiddenZones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-start gap-3 p-3 bg-red-50/50 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <WarningOutlined className="text-red-500 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800 text-sm">{zone.name}</span>
                    <Tag color={zoneTypeColors[zone.type]} style={{ margin: 0 }}>
                      {zoneTypeLabels[zone.type]}
                    </Tag>
                  </div>
                  <p className="text-xs text-gray-500">{zone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          size="small"
          title={
            <div className="flex items-center gap-2">
              <BellOutlined className="text-orange-500" />
              <span>围栏预警设置</span>
            </div>
          }
          className="shadow-sm"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">进入禁入区提醒</p>
                <p className="text-xs text-gray-400">检测到进入禁入区域时推送提醒</p>
              </div>
              <Switch size="small" checked={entryAlert} onChange={setEntryAlert} />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">离开服务区提醒</p>
                <p className="text-xs text-gray-400">驶出已开启的服务区域时推送提醒</p>
              </div>
              <Switch size="small" checked={exitAlert} onChange={setExitAlert} />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-start gap-2">
                <PauseCircleOutlined className="text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">超出范围自动暂停接单</p>
                  <p className="text-xs text-gray-400">离开配送范围超过2分钟自动离线</p>
                </div>
              </div>
              <Switch size="small" checked={autoPause} onChange={setAutoPause} />
            </div>
          </div>
        </Card>

        <div className="relative bg-gray-200 rounded-xl overflow-hidden" style={{ height: 240 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
            <svg className="w-full h-full opacity-20">
              <defs>
                <pattern id="mapGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#9CA3AF" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mapGrid)" />
            </svg>
          </div>

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 240" preserveAspectRatio="none">
            <circle cx="200" cy="120" r="90" fill="rgba(59, 130, 246, 0.1)" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2" strokeDasharray="6,4" />
            <circle cx="200" cy="120" r="10" fill="#3B82F6" opacity="0.8" />

            <polygon
              points="120,60 150,40 180,70 160,100 110,80"
              fill="rgba(239, 68, 68, 0.15)"
              stroke="rgba(239, 68, 68, 0.5)"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
            <text x="140" y="75" textAnchor="middle" fontSize="10" fill="#DC2626" fontWeight="500">
              禁入区
            </text>

            <polygon
              points="280,160 320,150 340,190 310,210 275,195"
              fill="rgba(239, 68, 68, 0.15)"
              stroke="rgba(239, 68, 68, 0.5)"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
            <text x="305" y="185" textAnchor="middle" fontSize="10" fill="#DC2626" fontWeight="500">
              禁入区
            </text>

            <circle cx="200" cy="120" r="4" fill="#fff" stroke="#1D4ED8" strokeWidth="2" />
          </svg>

          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <EnvironmentOutlined className="text-blue-500" />
              <span className="text-sm font-medium">示例地图 - 接入地图SDK后展示真实区域</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500/30 border border-blue-500/60" />
                配送范围
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/60" />
                禁入区域
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600 border border-white" />
                当前位置
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeofencePage;
