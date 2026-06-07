import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  message,
  Spin,
  Descriptions,
  Row,
  Col,
  Statistic,
  Divider,
  Radio,
  List,
} from 'antd';
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  HistoryOutlined,
  HomeOutlined,
  FileTextOutlined,
  FileSearchOutlined,
  UserOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  getListings,
  getListingDetail,
  verifyListingProperty,
  getListingVerifications,
  getListingDealsHistory,
} from '@/api';
import type { ColumnsType } from 'antd/es/table';

interface ListingItem {
  id: number;
  title: string;
  building_name: string;
  price: number;
  area: number;
  rooms: string;
  type: string;
  property_status: string;
  floor: string;
  orientation: string;
  decoration: string;
  vr_url?: string;
  created_at: string;
}

interface PropertyVerification {
  id: number;
  listing_id: number;
  property_certificate_no: string;
  has_mortgage: number;
  has_seizure: number;
  verification_conclusion: string;
  reviewer_name: string;
  verification_time: string;
  status: string;
  notes: string;
  created_at: string;
}

interface PropertyHistory {
  id: number;
  date: string;
  buyer_name: string;
  price: number;
  type: string;
}

const ListingManager: React.FC = () => {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState(false);
  const [propertyHistory, setPropertyHistory] = useState<PropertyHistory[]>([]);
  const [verifications, setVerifications] = useState<PropertyVerification[]>([]);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res: any = await getListings({ pageSize: 100 });
      setListings(res?.list ?? []);
    } catch {
      message.error('获取房源列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleViewDetail = async (listing: ListingItem) => {
    setSelectedListing(listing);
    setDetailLoading(true);
    try {
      const [detailRes, verifyRes, historyRes]: any[] = await Promise.all([
        getListingDetail(listing.id),
        getListingVerifications(listing.id),
        getListingDealsHistory(listing.id),
      ]);

      if (detailRes?.listing?.deals_history) {
        const history = typeof detailRes.listing.deals_history === 'string'
          ? JSON.parse(detailRes.listing.deals_history)
          : detailRes.listing.deals_history;
        setPropertyHistory(history || []);
      } else if (historyRes?.list) {
        setPropertyHistory(historyRes.list || []);
      } else {
        setPropertyHistory([]);
      }

      setVerifications(verifyRes?.list ?? []);
    } catch {
      setPropertyHistory([]);
      setVerifications([]);
    } finally {
      setDetailLoading(false);
    }
    setDetailModal(true);
  };

  const handleOpenVerify = (listing: ListingItem) => {
    setSelectedListing(listing);
    form.resetFields();
    form.setFieldsValue({
      has_mortgage: 0,
      has_seizure: 0,
      reviewer_name: '系统审核',
    });
    setVerifyModal(true);
  };

  const handleVerifySubmit = async (values: any) => {
    if (!selectedListing) return;
    setVerifyLoading(true);
    try {
      const res: any = await verifyListingProperty(selectedListing.id, {
        ...values,
        reviewer_id: 1,
      });
      message.success(res?.message || '产权核验完成');
      setVerifyModal(false);
      fetchListings();
      handleViewDetail({ ...selectedListing, property_status: res?.data?.property_status } as ListingItem);
    } catch (e: any) {
      message.error(e.message || '核验失败');
    } finally {
      setVerifyLoading(false);
    }
  };

  const getPropertyStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any; text: string }> = {
      verified: { color: 'green', icon: <CheckCircleOutlined />, text: '已验证' },
      mortgaged: { color: 'orange', icon: <CloseCircleOutlined />, text: '有抵押' },
      pending: { color: 'default', icon: <SearchOutlined />, text: '待验证' },
    };
    const s = statusMap[status] || statusMap.pending;
    return <Tag color={s.color} icon={s.icon}>{s.text}</Tag>;
  };

  const columns: ColumnsType<ListingItem> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    {
      title: '房源标题',
      dataIndex: 'title',
      key: 'title',
      width: 220,
      ellipsis: true,
    },
    { title: '所属楼盘', dataIndex: 'building_name', key: 'building_name', width: 140 },
    { title: '价格', dataIndex: 'price', key: 'price', width: 110, render: (v: number) => <span className="price-text">{v.toLocaleString()}万</span> },
    { title: '面积', dataIndex: 'area', key: 'area', width: 90, render: (v: number) => `${v}㎡` },
    { title: '户型', dataIndex: 'rooms', key: 'rooms', width: 80 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 90, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '产权状态', dataIndex: 'property_status', key: 'property_status', width: 100, render: (v: string) => getPropertyStatusTag(v) },
    { title: 'VR看房', dataIndex: 'vr_url', key: 'vr_url', width: 90, render: (v: string) => v ? <Tag color="purple">有</Tag> : <Tag color="default">无</Tag> },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button
            size="small"
            type={record.property_status === 'verified' ? 'default' : 'primary'}
            icon={<FileSearchOutlined />}
            loading={verifyLoading}
            onClick={() => handleOpenVerify(record)}
          >
            {record.property_status === 'verified' ? '再次核验' : '产权核验'}
          </Button>
        </Space>
      ),
    },
  ];

  const stats = [
    { title: '房源总数', value: listings.length, icon: <HomeOutlined />, color: '#1677ff' },
    { title: '已核验', value: listings.filter(l => l.property_status === 'verified').length, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: '有抵押', value: listings.filter(l => l.property_status === 'mortgaged').length, icon: <CloseCircleOutlined />, color: '#fa8c16' },
    { title: '待核验', value: listings.filter(l => l.property_status === 'pending').length, icon: <SearchOutlined />, color: '#8c8c8c' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>房源管理</h2>
        <p>房源列表、产权状态核验、历史成交记录、核验记录管理</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, i) => (
          <Col xs={12} sm={6} key={i}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={React.cloneElement(stat.icon, { style: { color: stat.color } })}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={listings}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条记录` }}
          size="middle"
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        title="房源详情与核验记录"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            关闭
          </Button>,
          <Button
            key="verify"
            type="primary"
            icon={<FileSearchOutlined />}
            onClick={() => {
              if (selectedListing) handleOpenVerify(selectedListing);
              setDetailModal(false);
            }}
          >
            发起产权核验
          </Button>,
        ]}
      >
        <Spin spinning={detailLoading}>
          {selectedListing && (
            <>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="房源标题" span={2}>
                  {selectedListing.title}
                </Descriptions.Item>
                <Descriptions.Item label="所属楼盘">
                  {selectedListing.building_name}
                </Descriptions.Item>
                <Descriptions.Item label="房源类型">
                  <Tag color="blue">{selectedListing.type}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="售价">
                  <span className="price-text">{selectedListing.price.toLocaleString()}万</span>
                </Descriptions.Item>
                <Descriptions.Item label="面积">
                  {selectedListing.area}㎡
                </Descriptions.Item>
                <Descriptions.Item label="户型">
                  {selectedListing.rooms}
                </Descriptions.Item>
                <Descriptions.Item label="楼层">
                  {selectedListing.floor}
                </Descriptions.Item>
                <Descriptions.Item label="朝向">
                  {selectedListing.orientation}
                </Descriptions.Item>
                <Descriptions.Item label="装修">
                  {selectedListing.decoration}
                </Descriptions.Item>
                <Descriptions.Item label="产权状态" span={2}>
                  {getPropertyStatusTag(selectedListing.property_status)}
                </Descriptions.Item>
                <Descriptions.Item label="VR看房" span={2}>
                  {selectedListing.vr_url ? (
                    <Tag color="purple">已支持VR全景看房</Tag>
                  ) : (
                    <Tag color="default">暂未上传VR</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left" plain>
                <Space>
                  <HistoryOutlined />
                  历史成交记录
                </Space>
              </Divider>

              {propertyHistory.length > 0 ? (
                <Table
                  size="small"
                  columns={[
                    { title: '序号', key: 'idx', render: (_: any, __: any, i: number) => i + 1, width: 70 },
                    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
                    { title: '交易类型', dataIndex: 'type', key: 'type', width: 100, render: (v: string) => <Tag>{v}</Tag> },
                    { title: '买方', dataIndex: 'buyer_name', key: 'buyer_name' },
                    { title: '成交价', dataIndex: 'price', key: 'price', render: (v: number) => <span className="price-text">{(v / 10000).toFixed(0)}万</span> },
                  ]}
                  dataSource={propertyHistory}
                  pagination={false}
                  rowKey="id"
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 24 }}>
                  暂无历史成交记录
                </div>
              )}

              <Divider orientation="left" plain>
                <Space>
                  <FileSearchOutlined />
                  核验记录（共 {verifications.length} 次）
                </Space>
              </Divider>

              {verifications.length > 0 ? (
                <List
                  size="small"
                  dataSource={verifications}
                  renderItem={(item) => (
                    <List.Item key={item.id} style={{ border: '1px solid #f0f0f0', borderRadius: 8, marginBottom: 8, padding: 12 }}>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Tag color={item.status === 'verified' ? 'green' : 'default'}>
                              {item.status === 'verified' ? '核验通过' : '待处理'}
                            </Tag>
                            <span style={{ fontWeight: 500 }}>{item.verification_conclusion || '核验结论'}</span>
                          </Space>
                        }
                        description={
                          <div style={{ fontSize: 12, color: '#666' }}>
                            <div style={{ marginBottom: 4 }}>
                              <Space>
                                <span><UserOutlined /> 复查人：{item.reviewer_name}</span>
                                <span><HistoryOutlined /> 核验时间：{item.verification_time || item.created_at}</span>
                              </Space>
                            </div>
                            {item.property_certificate_no && (
                              <div style={{ marginBottom: 4 }}>
                                <FileTextOutlined /> 产权证号：{item.property_certificate_no}
                              </div>
                            )}
                            <div style={{ marginBottom: 4 }}>
                              <Space>
                                {item.has_mortgage ? <Tag color="orange">有抵押</Tag> : <Tag color="green">无抵押</Tag>}
                                {item.has_seizure ? <Tag color="red">有查封</Tag> : <Tag color="green">无查封</Tag>}
                              </Space>
                            </div>
                            {item.notes && <div>备注：{item.notes}</div>}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 24 }}>
                  暂无核验记录，点击右下角"发起产权核验"按钮开始核验
                </div>
              )}
            </>
          )}
        </Spin>
      </Modal>

      <Modal
        title="产权核验"
        open={verifyModal}
        onCancel={() => setVerifyModal(false)}
        width={700}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleVerifySubmit}
        >
          <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="房源" span={2}>
              {selectedListing?.title}
            </Descriptions.Item>
            <Descriptions.Item label="当前产权状态">
              {selectedListing && getPropertyStatusTag(selectedListing.property_status)}
            </Descriptions.Item>
            <Descriptions.Item label="价格">
              {selectedListing && <span className="price-text">{selectedListing.price.toLocaleString()}万</span>}
            </Descriptions.Item>
          </Descriptions>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="不动产权证号"
                name="property_certificate_no"
                rules={[{ required: true, message: '请输入不动产权证号' }]}
              >
                <Input placeholder="如：沪(2022)浦字不动产权第001234号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="复查人"
                name="reviewer_name"
                rules={[{ required: true, message: '请输入复查人姓名' }]}
              >
                <Input placeholder="请输入复查人姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="是否有抵押"
                name="has_mortgage"
                rules={[{ required: true, message: '请选择' }]}
              >
                <Radio.Group>
                  <Radio value={0}>无抵押</Radio>
                  <Radio value={1}>有抵押</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="是否有查封"
                name="has_seizure"
                rules={[{ required: true, message: '请选择' }]}
              >
                <Radio.Group>
                  <Radio value={0}>无查封</Radio>
                  <Radio value={1}>有查封</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="核验结论"
            name="verification_conclusion"
            rules={[{ required: true, message: '请输入核验结论' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入核验结论，如：产权清晰，无抵押无查封，可正常交易"
            />
          </Form.Item>

          <Form.Item label="备注" name="notes">
            <Input.TextArea rows={2} placeholder="核验过程中的其他说明" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setVerifyModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={verifyLoading} icon={<CheckCircleOutlined />}>
                确认核验
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ListingManager;
