import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Home,
  Users,
  MapPin,
  TrendingUp,
  DollarSign,
  BedDouble,
  UserCheck,
  Link as LinkIcon,
  X as XIcon,
} from 'lucide-react';
import { message } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { DesensitizeText } from '@/components/common/DesensitizeText';
import {
  CommunityTree,
  type CommunityTreeNode,
} from '@/components/business/CommunityTree';
import type { CardVariant } from '@/components/common/StatCard';
import { cn } from '@/utils/cn';

interface RoomInfo {
  id: string;
  roomNumber: string;
  area: number;
  ownerName: string;
  ownerPhone: string;
  bindingStatus: 'bound' | 'unbound';
  paymentStatus: 'paid' | 'partial' | 'unpaid' | 'overdue';
  residents: number;
}

const treeData: CommunityTreeNode[] = [
  {
    key: 'c1',
    label: '阳光花园',
    type: 'community',
    count: {
      total: 576,
      bound: 480,
      paid: 490,
    },
    children: [
      {
        key: 'b1',
        label: '1号楼',
        type: 'building',
        count: {
          total: 96,
          bound: 82,
          paid: 85,
        },
        children: [
          {
            key: 'u1',
            label: '1单元',
            type: 'unit',
            count: {
              total: 48,
              bound: 42,
              paid: 43,
            },
            children: [
              {
                key: '501',
                label: '501室',
                type: 'house',
                bindingStatus: 'bound',
                paymentStatus: 'paid',
                householdInfo: {
                  id: 'h1',
                  name: '张三',
                  phone: '138****1234',
                  residents: 3,
                  lastPaymentDate: '2024-01-05',
                },
              },
              {
                key: '502',
                label: '502室',
                type: 'house',
                bindingStatus: 'bound',
                paymentStatus: 'unpaid',
                householdInfo: {
                  id: 'h2',
                  name: '李四',
                  phone: '139****5678',
                  residents: 2,
                },
              },
              {
                key: '601',
                label: '601室',
                type: 'house',
                bindingStatus: 'unbound',
                paymentStatus: 'overdue',
                householdInfo: {
                  id: 'h3',
                  name: '王五',
                  phone: '137****9012',
                  residents: 4,
                },
              },
              {
                key: '602',
                label: '602室',
                type: 'house',
                bindingStatus: 'bound',
                paymentStatus: 'partial',
                householdInfo: {
                  id: 'h4',
                  name: '赵六',
                  phone: '136****3456',
                  residents: 1,
                  lastPaymentDate: '2024-01-02',
                },
              },
            ],
          },
          {
            key: 'u2',
            label: '2单元',
            type: 'unit',
            count: {
              total: 48,
              bound: 40,
              paid: 42,
            },
            children: [
              {
                key: '301',
                label: '301室',
                type: 'house',
                bindingStatus: 'bound',
                paymentStatus: 'paid',
                householdInfo: {
                  id: 'h5',
                  name: '孙七',
                  phone: '135****7890',
                  residents: 3,
                  lastPaymentDate: '2024-01-08',
                },
              },
              {
                key: '302',
                label: '302室',
                type: 'house',
                bindingStatus: 'bound',
                paymentStatus: 'paid',
                householdInfo: {
                  id: 'h6',
                  name: '周八',
                  phone: '134****1234',
                  residents: 2,
                  lastPaymentDate: '2024-01-03',
                },
              },
            ],
          },
        ],
      },
      {
        key: 'b2',
        label: '2号楼',
        type: 'building',
        count: {
          total: 96,
          bound: 78,
          paid: 80,
        },
        children: [
          {
            key: 'u3',
            label: '1单元',
            type: 'unit',
            count: {
              total: 48,
              bound: 40,
              paid: 41,
            },
            children: [
              {
                key: '201',
                label: '201室',
                type: 'house',
                bindingStatus: 'unbound',
                paymentStatus: 'unpaid',
                householdInfo: {
                  id: 'h7',
                  name: '吴九',
                  phone: '133****5678',
                  residents: 2,
                },
              },
              {
                key: '202',
                label: '202室',
                type: 'house',
                bindingStatus: 'bound',
                paymentStatus: 'paid',
                householdInfo: {
                  id: 'h8',
                  name: '郑十',
                  phone: '132****9012',
                  residents: 4,
                  lastPaymentDate: '2024-01-01',
                },
              },
            ],
          },
        ],
      },
      {
        key: 'b3',
        label: '3号楼',
        type: 'building',
        count: {
          total: 96,
          bound: 85,
          paid: 88,
        },
        children: [],
      },
    ],
  },
];

