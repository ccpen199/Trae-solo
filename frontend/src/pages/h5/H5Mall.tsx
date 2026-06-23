import { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Tabs, Modal, Spin, Empty, InputNumber, Input, message, Avatar } from 'antd';
import { ShoppingCartOutlined, ShopOutlined, StarOutlined } from '@ant-design/icons';
import { mallApi } from '@/api';

export default function H5Mall() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');
  const [detail, setDetail] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [redeemCode, setRedeemCode] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, o]: any = await Promise.all([
        mallApi.products({ pageSize: 50 }),
        mallApi.myOrders({ pageSize: 50 }).catch(() => ({ data: [] })),
      ]);
      setProducts(p.data || []);
      setOrders(o.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const [catFilter, setCatFilter] = useState<string>('ALL');
  const filtered = catFilter === 'ALL' ? products : products.filter((p) => p.category === catFilter);

  const handleOrder = async (p: any) => {
    try {
      await mallApi.placeOrder({ productId: p.id, quantity: qty });
      message.success('下单成功，凭券码到店核销');
      fetchAll();
      setDetail(null);
      setTab('orders');
    } catch (e: any) {
      message.error(e?.response?.data?.message || '下单失败');
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    try {
      const r: any = await mallApi.redeem({ code: redeemCode.trim() });
      message.success(`核销成功：${r.MallOrder?.MallProduct?.name || '商品'}`);
      setRedeemCode('');
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '核销失败');
    }
  };

  const catIcon: any = { FOOD: '🍜', LIFE: '🎁', SERVICE: '🎫', GOODS: '🛍️', OTHER: '🏷️' };
  const catName: any = { FOOD: '美食餐饮', LIFE: '生活日用', SERVICE: '服务票券', GOODS: '实物商品', OTHER: '其他' };

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}><Spin size="large" /></div>;

  return (
    <div>
      <Card style={{ marginBottom: 12, borderRadius: 10 }} bodyStyle={{ padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🎫 券码核销</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} placeholder="请输入券码" allowClear />
          <Button type="primary" onClick={handleRedeem}>核销</Button>
        </div>
      </Card>

      <Tabs activeKey={tab} onChange={setTab}
        items={[
          { key: 'products', label: `商品 (${products.length})` },
          { key: 'orders', label: `我的订单 (${orders.length})` },
        ]}
      />

      {tab === 'products' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <Tag.CheckableTag checked={catFilter === 'ALL'} onChange={() => setCatFilter('ALL')} style={{ padding: '4px 12px', borderRadius: 16 }}>
              全部
            </Tag.CheckableTag>
            {categories.map((c) => (
              <Tag.CheckableTag key={c as string} checked={catFilter === c} onChange={() => setCatFilter(c as string)}
                style={{ padding: '4px 12px', borderRadius: 16 }}>
                {catIcon[c]} {catName[c] || c}
              </Tag.CheckableTag>
            ))}
          </div>

          <List
            grid={{ gutter: 8, column: 2 }}
            dataSource={filtered}
            locale={{ emptyText: <Empty description="暂无商品" /> }}
            renderItem={(p) => (
              <Card style={{ borderRadius: 10, overflow: 'hidden' }} bodyStyle={{ padding: 0 }}
                onClick={() => { setDetail(p); setQty(1); }}
              >
                <div style={{ height: 100, background: `linear-gradient(135deg, #f5f5f5, #e6f7ff)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>
                  {catIcon[p.category] || '🛍️'}
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2, height: 16, overflow: 'hidden' }}>{p.description}</div>
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: '#f5222d', fontWeight: 700, fontSize: 16 }}>¥{p.price}</span>
                      <span style={{ fontSize: 10, color: '#999', textDecoration: 'line-through', marginLeft: 4 }}>¥{p.originalPrice}</span>
                    </div>
                    <Tag color={p.stock > 0 ? 'green' : 'red'} style={{ margin: 0 }}>
                      {p.stock > 0 ? `库存${p.stock}` : '售罄'}
                    </Tag>
                  </div>
                </div>
              </Card>
            )}
          />
        </div>
      )}

      {tab === 'orders' && (
        <List
          dataSource={orders}
          locale={{ emptyText: <Empty description="暂无订单" /> }}
          renderItem={(o) => (
            <Card style={{ marginBottom: 12, borderRadius: 10 }} bodyStyle={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar style={{ background: '#fff7e6', color: '#fa8c16' }}>{catIcon[o.MallProduct?.category] || '🛍️'}</Avatar>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{o.MallProduct?.name}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>数量: {o.quantity} | 订单号: {o.orderNo}</div>
                  </div>
                </div>
                <Tag color={o.status === 'PAID' ? 'blue' : o.status === 'USED' ? 'green' : o.status === 'EXPIRED' ? 'default' : 'orange'}>
                  {o.status === 'PAID' ? '待使用' : o.status === 'USED' ? '已使用' : o.status === 'EXPIRED' ? '已过期' : o.status}
                </Tag>
              </div>
              <div style={{ padding: 10, background: o.status === 'PAID' ? '#e6f4ff' : '#f5f5f5', borderRadius: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>券码:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 14 }}>{o.code}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span>有效期至:</span>
                  <span>{new Date(o.expireAt).toLocaleDateString()}</span>
                </div>
              </div>
              {o.Merchant && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  <ShopOutlined /> 商家: {o.Merchant.name} | {o.Merchant.address || ''}
                </div>
              )}
            </Card>
          )}
        />
      )}

      <Modal open={!!detail} onCancel={() => setDetail(null)} footer={null} width={340} title="商品详情">
        {detail && (
          <div>
            <div style={{ height: 160, borderRadius: 10,
              background: `linear-gradient(135deg, #fff7e6, #ffe7ba)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, marginBottom: 16 }}>
              {catIcon[detail.category] || '🛍️'}
            </div>
            <h3 style={{ margin: 0 }}>{detail.name}</h3>
            <div style={{ margin: '8px 0 16px' }}>
              <span style={{ fontSize: 22, color: '#f5222d', fontWeight: 700 }}>¥{detail.price}</span>
              <span style={{ fontSize: 12, color: '#999', textDecoration: 'line-through', marginLeft: 8 }}>¥{detail.originalPrice}</span>
              <Tag color="blue" style={{ marginLeft: 8 }}>{catName[detail.category] || detail.category}</Tag>
            </div>
            <p style={{ color: '#666', fontSize: 13, lineHeight: 1.6 }}>{detail.description || '暂无描述'}</p>
            <div style={{ padding: 10, background: '#fafafa', borderRadius: 8, fontSize: 12, lineHeight: 1.8 }}>
              <div>库存: {detail.stock} 件</div>
              <div>商家: {detail.Merchant?.name || '平台自营'}</div>
              <div>地址: {detail.Merchant?.address || '—'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <span>数量:</span>
              <InputNumber min={1} max={detail.stock || 99} value={qty} onChange={(v) => setQty(v as number)} />
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>合计: ¥{(detail.price * qty).toFixed(2)}</span>
            </div>
            <Button type="primary" block icon={<ShoppingCartOutlined />} disabled={detail.stock <= 0}
              onClick={() => handleOrder(detail)}>
              {detail.stock > 0 ? '立即购买' : '已售罄'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
