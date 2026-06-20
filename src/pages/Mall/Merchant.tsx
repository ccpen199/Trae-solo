import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Store,
  Star,
  ShoppingBag,
  Package,
  DollarSign,
  Users,
  TrendingUp,
  Edit2,
  Trash2,
  Plus,
  Settings,
  BarChart3,
  ListOrdered,
  Upload,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
} from 'lucide-react';
import {
  Tabs,
  Button,
  Switch,
  Input,
  InputNumber,
  message,
  Modal,
  Form,
  Select,
} from 'antd';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import { mockProducts } from '@/mocks/data/mall';
import type { Product } from '@/types/entity';

const shopInfo = {
  name: '阳光优选生鲜店',
  avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=shop1',
  coverImage: 'https://api.dicebear.com/7.x/shapes/svg?seed=cover1',
  rating: 4.9,
  totalSales: 12580,
  totalProducts: 56,
  description:
    '专注生鲜食品8年，坚持产地直采，新鲜直达。所有商品经过严格质检，让您买的放心，吃的安心。',
  phone: '400-888-8888',
  email: 'service@yangguang.com',
  address: '阳光花园社区底商B108',
  isEntered: true,
};

const salesTrendData = [
  { name: '周一', gmv: 2400, orders: 45, visitors: 320 },
  { name: '周二', gmv: 3200, orders: 58, visitors: 410 },
  { name: '周三', gmv: 2800, orders: 52, visitors: 380 },
  { name: '周四', gmv: 3600, orders: 65, visitors: 450 },
  { name: '周五', gmv: 4200, orders: 78, visitors: 520 },
  { name: '周六', gmv: 5800, orders: 98, visitors: 680 },
  { name: '周日', gmv: 5200, orders: 88, visitors: 620 },
];

const merchantProducts = mockProducts.slice(0, 8).map((p, idx) => ({
  ...p,
  isOnSale: idx < 6,
  sales: Math.floor(Math.random() * 500) + 50,
}));

const tabItems = [
  { key: 'products', label: '商品管理', icon: Package },
  { key: 'orders', label: '订单管理', icon: ListOrdered },
  { key: 'data', label: '经营数据', icon: BarChart3 },
  { key: 'settings', label: '店铺设置', icon: Settings },
];

const noEnterShopInfo = {
  name: '',
  avatar: '',
  coverImage: '',
  rating: 0,
  totalSales: 0,
  totalProducts: 0,
  description: '',
  phone: '',
  email: '',
  address: '',
  isEntered: false,
};

