import { useState, useMemo } from 'react';
import {
  Layout,
  Button,
  Input,
  Select,
  Slider,
  Table,
  Tag,
  Space,
  Row,
  Col,
  Card,
  Checkbox,
  message,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  HomeOutlined,
  AuditOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Handshake } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import type { Property, PropertyStatus, VerifyState } from '@/types';
import ProgressRing from '@/components/common/ProgressRing';
import DataCard from '@/components/common/DataCard';
import { cn } from '@/lib/utils';

const { Content } = Layout;
const { Option } = Select;

/** 三态核验类型 */
type TriVerifyType = 'video' | 'vr' | 'onsite';

/** 三态核验状态 */
interface TriVerifyStatus {
  video: VerifyState;
  vr: VerifyState;
  onsite: VerifyState;
}

/** 行政区列表 */
const DISTRICTS = [
  '浦东新区', '黄浦区', '徐汇区', '长宁区', '静安区',
  '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区',
];

/** 房型列表 */
const ROOM_TYPES = [
  { label: '一室', value: 1 },
  { label: '两室', value: 2 },
  { label: '三室', value: 3 },
  { label: '四室及以上', value: 4 },
];

/** 核验状态选项 */
const VERIFY_STATUS_OPTIONS = [
  { label: '未核验', value: 'unverified' },
  { label: '核验中', value: 'verifying' },
  { label: '已核验', value: 'verified' },
  { label: '核验失败', value: 'verification_failed' },
];

/** 从property对象读取三态核验状态（统一数据源） */
function getTriVerify(property: Property): TriVerifyStatus {
  return {
    video: property.videoVerify || 'unverified',
    vr: property.vrVerify || 'unverified',
    onsite: property.onsiteVerify || 'unverified',
  };
}

/** 计算真实性评分（基于三态核验 + verifyState） */
function calculateAuthenticityScore(property: Property): number {
  const tri = getTriVerify(property);
  let score = 30;
  const scoreMap: Record<VerifyState, number> = {
    verified: 25,
    verifying: 10,
    unverified: 0,
    verification_failed: -5,
  };
  score += scoreMap[tri.video] + scoreMap[tri.vr] + scoreMap[tri.onsite];
  if (property.verifyState === 'verified') score += 15;
  else if (property.verifyState === 'verifying') score += 5;
  else if (property.verifyState === 'verification_failed') score -= 10;
  return Math.max(0, Math.min(100, score));
}

/** 获取评分颜色 */
function getScoreColor(score: number): string {
  if (score >= 80) return '#00A86B';
  if (score >= 60) return '#FF6B35';
  return '#E63946';
}

/** 三态核验Tag组件 */
function TriVerifyTag({ type, status }: { type: TriVerifyType; status: VerifyState }) {
  const labelMap: Record<TriVerifyType, string> = {
    video: '视频',
    vr: 'VR',
    onsite: '实地',
  };
  const statusStyleMap: Record<VerifyState, string> = {
    verified: 'bg-success-50 text-success-600 border-success-200',
    verifying: 'bg-brand-50 text-brand-600 border-brand-200',
    unverified: 'bg-ink-100 text-ink-500 border-ink-200',
    verification_failed: 'bg-danger-50 text-danger-600 border-danger-200',
  };
  const statusIconMap: Record<VerifyState, string> = {
    verified: '✓',
    verifying: '⋯',
    unverified: '○',
    verification_failed: '✗',
  };
  return (
    <Tag
      className={cn(
        'm-0 border px-2 py-0.5 text-xs font-medium',
        statusStyleMap[status]
      )}
      style={{ backgroundColor: 'transparent', borderRadius: 4 }}
    >
      <span className="mr-0.5">{statusIconMap[status]}</span>
      {labelMap[type]}
    </Tag>
  );
}

