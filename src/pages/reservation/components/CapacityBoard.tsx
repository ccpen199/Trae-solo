import React from 'react';
import { Card, Table, Tag, Select, Row, Col, Statistic, Tooltip } from 'antd';
import { DashboardOutlined, TeamOutlined, ClockCircleOutlined, StopOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { getCapacityBoard, type CapacityBoardData, type CapacitySlot } from '@/services/api/reservation';
import { getPlaceList } from '@/services/api/place';

const CapacityBoard: React.FC = () => {
  const [selectedPlace, setSelectedPlace] = React.useState<string>('');
  const [placeOptions, setPlaceOptions] = React.useState<{ label: string; value: string }[]>([]);

  React.useEffect(() => {
    getPlaceList({ page: 1, pageSize: 50, status: 'approved' }).then(res => {
      if (res.data?.list) setPlaceOptions(res.data.list.map(p => ({ label: p.name, value: p.id })));
    });
  }, []);

  const { data } = useRequest(
    () => getCapacityBoard(selectedPlace ? { placeId: selectedPlace } : undefined),
    { refreshDeps: [selectedPlace] }
  );

  const boardData = data?.data || [];

  const getStatusTag = (status: CapacitySlot['status']) => {
    const map: Record<string, { color: string; text: string }> = {
      normal: { color: 'green', text: '正常' },
      tight: { color: 'orange', text: '紧张' },
      full: { color: 'red', text: '已满' },
    };
    const info = map[status] || map.normal;
    if (status === 'full') {
      return (
        <Tooltip title="该时段预约已满，无法新增预约。超容量政策：系统将自动拒绝新预约，或您可选择加入排队等候列表，有名额释放时按顺序通知。">
          <span className="inline-flex items-center gap-1">
            <Tag color={info.color} style={{ margin: 0 }}>{info.text}</Tag>
            <StopOutlined className="text-red-500 text-xs" />
            <InfoCircleOutlined className="text-neutral-400 text-xs" />
          </span>
        </Tooltip>
      );
    }
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const slotColumns = [
    { title: '时段', dataIndex: 'timeSlot', width: 130, render: (v: string, record: CapacitySlot) => (
      <span className="font-mono inline-flex items-center gap-1">
        {v}
        {record.status === 'full' && <Tag color="error" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }}>禁止预约</Tag>}
      </span>
    )},
    { title: '总容量', dataIndex: 'totalCapacity', width: 90, align: 'center' as const },
    { title: '已预约', dataIndex: 'reserved', width: 90, align: 'center' as const },
    { title: '已到店', dataIndex: 'checkedIn', width: 90, align: 'center' as const },
    {
      title: '剩余',
      dataIndex: 'remaining',
      width: 90,
      align: 'center' as const,
      render: (v: number, record: CapacitySlot) => (
        <span className={record.status === 'full' ? 'text-red-500 font-medium' : record.status === 'tight' ? 'text-orange-500' : 'text-green-600'}>
          {v}
        </span>
      ),
    },
    {
      title: '使用率',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: CapacitySlot) => {
        const rate = record.totalCapacity > 0 ? Math.round((record.reserved / record.totalCapacity) * 100) : 0;
        return (
          <div className="flex items-center gap-1">
            <div className="flex-1 bg-neutral-100 dark:bg-neutral-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${rate >= 100 ? 'bg-red-500' : rate >= 80 ? 'bg-orange-400' : 'bg-green-400'}`}
                style={{ width: `${Math.min(rate, 100)}%` }}
              />
            </div>
            <span className="text-xs text-neutral-500">{rate}%</span>
          </div>
        );
      },
    },
    { title: '状态', dataIndex: 'status', width: 80, align: 'center' as const, render: (s: CapacitySlot['status']) => getStatusTag(s) },
  ];

  return (
    <Card
      title={<span><DashboardOutlined className="mr-2" />容量限流看板</span>}
      className="mb-4 shadow-none border border-neutral-100 dark:border-neutral-700"
      bodyStyle={{ padding: '16px' }}
      extra={
        <Select
          placeholder="全部场所"
          options={placeOptions}
          value={selectedPlace || undefined}
          onChange={(v) => setSelectedPlace(v || '')}
          allowClear
          showSearch
          filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
          style={{ width: 240 }}
        />
      }
    >
      {boardData.length === 0 ? (
        <div className="text-center py-8 text-neutral-400">暂无容量数据</div>
      ) : (
        <div className="space-y-4">
          {boardData.slice(0, selectedPlace ? 1 : 4).map((place) => (
            <Card
              key={place.placeId}
              size="small"
              title={
                <div className="flex items-center justify-between">
                  <span className="font-medium">{place.placeName}</span>
                  <span className="text-xs text-neutral-400">{place.date}</span>
                </div>
              }
              className="shadow-none border border-neutral-100 dark:border-neutral-700"
            >
              <Row gutter={16} className="mb-3">
                <Col span={6}>
                  <Statistic title="总容量" value={place.totalCapacity} prefix={<TeamOutlined />} valueStyle={{ fontSize: 16 }} />
                </Col>
                <Col span={6}>
                  <Statistic title="已预约" value={place.totalReserved} valueStyle={{ fontSize: 16, color: '#1677ff' }} />
                </Col>
                <Col span={6}>
                  <Statistic title="已到店" value={place.totalCheckedIn} valueStyle={{ fontSize: 16, color: '#52c41a' }} />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="剩余"
                    value={place.totalRemaining}
                    valueStyle={{ fontSize: 16, color: place.totalRemaining <= place.totalCapacity * 0.2 ? '#ff4d4f' : '#52c41a' }}
                  />
                </Col>
              </Row>
              <Table
                dataSource={place.slots}
                columns={slotColumns}
                rowKey="timeSlot"
                pagination={false}
                size="small"
                rowClassName={(record) =>
                  record.status === 'full' ? 'bg-red-50 dark:bg-red-900/10 opacity-80' :
                  record.status === 'tight' ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                }
              />
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};

export default CapacityBoard;
