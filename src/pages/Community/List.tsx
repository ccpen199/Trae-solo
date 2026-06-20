import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Home,
  Users,
  Trees,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { Input, message, Popconfirm, Button, Progress } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { cn } from '@/lib/utils';
import type { Community } from '@/types/entity';

interface CommunityItem extends Community {
  address: string;
  greenRate: number;
  propertyFee: string;
  paymentRate: number;
}

const mockCommunities: CommunityItem[] = [
  {
    id: '1',
    name: '阳光花园',
    address: '北京市朝阳区阳光路88号',
    totalBuildings: 12,
    totalUnits: 48,
    totalRooms: 576,
    greenRate: 35,
    propertyFee: '2.5元/㎡/月',
    paymentRate: 85,
    createdAt: '2020-01-15T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: '2',
    name: '翠湖苑',
    address: '北京市海淀区翠湖路66号',
    totalBuildings: 8,
    totalUnits: 32,
    totalRooms: 384,
    greenRate: 42,
    propertyFee: '3.2元/㎡/月',
    paymentRate: 92,
    createdAt: '2019-06-20T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z',
  },
  {
    id: '3',
    name: '金色家园',
    address: '北京市丰台区金台路12号',
    totalBuildings: 15,
    totalUnits: 60,
    totalRooms: 720,
    greenRate: 30,
    propertyFee: '2.0元/㎡/月',
    paymentRate: 78,
    createdAt: '2018-09-01T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: '4',
    name: '锦绣江南',
    address: '北京市西城区锦绣街33号',
    totalBuildings: 6,
    totalUnits: 24,
    totalRooms: 288,
    greenRate: 45,
    propertyFee: '4.0元/㎡/月',
    paymentRate: 95,
    createdAt: '2021-03-18T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
  },
  {
    id: '5',
    name: '东方明珠',
    address: '北京市东城区明珠路99号',
    totalBuildings: 10,
    totalUnits: 40,
    totalRooms: 480,
    greenRate: 38,
    propertyFee: '3.5元/㎡/月',
    paymentRate: 88,
    createdAt: '2020-11-25T00:00:00Z',
    updatedAt: '2024-01-09T00:00:00Z',
  },
  {
    id: '6',
    name: '中央公园',
    address: '北京市通州区公园路1号',
    totalBuildings: 20,
    totalUnits: 80,
    totalRooms: 960,
    greenRate: 50,
    propertyFee: '2.8元/㎡/月',
    paymentRate: 72,
    createdAt: '2017-05-10T00:00:00Z',
    updatedAt: '2024-01-11T00:00:00Z',
  },
  {
    id: '7',
    name: '海景花园',
    address: '北京市顺义区海景大道77号',
    totalBuildings: 5,
    totalUnits: 20,
    totalRooms: 240,
    greenRate: 55,
    propertyFee: '4.5元/㎡/月',
    paymentRate: 98,
    createdAt: '2022-08-08T00:00:00Z',
    updatedAt: '2024-01-13T00:00:00Z',
  },
  {
    id: '8',
    name: '星河湾',
    address: '北京市昌平区星河路22号',
    totalBuildings: 9,
    totalUnits: 36,
    totalRooms: 432,
    greenRate: 40,
    propertyFee: '2.6元/㎡/月',
    paymentRate: 65,
    createdAt: '2019-02-14T00:00:00Z',
    updatedAt: '2024-01-06T00:00:00Z',
  },
];

