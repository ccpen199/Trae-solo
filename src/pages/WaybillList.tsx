import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Calendar,
  ChevronDown,
  Eye,
  Phone,
  Package,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Table, Column } from '@/components/common/Table';
import { Tag } from '@/components/common/Tag';
import { get } from '@/utils/request';
import { useNavigate } from 'react-router-dom';

interface WaybillListItem {
  id: string;
  waybillNo: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  itemType: string;
  weight: number;
  status: 'synced' | 'pending_sync' | 'created';
  createdAt: string;
}

const statusMap: Record<string, { label: string; color: 'success' | 'warning' | 'default' }> = {
  synced: { label: '已同步', color: 'success' },
  pending_sync: { label: '待同步', color: 'warning' },
  created: { label: '已创建', color: 'default' },
};

const maskName = (name: string) => {
  if (!name) return '';
  if (name.length <= 1) return name;
  return name.charAt(0) + '*'.repeat(name.length - 1);
};

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
};

const mockData: WaybillListItem[] = [
  {
    id: '1',
    waybillNo: 'YZ2024010100001',
    senderName: '张三',
    senderPhone: '13800138001',
    receiverName: '李四',
    receiverPhone: '13900139001',
    itemType: '电子产品',
    weight: 2.5,
    status: 'synced',
    createdAt: '2024-01-15 10:30:00',
  },
  {
    id: '2',
    waybillNo: 'YZ2024010100002',
    senderName: '王五',
    senderPhone: '13800138002',
    receiverName: '赵六',
    receiverPhone: '13900139002',
    itemType: '服装',
    weight: 1.2,
    status: 'pending_sync',
    createdAt: '2024-01-15 11:20:00',
  },
  {
    id: '3',
    waybillNo: 'YZ2024010100003',
    senderName: '孙七',
    senderPhone: '13800138003',
    receiverName: '周八',
    receiverPhone: '13900139003',
    itemType: '文件',
    weight: 0.5,
    status: 'synced',
    createdAt: '2024-01-15 14:00:00',
  },
  {
    id: '4',
    waybillNo: 'YZ2024010100004',
    senderName: '吴九',
    senderPhone: '13800138004',
    receiverName: '郑十',
    receiverPhone: '13900139004',
    itemType: '食品',
    weight: 5.0,
    status: 'created',
    createdAt: '2024-01-15 15:45:00',
  },
  {
    id: '5',
    waybillNo: 'YZ2024010100005',
    senderName: '冯十一',
    senderPhone: '13800138005',
    receiverName: '陈十二',
    receiverPhone: '13900139005',
    itemType: '日用品',
    weight: 3.8,
    status: 'synced',
    createdAt: '2024-01-15 16:30:00',
  },
];

export default function WaybillList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WaybillListItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, [searchKeyword, statusFilter, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await get<{ list: WaybillListItem[] }>('/waybill', {
        params: {
          keyword: searchKeyword,
          status: statusFilter === 'all' ? undefined : statusFilter,
          startDate,
          endDate,
        },
      });
      setData(result.list || []);
    } catch (err) {
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<WaybillListItem>[] = [
    {
      key: 'waybillNo',
      title: '运单号',
      dataIndex: 'waybillNo',
      sortable: true,
      render: (record) => (
        <span className="font-mono text-sm font-medium text-primary">{record.waybillNo}</span>
      ),
    },
    {
      key: 'sender',
      title: '寄件人',
      render: (record) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-sm text-gray-900">
            <span>{maskName(record.senderName)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Phone className="h-3 w-3" />
            <span>{maskPhone(record.senderPhone)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'receiver',
      title: '收件人',
      render: (record) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-sm text-gray-900">
            <span>{maskName(record.receiverName)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Phone className="h-3 w-3" />
            <span>{maskPhone(record.receiverPhone)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'itemType',
      title: '物品类型',
      dataIndex: 'itemType',
      render: (record) => (
        <span className="inline-flex items-center gap-1 text-sm text-gray-700">
          <Package className="h-3 w-3 text-gray-400" />
          {record.itemType}
        </span>
      ),
    },
    {
      key: 'weight',
      title: '重量',
      dataIndex: 'weight',
      sortable: true,
      align: 'right',
      render: (record) => <span className="text-sm text-gray-700">{record.weight} kg</span>,
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      align: 'center',
      render: (record) => {
        const status = statusMap[record.status] || statusMap.created;
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      key: 'createdAt',
      title: '创建时间',
      dataIndex: 'createdAt',
      sortable: true,
      render: (record) => <span className="text-sm text-gray-500">{record.createdAt}</span>,
    },
    {
      key: 'actions',
      title: '操作',
      align: 'center',
      width: 100,
      render: (record) => (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={Eye}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/waybills/${record.id}`);
          }}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">运单管理</h1>
            <p className="mt-1 text-sm text-gray-500">查看和管理所有电子运单</p>
          </div>
          <Button leftIcon={Plus} onClick={() => navigate('/waybills/new')}>
            新建运单
          </Button>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex min-w-[240px] flex-1 items-center">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索运单号或手机号"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-transparent pr-6 text-sm text-gray-700 focus:outline-none"
                >
                  <option value="all">全部状态</option>
                  <option value="synced">已同步</option>
                  <option value="pending_sync">待同步</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button variant="secondary" onClick={fetchData}>
              查询
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          data={data}
          rowKey="id"
          loading={loading}
          pageSize={10}
          onRowClick={(record) => navigate(`/waybills/${record.id}`)}
        />
      </div>
    </div>
  );
}
