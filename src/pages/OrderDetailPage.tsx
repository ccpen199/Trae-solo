import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Package,
  Truck,
  MapPin,
  Phone,
  User,
  Copy,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import ProductionTimeline from '@/components/order/ProductionTimeline';
import { orders } from '@/mock/data/orders';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';
import type { ProductionNode } from '@/types';

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useUserStore();
  const navigate = useNavigate();

  const order = orders.find((o) => o.id === orderId) || orders[0];

  const statusColors: Record<string, string> = {
    pending: 'warning',
    producing: 'brand',
    shipped: 'gold',
    completed: 'success',
    cancelled: 'error',
  };

  const nodeRemarkMap: Record<string, string> = {
    printing: '富士胶片冲印，色彩还原度98%',
    binding: '手工精装 / 锁线装订',
    shipping: '顺丰速运 / 全国包邮',
  };

  const mapProductionNodes = (): ProductionNode[] => {
    const nodeMap: Record<string, { nodeName: string; nodeKey: string }> = {
      order_received: { nodeName: '订单已提交', nodeKey: 'order_received' },
      payment_confirmed: { nodeName: '支付确认', nodeKey: 'payment_confirmed' },
      design_review: { nodeName: '设计稿审核', nodeKey: 'design_review' },
      printing: { nodeName: '胶片冲洗', nodeKey: 'printing' },
      binding: { nodeName: '装帧加工', nodeKey: 'binding' },
      quality_check: { nodeName: '质量检验', nodeKey: 'quality_check' },
      shipping: { nodeName: '物流配送', nodeKey: 'shipping' },
      delivered: { nodeName: '已送达', nodeKey: 'delivered' },
    };

    const findProcessingIndex = () => {
      for (let i = order.productionNodes.length - 1; i >= 0; i--) {
        if (order.productionNodes[i].completed) {
          return i + 1 < order.productionNodes.length ? i + 1 : i;
        }
      }
      return 0;
    };

    const processingIndex = findProcessingIndex();

    return order.productionNodes.map((node, index) => {
      const info = nodeMap[node.status] || {
        nodeName: node.description,
        nodeKey: node.status,
      };
      const isProcessing = !node.completed && index === processingIndex;
      const lastLog = node.operationLogs && node.operationLogs.length > 0
        ? node.operationLogs[node.operationLogs.length - 1]
        : null;
      return {
        id: `node-${index}`,
        nodeKey: info.nodeKey,
        nodeName: info.nodeName,
        status: node.completed
          ? 'completed'
          : isProcessing
            ? 'processing'
            : 'pending',
        timestamp: node.completedAt || node.estimatedAt || '',
        operator: lastLog?.operator || (node.completed ? '系统自动' : ''),
        remark: node.remark || nodeRemarkMap[node.status] || '',
        operationLogs: node.operationLogs || [],
      };
    });
  };

  const productionNodes = mapProductionNodes();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">订单详情</CardTitle>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-paper-500">
                <span className="flex items-center gap-1">
                  <span>订单号：</span>
                  <span className="font-mono text-paper-700">{order.orderNo}</span>
                  <button className="ml-1 text-brand-500 hover:text-brand-600 transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>下单时间：{order.createdAt}</span>
                </span>
              </div>
            </div>
            <Tag
              variant={statusColors[order.status] as any}
              size="md"
              className="self-start sm:self-center"
            >
              {order.statusText}
            </Tag>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProductionTimeline nodes={productionNodes} />

          {order.workOrderInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-500" />
                  生产工单信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-paper-500">工单号</p>
                    <p className="font-medium text-paper-900 font-mono">
                      {order.workOrderInfo.workOrderNo}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-paper-500">工厂ID</p>
                    <p className="font-medium text-paper-900 font-mono">
                      {order.workOrderInfo.factoryId}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-paper-500">生产线</p>
                    <p className="font-medium text-paper-900">
                      {order.workOrderInfo.productionLine}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-paper-500">操作员</p>
                    <p className="font-medium text-paper-900">
                      {order.workOrderInfo.operator}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-paper-500">设备编号</p>
                    <p className="font-medium text-paper-900 font-mono">
                      {order.workOrderInfo.equipment}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-paper-500">质检记录</p>
                    <p className="font-medium text-paper-900">
                      {order.workOrderInfo.qualityRecord || '待检验'}
                    </p>
                  </div>
                  {order.workOrderInfo.estimatedCompletionTime && (
                    <div className="space-y-1">
                      <p className="text-sm text-paper-500">预计完成时间</p>
                      <p className="font-medium text-paper-900">
                        {order.workOrderInfo.estimatedCompletionTime}
                      </p>
                    </div>
                  )}
                  {order.workOrderInfo.actualCompletionTime && (
                    <div className="space-y-1">
                      <p className="text-sm text-paper-500">实际完成时间</p>
                      <p className="font-medium text-paper-900">
                        {order.workOrderInfo.actualCompletionTime}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {productionNodes.some(n => n.operationLogs && n.operationLogs.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-500" />
                  节点操作记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {productionNodes.map((node, nodeIndex) => {
                    if (!node.operationLogs || node.operationLogs.length === 0) return null;
                    return (
                      <div key={node.id} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-2 h-2 rounded-full',
                            node.status === 'completed' ? 'bg-forest-500' :
                            node.status === 'processing' ? 'bg-brand-500' : 'bg-paper-300'
                          )} />
                          <h4 className="font-medium text-paper-900">{node.nodeName}</h4>
                        </div>
                        <div className="relative pl-6">
                          <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-paper-200" />
                          <div className="space-y-3">
                            {node.operationLogs.map((log, logIndex) => (
                              <div key={logIndex} className="relative">
                                <div className="absolute left-[-18px] top-1.5 w-3 h-3 rounded-full bg-paper-300 border-2 border-white" />
                                <div className="bg-paper-50 rounded-lg p-3">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <p className="text-sm text-paper-900">{log.action}</p>
                                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-paper-500">
                                        <span className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {log.operator}
                                        </span>
                                        {log.equipment && (
                                          <span className="flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" />
                                            {log.equipment}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-xs text-paper-400 whitespace-nowrap">
                                      {log.time}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {order.logistics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand-500" />
                  物流信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-paper-500">物流公司</p>
                    <p className="font-medium text-paper-900">
                      {order.logistics.company}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-paper-500">物流单号</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-medium text-paper-900">
                        {order.logistics.trackingNumber}
                      </p>
                      <button className="text-brand-500 hover:text-brand-600 transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-paper-500">更新时间</p>
                    <p className="font-medium text-paper-900">
                      {order.logistics.updatedAt}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-paper-500">物流状态</p>
                    <p className="font-medium text-paper-900">
                      {order.logistics.status}
                    </p>
                  </div>
                  {order.logistics.estimatedDelivery && (
                    <div className="space-y-1">
                      <p className="text-sm text-paper-500">预计送达</p>
                      <p className="font-medium text-paper-900">
                        {order.logistics.estimatedDelivery}
                      </p>
                    </div>
                  )}
                  {order.logistics.currentLocation && (
                    <div className="space-y-1">
                      <p className="text-sm text-paper-500">当前位置</p>
                      <p className="font-medium text-paper-900">
                        {order.logistics.currentLocation}
                      </p>
                    </div>
                  )}
                </div>

                {order.logistics.updates?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-paper-200">
                    <div className="relative">
                      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-paper-200" />
                      <div className="space-y-4">
                        {order.logistics.updates
                          .slice()
                          .reverse()
                          .slice(0, 3)
                          .map((update, index) => (
                            <div key={index} className="relative flex gap-4">
                              <div
                                className={cn(
                                  'relative z-10 w-4 h-4 rounded-full border-2 mt-0.5',
                                  index === 0
                                    ? 'border-brand-500 bg-brand-500'
                                    : 'border-paper-300 bg-white'
                                )}
                              />
                              <div className="flex-1 pb-2">
                                <p className="text-sm text-paper-900">
                                  {update.description}
                                </p>
                                <div className="mt-1 flex items-center gap-3 text-xs text-paper-500">
                                  <span>{update.time}</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {update.location}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-500" />
                商品清单
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-paper-100">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 sm:p-5 hover:bg-paper-50 transition-colors"
                  >
                    <img
                      src={item.previewImage}
                      alt={item.productName}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover bg-paper-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-paper-900 truncate">
                        {item.productName}
                      </h4>
                      {item.templateName && (
                        <p className="mt-0.5 text-sm text-paper-500 truncate">
                          {item.templateName}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-paper-400">{item.spec}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium text-paper-900">
                        ¥{item.unitPrice.toFixed(2)}
                      </p>
                      <p className="mt-0.5 text-sm text-paper-500">x{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-500" />
                收货地址
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-paper-900">
                      {order.receiverInfo.name}
                    </span>
                    <span className="text-paper-600">{order.receiverInfo.phone}</span>
                  </div>
                  <p className="mt-1 text-sm text-paper-600">
                    {order.receiverInfo.province}
                    {order.receiverInfo.city}
                    {order.receiverInfo.district}
                    {order.receiverInfo.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.isEnterprise && order.splitAccountInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-500" />
                  分账信息
                  <Badge variant="brand" size="sm">
                    企业订单
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-paper-500">分账方式</span>
                  <span className="font-medium text-paper-900">
                    {order.splitAccountInfo.paymentMethodName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-paper-500">分账状态</span>
                  <span className={cn(
                    'flex items-center gap-1 font-medium',
                    order.splitAccountInfo.status === 'completed' ? 'text-forest-600' :
                    order.splitAccountInfo.status === 'processing' ? 'text-brand-600' :
                    order.splitAccountInfo.status === 'failed' ? 'text-red-600' : 'text-paper-600'
                  )}>
                    {order.splitAccountInfo.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                    {order.splitAccountInfo.status === 'failed' && <AlertCircle className="w-4 h-4" />}
                    {order.splitAccountInfo.status === 'completed' ? '已完成' :
                     order.splitAccountInfo.status === 'processing' ? '处理中' :
                     order.splitAccountInfo.status === 'failed' ? '失败' : '待处理'}
                  </span>
                </div>
                {order.splitAccountInfo.completedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-paper-500">完成时间</span>
                    <span className="font-medium text-paper-900">
                      {order.splitAccountInfo.completedAt}
                    </span>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-paper-200">
                  <p className="text-sm font-medium text-paper-900 mb-3">分账明细</p>
                  <div className="space-y-3">
                    {order.splitAccountInfo.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'w-2 h-2 rounded-full',
                            item.status === 'completed' ? 'bg-forest-500' :
                            item.status === 'failed' ? 'bg-red-500' : 'bg-brand-500'
                          )} />
                          <span className="text-sm text-paper-700">{item.party}</span>
                          <span className="text-xs text-paper-400">
                            ({(item.ratio * 100).toFixed(0)}%)
                          </span>
                        </div>
                        <span className="text-sm font-medium text-paper-900">
                          ¥{(item.amount / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">金额明细</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-paper-500">商品金额</span>
                <span className="text-paper-900">¥{order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-paper-500">运费</span>
                <span className="text-paper-900">
                  {order.shippingFee === 0 ? '免运费' : `¥${order.shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-paper-500">优惠</span>
                <span className="text-brand-500">-¥{order.discount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-paper-200">
                <div className="flex items-center justify-between">
                  <span className="text-paper-700 font-medium">实付金额</span>
                  <span className="text-xl font-display font-semibold text-brand-500">
                    ¥{order.payableAmount.toFixed(2)}
                  </span>
                </div>
                {order.paymentMethod && (
                  <p className="mt-1 text-right text-xs text-paper-400">
                    支付方式：{order.paymentMethod}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {order.remark && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">订单备注</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-paper-600">{order.remark}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-3">
              {order.status === 'pending' && (
                <Button className="w-full" variant="primary">
                  去支付
                </Button>
              )}
              {order.status === 'shipped' && (
                <Button className="w-full" variant="primary">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  确认收货
                </Button>
              )}
              {order.status === 'completed' && (
                <Button className="w-full" variant="primary">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  再次购买
                </Button>
              )}
              {(order.status === 'producing' || order.status === 'shipped') && (
                <Button className="w-full" variant="secondary">
                  <Truck className="w-4 h-4 mr-2" />
                  查看物流
                </Button>
              )}
              {(order.status === 'shipped' || order.status === 'completed') && (
                <Button className="w-full" variant="secondary">
                  申请售后
                </Button>
              )}
              <Button className="w-full" variant="ghost">
                <Phone className="w-4 h-4 mr-2" />
                联系客服
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
