import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Space,
  Tag,
  Descriptions,
  message,
  Steps,
  Alert,
} from 'antd';
import { PlusOutlined, EyeOutlined, UndoOutlined } from '@ant-design/icons';
import { ordersApi, audiencesApi, showtimesApi, concessionsApi, walletApi } from '../api';

const statusConfig = {
  pending: { color: 'orange', label: 'Pending' },
  paid: { color: 'green', label: 'Paid' },
  cancelled: { color: 'red', label: 'Cancelled' },
  refunded: { color: 'default', label: 'Refunded' },
};

const paymentMethodConfig = {
  cash: 'Cash',
  card: 'Card',
  wallet: 'Wallet',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ audience_id: undefined, status: undefined });
  const [audiences, setAudiences] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();

  const [showtimes, setShowtimes] = useState([]);
  const [seatData, setSeatData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatLoading, setSeatLoading] = useState(false);

  const [concessions, setConcessions] = useState([]);
  const [concessionItems, setConcessionItems] = useState([]);

  const [cards, setCards] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.audience_id) params.audience_id = filters.audience_id;
      if (filters.status) params.status = filters.status;
      const data = await ordersApi.list(params);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    audiencesApi.list().then((data) => setAudiences(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setStep(0);
    form.resetFields();
    setSelectedSeats([]);
    setSeatData(null);
    setConcessionItems([]);
    setCards([]);
    setCreateOpen(true);
    showtimesApi.list().then((data) => setShowtimes(Array.isArray(data) ? data : [])).catch(() => {});
    concessionsApi.list().then((data) => setConcessions(Array.isArray(data) ? data : [])).catch(() => {});
  };

  const handleShowtimeChange = async (showtimeId) => {
    setSelectedSeats([]);
    setSeatData(null);
    if (!showtimeId) return;
    setSeatLoading(true);
    try {
      const data = await showtimesApi.seats(showtimeId);
      setSeatData(data);
    } catch (err) {
      message.error(err.message || 'Failed to load seats');
      setSeatData(null);
    } finally {
      setSeatLoading(false);
    }
  };

  const toggleSeat = (row, col) => {
    const key = `${row}-${col}`;
    const exists = selectedSeats.find((s) => s.row === row && s.col === col);
    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => `${s.row}-${s.col}` !== key));
    } else {
      setSelectedSeats([...selectedSeats, { row, col }]);
    }
  };

  const loadCards = async (audienceId) => {
    if (!audienceId) { setCards([]); return; }
    try {
      const data = await walletApi.cards(audienceId);
      setCards(Array.isArray(data) ? data : []);
    } catch {
      setCards([]);
    }
  };

  const getSelectedShowtime = () => {
    const id = form.getFieldValue('showtime_id');
    return showtimes.find((s) => s.id === id);
  };

  const getTicketTotal = () => {
    const st = getSelectedShowtime();
    return st ? selectedSeats.length * (st.current_price || 0) : 0;
  };

  const getConcessionTotal = () => {
    return concessionItems.reduce((sum, ci) => {
      const c = concessions.find((x) => x.id === ci.concession_id);
      return sum + (c ? c.price * ci.quantity : 0);
    }, 0);
  };

  const handleNext = async () => {
    if (step === 0) {
      try {
        await form.validateFields(['audience_id', 'showtime_id']);
        setStep(1);
      } catch {}
    } else if (step === 1) {
      if (selectedSeats.length === 0) {
        message.warning('Please select at least one seat');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrev = () => {
    setStep(Math.max(0, step - 1));
  };

  const handleCreate = async () => {
    try {
      await form.validateFields(['payment_method']);
      const paymentMethod = form.getFieldValue('payment_method');
      if (paymentMethod === 'wallet' && !form.getFieldValue('pay_card_id')) {
        message.warning('Please select a wallet card');
        return;
      }
    } catch {
      return;
    }

    setSubmitting(true);
    try {
      const audienceId = form.getFieldValue('audience_id');
      const showtimeId = form.getFieldValue('showtime_id');
      const paymentMethod = form.getFieldValue('payment_method');
      const payCardId = form.getFieldValue('pay_card_id');

      await ordersApi.create({
        audience_id: audienceId,
        showtime_id: showtimeId,
        seats: selectedSeats.map((s) => ({ row: s.row, col: s.col })),
        payment_method: paymentMethod,
        pay_card_id: paymentMethod === 'wallet' ? payCardId : undefined,
        concession_items: concessionItems
          .filter((ci) => ci.quantity > 0)
          .map((ci) => ({ concession_id: ci.concession_id, quantity: ci.quantity })),
      });
      message.success('Order created');
      setCreateOpen(false);
      fetchOrders();
    } catch (err) {
      message.error(err.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const data = await ordersApi.get(record.id);
      setDetailData(data);
      setDetailOpen(true);
    } catch (err) {
      message.error(err.message || 'Failed to load order detail');
    }
  };

  const handleRefund = async (id) => {
    try {
      await ordersApi.refund(id);
      message.success('Refund processed');
      fetchOrders();
    } catch (err) {
      message.error(err.message || 'Refund failed');
    }
  };

  const columns = [
    { title: 'Order No', dataIndex: 'order_no', key: 'order_no' },
    { title: 'Movie', dataIndex: 'movie_title', key: 'movie_title', ellipsis: true },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (v) => (v != null ? `¥${v}` : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const cfg = statusConfig[v];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : v;
      },
    },
    {
      title: 'Payment',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (v) => paymentMethodConfig[v] || v || '-',
    },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            Detail
          </Button>
          {record.status === 'paid' && (
            <Button type="link" danger icon={<UndoOutlined />} onClick={() => handleRefund(record.id)}>
              Refund
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const renderSeatMap = () => {
    if (!seatData) return null;
    const { seat_rows, seat_cols, seats: seatList } = seatData;

    const seatMap = {};
    for (const s of seatList) {
      seatMap[`${s.row}-${s.col}`] = s;
    }

    const rows = [];
    for (let r = 1; r <= seat_rows; r++) {
      const cols = [];
      cols.push(
        <span key={`label-row-${r}`} style={{ width: 30, textAlign: 'center', fontWeight: 600, fontSize: 12, lineHeight: '32px', flexShrink: 0 }}>
          {r}
        </span>
      );
      for (let c = 1; c <= seat_cols; c++) {
        const seat = seatMap[`${r}-${c}`];
        const status = seat ? seat.status : 'available';
        const isAvailable = status === 'available';
        const isSelected = selectedSeats.some((s) => s.row === r && s.col === c);
        const bgColor = isSelected ? '#1890ff' : isAvailable ? '#52c41a' : '#d9d9d9';
        const cursor = isAvailable ? 'pointer' : 'not-allowed';

        cols.push(
          <div
            key={`${r}-${c}`}
            onClick={() => isAvailable && toggleSeat(r, c)}
            style={{
              width: 28,
              height: 28,
              margin: 2,
              borderRadius: 4,
              backgroundColor: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: '#fff',
              cursor,
              flexShrink: 0,
            }}
          >
            {c}
          </div>
        );
      }
      rows.push(
        <div key={`row-${r}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {cols}
        </div>
      );
    }

    const colLabels = [];
    colLabels.push(<span key="corner" style={{ width: 30, flexShrink: 0 }} />);
    for (let c = 1; c <= seat_cols; c++) {
      colLabels.push(
        <span key={`col-${c}`} style={{ width: 28, margin: 2, textAlign: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
          {c}
        </span>
      );
    }

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
          {colLabels}
        </div>
        {rows}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
          <Space>
            <div style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: '#52c41a' }} />
            <span style={{ fontSize: 12 }}>Available</span>
          </Space>
          <Space>
            <div style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: '#d9d9d9' }} />
            <span style={{ fontSize: 12 }}>Locked/Sold</span>
          </Space>
          <Space>
            <div style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: '#1890ff' }} />
            <span style={{ fontSize: 12 }}>Selected</span>
          </Space>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    const st = getSelectedShowtime();

    switch (step) {
      case 0:
        return (
          <Form form={form} layout="vertical">
            <Form.Item name="audience_id" label="Audience" rules={[{ required: true, message: 'Please select audience' }]}>
              <Select
                placeholder="Select audience"
                showSearch
                optionFilterProp="label"
                options={audiences.map((a) => ({ label: a.name || a.phone || `#${a.id}`, value: a.id }))}
                onChange={(val) => loadCards(val)}
              />
            </Form.Item>
            <Form.Item name="showtime_id" label="Showtime" rules={[{ required: true, message: 'Please select showtime' }]}>
              <Select
                placeholder="Select showtime"
                showSearch
                optionFilterProp="label"
                options={showtimes.map((s) => ({
                  label: `${s.movie_title || ''} - ${s.cinema_name || ''} ${s.show_date} ${s.show_time}`,
                  value: s.id,
                }))}
                onChange={(val) => handleShowtimeChange(val)}
              />
            </Form.Item>
          </Form>
        );

      case 1:
        if (seatLoading) return <div style={{ textAlign: 'center', padding: 40 }}>Loading seats...</div>;
        if (!seatData) return <Alert type="info" message="Please select a showtime first" />;
        return (
          <div>
            {st && (
              <Alert
                type="info"
                message={`Price per seat: ¥${st.current_price} | Selected: ${selectedSeats.length} seat(s) | Ticket total: ¥${getTicketTotal()}`}
                style={{ marginBottom: 12 }}
              />
            )}
            <div style={{ overflowX: 'auto' }}>{renderSeatMap()}</div>
          </div>
        );

      case 2:
        if (concessions.length === 0) return <Alert type="info" message="No concession items available" />;
        return (
          <div>
            {concessions.map((c) => {
              const existing = concessionItems.find((ci) => ci.concession_id === c.id);
              const qty = existing ? existing.quantity : 0;
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                    <span style={{ marginLeft: 8, color: '#888' }}>¥{c.price}</span>
                  </div>
                  <InputNumber
                    min={0}
                    max={99}
                    value={qty}
                    onChange={(val) => {
                      setConcessionItems((prev) => {
                        const filtered = prev.filter((ci) => ci.concession_id !== c.id);
                        if (val > 0) filtered.push({ concession_id: c.id, quantity: val });
                        return filtered;
                      });
                    }}
                  />
                </div>
              );
            })}
            {concessionItems.length > 0 && (
              <Alert type="info" message={`Concession total: ¥${getConcessionTotal().toFixed(2)}`} style={{ marginTop: 8 }} />
            )}
          </div>
        );

      case 3: {
        const ticketTotal = getTicketTotal();
        const conTotal = getConcessionTotal();
        const total = ticketTotal + conTotal;
        const paymentMethod = form.getFieldValue('payment_method');

        return (
          <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Seats">
                {selectedSeats.map((s) => `Row ${s.row} Col ${s.col}`).join(', ')}
              </Descriptions.Item>
              <Descriptions.Item label="Ticket Total">¥{ticketTotal.toFixed(2)}</Descriptions.Item>
              {concessionItems.length > 0 && (
                <Descriptions.Item label="Concessions">
                  {concessionItems.map((ci) => {
                    const c = concessions.find((x) => x.id === ci.concession_id);
                    return c ? `${c.name} x${ci.quantity} (¥${(c.price * ci.quantity).toFixed(2)})` : '';
                  }).join(', ')}
                </Descriptions.Item>
              )}
              {conTotal > 0 && (
                <Descriptions.Item label="Concession Total">¥{conTotal.toFixed(2)}</Descriptions.Item>
              )}
              <Descriptions.Item label="Total Amount">
                <span style={{ fontWeight: 700, fontSize: 16, color: '#f5222d' }}>¥{total.toFixed(2)}</span>
              </Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical">
              <Form.Item name="payment_method" label="Payment Method" rules={[{ required: true, message: 'Please select payment method' }]}>
                <Select
                  placeholder="Select payment method"
                  onChange={() => form.setFieldValue('pay_card_id', undefined)}
                >
                  <Select.Option value="cash">Cash</Select.Option>
                  <Select.Option value="card">Card</Select.Option>
                  <Select.Option value="wallet">Wallet</Select.Option>
                </Select>
              </Form.Item>
              {paymentMethod === 'wallet' && (
                <Form.Item name="pay_card_id" label="Wallet Card">
                  <Select placeholder="Select card" options={cards.map((c) => ({ label: `${c.card_no} (¥${c.balance})`, value: c.id }))} />
                </Form.Item>
              )}
            </Form>
          </div>
        );
      }
    }
  };

  const stepTitles = ['Select Show', 'Select Seats', 'Add Concessions', 'Confirm'];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by audience"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 200 }}
          value={filters.audience_id}
          onChange={(v) => setFilters((f) => ({ ...f, audience_id: v }))}
          options={audiences.map((a) => ({ label: a.name || a.phone || `#${a.id}`, value: a.id }))}
        />
        <Select
          placeholder="Filter by status"
          allowClear
          style={{ width: 160 }}
          value={filters.status}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        >
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <Select.Option key={key} value={key}>{cfg.label}</Select.Option>
          ))}
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Create Order
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Total ${t}` }}
      />

      <Modal
        title="Create Order"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        width={720}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              {step > 0 && (
                <Button onClick={handlePrev}>Previous</Button>
              )}
            </div>
            <Space>
              <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
              {step < 3 ? (
                <Button type="primary" onClick={handleNext}>Next</Button>
              ) : (
                <Button type="primary" loading={submitting} onClick={handleCreate}>Submit</Button>
              )}
            </Space>
          </div>
        }
      >
        <Steps current={step} items={stepTitles.map((t) => ({ title: t }))} size="small" style={{ marginBottom: 24 }} />
        {renderStepContent()}
      </Modal>

      <Modal
        title="Order Detail"
        open={detailOpen}
        onCancel={() => { setDetailOpen(false); setDetailData(null); }}
        footer={null}
        width={640}
      >
        {detailData && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Order No">{detailData.order_no}</Descriptions.Item>
              <Descriptions.Item label="Movie">{detailData.movie_title}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusConfig[detailData.status]?.color}>{statusConfig[detailData.status]?.label || detailData.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Payment">{paymentMethodConfig[detailData.payment_method] || detailData.payment_method || '-'}</Descriptions.Item>
              <Descriptions.Item label="Total Amount">¥{detailData.total_amount}</Descriptions.Item>
              <Descriptions.Item label="Created At">{detailData.created_at}</Descriptions.Item>
            </Descriptions>
            {detailData.items && detailData.items.length > 0 && (
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={detailData.items}
                columns={[
                  { title: 'Item', dataIndex: 'item_name', key: 'item_name' },
                  { title: 'Type', dataIndex: 'item_type', key: 'item_type' },
                  { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                  { title: 'Unit Price', dataIndex: 'unit_price', key: 'unit_price', render: (v) => `¥${v}` },
                  { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal', render: (v) => `¥${v}` },
                ]}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
