import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import PriceTag from '@/components/common/PriceTag';
import SplitAccountCard from '@/components/order/SplitAccountCard';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Plus,
  Check,
  CreditCard,
  Receipt,
  FileText,
  ChevronRight,
  Package,
  Truck,
  Tag,
  ShoppingBag,
  Banknote,
  Wallet,
  TrendingUp,
} from 'lucide-react';

const mockAddresses = [
  {
    id: 'addr-001',
    name: '李女士',
    phone: '138****5678',
    province: '浙江省',
    city: '杭州市',
    district: '西湖区',
    detail: '文三路 478 号华星时代广场 B 座 1201',
    isDefault: true,
  },
  {
    id: 'addr-002',
    name: '王先生',
    phone: '139****8765',
    province: '浙江省',
    city: '杭州市',
    district: '拱墅区',
    detail: '莫干山路 789 号蓝天城市花园 3 幢 2 单元 501',
    isDefault: false,
  },
];

const mockItems = [
  {
    id: 'item-001',
    templateName: '宝宝成长相册',
    productName: '相册',
    materialName: '光面相纸',
    spec: '12寸精装 / 24页',
    quantity: 1,
    unitPrice: 12800,
    previewImage: 'https://picsum.photos/seed/checkout001/120/90',
  },
  {
    id: 'item-002',
    templateName: '情侣款马克杯',
    productName: '马克杯',
    materialName: '高温陶瓷',
    spec: '情侣款一对 / 白色陶瓷',
    quantity: 2,
    unitPrice: 5900,
    previewImage: 'https://picsum.photos/seed/checkout002/120/90',
  },
];