/** 房源状态徽章 */
function PropertyStatusTag({ status }: { status: PropertyStatus }) {
  const statusMap: Record<PropertyStatus, { label: string; className: string }> = {
    on_shelf: { label: '上架', className: 'bg-success-50 text-success-600 border-success-300' },
    rented: { label: '已租', className: 'bg-brand-50 text-brand-600 border-brand-300' },
    off_shelf: { label: '下架', className: 'bg-ink-100 text-ink-500 border-ink-200' },
    pending: { label: '待上架', className: 'bg-gold-50 text-gold-600 border-gold-300' },
    maintenance: { label: '维修中', className: 'bg-warning-50 text-warning-600 border-warning-300' },
    violation: { label: '违规', className: 'bg-danger-50 text-danger-600 border-danger-300' },
    draft: { label: '草稿', className: 'bg-ink-100 text-ink-500 border-ink-200' },
  };
  const config = statusMap[status];
  return (
    <Tag
      className={cn(
        'm-0 border px-2.5 py-0.5 text-xs font-semibold',
        config.className
      )}
      style={{ backgroundColor: 'transparent', borderRadius: 4 }}
    >
      {config.label}
    </Tag>
  );
}

export default function PropertyList() {
  const navigate = useNavigate();
  const { properties, setPropertyStatus } = useAppStore();

  /** 筛选条件状态 */
  const [district, setDistrict] = useState<string | undefined>();
  const [community, setCommunity] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 30000]);
  const [roomTypes, setRoomTypes] = useState<number[]>([]);
  const [verifyStates, setVerifyStates] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());

  /** 统计概览 */
  const statistics = useMemo(() => {
    const onShelf = properties.filter(p => p.status === 'on_shelf').length;
    const verifying = properties.filter(p => p.verifyState === 'verifying').length;
    const rented = properties.filter(p => p.status === 'rented').length;
    const pending = properties.filter(p => p.verifyState === 'unverified' || p.status === 'pending').length;
    return { onShelf, verifying, rented, pending };
  }, [properties]);

  /** 过滤后的房源列表 */
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      if (district && p.district !== district) return false;
      if (community && !p.communityName.includes(community)) return false;
      if (p.monthlyRent < priceRange[0] || p.monthlyRent > priceRange[1]) return false;
      if (roomTypes.length > 0) {
        const maxRoom = Math.max(...roomTypes);
        if (maxRoom === 4) {
          if (p.bedrooms < 4 && !roomTypes.includes(p.bedrooms)) return false;
        } else if (!roomTypes.includes(p.bedrooms)) return false;
      }
      if (verifyStates.length > 0 && !verifyStates.includes(p.verifyState)) return false;
      if (searchText) {
        const text = searchText.toLowerCase();
        if (
          !p.title.toLowerCase().includes(text) &&
          !p.communityName.toLowerCase().includes(text) &&
          !p.address.toLowerCase().includes(text) &&
          !p.propertyNo.toLowerCase().includes(text)
        ) return false;
      }
      return true;
    });
  }, [properties, district, community, priceRange, roomTypes, verifyStates, searchText]);

  /** 模拟签约成交 - 毫秒级下架动画 */
  const handleMockSign = (property: Property) => {
    if (property.status !== 'on_shelf') {
      message.warning('该房源当前不可签约');
      return;
    }

    setFlashingIds(prev => new Set(prev).add(property.id));

    setTimeout(() => {
      setPropertyStatus(property.id, 'rented');
      setFlashingIds(prev => {
        const next = new Set(prev);
        next.delete(property.id);
        return next;
      });
      message.success('已触发毫秒级下架同步', 1.5);
    }, 300);
  };

  /** 批量核验 */
  const handleBatchVerify = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择需要核验的房源');
      return;
    }
    message.success(`已提交 ${selectedRowKeys.length} 套房源进行批量核验`);
    setSelectedRowKeys([]);
  };

  /** 导出 */
  const handleExport = () => {
    message.success(`正在导出 ${filteredProperties.length} 条房源数据...`);
  };

  /** 重置筛选 */
  const handleReset = () => {
    setDistrict(undefined);
    setCommunity('');
    setPriceRange([0, 30000]);
    setRoomTypes([]);
    setVerifyStates([]);
    setSearchText('');
  };

  /** 表格列配置 */
  const columns: ColumnsType<Property> = [
    {
      title: '房源信息',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      fixed: 'left',
      render: (_, record) => (
        <div className="flex items-start gap-3">
          <img
            src={record.coverImage}
            alt={record.title}
            className="h-16 w-20 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0 flex-1">
            <div
              className="cursor-pointer truncate text-sm font-semibold text-ink-800 hover:text-brand-600"
              onClick={() => navigate(`/property/detail/${record.id}`)}
              title={record.title}
            >
              {record.title}
            </div>
            <div className="mt-1 truncate text-xs text-ink-500" title={record.communityName}>
              <HomeOutlined className="mr-1" />
              {record.communityName}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '租金/月',
      dataIndex: 'monthlyRent',
      key: 'monthlyRent',
      width: 140,
      align: 'center',
      sorter: (a, b) => a.monthlyRent - b.monthlyRent,
      render: value => (
        <div className="flex flex-col items-center">
          <span className="font-mono text-2xl font-bold text-warning-500 tabular-nums">
            ¥{value.toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      title: '房型/面积',
      key: 'roomInfo',
      width: 130,
      align: 'center',
      render: (_, record) => (
        <div className="text-sm text-ink-700">
          <div className="font-medium">
            {record.bedrooms}室{record.livingRooms}厅{record.bathrooms}卫
          </div>
          <div className="mt-0.5 text-xs text-ink-500">
            建面 {record.buildingArea}㎡
          </div>
        </div>
      ),
    },
    {
      title: '三态核验',
      key: 'triVerify',
      width: 180,
      align: 'center',
      render: (_, record) => {
        const tri = getTriVerify(record);
        return (
          <Space size={4} wrap className="justify-center">
            <TriVerifyTag type="video" status={tri.video} />
            <TriVerifyTag type="vr" status={tri.vr} />
            <TriVerifyTag type="onsite" status={tri.onsite} />
          </Space>
        );
      },
    },
    {
      title: '真实性评分',
      key: 'authenticity',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const score = calculateAuthenticityScore(record);
        return (
          <ProgressRing
            progress={score}
            size={56}
            strokeWidth={5}
            color={getScoreColor(score)}
            showPercentage
          />
        );
      },
    },
    {
      title: '房源状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status: PropertyStatus, record) => (
        <div
          className={cn(
            'inline-block transition-all duration-300',
            flashingIds.has(record.id) && 'animate-breathe scale-110'
          )}
        >
          <PropertyStatusTag status={flashingIds.has(record.id) ? 'rented' : status} />
        </div>
      ),
    },
    {
      title: '最近核验时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 160,
      align: 'center',
      render: value => (
        <span className="text-sm text-ink-500 tabular-nums">
          {value?.replace('T', ' ').slice(0, 16) || '-'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size={8}>
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/property/detail/${record.id}`)}
            >
              详情
            </Button>
          </Tooltip>
          <Tooltip title="模拟签约成交">
            <Button
              type="link"
              size="small"
              danger
              icon={<Handshake className="h-4 w-4" />}
              onClick={() => handleMockSign(record)}
              disabled={record.status !== 'on_shelf'}
            >
              签约
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Layout className="bg-transparent">
      <Content className="p-6">
        {/* 页面标题 + 操作按钮 */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="m-0 text-2xl font-bold text-ink-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              <AuditOutlined className="mr-2 text-brand-500" />
              房源真实性管理
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              统一管理平台房源的三态核验、真实性评分与上架状态
            </p>
          </div>
          <Space size={12}>
            <Button
              type="primary"
              icon={<CheckSquareOutlined />}
              onClick={handleBatchVerify}
              disabled={selectedRowKeys.length === 0}
            >
              批量核验{selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleExport}
            >
              导出
            </Button>
          </Space>
        </div>

        {/* 统计概览条 */}
        <Row gutter={16} className="mb-5">
          <Col span={6}>
            <DataCard
              title="已上架房源"
              value={statistics.onShelf}
              unit="套"
              prefix={<CheckCircleOutlined />}
              accentColor="#00A86B"
              trend={8.5}
              comparedTo="week"
              sparkline={[42, 45, 48, 52, 55, 58, statistics.onShelf]}
            />
          </Col>
          <Col span={6}>
            <DataCard
              title="核验中"
              value={statistics.verifying}
              unit="套"
              prefix={<AuditOutlined />}
              accentColor="#0F4C81"
              trend={-3.2}
              comparedTo="week"
              sparkline={[15, 18, 16, 14, 12, 10, statistics.verifying]}
            />
          </Col>
          <Col span={6}>
            <DataCard
              title="已租房源"
              value={statistics.rented}
              unit="套"
              prefix={<Handshake />}
              accentColor="#FF6B35"
              trend={12.3}
              comparedTo="week"
              sparkline={[20, 22, 25, 28, 30, 32, statistics.rented]}
            />
          </Col>
          <Col span={6}>
            <DataCard
              title="待补材料"
              value={statistics.pending}
              unit="套"
              prefix={<FileTextOutlined />}
              accentColor="#E63946"
              trend={-5.1}
              comparedTo="week"
              sparkline={[18, 16, 14, 13, 11, 10, statistics.pending]}
            />
          </Col>
        </Row>

        {/* 筛选栏 */}
        <Card className="mb-5 shadow-card" bodyStyle={{ padding: '20px 24px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col span={5}>
              <div className="text-sm font-medium text-ink-600 mb-1">行政区</div>
              <Select
                placeholder="请选择行政区"
                allowClear
                style={{ width: '100%' }}
                value={district}
                onChange={setDistrict}
              >
                {DISTRICTS.map(d => (
                  <Option key={d} value={d}>{d}</Option>
                ))}
              </Select>
            </Col>
            <Col span={5}>
              <div className="text-sm font-medium text-ink-600 mb-1">小区名称</div>
              <Input
                placeholder="输入小区关键字"
                value={community}
                onChange={e => setCommunity(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={6}>
              <div className="text-sm font-medium text-ink-600 mb-1">
                租金区间：<span className="font-mono text-warning-500">¥{priceRange[0].toLocaleString()}</span>
                <span className="mx-1 text-ink-400">~</span>
                <span className="font-mono text-warning-500">¥{priceRange[1].toLocaleString()}</span>
              </div>
              <Slider
                min={0}
                max={30000}
                step={500}
                range
                value={priceRange}
                onChange={v => setPriceRange(v as [number, number])}
                tooltip={{ formatter: v => `¥${v?.toLocaleString()}` }}
              />
            </Col>
            <Col span={4}>
              <div className="text-sm font-medium text-ink-600 mb-1">房型</div>
              <Select
                mode="multiple"
                placeholder="选择房型"
                allowClear
                style={{ width: '100%' }}
                value={roomTypes}
                onChange={setRoomTypes}
                maxTagCount="responsive"
              >
                {ROOM_TYPES.map(rt => (
                  <Option key={rt.value} value={rt.value}>{rt.label}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <div className="text-sm font-medium text-ink-600 mb-1">核验状态</div>
              <Select
                mode="multiple"
                placeholder="核验状态"
                allowClear
                style={{ width: '100%' }}
                value={verifyStates}
                onChange={setVerifyStates}
                maxTagCount="responsive"
              >
                {VERIFY_STATUS_OPTIONS.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Col>
          </Row>

          <Row gutter={[16, 0]} align="middle" className="mt-4">
            <Col span={12}>
              <Input
                size="large"
                placeholder="搜索房源标题、小区、地址、编号..."
                prefix={<SearchOutlined className="text-ink-400" />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
                onPressEnter={() => {}}
              />
            </Col>
            <Col span={12} className="text-right">
              <Space>
                <Checkbox
                  checked={selectedRowKeys.length === filteredProperties.length && filteredProperties.length > 0}
                  indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < filteredProperties.length}
                  onChange={e => {
                    setSelectedRowKeys(e.target.checked ? filteredProperties.map(p => p.id) : []);
                  }}
                >
                  全选当前筛选结果（{filteredProperties.length}条）
                </Checkbox>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 房源表格 */}
        <Card className="shadow-card" bodyStyle={{ padding: 0 }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredProperties}
            scroll={{ x: 1300 }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: total => `共 ${total} 套房源`,
              pageSize: 10,
            }}
            size="middle"
          />
        </Card>
      </Content>
    </Layout>
  );
}