export default function CommunityList() {
  const [searchText, setSearchText] = useState('');
  const [communities, setCommunities] = useState<CommunityItem[]>(mockCommunities);

  const filteredCommunities = useMemo(() => {
    if (!searchText) return communities;
    return communities.filter(
      (c) =>
        c.name.includes(searchText) ||
        c.address.includes(searchText)
    );
  }, [searchText, communities]);

  const handleCreateClick = () => {
    message.success('跳转到新建小区页面');
  };

  const handleViewClick = (community: CommunityItem) => {
    message.info(`查看小区详情: ${community.name}`);
  };

  const handleEditClick = (e: React.MouseEvent, community: CommunityItem) => {
    e.stopPropagation();
    message.info(`编辑小区: ${community.name}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, community: CommunityItem) => {
    e.stopPropagation();
  };

  const handleDeleteConfirm = (community: CommunityItem) => {
    setCommunities((prev) => prev.filter((c) => c.id !== community.id));
    message.success(`已删除小区: ${community.name}`);
  };

  const columns = [
    {
      title: '小区名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string, record: CommunityItem) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-500/15 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-primary-400" />
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-medium text-white truncate cursor-pointer hover:text-primary-400 transition-colors"
              onClick={() => handleViewClick(record)}
            >
              {text}
            </p>
            <p className="text-xs text-neutral-500 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {record.address}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: '楼栋数',
      dataIndex: 'totalBuildings',
      key: 'totalBuildings',
      width: 100,
      align: 'center' as const,
      render: (num: number) => (
        <div className="flex items-center justify-center gap-1.5">
          <Building2 className="w-4 h-4 text-neutral-500" />
          <span className="text-sm text-neutral-300">{num} 栋</span>
        </div>
      ),
    },
    {
      title: '总户数',
      dataIndex: 'totalRooms',
      key: 'totalRooms',
      width: 120,
      align: 'center' as const,
      render: (num: number) => (
        <div className="flex items-center justify-center gap-1.5">
          <Home className="w-4 h-4 text-neutral-500" />
          <span className="text-sm text-neutral-300 font-mono">{num} 户</span>
        </div>
      ),
    },
    {
      title: '绿化率',
      dataIndex: 'greenRate',
      key: 'greenRate',
      width: 120,
      align: 'center' as const,
      render: (rate: number) => (
        <div className="flex items-center justify-center gap-1.5">
          <Trees className="w-4 h-4 text-success-500" />
          <span className="text-sm text-neutral-300">{rate}%</span>
        </div>
      ),
    },
    {
      title: '物业费标准',
      dataIndex: 'propertyFee',
      key: 'propertyFee',
      width: 140,
      align: 'center' as const,
      render: (fee: string) => (
        <div className="flex items-center justify-center gap-1.5">
          <DollarSign className="w-4 h-4 text-warning-500" />
          <span className="text-sm text-neutral-300">{fee}</span>
        </div>
      ),
    },
    {
      title: '收缴率',
      dataIndex: 'paymentRate',
      key: 'paymentRate',
      width: 180,
      render: (rate: number) => (
        <div className="flex items-center gap-3">
          <Progress
            percent={rate}
            size="small"
            strokeColor={
              rate >= 90
                ? '#10B981'
                : rate >= 70
                ? '#F59E0B'
                : '#EF4444'
            }
            showInfo={false}
            className="!min-w-[80px]"
          />
          <span
            className={cn(
              'text-sm font-medium',
              rate >= 90
                ? 'text-success-400'
                : rate >= 70
                ? 'text-warning-400'
                : 'text-danger-400'
            )}
          >
            {rate}%
          </span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: CommunityItem) => (
        <div className="flex items-center gap-1">
          <Button
            type="text"
            size="small"
            icon={<Eye className="w-4 h-4" />}
            className="!text-neutral-400 hover:!text-primary-400"
            onClick={() => handleViewClick(record)}
          >
            查看
          </Button>
          <Button
            type="text"
            size="small"
            icon={<Edit className="w-4 h-4" />}
            className="!text-neutral-400 hover:!text-primary-400"
            onClick={(e) => handleEditClick(e, record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除小区"${record.name}"吗？此操作不可撤销。`}
            onConfirm={() => handleDeleteConfirm(record)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 className="w-4 h-4" />}
              className="!text-neutral-400 hover:!text-danger-400"
              onClick={(e) => handleDeleteClick(e, record)}
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="小区管理"
        subtitle="管理所有小区的基本信息和缴费情况"
        breadcrumb={[{ title: '首页' }, { title: '小区管理' }]}
        extra={
          <button
            onClick={handleCreateClick}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建小区
          </button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card mb-6"
      >
        <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder="搜索小区名称、地址..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="!pl-10 !bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Users className="w-4 h-4" />
            <span>共 {filteredCommunities.length} 个小区</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-card"
      >
        <DataTable
          columns={columns as any}
          dataSource={filteredCommunities}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          onRow={(record: CommunityItem) => ({
            onClick: () => handleViewClick(record),
            style: { cursor: 'pointer' },
          })}
        />
      </motion.div>
    </div>
  );
}
