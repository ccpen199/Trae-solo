import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/client';
import dayjs from 'dayjs';

function AdminInventory() {
  const [syncs, setSyncs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await adminAPI.getInventorySync();
      setSyncs(result || []);
    } catch (e) {
      console.error('Load inventory failed:', e);
    }
  };

  const channelLabels = {
    maoyan: '猫眼',
    damai: '大麦',
    offline: '线下渠道',
  };

  const statusLabels = {
    success: '同步成功',
    syncing: '同步中',
    failed: '同步失败',
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>库存同步</h1>

      <div className="chart-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>活动</th>
              <th>渠道</th>
              <th>外部ID</th>
              <th>可售票数</th>
              <th>状态</th>
              <th>最后同步时间</th>
            </tr>
          </thead>
          <tbody>
            {syncs.map((sync, idx) => (
              <tr key={idx}>
                <td>{sync.event_title}</td>
                <td>{channelLabels[sync.channel] || sync.channel}</td>
                <td>{sync.external_id}</td>
                <td>{sync.available_count}</td>
                <td>
                  <span
                    className={`status-badge ${
                      sync.sync_status === 'success'
                        ? 'status-onsale'
                        : sync.sync_status === 'failed'
                        ? 'status-seckill'
                        : 'status-presale'
                    }`}
                  >
                    {statusLabels[sync.sync_status] || sync.sync_status}
                  </span>
                </td>
                <td>{sync.last_sync_time ? dayjs(sync.last_sync_time).format('YYYY-MM-DD HH:mm') : '-'}</td>
              </tr>
            ))}
            {syncs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                  暂无同步记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminInventory;
