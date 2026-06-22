import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Select, DatePicker, Empty } from 'antd';
import { CalendarOutlined, FilterOutlined } from '@ant-design/icons';
import PageHeader from '@/components/PageHeader';
import OrderCard from '@/components/OrderCard';
import Loading from '@/components/Loading';
import { orderService } from '@/services/order.service';
import type { Order, OrderStatus } from '@shared/types';

const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface OrderHistoryProps {}

const OrderHistory: React.FC<OrderHistoryProps> = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize: 20,
      };

      if (activeTab !== 'all') {
        params.status = activeTab;
      }

      const result = await orderService.getMyOrders(params);
      setOrders(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadOrders();
    } finally {
      setRefreshing(false);
    }
  };

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' },
    { key: 'exception', label: '异常' },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="历史订单"
        showBack
        rightContent={
          <div className="flex items-center gap-2">
            <Select defaultValue="all" size="small" style={{ width: 120 }}>
              <Option value="all">全部类型</Option>
              <Option value="express">快递</Option>
              <Option value="takeout">外卖</Option>
              <Option value="grocery">生鲜</Option>
            </Select>
          </div>
        }
      />

      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <RangePicker size="small" format="MM/DD" />
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <FilterOutlined />
            <span>共 {total} 单</span>
          </div>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="px-4"
      >
        {tabs.map((tab) => (
          <TabPane tab={tab.label} key={tab.key}>
            <div>
              {loading && <Loading />}
              {!loading && orders.length === 0 && (
                <Empty description="暂无订单记录" />
              )}
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} showActions={false} />
              ))}
            </div>
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
};

export default OrderHistory;
