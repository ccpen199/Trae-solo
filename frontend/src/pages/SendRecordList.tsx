import { useEffect, useState } from 'react';
import api from '../utils/api';
import { SendRecord } from '../types';

export default function SendRecordList() {
  const [records, setRecords] = useState<SendRecord[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, [filter]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/send-records${params}`);
      setRecords(res.data.data || []);
    } catch (error) {
      console.error('Load records error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <h1 className="page-title">发送记录</h1>

      <div className="card">
        <div className="filters">
          <div className="filter-item">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">全部状态</option>
              <option value="sent">已发送</option>
              <option value="opened">已打开</option>
              <option value="clicked">已点击</option>
              <option value="bounced">已退信</option>
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>主题</th>
              <th>收件人</th>
              <th>发送人</th>
              <th>状态</th>
              <th>发送时间</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {record.subject}
                </td>
                <td>
                  {record.customer_name}
                  <br />
                  <span style={{ fontSize: 12, color: '#888' }}>{record.customer_email}</span>
                </td>
                <td>{record.sent_by_name}</td>
                <td>
                  <span
                    className={`status-badge ${
                      record.status === 'sent'
                        ? 'status-sent'
                        : record.status === 'opened'
                        ? 'status-active'
                        : record.status === 'clicked'
                        ? 'status-approved'
                        : 'status-critical'
                    }`}
                  >
                    {record.status === 'sent'
                      ? '已发送'
                      : record.status === 'opened'
                      ? '已打开'
                      : record.status === 'clicked'
                      ? '已点击'
                      : record.status === 'bounced'
                      ? '退信'
                      : record.status}
                  </span>
                </td>
                <td>{new Date(record.sent_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
