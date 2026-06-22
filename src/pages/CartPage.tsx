import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import PriceTag from '@/components/common/PriceTag';
import EmptyState from '@/components/common/EmptyState';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  Package,
  Truck,
  Tag,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';

const mockCartItems = [
  {
    id: 'cart-001',
    templateId: 'tpl-005',
    templateName: '宝宝成长相册',
    templateThumbnail: 'https://picsum.photos/seed/cart001/200/150',
    productId: 'album',
    productName: '相册',
    materialId: 'mat-002',
    materialName: '光面相纸',
    quantity: 1,
    unitPrice: 12800,
    spec: '12寸精装 / 24页',
  },
  {
    id: 'cart-002',
    templateId: 'tpl-021',
    templateName: '情侣款马克杯',
    templateThumbnail: 'https://picsum.photos/seed/cart002/200/150',
    productId: 'mug',
    productName: '马克杯',
    materialId: 'mat-008',
    materialName: '高温陶瓷',
    quantity: 2,
    unitPrice: 5900,
    spec: '情侣款一对 / 白色陶瓷',
  },
  {
    id: 'cart-003',
    templateId: 'tpl-007',
    templateName: '简约生活台历',
    templateThumbnail: 'https://picsum.photos/seed/cart003/200/150',
    productId: 'calendar-desk',
    productName: '台历',
    materialId: 'mat-001',
    materialName: '哑面相纸',
    quantity: 3,
    unitPrice: 4900,
    spec: '8寸横版 / 12页',
  },
];

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState('');

  const displayItems = items.length > 0 ? items : mockCartItems;

  const allSelected = displayItems.length > 0 && selectedIds.length === displayItems.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayItems.map(item => item.id));
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleQuantityChange = (id: string, delta: number) => {
    const item = displayItems.find(i => i.id === id);
    if (!item) return;
    const newQuantity = Math.max(1, item.quantity + delta);
    if (items.length > 0) {
      updateQuantity(id, newQuantity);
    }
  };

  const handleDelete = (id: string) => {
    if (items.length > 0) {
      removeItem(id);
    }
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const handleBatchDelete = () => {
    if (items.length > 0) {
      selectedIds.forEach(id => removeItem(id));
    }
    setSelectedIds([]);
  };

  const selectedItems = displayItems.filter(item => selectedIds.includes(item.id));

  const subtotal = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingFee = subtotal > 0 ? (subtotal >= 9900 ? 0 : 800) : 0;
  const discount = couponCode === 'SAVE10' ? Math.floor(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal + shippingFee - discount);

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert('请选择要结算的商品');
      return;
    }
    navigate('/checkout');
  };

  if (displayItems.length === 0) {
    return (
      <div className="py-16">
        <EmptyState
          icon={<ShoppingCart className="h-16 w-16" />}
          title="购物车是空的"
          description="快去挑选心仪的商品吧"
          action={
            <Button onClick={() => navigate('/')}>
              去购物
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-paper-900">
              购物车
            </h1>
            <p className="text-paper-500 mt-1">
              共 {displayItems.length} 件商品
            </p>
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 text-darkroom-600 hover:text-darkroom-700 text-sm transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              批量删除
            </button>
          )}
        </div>

        <div className="flex gap-8 flex-col lg:flex-row">
          {/* 左侧：商品列表 */}
          <div className="flex-1 min-w-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">商品列表</CardTitle>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-paper-300 text-brand-500 focus:ring-brand-400"
                  />
                  <span className="text-sm text-paper-600">全选</span>
                </label>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-paper-100">
                  {displayItems.map(item => {
                    const isSelected = selectedIds.includes(item.id);
                    const subtotalItem = item.unitPrice * item.quantity;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'p-4 flex items-center gap-4 transition-colors',
                          isSelected && 'bg-brand-50/50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectItem(item.id)}
                          className="w-4 h-4 rounded border-paper-300 text-brand-500 focus:ring-brand-400"
                        />

                        <div className="w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-paper-100">
                          <img
                            src={item.templateThumbnail}
                            alt={item.templateName}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-paper-900 truncate">
                            {item.templateName}
                          </h3>
                          <p className="text-sm text-paper-500 mt-0.5">
                            {item.productName}
                          </p>
                          <p className="text-xs text-paper-400 mt-1">
                            {item.materialName} · {item.spec}
                          </p>
                        </div>

                        <div className="flex-shrink-0 w-24 text-right">
                          <PriceTag price={item.unitPrice} size="sm" />
                        </div>

                        <div className="flex-shrink-0 flex items-center gap-1 bg-paper-100 rounded-lg p-1">
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            disabled={item.quantity <= 1}
                            className={cn(
                              'w-7 h-7 flex items-center justify-center rounded-md transition-colors',
                              item.quantity <= 1
                                ? 'text-paper-300 cursor-not-allowed'
                                : 'text-paper-600 hover:bg-white hover:shadow-sm'
                            )}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-paper-700">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-md text-paper-600 hover:bg-white hover:shadow-sm transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex-shrink-0 w-28 text-right">
                          <PriceTag price={subtotalItem} size="md" />
                        </div>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-paper-400 hover:text-darkroom-500 hover:bg-darkroom-50 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：结算侧边栏 */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">结算明细</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-paper-500 flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        商品数量
                      </span>
                      <span className="text-paper-700 font-medium">
                        {selectedItems.reduce((sum, item) => sum + item.quantity, 0)} 件
                      </span>
                    </div>
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
                          优惠金额
                        </span>
                        <span className="text-brand-600 font-medium">
                          -{(discount / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {subtotal > 0 && subtotal < 9900 && (
                    <div className="bg-brand-50 rounded-lg p-3 text-xs text-brand-700">
                      再购 {(9900 - subtotal) / 100} 元即可免运费哦~
                    </div>
                  )}

                  <div className="border-t border-dashed border-paper-200 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-paper-700 font-medium">实付金额</span>
                      <PriceTag price={total} size="lg" />
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleCheckout}
                    leftIcon={<CreditCard className="h-4 w-4" />}
                  >
                    去结算
                  </Button>

                  <Link
                    to="/"
                    className="flex items-center justify-center gap-1 text-sm text-paper-500 hover:text-brand-500 transition-colors"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    继续购物
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">优惠券</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入优惠码"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      size="sm"
                    />
                    <Button size="sm" variant="secondary">
                      使用
                    </Button>
                  </div>
                  <p className="text-xs text-paper-400 mt-2">
                    试试输入 SAVE10 享受9折优惠
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    </div>
  );
}
