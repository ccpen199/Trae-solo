import { useState, useEffect } from 'react';
import { Card, List, Tag, Space, Button, Empty, message, Modal } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, QrcodeOutlined } from '@ant-design/icons';
import { eticketsAPI } from '../api';
import dayjs from 'dayjs';

function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await eticketsAPI.my();
      setTickets(res.tickets || []);
    } catch (err) {
      message.error('加载电子票失败');
    } finally {
      setLoading(false);
    }
  };

  const showQrCode = (ticket) => {
    setSelectedTicket(ticket);
    Modal.info({
      title: '电子票二维码',
      width: 400,
      okText: '关闭',
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}>
            <img src={ticket.qr_code} alt="QR Code" style={{ width: 200, height: 200 }} />
          </div>
          <p style={{ marginBottom: 8 }}><strong>{ticket.ticket_no}</strong></p>
          <p style={{ color: '#666', fontSize: 12 }}>
            请在入场时出示此二维码供闸机核验
          </p>
          <Tag color={ticket.status === 'used' ? 'gray' : 'green'}>
            {ticket.status === 'used' ? '已使用' : '未使用'}
          </Tag>
        </div>
      )
    });
  };

  return (
    <div className="container" style={{ padding: '24px 20px' }}>
      <Card title="我的票夹" extra={<Button onClick={loadTickets}>刷新</Button>}>
        <List
          loading={loading}
          dataSource={tickets}
          locale={{ emptyText: <Empty description="暂无电子票" /> }}
          renderItem={(ticket) => (
            <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 80,
                      height: 100,
                      background: ticket.status === 'used' ? 'linear-gradient(135deg, #d9d9d9, #bfbfbf)' : 'linear-gradient(135deg, #1890ff, #722ed1)',
                      borderRadius: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff'
                    }}
                  >
                    <QrcodeOutlined style={{ fontSize: 32, marginBottom: 4 }} />
                    <span style={{ fontSize: 10 }}>{ticket.status === 'used' ? '已使用' : '电子票'}</span>
                  </div>
                }
                title={
                  <Space>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{ticket.title}</span>
                    <Tag color={ticket.status === 'used' ? 'gray' : 'green'}>
                      {ticket.status === 'used' ? '已使用' : '有效'}
                    </Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small" style={{ marginTop: 8, width: '100%' }}>
                    <Space size="small" style={{ color: '#666' }}>
                      <CalendarOutlined />
                      <span>{dayjs(ticket.start_time).format('YYYY-MM-DD HH:mm')}</span>
                    </Space>
                    <Space size="small" style={{ color: '#666' }}>
                      <EnvironmentOutlined />
                      <span>{ticket.venue}</span>
                    </Space>
                    <Space size="small">
                      <Tag color="blue">{ticket.ticket_no}</Tag>
                      {ticket.seat_info && (
                        <span style={{ color: '#999', fontSize: 12 }}>
                          {JSON.parse(ticket.seat_info).row}排{JSON.parse(ticket.seat_info).number}座
                        </span>
                      )}
                    </Space>
                  </Space>
                }
              />
              <Button type="primary" icon={<QrcodeOutlined />} onClick={() => showQrCode(ticket)}>
                出示二维码
              </Button>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

export default TicketList;
