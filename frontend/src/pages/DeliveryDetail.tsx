import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPut, apiPost, formatCurrency, formatDate, getStatusText, getStatusBadgeClass } from '../api';
import type { Delivery, Order } from '../api';

export default function DeliveryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [downloadUrl, setDownloadUrl] = useState('');
  const [extraCount, setExtraCount] = useState('');
  const [extraFee, setExtraFee] = useState('');
  const [selectionCount, setSelectionCount] = useState('');
  const [retouchingCount, setRetouchingCount] = useState('');

  const [showCreateDelivery, setShowCreateDelivery] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [channel, setChannel] = useState('网盘');

  const searchParams = new URLSearchParams(window.location.search);
  const orderIdFromQuery = searchParams.get('order_id');

  function loadData() {
    if (!id && !orderIdFromQuery) return;
    setLoading(true);
    setError('');
    const promises: Promise<void>[] = [];

    if (id) {
      promises.push(
        apiGet<Delivery>(`/api/deliveries/${id}`)
          .then((d) => {
            setDelivery(d);
            setDownloadUrl(d.download_url || '');
            if (d.order_id) {
              return apiGet<Order>(`/api/orders/${d.order_id}`).then(setOrder);
            }
          })
          .catch((err) => setError(err.message))
      );
    }

    if (orderIdFromQuery) {
      promises.push(
        apiGet<Order>(`/api/orders/${orderIdFromQuery}`)
          .then((o) => {
            setOrder(o);
            setShowCreateDelivery(true);
            setAlbumName(o.client_name + ' - ' + o.shoot_type + '专辑');
          })
          .catch((err) => setError(err.message))
      );
    }

    Promise.all(promises).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [id, orderIdFromQuery]);

  async function handleCreateDelivery() {
    if (!orderIdFromQuery || !albumName) return;
    setActionError('');
    try {
      const created = await apiPost<Delivery>('/api/deliveries', {
        order_id: Number(orderIdFromQuery),
        album_name: albumName,
        delivery_date: deliveryDate || null,
        channel: channel,
      });
      setActionSuccess('交付创建成功');
      setShowCreateDelivery(false);
      setTimeout(() => {
        window.location.href = `/deliveries/${created.id}`;
      }, 1000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '创建失败');
    }
  }

  async function handleAction(action: string, body?: Record<string, unknown>) {
    if (!delivery) return;
    setActionError('');
    setActionSuccess('');
    try {
      await apiPut(`/api/deliveries/${delivery.id}`, { action, ...body });
      setActionSuccess('操作成功');
      loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作失败');
    }
  }

  async function handleConfirm() {
    if (!delivery) return;
    setActionError('');
    setActionSuccess('');
    try {
      await apiPut(`/api/deliveries/${delivery.id}`, { action: 'confirm_delivery' });
      setActionSuccess('交付已确认');
      loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作失败');
    }
  }

  function clearSuccess() {
    setActionSuccess('');
  }

  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(clearSuccess, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="notice error">加载失败：{error}</div>;

  if (showCreateDelivery && order) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1>创建交付</h1>
            <p>基于订单创建交付记录</p>
          </div>
          <Link to="/orders" className="btn btn-secondary">返回订单列表</Link>
        </div>

        {actionError && <div className="notice error">{actionError}</div>}
        {actionSuccess && <div className="notice success">{actionSuccess}</div>}

        <div className="card">
          <h3 className="section-title">订单信息</h3>
          <div className="detail-grid">
            <div className="detail-field">
              <div className="label">订单号</div>
              <div className="value">{order.order_no}</div>
            </div>
            <div className="detail-field">
              <div className="label">客户</div>
              <div className="value">{order.client_name}</div>
            </div>
            <div className="detail-field">
              <div className="label">拍摄类型</div>
              <div className="value">{order.shoot_type}</div>
            </div>
            <div className="detail-field">
              <div className="label">订单金额</div>
              <div className="value">{formatCurrency(order.amount)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">交付信息</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>相册名称 <span className="required">*</span></label>
              <input type="text" value={albumName} onChange={(e) => setAlbumName(e.target.value)} required placeholder="请输入相册名称" />
            </div>
            <div className="form-group">
              <label>预计交付日期</label>
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>交付渠道</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="网盘">网盘</option>
                <option value="云相册">云相册</option>
                <option value="邮件">邮件</option>
                <option value="硬盘">硬盘寄送</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleCreateDelivery} disabled={!albumName}>
              创建交付
            </button>
            <Link to="/orders" className="btn btn-secondary">取消</Link>
          </div>
        </div>
      </>
    );
  }

  if (!delivery) return null;

  const isCompleted = delivery.delivery_confirmed === 1;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>交付详情</h1>
          <p>{delivery.album_name} · {delivery.order_no}</p>
        </div>
        <div className="inline-flex">
          <Link to="/deliveries" className="btn btn-secondary">返回列表</Link>
          {order && (
            <Link to={`/orders/${order.id}`} className="btn btn-secondary">关联订单</Link>
          )}
        </div>
      </div>

      {actionError && <div className="notice error">{actionError}</div>}
      {actionSuccess && <div className="notice success">{actionSuccess}</div>}

      <div className="card">
        <h3 className="section-title">总进度</h3>
        <div className="progress-bar" style={{ height: 16 }}>
          <div
            className={`fill ${delivery.progress >= 100 ? 'ok' : delivery.progress >= 50 ? '' : 'warn'}`}
            style={{ width: `${delivery.progress}%` }}
          />
        </div>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--gray-600)' }}>
          当前进度 {delivery.progress}%
        </p>
      </div>

      <div className="detail-grid">
        <div className="detail-field">
          <div className="label">相册名称</div>
          <div className="value">{delivery.album_name}</div>
        </div>
        <div className="detail-field">
          <div className="label">客户</div>
          <div className="value">{delivery.client_name}</div>
        </div>
        <div className="detail-field">
          <div className="label">交付渠道</div>
          <div className="value">{delivery.channel || '-'}</div>
        </div>
        <div className="detail-field">
          <div className="label">状态</div>
          <div className="value">
            <span className={`badge ${getStatusBadgeClass(delivery.status)}`}>
              {getStatusText(delivery.status)}
            </span>
          </div>
        </div>
        <div className="detail-field">
          <div className="label">订单金额</div>
          <div className="value">{formatCurrency(delivery.order_amount)}</div>
        </div>
        <div className="detail-field">
          <div className="label">已付金额</div>
          <div className="value">{formatCurrency(delivery.paid_amount)}</div>
        </div>
        {delivery.delivery_date && (
          <div className="detail-field">
            <div className="label">预计交付</div>
            <div className="value">{formatDate(delivery.delivery_date)}</div>
          </div>
        )}
        {delivery.confirmed_at && (
          <div className="detail-field">
            <div className="label">确认时间</div>
            <div className="value">{formatDate(delivery.confirmed_at)}</div>
          </div>
        )}
      </div>

      <div className="card-grid">
        <div className="card">
          <h3 className="section-title">选片阶段</h3>
          <div className="detail-grid">
            <div className="detail-field">
              <div className="label">选片状态</div>
              <div className="value">
                <span className={`badge ${delivery.selection_done ? 'ok' : 'warn'}`}>
                  {delivery.selection_done ? '已完成' : '未开始'}
                </span>
              </div>
            </div>
            <div className="detail-field">
              <div className="label">已选数量</div>
              <div className="value">{delivery.selection_count || 0} 张</div>
            </div>
          </div>
          {!isCompleted && (
            <div className="action-row">
              {!delivery.selection_done && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAction('start_selection')}
                >
                  开始选片
                </button>
              )}
              {delivery.selection_done === 0 && !delivery.selection_count && (
                <>
                  <input
                    type="number"
                    value={selectionCount}
                    onChange={(e) => setSelectionCount(e.target.value)}
                    placeholder="选片数量"
                    min={0}
                    style={{ width: 120, height: 28, padding: '0 10px', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-sm)' }}
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAction('complete_selection', { selection_count: Number(selectionCount) })}
                    disabled={!selectionCount}
                  >
                    完成选片
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="section-title">修图阶段</h3>
          <div className="detail-grid">
            <div className="detail-field">
              <div className="label">修图阶段</div>
              <div className="value">
                <span className={`badge ${delivery.retouching_stage === '已完成' ? 'ok' : delivery.retouching_stage === '修图中' ? 'active' : 'warn'}`}>
                  {delivery.retouching_stage || '未开始'}
                </span>
              </div>
            </div>
            <div className="detail-field">
              <div className="label">修图数量</div>
              <div className="value">{delivery.retouching_count || 0} 张</div>
            </div>
          </div>
          {!isCompleted && delivery.selection_done && (
            <div className="action-row">
              {delivery.retouching_stage !== '已完成' && delivery.retouching_stage !== '修图中' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAction('start_retouching')}
                >
                  开始修图
                </button>
              )}
              {delivery.retouching_stage === '修图中' && (
                <>
                  <input
                    type="number"
                    value={retouchingCount}
                    onChange={(e) => setRetouchingCount(e.target.value)}
                    placeholder="修图数量"
                    min={0}
                    style={{ width: 120, height: 28, padding: '0 10px', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-sm)' }}
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAction('complete_retouching', { retouching_count: Number(retouchingCount) })}
                    disabled={!retouchingCount}
                  >
                    完成修图
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="section-title">加修服务</h3>
          <div className="detail-grid">
            <div className="detail-field">
              <div className="label">加修数量</div>
              <div className="value">{delivery.extra_retouch_count || 0} 张</div>
            </div>
            <div className="detail-field">
              <div className="label">加修费用</div>
              <div className="value">{formatCurrency(delivery.extra_retouch_fee)}</div>
            </div>
          </div>
          {!isCompleted && (
            <div className="action-row">
              <input
                type="number"
                value={extraCount}
                onChange={(e) => setExtraCount(e.target.value)}
                placeholder="加修张数"
                min={0}
                style={{ width: 120, height: 28, padding: '0 10px', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-sm)' }}
              />
              <input
                type="number"
                value={extraFee}
                onChange={(e) => setExtraFee(e.target.value)}
                placeholder="加修费用"
                min={0}
                style={{ width: 120, height: 28, padding: '0 10px', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-sm)' }}
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleAction('add_extra_retouch', { count: Number(extraCount), fee: Number(extraFee || 0) })}
                disabled={!extraCount}
              >
                添加加修
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="section-title">成片下载</h3>
          <div className="detail-grid">
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
              <div className="label">下载链接</div>
              <div className="value">
                {delivery.download_url ? (
                  <a href={delivery.download_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                    {delivery.download_url}
                  </a>
                ) : '未设置'}
              </div>
            </div>
          </div>
          {!isCompleted && (
            <div className="action-row">
              <input
                type="text"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="输入下载链接"
                style={{ flex: 1, height: 28, padding: '0 10px', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-sm)' }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleAction('set_download_url', { download_url: downloadUrl })}
                disabled={!downloadUrl}
              >
                设置链接
              </button>
            </div>
          )}
        </div>
      </div>

      {!isCompleted && (
        <div className="card">
          <h3 className="section-title">确认交付</h3>
          <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 12 }}>
            确认交付后进度将标记为 100%，订单进入已完成状态
          </p>
          <div className="detail-grid" style={{ marginBottom: 12 }}>
            <div className="detail-field">
              <div className="label">选片完成</div>
              <div className="value">
                <span className={`badge ${delivery.selection_done ? 'ok' : 'warn'}`}>
                  {delivery.selection_done ? '是' : '否'}
                </span>
              </div>
            </div>
            <div className="detail-field">
              <div className="label">修图完成</div>
              <div className="value">
                <span className={`badge ${delivery.retouching_stage === '已完成' ? 'ok' : 'warn'}`}>
                  {delivery.retouching_stage === '已完成' ? '是' : '否'}
                </span>
              </div>
            </div>
            <div className="detail-field">
              <div className="label">下载链接</div>
              <div className="value">
                <span className={`badge ${delivery.download_url ? 'ok' : 'warn'}`}>
                  {delivery.download_url ? '已设置' : '未设置'}
                </span>
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!delivery.selection_done || !delivery.download_url}
          >
            确认交付
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="card">
          <div className="notice success">
            交付已确认，完成时间：{delivery.confirmed_at ? formatDate(delivery.confirmed_at) : '-'}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="section-title">交付日志</h3>
        <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 2 }}>
          <p>• 创建时间：{delivery.created_at ? formatDate(delivery.created_at) : '-'}</p>
          {delivery.selection_done && <p>• 选片完成：{delivery.selection_count} 张</p>}
          {delivery.retouching_stage && <p>• 修图阶段：{delivery.retouching_stage}（{delivery.retouching_count || 0} 张）</p>}
          {delivery.extra_retouch_count > 0 && <p>• 加修服务：{delivery.extra_retouch_count} 张，费用 {formatCurrency(delivery.extra_retouch_fee)}</p>}
          {delivery.download_url && <p>• 下载链接：已设置</p>}
          {delivery.delivery_confirmed && <p>• 交付确认：{delivery.confirmed_at ? formatDate(delivery.confirmed_at) : '-'}</p>}
        </div>
      </div>
    </>
  );
}
