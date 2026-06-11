import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Upload, message, Tabs, List, Avatar, Rate, Timeline, Descriptions } from 'antd';
import { PlusOutlined, EyeOutlined, FileTextOutlined, DollarOutlined, CheckCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';

const { TextArea } = Input;

function VesselTrading() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPublishModalVisible, setIsPublishModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [negotiateForm] = Form.useForm();
  const [negotiateModalVisible, setNegotiateModalVisible] = useState(false);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const data = await apiService.get('/vessel-listings', { status: 'active' });
      setListings(data as any[]);
    } catch (err) {
      message.error('加载船舶列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (listing: any) => {
    setSelectedListing(listing);
    setIsDetailModalVisible(true);
    try {
      const data = await apiService.get(`/vessel-listings/${listing.id}/negotiations`);
      setNegotiations(data as any[]);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublish = async () => {
    try {
      const values = await form.validateFields();
      await apiService.post('/vessel-listings', {
        ...values,
        seller_id: 'demo-seller-1',
        vessel_id: 'mock-vessel-' + Date.now(),
      });
      message.success('挂牌成功');
      setIsPublishModalVisible(false);
      form.resetFields();
      loadListings();
    } catch (err) {
      message.error('挂牌失败');
    }
  };

  const handleNegotiate = async () => {
    try {
      const values = await negotiateForm.validateFields();
      message.success('议价申请已提交');
      setNegotiateModalVisible(false);
      negotiateForm.resetFields();
    } catch (err) {
      message.error('提交失败');
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    active: { color: 'green', text: '在售' },
    pending: { color: 'orange', text: '待审核' },
    under_offer: { color: 'blue', text: '议价中' },
    sold: { color: 'default', text: '已售出' },
  };

  const columns = [
    {
      title: '船舶信息',
      key: 'vessel',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: '500', fontSize: 16 }}>{record.vessel_name}</div>
          <Tag color="geekblue">{record.vessel_type}</Tag>
          <span style={{ color: '#999', fontSize: '12px', marginLeft: 8 }}>
            {record.built_year}年建造 | {record.flag}
          </span>
        </div>
      ),
    },
    {
      title: '船舶参数',
      key: 'specs',
      render: (_: any, record: any) => (
        <div>
          <div>载重吨: {record.dwt?.toLocaleString()} DWT</div>
          <div style={{ color: '#999', fontSize: '12px' }}>箱量: {record.teu?.toLocaleString()} TEU</div>
        </div>
      ),
    },
    {
      title: '卖方',
      key: 'seller',
      render: (_: any, record: any) => (
        <div>
          <div>{record.seller_company}</div>
          <div style={{ color: '#999', fontSize: '12px' }}>{record.seller_name}</div>
        </div>
      ),
    },
    {
      title: '报价',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <div style={{ color: '#ff7a45', fontWeight: 'bold', fontSize: 16 }}>
          ${(price / 10000).toFixed(2)}万
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => {
            setSelectedListing(record);
            setNegotiateModalVisible(true);
          }}>
            议价
          </Button>
        </Space>
      ),
    },
  ];

  const dueDiligenceDocs = [
    { name: '船舶登记证书', type: 'pdf', size: '2.3MB', status: 'verified' },
    { name: '入级证书', type: 'pdf', size: '1.8MB', status: 'verified' },
    { name: '检验报告', type: 'pdf', size: '5.2MB', status: 'verified' },
    { name: '轮机日志', type: 'pdf', size: '3.1MB', status: 'pending' },
    { name: '船舶保险单', type: 'pdf', size: '1.2MB', status: 'verified' },
    { name: '燃油检测报告', type: 'pdf', size: '0.8MB', status: 'pending' },
  ];

  return (
    <div>
      <div className="page-title">船舶交易</div>

      <Card
        style={{ marginBottom: 16 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsPublishModalVisible(true)}>
            发布挂牌
          </Button>
        }
      >
        <Tabs
          items={[
            {
              key: 'all',
              label: '全部船舶',
              children: (
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={listings}
                  loading={loading}
                  pagination={{ pageSize: 8 }}
                />
              ),
            },
            {
              key: 'my',
              label: '我的挂牌',
              children: <div>我的挂牌列表</div>,
            },
            {
              key: 'favorites',
              label: '我的收藏',
              children: <div>我的收藏列表</div>,
            },
          ]}
        />
      </Card>

      <Modal
        title="发布船舶挂牌"
        open={isPublishModalVisible}
        onOk={handlePublish}
        onCancel={() => setIsPublishModalVisible(false)}
        width={600}
        okText="发布"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="vessel_name" label="船舶名称" rules={[{ required: true }]}>
            <Input placeholder="请输入船舶名称" />
          </Form.Item>
          <Form.Item name="vessel_type" label="船舶类型" rules={[{ required: true }]}>
            <Input placeholder="如：集装箱船、散货船等" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="dwt" label="载重吨(DWT)" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="teu" label="载箱量(TEU)" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="built_year" label="建造年份" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={1990} max={2030} />
            </Form.Item>
            <Form.Item name="flag" label="船旗国" style={{ flex: 1 }}>
              <Input placeholder="如：巴拿马" />
            </Form.Item>
          </Space>
          <Form.Item name="price" label="报价(USD)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="description" label="船舶描述">
            <TextArea rows={3} placeholder="请详细描述船舶状况" />
          </Form.Item>
          <Form.Item name="inspection_date" label="预计验船日期">
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="船舶详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedListing && (
          <Tabs
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <div>
                    <Descriptions bordered column={2} size="small">
                      <Descriptions.Item label="船舶名称">{selectedListing.vessel_name}</Descriptions.Item>
                      <Descriptions.Item label="船舶类型">{selectedListing.vessel_type}</Descriptions.Item>
                      <Descriptions.Item label="载重吨">{selectedListing.dwt?.toLocaleString()} DWT</Descriptions.Item>
                      <Descriptions.Item label="载箱量">{selectedListing.teu?.toLocaleString()} TEU</Descriptions.Item>
                      <Descriptions.Item label="建造年份">{selectedListing.built_year}年</Descriptions.Item>
                      <Descriptions.Item label="船旗国">{selectedListing.flag}</Descriptions.Item>
                      <Descriptions.Item label="卖方">{selectedListing.seller_company}</Descriptions.Item>
                      <Descriptions.Item label="报价" style={{ color: '#ff7a45', fontWeight: 'bold' }}>
                        ${selectedListing.price?.toLocaleString()}
                      </Descriptions.Item>
                    </Descriptions>

                    <div style={{ marginTop: 16 }}>
                      <h4>船舶描述</h4>
                      <p style={{ color: '#666' }}>{selectedListing.description || '暂无描述'}</p>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <h4>交割流程</h4>
                      <Timeline
                        items={[
                          { color: 'green', children: '发布挂牌' },
                          { color: 'green', children: '尽调资料上传' },
                          { color: 'blue', children: '在线议价' },
                          { color: 'gray', children: '签署合同' },
                          { color: 'gray', children: '船舶交付' },
                          { color: 'gray', children: '款项结算' },
                        ]}
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: 'docs',
                label: '尽调文档',
                children: (
                  <div>
                    <List
                      dataSource={dueDiligenceDocs}
                      renderItem={(item: any) => (
                        <List.Item actions={[
                          <Button type="link" size="small">查看</Button>,
                          <Button type="link" size="small">下载</Button>
                        ]}>
                          <List.Item.Meta
                            avatar={<FileTextOutlined style={{ fontSize: '24px', color: '#1677ff' }} />}
                            title={item.name}
                            description={
                              <Space>
                                <span>{item.type.toUpperCase()}</span>
                                <span>{item.size}</span>
                                <Tag color={item.status === 'verified' ? 'green' : 'orange'}>
                                  {item.status === 'verified' ? '已核验' : '待核验'}
                                </Tag>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                ),
              },
              {
                key: 'negotiations',
                label: '议价记录',
                children: (
                  <div>
                    {negotiations.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                        暂无议价记录
                      </div>
                    ) : (
                      <List
                        dataSource={negotiations}
                        renderItem={(item: any) => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={<Avatar size="small">{item.buyer_name?.[0]}</Avatar>}
                              title={
                                <Space>
                                  <span>{item.buyer_name}</span>
                                  <span style={{ color: '#ff7a45', fontWeight: 'bold' }}>
                                    报价: ${item.proposed_price?.toLocaleString()}
                                  </span>
                                </Space>
                              }
                              description={
                                <div>
                                  {item.message || '暂无留言'}
                                  <div style={{ color: '#999', fontSize: '12px', marginTop: 4 }}>
                                    {new Date(item.created_at).toLocaleString()}
                                  </div>
                                </div>
                              }
                            />
                            <Tag color="blue">{item.status === 'pending' ? '待处理' : item.status}</Tag>
                          </List.Item>
                        )}
                      />
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Modal>

      <Modal
        title="发起议价"
        open={negotiateModalVisible}
        onOk={handleNegotiate}
        onCancel={() => setNegotiateModalVisible(false)}
        okText="提交议价"
        cancelText="取消"
      >
        <Form form={negotiateForm} layout="vertical">
          <Form.Item label="当前报价">
            <div style={{ color: '#999' }}>
              挂牌价: <span style={{ color: '#ff7a45', fontSize: 18, fontWeight: 'bold' }}>
                ${selectedListing?.price?.toLocaleString()}
              </span>
            </div>
          </Form.Item>
          <Form.Item name="proposed_price" label="您的报价(USD)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="message" label="议价说明">
            <TextArea rows={3} placeholder="请说明您的议价理由或附加条件" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default VesselTrading;