const paymentMethods = [
  { id: 'wechat', name: '微信支付', icon: Wallet, color: 'text-green-500', bgColor: 'bg-green-50' },
  { id: 'alipay', name: '支付宝', icon: CreditCard, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  { id: 'bank', name: '对公转账', icon: Banknote, color: 'text-gold-600', bgColor: 'bg-gold-50' },
  { id: 'monthly', name: '企业月结', icon: TrendingUp, color: 'text-forest-600', bgColor: 'bg-forest-50' },
];

const invoiceTypes = [
  { value: 'personal', label: '个人' },
  { value: 'company', label: '企业' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items } = useCartStore();
  const [selectedAddressId, setSelectedAddressId] = useState('addr-001');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentTab, setPaymentTab] = useState('wechat');
  const [needInvoice, setNeedInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState('personal');
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [remark, setRemark] = useState('');

  const displayItems = items.length > 0 ? items : mockItems;

  const selectedAddress = mockAddresses.find(a => a.id === selectedAddressId);

  const subtotal = displayItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingFee = subtotal >= 9900 ? 0 : 800;
  const discount = 0;
  const total = subtotal + shippingFee - discount;

  const paymentChannel = paymentTab as 'wechat' | 'alipay' | 'bank' | 'monthly';

  const calculateSplitDetails = () => {
    const baseDetails = {
      platformFee: Math.floor(total * 0.1),
      designerRoyalty: Math.floor(total * 0.15),
      factoryCost: Math.floor(total * 0.75),
      paymentChannel,
    };

    if (paymentTab === 'wechat') {
      return {
        ...baseDetails,
        wechatFee: Math.floor(total * 0.006),
      };
    } else if (paymentTab === 'alipay') {
      return {
        ...baseDetails,
        alipayFee: Math.floor(total * 0.006),
      };
    }

    return baseDetails;
  };

  const splitDetails = calculateSplitDetails();

  const handleSubmitOrder = () => {
    if (!selectedAddressId) {
      alert('请选择收货地址');
      return;
    }
    alert('订单提交成功！');
    navigate('/orders');
  };

  return (
    <div className="py-8">
        <h1 className="font-display text-3xl font-bold text-paper-900 mb-8">
          确认订单
        </h1>

        <div className="flex gap-8 flex-col lg:flex-row">
          {/* 左侧：主要内容 */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* 收货地址 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-brand-500" />
                  收货地址
                </CardTitle>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  新增地址
                </button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAddresses.map(addr => {
                    const isSelected = addr.id === selectedAddressId;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={cn(
                          'p-4 rounded-lg border-2 cursor-pointer transition-all',
                          isSelected
                            ? 'border-brand-500 bg-brand-50/50'
                            : 'border-paper-200 hover:border-brand-300 bg-white'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-medium text-paper-900">{addr.name}</span>
                              <span className="text-paper-500 text-sm">{addr.phone}</span>
                              {addr.isDefault && (
                                <span className="text-xs px-2 py-0.5 bg-brand-100 text-brand-600 rounded-full">
                                  默认
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-paper-600">
                              {addr.province}{addr.city}{addr.district}{addr.detail}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {showAddressForm && (
                  <div className="mt-4 p-4 bg-paper-50 rounded-lg space-y-4">
                    <h4 className="font-medium text-paper-900">新增收货地址</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-paper-500 mb-1 block">收货人</label>
                        <Input size="sm" placeholder="请输入收货人姓名" />
                      </div>
                      <div>
                        <label className="text-sm text-paper-500 mb-1 block">手机号</label>
                        <Input size="sm" placeholder="请输入手机号" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm text-paper-500 mb-1 block">省份</label>
                        <Input size="sm" placeholder="省份" />
                      </div>
                      <div>
                        <label className="text-sm text-paper-500 mb-1 block">城市</label>
                        <Input size="sm" placeholder="城市" />
                      </div>
                      <div>
                        <label className="text-sm text-paper-500 mb-1 block">区县</label>
                        <Input size="sm" placeholder="区县" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-paper-500 mb-1 block">详细地址</label>
                      <Input size="sm" placeholder="请输入详细地址" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowAddressForm(false)}
                      >
                        取消
                      </Button>
                      <Button size="sm" onClick={() => setShowAddressForm(false)}>
                        保存
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 商品清单 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-brand-500" />
                  商品清单
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-paper-100">
                  {displayItems.map(item => (
                    <div key={item.id} className="p-4 flex items-center gap-4">
                      <div className="w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-paper-100">
                        <img
                          src={item.previewImage || item.templateThumbnail}
                          alt={item.templateName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-paper-900 text-sm truncate">
                          {item.templateName}
                        </h3>
                        <p className="text-xs text-paper-500 mt-0.5">
                          {item.productName} · {item.materialName}
                        </p>
                        <p className="text-xs text-paper-400">
                          {item.spec}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <PriceTag price={item.unitPrice} size="sm" />
                        <p className="text-xs text-paper-400 mt-0.5">
                          × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 支付方式 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-brand-500" />
                  支付方式
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={paymentTab} onValueChange={setPaymentTab}>
                  <TabsList className="grid grid-cols-4">
                    {paymentMethods.map(method => {
                      const Icon = method.icon;
                      return (
                        <TabsTrigger key={method.id} value={method.id}>
                          <Icon className="h-4 w-4 mr-1" />
                          {method.name}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  <TabsContent value="wechat" className="mt-4">
                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                      <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Wallet className="h-8 w-8 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-paper-900">微信支付</h4>
                        <p className="text-sm text-paper-500 mt-1">
                          支持微信扫码、公众号支付
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="alipay" className="mt-4">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                      <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <CreditCard className="h-8 w-8 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-paper-900">支付宝</h4>
                        <p className="text-sm text-paper-500 mt-1">
                          支持支付宝扫码、花呗分期
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="bank" className="mt-4">
                    <div className="p-4 bg-gold-50 rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <Banknote className="h-6 w-6 text-gold-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-paper-900">对公转账</h4>
                          <p className="text-sm text-paper-500">
                            企业对公账户转账，需人工确认
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-paper-600 bg-white rounded-lg p-3 space-y-1">
                        <p><span className="text-paper-500">开户名：</span>杭州某某科技有限公司</p>
                        <p><span className="text-paper-500">开户行：</span>工商银行杭州西湖支行</p>
                        <p><span className="text-paper-500">账号：</span>1234 5678 9012 3456 789</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="monthly" className="mt-4">
                    <div className="p-4 bg-forest-50 rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <TrendingUp className="h-6 w-6 text-forest-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-paper-900">企业月结</h4>
                          <p className="text-sm text-paper-500">
                            签约企业客户可使用月结服务
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-forest-700 bg-white rounded-lg p-3">
                        <p>💡 企业月结额度：¥10,000.00</p>
                        <p className="mt-1">本月已用：¥2,580.00</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* 发票信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-brand-500" />
                  发票信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-paper-700">是否需要发票</span>
                  <Switch checked={needInvoice} onCheckedChange={setNeedInvoice} />
                </div>

                {needInvoice && (
                  <div className="space-y-4 pt-4 border-t border-paper-100">
                    <div>
                      <label className="text-sm text-paper-500 mb-2 block">发票类型</label>
                      <div className="flex gap-3">
                        {invoiceTypes.map(type => (
                          <button
                            key={type.value}
                            onClick={() => setInvoiceType(type.value)}
                            className={cn(
                              'flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all',
                              invoiceType === type.value
                                ? 'border-brand-500 bg-brand-50 text-brand-700'
                                : 'border-paper-200 text-paper-600 hover:border-paper-300'
                            )}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-paper-500 mb-1 block">
                        发票抬头
                      </label>
                      <Input
                        size="sm"
                        placeholder={invoiceType === 'company' ? '请输入公司名称' : '请输入个人姓名'}
                        value={invoiceTitle}
                        onChange={(e) => setInvoiceTitle(e.target.value)}
                      />
                    </div>
                    {invoiceType === 'company' && (
                      <div>
                        <label className="text-sm text-paper-500 mb-1 block">
                          纳税人识别号
                        </label>
                        <Input size="sm" placeholder="请输入纳税人识别号" />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 订单备注 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-500" />
                  订单备注
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="选填：如有特殊要求请在此备注..."
                  className="w-full h-24 px-4 py-3 rounded-md border border-paper-300 bg-white text-paper-900 placeholder-paper-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                />
                <p className="text-xs text-paper-400 mt-2 text-right">
                  {remark.length}/200
                </p>
              </CardContent>
            </Card>

            {/* 分账明细 */}
            <SplitAccountCard
              splitDetails={splitDetails}
              totalAmount={total}
            />
          </div>

          {/* 右侧：订单明细 */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">订单明细</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-paper-500 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        商品金额
                      </span>
                      <PriceTag price={subtotal} size="sm" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-paper-500 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        运费
                      </span>
                      {shippingFee === 0 ? (
                        <span className="text-forest-600 text-sm font-medium">
                          免运费
                        </span>
                      ) : (
                        <PriceTag price={shippingFee} size="sm" />
                      )}
                    </div>
                    {discount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-paper-500 flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          优惠
                        </span>
                        <span className="text-brand-600 font-medium">
                          -{(discount / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-paper-200 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-paper-700 font-medium">实付金额</span>
                      <PriceTag price={total} size="lg" />
                    </div>
                    <p className="text-xs text-paper-400 text-right">
                      共 {displayItems.reduce((sum, i) => sum + i.quantity, 0)} 件商品
                    </p>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleSubmitOrder}
                    leftIcon={<CreditCard className="h-4 w-4" />}
                  >
                    提交订单
                  </Button>

                  <button
                    onClick={() => navigate('/cart')}
                    className="w-full flex items-center justify-center gap-1 text-sm text-paper-500 hover:text-brand-500 transition-colors"
                  >
                    返回购物车
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    </div>
  );
}
