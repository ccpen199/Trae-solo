import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Tag } from 'antd';
import {
  ShoppingOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';

export default function Home() {
  const [products, setProducts] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    api.get('/merchant/products').then((res) => setProducts(res.data.filter((p: any) => p.status === 'active').length));
    api.get('/orders').then((res) => {
      setOrders(res.data.slice(0, 5));
      setPendingOrders(res.data.filter((o: any) => o.status === 'paid' || o.status === 'pending').length);
      setTotalRevenue(res.data.filter((o: any) => o.status === 'paid' || o.status === 'fulfilled').reduce((s: number, o: any) => s + Number(o.totalAmount), 0));
    });
  }, []);

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card className="card-hover" style={{ borderRadius: 12 }}>
            <Statistic title="在售商品" value={products} prefix={<ShoppingOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="card-hover" style={{ borderRadius: 12 }}>
            <Statistic title="待处理订单" value={pendingOrders} prefix={<ShoppingCartOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="card-hover" style={{ borderRadius: 12 }}>
            <Statistic title="累计营收" value={totalRevenue} precision={2} prefix="¥" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card title="最近订单" style={{ borderRadius: 12 }}>
        <List
          dataSource={orders}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>#{item.id.substring(0, 10)}</span>
                    {(() => {
                      const map: Record<string, any> = {
                        pending: <Tag color="orange">待支付</Tag>,
                        paid: <Tag color="blue">已支付</Tag>,
                        fulfilled: <Tag color="green">已完成</Tag>,
                      };
                      return map[item.status] || <Tag>{item.status}</Tag>;
                    })()}
                  </div>
                }
                description={
                  <div>
                    <div>商品：{item.product?.name} × {item.quantity}</div>
                    <div style={{ color: '#888' }}>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')} · 金额 ¥{item.totalAmount}</div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
