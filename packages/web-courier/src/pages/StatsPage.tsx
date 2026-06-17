import React, { useEffect, useState } from 'react';
import { Card, List, Avatar, Tag, Statistic, Progress, Divider, Button } from 'antd';
import { TrophyOutlined, RiseOutlined, WalletOutlined, ClockCircleOutlined, StarOutlined } from '@ant-design/icons';
import api from '@/api';
import dayjs from 'dayjs';

const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<any>({ rating: 5.0 });
  useEffect(() => { api.get('/courier/stats/today').then((r: any) => setStats(r.data)).catch(() => {}); }, []);
  const weekData = Array.from({ length: 7 }, (_, i) => ({ date: dayjs().subtract(6 - i, 'day').format('MM-DD'), count: 3 + Math.floor(Math.random() * 12), income: 40 + Math.floor(Math.random() * 200) }));
  const weekTotal = weekData.reduce((a, b) => ({ count: a.count + b.count, income: a.income + b.income }), { count: 0, income: 0 });

  return (
    <div>
      <div className="courier-header">
        <div style={{ fontSize: 20, fontWeight: 600 }}>📊 我的绩效</div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>本月 · {dayjs().format('YYYY年MM月')}</div>
      </div>

      <div style={{ margin: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <Card style={{ borderRadius: 12 }}>
          <Statistic title={<span><TrophyOutlined /> 本月完成</span>} value={weekTotal.count * 4} suffix="单" valueStyle={{ color: '#165DFF' }} />
        </Card>
        <Card style={{ borderRadius: 12 }}>
          <Statistic title={<span><WalletOutlined /> 预估收入</span>} value={weekTotal.income * 4} prefix="¥" valueStyle={{ color: '#F53F3F' }} />
        </Card>
        <Card style={{ borderRadius: 12 }}>
          <Statistic title={<span><StarOutlined /> 服务评分</span>} value={stats.rating} precision={1} suffix="/ 5.0" valueStyle={{ color: '#FF7D00' }} />
        </Card>
        <Card style={{ borderRadius: 12 }}>
          <Statistic title={<span><ClockCircleOutlined /> 准时率</span>} value={98.7} precision={1} suffix="%" valueStyle={{ color: '#00B42A' }} />
        </Card>
      </div>

      <Card style={{ margin: 12, borderRadius: 12 }} size="small" title="📈 本周工单趋势">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Tag color="blue">工单量</Tag>
          <Tag color="red">收入(¥)</Tag>
        </div>
        {weekData.map((d, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
              <span>{d.date}</span>
              <span style={{ color: '#165DFF' }}>{d.count}单</span>
              <span style={{ color: '#F53F3F' }}>¥{d.income}</span>
            </div>
            <Progress percent={Math.min(100, d.count * 8)} showInfo={false} size="small" strokeColor="#165DFF" />
          </div>
        ))}
      </Card>

      <Card style={{ margin: 12, borderRadius: 12 }} size="small" title="💰 结算记录">
        <List
          itemLayout="horizontal"
          dataSource={[
            { t: '2024年6月 第1周', a: 1280, d: '2024-06-09', s: '已发放' },
            { t: '2024年5月 第4周', a: 1560, d: '2024-06-02', s: '已发放' },
            { t: '2024年5月 第3周', a: 1420, d: '2024-05-26', s: '已发放' },
          ]}
          renderItem={(r: any) => (
            <List.Item>
              <List.Item.Meta title={<span>{r.t}</span>} description={`结算日：${r.d}`} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: '#F53F3F' }}>+¥{r.a}</div>
                <Tag color="green" style={{ marginTop: 3 }}>{r.s}</Tag>
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Card style={{ margin: 12, borderRadius: 12 }} size="small" title="🏆 本月荣誉榜">
        <List
          dataSource={[{ n: '李师傅', s: '广州天河支局', c: 286 }, { n: '（我）', s: '广州1号支局', c: 248 }, { n: '王师傅', s: '广州越秀支局', c: 231 }]}
          renderItem={(r: any, i: number) => (
            <List.Item>
              <List.Item.Meta avatar={<Avatar style={{ background: i === 0 ? '#F7BA1E' : i === 1 ? '#C0C4CC' : '#D46B08', color: '#fff' }}>{i + 1}</Avatar>} title={<span>{r.n} {r.n === '（我）' && <Tag color="blue">我</Tag>}</span>} description={r.s} />
              <div style={{ fontWeight: 600 }}>{r.c}单</div>
            </List.Item>
          )}
        />
      </Card>

      <div style={{ padding: 16 }}>
        <Button block size="large" icon={<RiseOutlined />}>查看完整绩效报表</Button>
      </div>
    </div>
  );
};
export default StatsPage;
