import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productApi, orderApi } from '../api/modules';
import { useToast, useUser } from '../App';
import Header from '../components/Header';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useUser();
  const [product, setProduct] = useState<any>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [form, setForm] = useState({ account: '', quantity: 1 });
  const [priceResult, setPriceResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (product) calculate();
  }, [product, form.quantity]);

  const loadData = async () => {
    try {
      const [prodRes, promoRes] = await Promise.all([
        productApi.getProductDetail(id!),
        productApi.getPromotions()
      ]);
      if (prodRes.success) setProduct(prodRes.data);
      if (promoRes.success) setPromotions(promoRes.data || []);
    } catch (e: any) {
      toast.show(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculate = async () => {
    if (!product) return;
    try {
      const res: any = await productApi.calculatePrice({
        items: [{
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: form.quantity,
          categoryId: product.category_id
        }]
      });
      if (res.success) setPriceResult(res.data);
    } catch {}
  };

  const getPlaceholder = () => {
    if (!product) return '请输入充值账号';
    if (product.category_name?.includes('话费') || product.category_name?.includes('流量')) return '请输入手机号码';
    if (product.name.includes('会员')) return '请输入手机号/账号';
    return '请输入收货手机号';
  };

  const isPhoneProduct = product && (product?.sku_type === 'recharge' || product?.category_id?.includes('phone') || product?.category_name?.includes('话费') || product?.category_name?.includes('流量'));

  const doOrder = async () => {
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (!form.account) return toast.show('请输入充值账号', 'error');
    if (isPhoneProduct && !/^1\d{10}$/.test(form.account)) return toast.show('手机号格式错误', 'error');
    if (!product || product.stock < form.quantity) return toast.show('库存不足', 'error');

    setOrdering(true);
    try {
      const res: any = await orderApi.create({
        productId: id,
        rechargeAccount: form.account,
        quantity: form.quantity
      });
      if (res.success) {
        toast.show('订单创建成功，正在支付...', 'success');
        setTimeout(async () => {
          try {
            const payRes: any = await orderApi.pay(res.data.id);
            if (payRes.success) {
              toast.show('支付成功', 'success');
              navigate(`/order/${res.data.id}`);
            } else {
              navigate(`/order/${res.data.id}`);
            }
          } catch (pe: any) {
            toast.show(pe.message || '支付失败', 'error');
            navigate(`/order/${res.data.id}`);
          }
        }, 500);
      }
    } catch (e: any) {
      toast.show(e.message || '下单失败', 'error');
    } finally {
      setOrdering(false);
    }
  };

  if (loading || !product) {
    return <div><Header title="商品详情" /><div className="empty-state"><div className="icon">⏳</div>加载中...</div></div>;
  }

  return (
    <div style={{ paddingBottom: 90 }}>
      <Header title="商品详情" />

      <div style={{
        height: 180,
        background: `linear-gradient(135deg, #667eea33 0%, #764ba233 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 48, fontWeight: 700, color: '#667eea',
        margin: 16, borderRadius: 16, letterSpacing: 2
      }}>
        {product.name.slice(0, 8)}
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
              {product.is_hot === 1 && <span className="hot-tag">HOT 热卖</span>}
              <span className="tag tag-blue">{product.sku_type === 'card' ? '卡密发货' : '官方直充'}</span>
              <span className="tag tag-gray">{product.category_name || '虚拟商品'}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>{product.name}</h2>
            <div className="mt-8">
              <span style={{ fontSize: 30, fontWeight: 800, color: '#ff4d4f' }}>
                <small style={{ fontSize: 18 }}>¥</small>{product.price}
              </span>
              {product.face_value && product.face_value > product.price && (
                <span style={{ color: '#999', textDecoration: 'line-through', marginLeft: 10, fontSize: 14 }}>¥{product.face_value}</span>
              )}
              {product.commission_rate > 0 && (
                <span style={{ float: 'right', fontSize: 13, color: '#52c41a', fontWeight: 600 }}>
                  分享赚 ¥{(product.price * product.commission_rate * 0.6).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {promotions.length > 0 && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="flex-between mb-12">
            <span className="text-bold">🎁 优惠活动</span>
            <span className="text-sm text-gray">可叠加使用</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {promotions.slice(0, 3).map(p => (
              <div key={p.id} style={{
                padding: '10px 12px', background: '#fff8f0', borderRadius: 10,
                border: '1px dashed #ffd591', display: 'flex', alignItems: 'center', gap: 10
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #ff9a9e, #fecfef)',
                  padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, color: '#c0443c'
                }}>{p.type === 'full_reduction' ? '满减' : p.type === 'percentage' ? '折扣' : '返现'}</span>
                <span style={{ fontSize: 13, color: '#fa8c16' }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 0 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">{isPhoneProduct ? '📱 充值手机号' : '🔢 充值账号'}</label>
          <input
            className="form-input" type={isPhoneProduct ? 'tel' : 'text'}
            placeholder={getPlaceholder()}
            value={form.account}
            onChange={e => setForm({ ...form, account: e.target.value })}
            style={{ fontSize: 16 }}
          />
        </div>

        <div className="form-group" style={{ marginTop: 16, marginBottom: 0 }}>
          <div className="flex-between" style={{ alignItems: 'center' }}>
            <span className="form-label" style={{ margin: 0 }}>📦 购买数量</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid #e8e8e8', background: '#fafafa',
                fontSize: 18, fontWeight: 600
              }} onClick={() => form.quantity > 1 && setForm({ ...form, quantity: form.quantity - 1 })} disabled={form.quantity <= 1}>−</button>
              <span style={{ fontSize: 16, fontWeight: 600, minWidth: 30, textAlign: 'center' }}>{form.quantity}</span>
              <button style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid #e8e8e8', background: '#fafafa',
                fontSize: 18, fontWeight: 600
              }} onClick={() => form.quantity < 10 && setForm({ ...form, quantity: form.quantity + 1 })} disabled={form.quantity >= 10}>+</button>
            </div>
          </div>
        </div>

        {product.stock <= 10 && product.stock > 0 && (
          <div style={{ color: '#faad14', fontSize: 12, marginTop: 12 }}>⚠️ 库存紧张，仅剩 {product.stock} 件</div>
        )}
        {product.stock === 0 && (
          <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 12 }}>❌ 暂时缺货</div>
        )}
      </div>

      {priceResult?.discountDetails?.length > 0 && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="text-bold mb-12">💰 价格明细</div>
          <div className="flex-between text-sm"><span className="text-gray">商品原价</span><span>¥{priceResult.originalAmount}</span></div>
          {priceResult.discountDetails.map((d: any, i: number) => (
            <div key={i} className="flex-between text-sm mt-8">
              <span className="text-gray">{d.description}</span>
              <span className="text-green">-¥{d.discountAmount}</span>
            </div>
          ))}
          {priceResult.cashbackAmount > 0 && (
            <div className="flex-between text-sm mt-8"><span className="text-gray">返现（确认收货后到账</span><span className="text-red">-¥{priceResult.cashbackAmount}</span></div>
          )}
          <div className="divider" />
          <div className="flex-between">
            <span className="text-bold">实付金额</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#ff4d4f' }}>¥{priceResult.finalAmount}</span>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 0 }}>
        <div className="text-bold mb-12">📋 商品说明</div>
        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
          {product.description || `• 本商品为虚拟商品，售出后不支持退款
• 充值完成后不可取消订单
• 如遇充值失败，系统将自动发起退款
• 请确认充值账号，避免输错造成损失
• 客服工作时间：9:00 - 22:00`}
        </div>
      </div>

      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'white', padding: '12px 16px 20px',
        borderTop: '1px solid #eee', display: 'flex', gap: 12,
        zIndex: 100
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#999', fontSize: 11 }}>合计</div>
          <div style={{ color: '#ff4d4f', fontSize: 22, fontWeight: 800 }}>
            ¥{priceResult?.finalAmount || (product.price * form.quantity)}
          </div>
        </div>
        <button className="btn-primary btn-block" style={{ flex: 1.5, padding: '12px' }} onClick={doOrder}
          disabled={ordering || product.stock === 0}>
          {ordering ? '处理中...' : product.stock === 0 ? '暂时缺货' : '立即购买'}
        </button>
      </div>
    </div>
  );
}
