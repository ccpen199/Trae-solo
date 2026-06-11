import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, Modal, Form, InputNumber, message, Alert, Tabs, Row, Col, Statistic, Descriptions, List } from 'antd';
import { PlusOutlined, SearchOutlined, SwapOutlined, EditOutlined, EyeOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAppStore } from '../store/appStore';
import { canPublishCargo, canSeeAllCargos, canEditCargo, UserRole } from '../utils/permissions';

const { Option } = Select;
const { TextArea } = Input;

function CargoBookings() {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedVoyages, setMatchedVoyages] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const canPublish = canPublishCargo(currentUser?.role as UserRole);
  const canSeeAll = canSeeAllCargos(currentUser?.role as UserRole);

  useEffect(() => {
    loadBookings();
  }, [currentUser]);

  const loadBookings = async (params?: any) => {
    setLoading(true);
    try {
      const data = await apiService.get('/cargo-bookings', params) as any[];
      setBookings(data);
      if (!canSeeAll) {
        const filtered = data.filter(b => b.owner_name === currentUser?.name || b.cargo_owner_id === currentUser?.id);
        setFilteredBookings(filtered);
      } else {
        setFilteredBookings(data);
      }
    } catch (err) {
      message.error('加载货盘数据失败');
    } finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    inquiry: { color: 'blue', text: '询盘中' },
    quoted: { color: 'orange', text: '已报价' },
    confirmed: { color: 'green', text: '已确认' },
    cancelled: { color: 'default', text: '已取消' },
  };

  const handleMatchVoyages = async (booking: any) => {
    setSelectedBooking(booking);
    setMatchModalVisible(true);
    setMatchingLoading(true);
    try {
      const data = await apiService.get(`/cargo-bookings/${booking.id}/match-voyages`);
      setMatchedVoyages(data as any[]);
    } catch (err) {
      message.error('匹配失败');
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const resolvedOwnerId = bookings.find(
        b => b.owner_name === currentUser?.name && b.owner_company === currentUser?.company
      )?.cargo_owner_id || currentUser?.id || 'demo-user-1';
      const payload = {
        ...values,
        cargo_owner_id: resolvedOwnerId,
        owner_name: currentUser?.name,
        owner_company: currentUser?.company,
        special_requirements: values.special_requirements || [],
        compliance_docs: values.compliance_docs || [],
      };

      if (isEditMode && editingId) {
        await apiService.put(`/cargo-bookings/${editingId}`, payload);
        message.success('货盘更新成功');
        loadBookings();
      } else {
        await apiService.post('/cargo-bookings', payload);
        message.success('货盘发布成功');
        loadBookings();
      }

      setIsModalVisible(false);
      setIsEditMode(false);
      setEditingId(null);
      form.resetFields();
    } catch (err) {
      message.error(isEditMode ? '更新失败' : '发布失败');
    }
  };

  const handleEdit = (record: any) => {
    setIsEditMode(true);
    setEditingId(record.id);
    form.setFieldsValue({
      cargo_type: record.cargo_type,
      origin_port: record.origin_port,
      destination_port: record.destination_port,
      teu: record.teu,
      weight: record.weight,
      budget_rate: record.budget_rate,
      earliest_departure: record.earliest_departure?.substring(0, 10),
      latest_arrival: record.latest_arrival?.substring(0, 10),
      special_requirements: record.special_requirements || [],
      compliance_docs: record.compliance_docs || [],
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后货盘将无法恢复，是否继续？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setFilteredBookings(filteredBookings.filter(b => b.id !== id));
        setBookings(bookings.filter(b => b.id !== id));
        message.success('货盘已删除');
      },
    });
  };

  const columns = [
    {
      title: '货主',
      key: 'owner',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: '500' }}>{record.owner_name}</div>
          <div style={{ color: '#999', fontSize: '12px' }}>{record.owner_company}</div>
        </div>
      ),
    },
    {
      title: '货物类型',
      dataIndex: 'cargo_type',
      key: 'cargo_type',
    },
    {
      title: '数量',
      key: 'quantity',
      render: (_: any, record: any) => (
        <div>
          <div>{record.teu} TEU</div>
          <div style={{ color: '#999', fontSize: '12px' }}>{record.weight} 吨</div>
        </div>
      ),
    },
    {
      title: '运输路线',
      key: 'route',
      render: (_: any, record: any) => (
        <div>
          <div>{record.origin_port}</div>
          <div style={{ color: '#999', fontSize: '12px' }}>→ {record.destination_port}</div>
        </div>
      ),
    },
    {
      title: '时间窗口',
      key: 'time',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontSize: '12px' }}>最早出发: {dayjs(record.earliest_departure).format('MM-DD')}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>最晚到达: {dayjs(record.latest_arrival).format('MM-DD')}</div>
        </div>
      ),
    },
    {
      title: '预算运价',
      dataIndex: 'budget_rate',
      key: 'budget_rate',
      render: (rate: number) => <span style={{ color: '#ff7a45' }}>${rate?.toLocaleString()}/TEU</span>,
    },
    {
      title: '特殊要求',
      dataIndex: 'special_requirements',
      key: 'special_requirements',
      render: (reqs: string[]) => (
        <div className="tag-list">
          {reqs?.map((r, i) => (
            <span key={i} className="tag-item">{r}</span>
          ))}
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
      render: (_: any, record: any) => {
        const isOwner =
          (record.owner_name === currentUser?.name && record.owner_company === currentUser?.company) ||
          record.cargo_owner_id === currentUser?.id;
        const canEdit = canEditCargo(currentUser?.role as UserRole, record.cargo_owner_id, currentUser?.id) || isOwner;

        return (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedBooking(record);
                setDetailModalVisible(true);
              }}
            >
              详情
            </Button>
            {canSeeAll && (
              <Button
                type="link"
                size="small"
                icon={<SwapOutlined />}
                onClick={() => handleMatchVoyages(record)}
              >
                匹配
              </Button>
            )}
            {canEdit && (
              <>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record.id)}
                >
                  删除
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div className="page-title">货盘管理</div>

      {!canSeeAll && (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message="我的货盘"
          description="仅显示您本人发布的货盘。如需查看全部市场货盘，请切换至船东/货代身份。"
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title={canSeeAll ? '市场总货盘' : '我的货盘数'}
              value={filteredBookings.length}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="询盘中"
              value={filteredBookings.filter(b => b.status === 'inquiry').length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="已确认"
              value={filteredBookings.filter(b => b.status === 'confirmed').length}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" onFinish={loadBookings}>
          <Form.Item name="cargo_type" label="货物类型">
            <Input placeholder="请输入" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="origin_port" label="出发港">
            <Input placeholder="出发港" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" style={{ width: 120 }} allowClear>
              <Option value="inquiry">询盘中</Option>
              <Option value="quoted">已报价</Option>
              <Option value="confirmed">已确认</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={() => loadBookings()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        extra={
          canPublish ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setIsEditMode(false);
                setEditingId(null);
                form.resetFields();
                setIsModalVisible(true);
              }}
            >
              发布货盘
            </Button>
          ) : null
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredBookings}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={isEditMode ? '编辑货盘' : '发布新货盘'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setIsEditMode(false);
          setEditingId(null);
          form.resetFields();
        }}
        width={600}
        okText={isEditMode ? '保存修改' : '发布'}
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="cargo_type" label="货物类型" rules={[{ required: true }]}>
            <Input placeholder="如：电子产品、服装等" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="origin_port" label="出发港" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="出发港口" />
            </Form.Item>
            <Form.Item name="destination_port" label="目的港" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="目的港口" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="teu" label="TEU数量" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            <Form.Item name="weight" label="总重量(吨)" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space>
          <Form.Item name="budget_rate" label="预算运价(USD/TEU)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="earliest_departure" label="最早出发日期">
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="latest_arrival" label="最晚到达日期">
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="special_requirements" label="特殊要求">
            <Select mode="tags" placeholder="添加特殊要求" style={{ width: '100%' }}>
              <Option value="防潮">防潮</Option>
              <Option value="轻放">轻放</Option>
              <Option value="冷藏">冷藏</Option>
              <Option value="危险品">危险品</Option>
              <Option value="大件">大件运输</Option>
            </Select>
          </Form.Item>
          <Form.Item name="compliance_docs" label="已备单证">
            <Select mode="multiple" placeholder="选择已准备的单证">
              <Option value="商业发票">商业发票</Option>
              <Option value="装箱单">装箱单</Option>
              <Option value="产地证">产地证</Option>
              <Option value="报关单">报关单</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`AI智能匹配航次 - ${selectedBooking?.cargo_type || ''}`}
        open={matchModalVisible}
        onCancel={() => setMatchModalVisible(false)}
        footer={null}
        width={800}
      >
        {matchingLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>AI智能匹配中...</div>
        ) : matchedVoyages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无匹配的航次
          </div>
        ) : (
          <div>
            {matchedVoyages.map((item, index) => (
              <Card key={item.voyage.id} size="small" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className={`match-score ${item.score >= 70 ? 'high' : item.score >= 50 ? 'medium' : 'low'}`}>
                    {item.score}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                      {item.vessel.name} 
                      <Tag color="blue" style={{ marginLeft: 8 }}>{item.voyage.voyage_number}</Tag>
                    </div>
                    <div style={{ color: '#666', fontSize: '13px', marginBottom: 8 }}>
                      {item.voyage.origin_port} → {item.voyage.destination_port}
                    </div>
                    <div className="tag-list">
                      {item.reasons.map((r: string, i: number) => (
                        <span key={i} className="tag-item">{r}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#ff7a45', fontSize: '18px', fontWeight: 'bold' }}>
                      ${item.estimated_rate.toLocaleString()}
                    </div>
                    <div style={{ color: '#999', fontSize: '12px' }}>
                      碳排放: {item.carbon_estimate} kg CO₂
                    </div>
                    <Button type="primary" size="small" style={{ marginTop: 8 }}>
                      立即订舱
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        title="货盘详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
          <Button
            key="match"
            type="primary"
            icon={<SwapOutlined />}
            onClick={() => {
              setDetailModalVisible(false);
              handleMatchVoyages(selectedBooking);
            }}
          >
            智能匹配航次
          </Button>,
        ]}
        width={720}
      >
        <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="货主">{selectedBooking?.owner_company || '-'}</Descriptions.Item>
          <Descriptions.Item label="联系人">{selectedBooking?.owner_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="货物类型">{selectedBooking?.cargo_type || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            {selectedBooking?.status && (
              <Tag color={statusMap[selectedBooking.status]?.color}>
                {statusMap[selectedBooking.status]?.text}
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="TEU数量">{selectedBooking?.teu} TEU</Descriptions.Item>
          <Descriptions.Item label="总重量">{selectedBooking?.weight} 吨</Descriptions.Item>
          <Descriptions.Item label="预算运价">
            ${selectedBooking?.budget_rate?.toLocaleString()} / TEU
          </Descriptions.Item>
          <Descriptions.Item label="货物价值">
            ${selectedBooking?.cargo_value?.toLocaleString() || '未填写'}
          </Descriptions.Item>
        </Descriptions>

        <h4 style={{ marginBottom: 12 }}>运输路线</h4>
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col xs={11}>
            <Card size="small" style={{ background: '#f6ffed' }}>
              <div style={{ fontWeight: '500' }}>起运港</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a', marginTop: 4 }}>
                {selectedBooking?.origin_port}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                最早出发: {dayjs(selectedBooking?.earliest_departure).format('YYYY-MM-DD')}
              </div>
            </Card>
          </Col>
          <Col xs={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SwapOutlined style={{ fontSize: 20, color: '#1677ff' }} />
          </Col>
          <Col xs={11}>
            <Card size="small" style={{ background: '#e6f4ff' }}>
              <div style={{ fontWeight: '500' }}>目的港</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1677ff', marginTop: 4 }}>
                {selectedBooking?.destination_port}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                最晚到达: {dayjs(selectedBooking?.latest_arrival).format('YYYY-MM-DD')}
              </div>
            </Card>
          </Col>
        </Row>

        <h4 style={{ marginBottom: 12 }}>特殊要求</h4>
        <div className="tag-list" style={{ marginBottom: 20 }}>
          {(selectedBooking?.special_requirements || []).map((r: string, i: number) => (
            <Tag key={i} color="orange">{r}</Tag>
          ))}
          {(!selectedBooking?.special_requirements || selectedBooking.special_requirements.length === 0) && (
            <span style={{ color: '#999' }}>无特殊要求</span>
          )}
        </div>

        <h4 style={{ marginBottom: 12 }}>已备单证</h4>
        <List
          size="small"
          dataSource={selectedBooking?.compliance_docs || []}
          renderItem={(item: string) => (
            <List.Item>
              <List.Item.Meta
                title={item}
                description="已上传，点击查看"
                avatar={<FileTextOutlined style={{ color: '#52c41a' }} />}
              />
              <Button type="link" size="small">预览</Button>
            </List.Item>
          )}
        />
        {(!selectedBooking?.compliance_docs || selectedBooking.compliance_docs.length === 0) && (
          <div style={{ color: '#999', textAlign: 'center', padding: 12 }}>暂无上传单证</div>
        )}
      </Modal>
    </div>
  );
}

export default CargoBookings;
