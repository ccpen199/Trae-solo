import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Select,
  DatePicker,
  Tag,
  Card,
  Row,
  Col,
  Tooltip,
  message,
  Descriptions,
  Alert,
  Space,
} from 'antd';
import { EyeOutlined, LockOutlined, UnlockOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { showtimesApi, cinemasApi, moviesApi, seatsApi } from '../api';

const refundRuleConfig = {
  flexible: { color: 'green', label: '灵活退', desc: '开场前2小时可免费退改' },
  strict: { color: 'orange', label: '严格退', desc: '开场前24小时可退，收取10%手续费' },
  none: { color: 'red', label: '不可退', desc: '购票后不支持退改' },
};

const statusConfig = {
  open: { color: 'green', label: '售票中' },
  sold_out: { color: 'red', label: '已售罄' },
  cancelled: { color: 'default', label: '已取消' },
};

const seatStatusConfig = {
  available: { bg: '#52c41a', label: '可选' },
  locked: { bg: '#fa8c16', label: '锁定' },
  sold: { bg: '#f5222d', label: '已售' },
  selected: { bg: '#1890ff', label: '已选' },
};

export default function Showtimes() {
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cinemas, setCinemas] = useState([]);
  const [movies, setMovies] = useState([]);
  const [filters, setFilters] = useState({ cinema_id: undefined, movie_id: undefined, date: undefined });
  const [seatModalOpen, setSeatModalOpen] = useState(false);
  const [seatData, setSeatData] = useState(null);
  const [seatLoading, setSeatLoading] = useState(false);
  const [currentShowtime, setCurrentShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchShowtimes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.cinema_id) params.cinema_id = filters.cinema_id;
      if (filters.movie_id) params.movie_id = filters.movie_id;
      if (filters.date) params.date = filters.date;
      const data = await showtimesApi.list(params);
      setShowtimes(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error(err.message || '获取场次列表失败');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchShowtimes();
  }, [fetchShowtimes]);

  useEffect(() => {
    cinemasApi.list().then((data) => setCinemas(Array.isArray(data) ? data : [])).catch(() => {});
    moviesApi.list().then((data) => setMovies(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const handleViewSeats = async (record) => {
    setCurrentShowtime(record);
    setSeatModalOpen(true);
    setSeatLoading(true);
    setSelectedSeats([]);
    try {
      const data = await showtimesApi.seats(record.id);
      setSeatData(data);
    } catch (err) {
      message.error(err.message || '获取座位信息失败');
      setSeatData(null);
    } finally {
      setSeatLoading(false);
    }
  };

  const getSeatStatistics = () => {
    if (!seatData) return { available: 0, locked: 0, sold: 0, selected: selectedSeats.length };
    const seats = seatData.seats || [];
    return {
      available: seats.filter((s) => s.status === 'available').length,
      locked: seats.filter((s) => s.status === 'locked').length,
      sold: seats.filter((s) => s.status === 'sold').length,
      selected: selectedSeats.length,
    };
  };

  const isSeatSelected = (row, col) => {
    return selectedSeats.some((s) => s.row === row && s.col === col);
  };

  const handleSeatClick = (seat) => {
    if (seat.status === 'sold') {
      message.warning('该座位已售出，不可选择');
      return;
    }
    if (seat.status === 'locked') {
      message.warning('该座位已被锁定，请稍后再试');
      return;
    }
    if (isSeatSelected(seat.row, seat.col)) {
      setSelectedSeats(selectedSeats.filter((s) => !(s.row === seat.row && s.col === seat.col)));
    } else {
      setSelectedSeats([...selectedSeats, { row: seat.row, col: seat.col, seat_id: seat.id }]);
    }
  };

  const handleLockSeats = async () => {
    if (selectedSeats.length === 0) {
      message.warning('请先选择要锁定的座位');
      return;
    }
    setActionLoading(true);
    try {
      await seatsApi.lock({
        showtime_id: currentShowtime.id,
        seats: selectedSeats.map((s) => ({ row: s.row, col: s.col })),
      });
      message.success(`成功锁定 ${selectedSeats.length} 个座位`);
      const data = await showtimesApi.seats(currentShowtime.id);
      setSeatData(data);
      setSelectedSeats([]);
    } catch (err) {
      message.error(err.message || '锁定座位失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlockSeats = async () => {
    if (selectedSeats.length === 0) {
      message.warning('请先选择要释放的座位');
      return;
    }
    setActionLoading(true);
    try {
      await seatsApi.unlock({
        showtime_id: currentShowtime.id,
        seats: selectedSeats.map((s) => ({ row: s.row, col: s.col })),
      });
      message.success(`成功释放 ${selectedSeats.length} 个座位`);
      const data = await showtimesApi.seats(currentShowtime.id);
      setSeatData(data);
      setSelectedSeats([]);
    } catch (err) {
      message.error(err.message || '释放座位失败');
    } finally {
      setActionLoading(false);
    }
  };

  const renderSelectedSummary = () => {
    if (selectedSeats.length === 0) return null;
    const seatLabels = selectedSeats.map((s) => `${s.row}排${s.col}座`).join(', ');
    const totalPrice = currentShowtime ? (selectedSeats.length * (currentShowtime.current_price || 0)).toFixed(2) : 0;
    return (
      <Card size="small" style={{ marginTop: 16, background: '#e6f7ff', borderColor: '#91d5ff' }}>
        <div style={{ fontWeight: 600, color: '#1890ff' }}>
          已选: {seatLabels} (共{selectedSeats.length}座，¥{totalPrice})
        </div>
      </Card>
    );
  };

  const columns = [
    { title: '影片', dataIndex: 'movie_title', key: 'movie_title', ellipsis: true },
    { title: '影院', dataIndex: 'cinema_name', key: 'cinema_name', ellipsis: true },
    { title: '影厅', dataIndex: 'hall_name', key: 'hall_name', ellipsis: true },
    { title: '日期', dataIndex: 'show_date', key: 'show_date' },
    { title: '时间', dataIndex: 'show_time', key: 'show_time' },
    {
      title: '基础价',
      dataIndex: 'base_price',
      key: 'base_price',
      render: (v) => (v != null ? `¥${v}` : '-'),
    },
    {
      title: '当前价',
      dataIndex: 'current_price',
      key: 'current_price',
      render: (v) => (v != null ? `¥${v}` : '-'),
    },
    {
      title: '退票规则',
      dataIndex: 'refund_rule',
      key: 'refund_rule',
      render: (v) => {
        const cfg = refundRuleConfig[v];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : v;
      },
    },
    {
      title: '最少座位',
      dataIndex: 'min_seats',
      key: 'min_seats',
      render: (v) => v ?? '-',
    },
    {
      title: '最多座位',
      dataIndex: 'max_seats',
      key: 'max_seats',
      render: (v) => v ?? '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const cfg = statusConfig[v];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : v;
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Tooltip title="查看座位">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewSeats(record)}>
            座位
          </Button>
        </Tooltip>
      ),
    },
  ];

  const renderSeatMap = () => {
    if (!seatData) return null;
    const { seat_rows, seat_cols, seats } = seatData;

    const seatMap = {};
    for (const s of seats) {
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
        const status = isSeatSelected(r, c) ? 'selected' : (seat ? seat.status : 'available');
        const cfg = seatStatusConfig[status] || seatStatusConfig.available;
        const isClickable = seat && seat.status === 'available';
        cols.push(
          <Tooltip key={`${r}-${c}`} title={`${r}排${c}座 - ${cfg.label}`}>
            <div
              onClick={() => seat && handleSeatClick(seat)}
              style={{
                width: 28,
                height: 28,
                margin: 2,
                borderRadius: 4,
                backgroundColor: cfg.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#fff',
                cursor: isClickable ? 'pointer' : 'default',
                flexShrink: 0,
                border: status === 'selected' ? '2px solid #096dd9' : 'none',
                opacity: seat && seat.status === 'sold' ? 0.6 : 1,
              }}
            >
              {c}
            </div>
          </Tooltip>
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
      </div>
    );
  };

  const renderLegend = () => {
    const stats = getSeatStatistics();
    return (
      <Card size="small" style={{ marginTop: 16 }}>
        <Row justify="center" gutter={[16, 8]}>
          <Col>
            <Space>
              <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 3, backgroundColor: seatStatusConfig.available.bg }} />
              <span style={{ fontSize: 12 }}>可选 ({stats.available})</span>
            </Space>
          </Col>
          <Col>
            <Space>
              <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 3, backgroundColor: seatStatusConfig.locked.bg }} />
              <span style={{ fontSize: 12 }}>锁定 ({stats.locked})</span>
            </Space>
          </Col>
          <Col>
            <Space>
              <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 3, backgroundColor: seatStatusConfig.sold.bg }} />
              <span style={{ fontSize: 12 }}>已售 ({stats.sold})</span>
            </Space>
          </Col>
          <Col>
            <Space>
              <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 3, backgroundColor: seatStatusConfig.selected.bg, border: '2px solid #096dd9' }} />
              <span style={{ fontSize: 12 }}>已选 ({stats.selected})</span>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Select
              placeholder="选择影院"
              allowClear
              style={{ width: 200 }}
              value={filters.cinema_id}
              onChange={(v) => setFilters((f) => ({ ...f, cinema_id: v }))}
              options={cinemas.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="选择影片"
              allowClear
              style={{ width: 200 }}
              value={filters.movie_id}
              onChange={(v) => setFilters((f) => ({ ...f, movie_id: v }))}
              options={movies.map((m) => ({ label: m.title, value: m.id }))}
            />
          </Col>
          <Col>
            <DatePicker
              placeholder="选择日期"
              value={filters.date ? dayjs(filters.date) : undefined}
              onChange={(_, dateString) => setFilters((f) => ({ ...f, date: dateString || undefined }))}
            />
          </Col>
        </Row>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={showtimes}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={currentShowtime ? `座位图 - ${currentShowtime.movie_title}` : '座位图'}
        open={seatModalOpen}
        onCancel={() => {
          setSeatModalOpen(false);
          setSeatData(null);
          setCurrentShowtime(null);
          setSelectedSeats([]);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setSeatModalOpen(false);
            setSeatData(null);
            setCurrentShowtime(null);
            setSelectedSeats([]);
          }}>
            关闭
          </Button>,
          <Button
            key="unlock"
            icon={<UnlockOutlined />}
            onClick={handleUnlockSeats}
            loading={actionLoading}
            disabled={selectedSeats.length === 0 || !currentShowtime || currentShowtime.status !== 'open'}
          >
            释放锁定
          </Button>,
          <Button
            key="lock"
            type="primary"
            icon={<LockOutlined />}
            onClick={handleLockSeats}
            loading={actionLoading}
            disabled={selectedSeats.length === 0 || !currentShowtime || currentShowtime.status !== 'open'}
          >
            锁定座位
          </Button>,
        ]}
        width={800}
      >
        {seatLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : seatData && currentShowtime ? (
          <div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="影片">{currentShowtime.movie_title}</Descriptions.Item>
              <Descriptions.Item label="影院">{currentShowtime.cinema_name}</Descriptions.Item>
              <Descriptions.Item label="影厅">{currentShowtime.hall_name}</Descriptions.Item>
              <Descriptions.Item label="时间">{currentShowtime.show_date} {currentShowtime.show_time}</Descriptions.Item>
              <Descriptions.Item label="当前票价">¥{currentShowtime.current_price}</Descriptions.Item>
              <Descriptions.Item label="退票规则">
                <Tag color={refundRuleConfig[currentShowtime.refund_rule]?.color || 'default'}>
                  {refundRuleConfig[currentShowtime.refund_rule]?.label || currentShowtime.refund_rule}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {currentShowtime.refund_rule && (
              <Alert
                message={
                  <Space>
                    <InfoCircleOutlined />
                    <span>退票规则: {refundRuleConfig[currentShowtime.refund_rule]?.desc}</span>
                  </Space>
                }
                type={currentShowtime.refund_rule === 'none' ? 'error' : currentShowtime.refund_rule === 'strict' ? 'warning' : 'info'}
                showIcon={false}
                style={{ marginBottom: 16 }}
              />
            )}

            <div style={{ overflowX: 'auto', padding: 16, background: '#fafafa', borderRadius: 8 }}>
              <div style={{ textAlign: 'center', marginBottom: 12, fontWeight: 600, color: '#666' }}>
                ▲ 银 幕 ▲
              </div>
              {renderSeatMap()}
            </div>

            {renderLegend()}
            {renderSelectedSummary()}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