const mockRooms: RoomInfo[] = [
  {
    id: '1',
    roomNumber: '501室',
    area: 120.5,
    ownerName: '张三',
    ownerPhone: '13812345678',
    bindingStatus: 'bound',
    paymentStatus: 'paid',
    residents: 3,
  },
  {
    id: '2',
    roomNumber: '502室',
    area: 98.2,
    ownerName: '李四',
    ownerPhone: '13956781234',
    bindingStatus: 'bound',
    paymentStatus: 'unpaid',
    residents: 2,
  },
  {
    id: '3',
    roomNumber: '601室',
    area: 120.5,
    ownerName: '王五',
    ownerPhone: '13790123456',
    bindingStatus: 'unbound',
    paymentStatus: 'overdue',
    residents: 4,
  },
  {
    id: '4',
    roomNumber: '602室',
    area: 98.2,
    ownerName: '赵六',
    ownerPhone: '13634567890',
    bindingStatus: 'bound',
    paymentStatus: 'partial',
    residents: 1,
  },
  {
    id: '5',
    roomNumber: '701室',
    area: 120.5,
    ownerName: '孙七',
    ownerPhone: '13578901234',
    bindingStatus: 'bound',
    paymentStatus: 'paid',
    residents: 3,
  },
  {
    id: '6',
    roomNumber: '702室',
    area: 98.2,
    ownerName: '周八',
    ownerPhone: '13412345678',
    bindingStatus: 'bound',
    paymentStatus: 'paid',
    residents: 2,
  },
  {
    id: '7',
    roomNumber: '801室',
    area: 120.5,
    ownerName: '吴九',
    ownerPhone: '13356789012',
    bindingStatus: 'unbound',
    paymentStatus: 'unpaid',
    residents: 0,
  },
  {
    id: '8',
    roomNumber: '802室',
    area: 98.2,
    ownerName: '郑十',
    ownerPhone: '13290123456',
    bindingStatus: 'bound',
    paymentStatus: 'paid',
    residents: 4,
  },
];

const paymentStatusConfig = {
  paid: { label: '已缴费', color: 'text-success-400', bg: 'bg-success-500/15' },
  partial: { label: '部分缴费', color: 'text-primary-400', bg: 'bg-primary-500/15' },
  unpaid: { label: '待缴费', color: 'text-warning-400', bg: 'bg-warning-500/15' },
  overdue: { label: '已逾期', color: 'text-danger-400', bg: 'bg-danger-500/15' },
};

