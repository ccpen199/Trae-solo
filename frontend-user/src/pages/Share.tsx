import { useEffect, useState } from 'react';
import { commissionApi } from '../api/modules';
import { useToast } from '../App';
import Header from '../components/Header';

export default function Share() {
  const toast = useToast();
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res: any = await commissionApi.shareCode();
      if (res.success) {
        setShareInfo(res.data);
      }
    } catch (e: any) {
      toast.show(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async () => {
    if (!shareInfo?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareInfo.shareUrl);
      setCopied(true);
      toast.show('复制成功', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('textarea');
      input.value = shareInfo.shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      toast.show('复制成功', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyCode = async () => {
    if (!shareInfo?.code) return;
    try {
      await navigator.clipboard.writeText(shareInfo.code);
      toast.show('邀请码已复制', 'success');
    } catch {
      const input = document.createElement('textarea');
      input.value = shareInfo.code;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      toast.show('邀请码已复制', 'success');
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="分享赚钱" />
        <div className="empty-state"><div className="icon">⏳</div>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <Header title="分享赚钱" />

      <div style={{
        margin: 16, padding: 32,
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #ffecd2 100%)',
        borderRadius: 24, color: 'white',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />

        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ fontSize: 18, opacity: 0.95, marginBottom: 12 }}>👥 您的专属邀请码</div>
          <div
            onClick={copyCode}
            style={{
              fontSize: 42, fontWeight: 900, letterSpacing: 4,
              background: 'rgba(255,255,255,0.25)', padding: '14px 28px', borderRadius: 16,
              display: 'inline-block', backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            {shareInfo?.code?.slice(0, 8).toUpperCase()}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>点击复制邀请码</div>
          <div style={{ marginTop: 16, fontSize: 14, opacity: 0.9 }}>
            邀请好友注册，双方立得优惠券
          </div>
          {shareInfo?.nickname && (
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
              来自 {shareInfo.nickname} 的邀请
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="text-bold mb-16" style={{ fontSize: 16, marginBottom: 16 }}>💰 三级佣金制度</div>
        <div className="grid-3">
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800,
              margin: '0 auto 8px',
              boxShadow: '0 4px 12px rgba(255,107,107,0.3)'
            }}>1</div>
            <div className="text-bold">一级好友</div>
            <div className="text-red text-bold" style={{ fontSize: 18, marginTop: 4 }}>
              {shareInfo?.rates?.level1 ? `${(shareInfo.rates.level1 * 100).toFixed(0)}%` : '0%'}
            </div>
            <div className="text-sm text-gray">直接邀请</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffa36b, #ee9a5a)',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800,
              margin: '0 auto 8px',
              boxShadow: '0 4px 12px rgba(255,163,107,0.3)'
            }}>2</div>
            <div className="text-bold">二级好友</div>
            <div style={{ fontSize: 18, marginTop: 4, color: '#fa8c16', fontWeight: 800 }}>
              {shareInfo?.rates?.level2 ? `${(shareInfo.rates.level2 * 100).toFixed(0)}%` : '0%'}
            </div>
            <div className="text-sm text-gray">好友的好友</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffcc6b, #eecc5a)',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800,
              margin: '0 auto 8px',
              boxShadow: '0 4px 12px rgba(255,204,107,0.3)'
            }}>3</div>
            <div className="text-bold">三级好友</div>
            <div style={{ fontSize: 18, marginTop: 4, color: '#d4b106', fontWeight: 800 }}>
              {shareInfo?.rates?.level3 ? `${(shareInfo.rates.level3 * 100).toFixed(0)}%` : '0%'}
            </div>
            <div className="text-sm text-gray">好友邀请的好友</div>
          </div>
        </div>

        <div className="divider" style={{ margin: '20px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <div className="text-sm text-gray">
            好友消费后，您将获得对应比例的佣金奖励
          </div>
          <div className="text-sm text-green" style={{ marginTop: 4, fontWeight: 500 }}>
            佣金自动到账，可随时提现
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div className="text-bold mb-16" style={{ fontSize: 16, marginBottom: 16 }}>🔗 我的分享链接</div>
        <div style={{
          padding: 14,
          background: '#f5f7ff', borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 10,
          border: '1px dashed #667eea44'
        }}>
          <div style={{
            flex: 1,
            fontSize: 13,
            color: '#667eea',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'monospace'
          }}>
            {shareInfo?.shareUrl}
          </div>
          <button
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: 13 }}
            onClick={copyUrl}
          >
            {copied ? '✓ 已复制' : '复制链接'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div className="text-bold mb-16" style={{ fontSize: 16, marginBottom: 16 }}>🎯 分享攻略</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            {
              icon: '💬',
              title: '分享给好友',
              desc: '将链接分享给微信好友、微信群',
              tip: '好友注册后即永久绑定，首单立减20元'
            },
            {
              icon: '�',
              title: '好友下单',
              desc: '好友完成任意消费',
              tip: '您立即获得佣金，好友订单金额比例佣金'
            },
            {
              icon: '💰',
              title: '佣金到账',
              desc: '订单完成后自动结算',
              tip: '可随时提现到账户余额'
            }
          ].map((step, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, #f0f4ff, #e8eeff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0
              }}>
                {step.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div className="text-bold">步骤{idx + 1}: {step.title}</div>
                <div className="text-sm" style={{ marginTop: 4, color: '#666' }}>{step.desc}</div>
                <div className="text-sm text-green" style={{ marginTop: 4, fontWeight: 500 }}>
                  ✓ {step.tip}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div className="text-bold mb-12" style={{ marginBottom: 12 }}>📌 温馨提示</div>
        <div style={{ fontSize: 12, color: '#999', lineHeight: 1.8 }}>
          <div>• 佣金将在订单完成后自动结算到您的账户</div>
          <div>• 如有退款订单，相应佣金将被扣除</div>
          <div>• 邀请关系一旦绑定，永久有效</div>
          <div>• 最终解释权归平台所有</div>
        </div>
      </div>

      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'white', padding: '12px 16px 20px',
        borderTop: '1px solid #eee',
        zIndex: 100
      }}>
        <button
          className="btn-primary btn-block"
          style={{
            background: 'linear-gradient(135deg, #f093fb, #f5576c)',
            fontWeight: 600
          }}
          onClick={copyUrl}
        >
          {copied ? '✓ 链接已复制' : '立即分享赚佣金'}
        </button>
      </div>
    </div>
  );
}
