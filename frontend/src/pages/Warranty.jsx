import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, message, Space, Descriptions, Timeline, QRCode, Row, Col } from 'antd';
import { SafetyCertificateOutlined, ClockCircleOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { productAPI } from '../api';
import dayjs from 'dayjs';

const Warranty = () => {
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentWarranty, setCurrentWarranty] = useState(null);

  useEffect(() => {
    loadWarranties();
  }, []);

  const loadWarranties = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getWarranties();
      setWarranties(res.data || []);
    } catch (err) {
      message.error('加载质保信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (record) => {
    setCurrentWarranty(record);
    setDetailVisible(true);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      active: { color: 'success', icon: <CheckCircleOutlined />, text: '有效' },
      expired: { color: 'default', icon: <ClockCircleOutlined />, text: '已过期' },
      transferred: { color: 'blue', icon: <SafetyCertificateOutlined />, text: '已过户' },
      void: { color: 'warning', icon: <WarningOutlined />, text: '已作废' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return (
      <Tag color={info.color} icon={info.icon}>
        {info.text}
      </Tag>
    );
  };

  const getRemainingDays = (warranty) => {
    const endDate = dayjs(warranty.end_date);
    const now = dayjs();
    return endDate.diff(now, 'day');
  };

  const columns = [
    {
      title: '电子质保卡号',
      dataIndex: 'warranty_no',
      render: (v) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontFamily: 'monospace' }}>{v}</span>
        </Space>
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'product_name',
    },
    {
      title: '购买日期',
      dataIndex: 'purchase_date',
      render: (v) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '质保期限',
      render: (_, record) => (
        <div>
          <div>{record.warranty_months}个月</div>
          <div style={{ color: '#999', fontSize: 12 }}>
            至 {dayjs(record.end_date).format('YYYY-MM-DD')}
          </div>
        </div>
      ),
    },
    {
      title: '剩余天数',
      render: (_, record) => {
        const days = getRemainingDays(record);
        if (record.status !== 'active') return '-';
        return (
          <span style={{ color: days > 30 ? '#52c41a' : days > 0 ? '#faad14' : '#f5222d' }}>
            {days > 0 ? `${days}天` : '已到期'}
          </span>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v) => getStatusTag(v),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewDetail(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  const stats = [
    {
      title: '有效质保',
      value: warranties.filter(w => w.status === 'active').length,
      color: '#52c41a',
    },
    {
      title: '即将到期（30天内）',
      value: warranties.filter(w => w.status === 'active' && getRemainingDays(w) > 0 && getRemainingDays(w) <= 30).length,
      color: '#faad14',
    },
    {
      title: '已过期',
      value: warranties.filter(w => w.status === 'expired').length,
      color: '#999',
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>电子质保证书</h2>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          您购买的燃气具、家电等商品均提供电子质保证书，扫码可查询真伪和保修服务
        </p>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {stats.map((stat, idx) => (
          <Col span={8} key={idx}>
            <Card className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, color: '#666' }}>{stat.title}</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: 28, color: stat.color, fontWeight: 'bold' }}>
                    {stat.value}
                  </p>
                </div>
                <SafetyCertificateOutlined style={{ fontSize: 36, color: stat.color + '40' }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} title="质保卡列表">
        <Table
          columns={columns}
          dataSource={warranties}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <Card size="small" style={{ background: '#fafafa' }}>
                <Descriptions column={4} size="small">
                  <Descriptions.Item label="安装日期">
                    {record.install_date ? dayjs(record.install_date).format('YYYY-MM-DD') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="安装人员">{record.installer_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="商品规格">{record.product_spec || '-'}</Descriptions.Item>
                  <Descriptions.Item label="商品品牌">{record.product_brand || '-'}</Descriptions.Item>
                </Descriptions>
              </Card>
            ),
          }}
        />
      </Card>

      <Modal
        title="电子质保详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentWarranty && (
          <div>
            <Card style={{ marginBottom: 16, textAlign: 'center', background: 'linear-gradient(135deg, #1890ff20, #1890ff05)' }}>
              <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 8 }} />
              <h3 style={{ margin: 0 }}>电子质保证书</h3>
              <p style={{ margin: '8px 0', fontFamily: 'monospace', fontSize: 16, color: '#1890ff' }}>
                {currentWarranty.warranty_no}
              </p>
              {getStatusTag(currentWarranty.status)}
            </Card>

            <Row gutter={24}>
              <Col span={16}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="商品名称">{currentWarranty.product_name}</Descriptions.Item>
                  <Descriptions.Item label="商品规格">{currentWarranty.product_spec || '-'}</Descriptions.Item>
                  <Descriptions.Item label="商品品牌">{currentWarranty.product_brand || '-'}</Descriptions.Item>
                  <Descriptions.Item label="购买日期">{dayjs(currentWarranty.purchase_date).format('YYYY-MM-DD')}</Descriptions.Item>
                  <Descriptions.Item label="安装日期">{currentWarranty.install_date ? dayjs(currentWarranty.install_date).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="安装人员">{currentWarranty.installer_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="质保期限">{currentWarranty.warranty_months}个月</Descriptions.Item>
                  <Descriptions.Item label="有效期至">{dayjs(currentWarranty.end_date).format('YYYY-MM-DD')}</Descriptions.Item>
                  <Descriptions.Item label="购买订单">
                    <Button type="link" size="small">{currentWarranty.order_no}</Button>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <Card size="small" title="扫码验真">
                  <QRCode value={`https://gas.example.com/warranty/verify/${currentWarranty.warranty_no}`} size={160} />
                  <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: 12 }}>
                    扫描二维码验证质保真伪
                  </p>
                </Card>
              </Col>
            </Row>

            <Card title="维修记录" size="small" bordered={false} style={{ marginTop: 16, background: '#fafafa' }}>
              {(currentWarranty.repair_logs || []).length > 0 ? (
                <Timeline
                  items={currentWarranty.repair_logs.map(log => ({
                    children: (
                      <div>
                        <p style={{ margin: 0 }}>{log.service_type}</p>
                        <p style={{ margin: 0, color: '#666', fontSize: 12 }}>{log.description}</p>
                        <p style={{ margin: 0, color: '#999', fontSize: 12 }}>
                          {log.technician} · {dayjs(log.service_date).format('YYYY-MM-DD')}
                        </p>
                      </div>
                    ),
                  }))}
                />
              ) : (
                <p style={{ color: '#999', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                  暂无维修记录
                </p>
              )}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Warranty;