export default function CommunityDetail() {
  const [selectedNode, setSelectedNode] = useState<CommunityTreeNode | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>(mockRooms);

  const stats: Array<{
    title: string;
    value: string;
    unit: string;
    icon: typeof Building2;
    variant: CardVariant;
    trend?: { value: number; direction: 'up' | 'down' | 'flat'; label?: string };
  }> = useMemo(
    () => [
      {
        title: '楼栋数',
        value: '12',
        unit: '栋',
        icon: Building2,
        variant: 'primary',
      },
      {
        title: '单元数',
        value: '48',
        unit: '个',
        icon: Home,
        variant: 'success',
      },
      {
        title: '户数',
        value: '576',
        unit: '户',
        icon: Users,
        variant: 'warning',
      },
      {
        title: '入住率',
        value: '85',
        unit: '%',
        icon: BedDouble,
        variant: 'primary',
      },
      {
        title: '收缴率',
        value: '85',
        unit: '%',
        icon: DollarSign,
        variant: 'success',
        trend: { value: 2.3, direction: 'up', label: '较上月' },
      },
    ],
    []
  );

  const handleBack = () => {
    message.info('返回小区列表');
  };

  const handleNodeClick = (node: CommunityTreeNode) => {
    setSelectedNode(node);
    if (node.type === 'building' || node.type === 'unit') {
      message.info(`已选择: ${node.label}`);
    }
  };

  const filteredRooms = useMemo(() => {
    if (!selectedNode) return rooms;
    if (selectedNode.type === 'house') {
      return rooms.filter((r) => r.roomNumber === selectedNode.label);
    }
    return rooms;
  }, [selectedNode, rooms]);

  const columns = [
    {
      title: '房号',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
      width: 120,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-neutral-500" />
          <span className="text-sm text-white font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: '面积',
      dataIndex: 'area',
      key: 'area',
      width: 100,
      render: (area: number) => (
        <span className="text-sm text-neutral-300">{area} ㎡</span>
      ),
    },
    {
      title: '业主',
      dataIndex: 'ownerName',
      key: 'ownerName',
      width: 120,
      render: (name: string, record: RoomInfo) => (
        <div className="flex flex-col gap-0.5">
          <DesensitizeText value={name} type="name" />
          <DesensitizeText value={record.ownerPhone} type="phone" className="text-xs" />
        </div>
      ),
    },
    {
      title: '居住人数',
      dataIndex: 'residents',
      key: 'residents',
      width: 100,
      align: 'center' as const,
      render: (num: number) => (
        <div className="flex items-center justify-center gap-1.5">
          <Users className="w-4 h-4 text-neutral-500" />
          <span className="text-sm text-neutral-300">{num} 人</span>
        </div>
      ),
    },
    {
      title: '绑定状态',
      dataIndex: 'bindingStatus',
      key: 'bindingStatus',
      width: 100,
      render: (status: 'bound' | 'unbound') => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
            status === 'bound'
              ? 'bg-success-500/15 text-success-400'
              : 'bg-neutral-500/15 text-neutral-400'
          )}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          {status === 'bound' ? '已绑定' : '未绑定'}
        </span>
      ),
    },
    {
      title: '缴费状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 100,
      render: (status: 'paid' | 'partial' | 'unpaid' | 'overdue') => {
        const config = paymentStatusConfig[status];
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
              config.bg,
              config.color
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', config.color.replace('text-', 'bg-'))} />
            {config.label}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: RoomInfo) => (
        <button
          className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          onClick={() => message.info(`查看 ${record.roomNumber} 详情`)}
        >
          详情
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-500/15 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">阳光花园</h1>
              <div className="flex items-center gap-1.5 text-sm text-neutral-500 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                北京市朝阳区阳光路88号
              </div>
            </div>
          </div>
        }
        showBack
        onBack={handleBack}
        breadcrumb={[
          { title: '首页' },
          { title: '小区管理' },
          { title: '小区详情' },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              unit={stat.unit}
              icon={stat.icon}
              variant={stat.variant}
              trend={stat.trend}
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-400" />
              楼宇结构
            </h3>
          </div>
          <CommunityTree
            data={treeData}
            defaultExpandAll
            onNodeClick={handleNodeClick}
            className="max-h-[calc(100vh-360px)] overflow-y-auto"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="lg:col-span-3"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
              <Home className="w-4 h-4 text-primary-400" />
              房屋列表
              {selectedNode && (
                <span className="text-xs text-neutral-500 ml-2">
                  - {selectedNode.label}
                </span>
              )}
            </h3>
            <div className="text-xs text-neutral-500">
              共 {filteredRooms.length} 套房屋
            </div>
          </div>

          <div className="glass-card">
            <DataTable
              columns={columns as any}
              dataSource={filteredRooms}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
              }}
              size="middle"
            />
          </div>

          {selectedNode && selectedNode.type === 'house' && selectedNode.householdInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 glass-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary-400" />
                  住户详情 - {selectedNode.label}
                </h4>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-neutral-500 mb-1">业主姓名</div>
                  <DesensitizeText
                    value={selectedNode.householdInfo.name}
                    type="name"
                    className="text-sm text-white"
                  />
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">联系电话</div>
                  <DesensitizeText
                    value={selectedNode.householdInfo.phone}
                    type="phone"
                    className="text-sm text-white"
                  />
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">居住人数</div>
                  <div className="text-sm text-white">
                    {selectedNode.householdInfo.residents} 人
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1">上次缴费</div>
                  <div className="text-sm text-white">
                    {selectedNode.householdInfo.lastPaymentDate || '暂无记录'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
