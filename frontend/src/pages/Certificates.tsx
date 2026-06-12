import { useState, useEffect } from 'react';
import { Card, List, Avatar, Typography, Tag, Empty, Modal, QRCode } from 'antd';
import { TrophyOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function Certificates() {
  const [list, setList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/lms/my/certificates').then((d: any) => setList(d.certificates || [])).finally(() => setLoading(false));
  }, []);

  return (
    <Card title={<Title level={5} style={{ margin: 0 }}><TrophyOutlined style={{ color: '#faad14' }} /> 我的证书</Title>}>
      <List
        loading={loading}
        locale={{ emptyText: <Empty description="完成课程后将获得结业证书" /> }}
        dataSource={list}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
        renderItem={(c: any) => (
          <List.Item>
            <Card
              className="card-hover"
              onClick={() => setSelected(c)}
              style={{ background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', cursor: 'pointer', textAlign: 'center', color: '#333', height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
              actions={[<EyeOutlined key="view" onClick={(e) => { e.stopPropagation(); setSelected(c); }} />]}
            >
              <TrophyOutlined style={{ fontSize: 48, color: '#faad14' }} />
              <Title level={5} style={{ marginTop: 12, color: '#333', marginBottom: 4 }}>{c.course_name}</Title>
              <Text style={{ fontSize: 12, color: '#666' }}>获得于 {dayjs(c.issued_at).format('YYYY-MM-DD')}</Text>
            </Card>
          </List.Item>
        )}
      />

      <Modal title="结业证书" open={!!selected} onCancel={() => setSelected(null)} footer={null} width={520}>
        {selected && (
          <div style={{ background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', padding: 32, borderRadius: 8, textAlign: 'center', color: '#333' }}>
            <TrophyOutlined style={{ fontSize: 48, color: '#faad14' }} />
            <Title level={3} style={{ marginTop: 12, color: '#333' }}>结业证书</Title>
            <div style={{ fontSize: 14, margin: '12px 0' }}>已完成《<strong>{selected.course_name}</strong>》</div>
            <Tag color="gold" style={{ fontSize: 14, marginBottom: 8 }}>得分 {selected.score || 100} 分</Tag>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>证书编号：{selected.certificate_no}</div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>颁发日期：{dayjs(selected.issued_at).format('YYYY年MM月DD日')}</div>
            <QRCode value={`${window.location.origin}/cert-verify/${selected.certificate_no}`} size={80} />
            <div style={{ fontSize: 10, color: '#999', marginTop: 8 }}>扫码验证证书</div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