export default function Merchant() {
  const [activeTab, setActiveTab] = useState('products');
  const [isEntered, setIsEntered] = useState(true);
  const [products, setProducts] = useState(merchantProducts);
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleToggleSale = (product: Product & { isOnSale: boolean }) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, isOnSale: !p.isOnSale } : p
      )
    );
    message.success(
      `${product.isOnSale ? '已下架' : '已上架'}：${product.name}`
    );
  };

  const handleEditProduct = (product: Product) => {
    message.info(`编辑商品：${product.name}`);
  };

  const handleDeleteProduct = (product: Product) => {
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    message.success(`已删除商品：${product.name}`);
  };

  const handleApplySubmit = () => {
    form.validateFields().then(() => {
      setIsEntered(true);
      setIsApplyModalVisible(false);
      message.success('入驻申请已提交，审核中...');
    });
  };

  const productColumns = [
    {
      title: '商品信息',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (_: string, record: Product & { isOnSale: boolean; sales: number }) => (
        <div className="flex items-center gap-3">
          <img
            src={record.imageUrl}
            alt={record.name}
            className="w-14 h-14 rounded-lg bg-white/5 object-cover"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {record.name}
            </p>
            <p className="text-xs text-neutral-500 truncate">
              {record.category}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => (
        <span className="text-sm text-danger-400 font-mono font-medium">
          ¥{price.toFixed(2)}
        </span>
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (stock: number) => (
        <span className="text-sm text-neutral-300 font-mono">{stock}</span>
      ),
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      width: 100,
      render: (sales: number) => (
        <span className="text-sm text-neutral-300 font-mono">{sales}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isOnSale',
      key: 'isOnSale',
      width: 100,
      render: (isOnSale: boolean) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            isOnSale
              ? 'bg-success-500/10 text-success-400'
              : 'bg-neutral-500/10 text-neutral-400'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              isOnSale ? 'bg-success-500' : 'bg-neutral-500'
            )}
          />
          {isOnSale ? '在售' : '已下架'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: Product & { isOnSale: boolean; sales: number }) => (
        <div className="flex items-center gap-1">
          <Button
            type="text"
            size="small"
            icon={<Eye className="w-4 h-4" />}
            className="!text-neutral-400 hover:!text-primary-400"
            onClick={() => message.info(`查看商品：${record.name}`)}
          >
            查看
          </Button>
          <Button
            type="text"
            size="small"
            icon={<Edit2 className="w-4 h-4" />}
            className="!text-neutral-400 hover:!text-primary-400"
            onClick={() => handleEditProduct(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            size="small"
            danger={record.isOnSale}
            className={cn(
              '!text-neutral-400',
              record.isOnSale ? 'hover:!text-warning-400' : 'hover:!text-success-400'
            )}
            onClick={() => handleToggleSale(record)}
          >
            {record.isOnSale ? '下架' : '上架'}
          </Button>
          <Button
            type="text"
            size="small"
            danger
            icon={<Trash2 className="w-4 h-4" />}
            className="!text-neutral-400 hover:!text-danger-400"
            onClick={() => handleDeleteProduct(record)}
          />
        </div>
      ),
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Package className="w-4 h-4" />
                <span>共 {products.length} 件商品</span>
              </div>
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => message.info('添加商品')}
              >
                添加商品
              </Button>
            </div>
            <DataTable
              columns={productColumns as any}
              dataSource={products}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </div>
        );

      case 'orders':
        return (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-warning-400 font-mono">3</p>
                <p className="text-sm text-neutral-500 mt-1">待发货</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-primary-400 font-mono">12</p>
                <p className="text-sm text-neutral-500 mt-1">待收货</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-accent-400 font-mono">8</p>
                <p className="text-sm text-neutral-500 mt-1">待评价</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-success-400 font-mono">256</p>
                <p className="text-sm text-neutral-500 mt-1">已完成</p>
              </div>
            </div>
            <EmptyState
              type="default"
              title="订单列表"
              description="订单管理功能开发中..."
            />
          </div>
        );

      case 'data':
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatCard
                title="今日GMV"
                value="5,280"
                prefix="¥"
                icon={DollarSign}
                variant="success"
                trend={{ value: 12.5, direction: 'up', label: '较昨日' }}
              />
              <StatCard
                title="今日订单数"
                value="88"
                icon={ShoppingBag}
                variant="primary"
                trend={{ value: 8.2, direction: 'up', label: '较昨日' }}
              />
              <StatCard
                title="今日访客数"
                value="620"
                icon={Users}
                variant="accent"
                trend={{ value: -3.1, direction: 'down', label: '较昨日' }}
              />
            </div>
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                本周销售趋势
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrendData}>
                    <defs>
                      <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748B"
                      fontSize={12}
                    />
                    <YAxis stroke="#64748B" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#F1F5F9',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="gmv"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorGmv)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="max-w-2xl">
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  基本信息
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">
                      店铺名称
                    </label>
                    <Input
                      defaultValue={shopInfo.name}
                      className="!bg-white/5 !border-white/10 !text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">
                      店铺简介
                    </label>
                    <Input.TextArea
                      rows={3}
                      defaultValue={shopInfo.description}
                      className="!bg-white/5 !border-white/10 !text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-neutral-400 mb-2">
                        联系电话
                      </label>
                      <Input
                        defaultValue={shopInfo.phone}
                        className="!bg-white/5 !border-white/10 !text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-400 mb-2">
                        联系邮箱
                      </label>
                      <Input
                        defaultValue={shopInfo.email}
                        className="!bg-white/5 !border-white/10 !text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">
                      店铺地址
                    </label>
                    <Input
                      defaultValue={shopInfo.address}
                      className="!bg-white/5 !border-white/10 !text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  店铺图片
                </h3>
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-xl bg-white/5 flex items-center justify-center border-2 border-dashed border-white/10">
                    <Upload className="w-6 h-6 text-neutral-500" />
                  </div>
                  <div className="w-24 h-24 rounded-xl bg-white/5 flex items-center justify-center border-2 border-dashed border-white/10">
                    <Upload className="w-6 h-6 text-neutral-500" />
                  </div>
                  <div className="w-24 h-24 rounded-xl bg-white/5 flex items-center justify-center border-2 border-dashed border-white/10">
                    <Upload className="w-6 h-6 text-neutral-500" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button className="!border-white/10 !text-neutral-300">
                  取消
                </Button>
                <Button
                  type="primary"
                  onClick={() => message.success('保存成功')}
                >
                  保存修改
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const shop = isEntered ? shopInfo : noEnterShopInfo;

  return (
    <div className="p-6">
      <PageHeader
        title="商户中心"
        subtitle={isEntered ? '管理您的店铺和商品' : '申请入驻成为商户'}
        breadcrumb={[
          { title: '首页' },
          { title: '社区电商' },
          { title: '商户中心' },
        ]}
      />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="glass-card overflow-hidden sticky top-6">
              {isEntered ? (
                <>
                  <div className="h-24 bg-gradient-to-r from-primary-500/30 to-accent-500/30 relative">
                    <img
                      src={shop.coverImage}
                      alt="店招"
                      className="w-full h-full object-cover opacity-50"
                    />
                  </div>
                  <div className="p-4 -mt-8">
                    <img
                      src={shop.avatar}
                      alt={shop.name}
                      className="w-16 h-16 rounded-xl border-2 border-white/20 bg-white/5 mb-3"
                    />
                    <h2 className="text-lg font-semibold text-white mb-1">
                      {shop.name}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-neutral-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-warning-400 fill-warning-400" />
                        <span className="text-warning-400">{shop.rating}</span>
                      </div>
                      <span className="text-neutral-600">|</span>
                      <span>销量 {shop.totalSales}</span>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <Phone className="w-4 h-4" />
                        <span>{shop.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-400">
                        <Mail className="w-4 h-4" />
                        <span>{shop.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-400">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{shop.address}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t border-white/5 flex gap-2">
                    <button
                      onClick={() => message.info('查看店铺')}
                      className="flex-1 py-2 rounded-lg bg-white/5 text-neutral-300 text-sm hover:bg-white/10 transition-colors"
                    >
                      查看店铺
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="flex-1 py-2 rounded-lg bg-primary-500/20 text-primary-400 text-sm hover:bg-primary-500/30 transition-colors"
                    >
                      店铺设置
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Store className="w-8 h-8 text-neutral-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-white mb-2">
                    尚未入驻
                  </h2>
                  <p className="text-sm text-neutral-500 mb-4">
                    申请入驻成为商户，开启您的社区电商之旅
                  </p>
                  <button
                    onClick={() => setIsApplyModalVisible(true)}
                    className="btn-primary w-full"
                  >
                    立即申请入驻
                  </button>
                </div>
              )}

              {isEntered && (
                <div className="p-2 border-t border-white/5">
                  {tabItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-1',
                          activeTab === item.key
                            ? 'bg-primary-500/15 text-primary-400'
                            : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="lg:col-span-3"
          >
            {isEntered ? (
              <div className="glass-card p-4">
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={tabItems.map((item) => ({
                    key: item.key,
                    label: (
                      <span className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </span>
                    ),
                  }))}
                  className="!mb-4"
                />
                {renderContent()}
              </div>
            ) : (
              <div className="glass-card">
                <EmptyState
                  type="default"
                  title="未入驻商户"
                  description="申请入驻后即可使用商户后台管理功能"
                  action={{
                    label: '立即申请',
                    onClick: () => setIsApplyModalVisible(true),
                  }}
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <Modal
        title="商户入驻申请"
        open={isApplyModalVisible}
        onCancel={() => setIsApplyModalVisible(false)}
        footer={null}
        width={560}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="店铺名称"
            name="shopName"
            rules={[{ required: true, message: '请输入店铺名称' }]}
          >
            <Input placeholder="请输入店铺名称" />
          </Form.Item>
          <Form.Item
            label="店铺类型"
            name="shopType"
            rules={[{ required: true, message: '请选择店铺类型' }]}
          >
            <Select placeholder="请选择店铺类型">
              <Select.Option value="fresh">生鲜果蔬</Select.Option>
              <Select.Option value="daily">日用百货</Select.Option>
              <Select.Option value="service">家政服务</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="联系人"
            name="contactName"
            rules={[{ required: true, message: '请输入联系人姓名' }]}
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
          <Form.Item
            label="联系电话"
            name="contactPhone"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item label="店铺简介" name="description">
            <Input.TextArea rows={3} placeholder="请简要描述您的店铺" />
          </Form.Item>
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={() => setIsApplyModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" onClick={handleApplySubmit}>
              提交申请
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
