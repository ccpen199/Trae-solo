import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Modal,
  Form,
  Select,
  Input,
  message,
  Radio,
  Badge,
  Space,
} from 'antd'
import {
  HomeOutlined,
  UserOutlined,
  ReloadOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { roomsApi } from '@/services/api'

const RoomStatus: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<any[]>([])
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [roomModalVisible, setRoomModalVisible] = useState(false)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const response = await roomsApi.getAll()
      if (response.data.success) {
        setRooms(response.data.data)
      }
    } catch (error) {
      message.error('获取房间列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b)

  const filteredRooms = selectedFloor
    ? rooms.filter((r) => r.floor === selectedFloor)
    : rooms

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      VACANT: 'room-status-vacant',
      OCCUPIED: 'room-status-occupied',
      DIRTY: 'room-status-dirty',
      MAINTENANCE: 'room-status-maintenance',
      RESERVED: 'room-status-reserved',
    }
    return colorMap[status] || 'room-status-vacant'
  }

  const getStatusLabel = (status: string): string => {
    const labelMap: Record<string, string> = {
      VACANT: '空闲',
      OCCUPIED: '在住',
      DIRTY: '脏房',
      MAINTENANCE: '维修',
      RESERVED: '预订',
    }
    return labelMap[status] || '未知'
  }

  const getRoomTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      STANDARD: '标准间',
      DELUXE: '豪华间',
      SUITE: '套房',
      FAMILY: '家庭房',
    }
    return typeMap[type] || type
  }

  const handleRoomClick = (room: any) => {
    setSelectedRoom(room)
    setRoomModalVisible(true)
  }

  const handleStatusChange = () => {
    setStatusModalVisible(true)
  }

  const handleStatusSubmit = async (values: any) => {
    try {
      const response = await roomsApi.updateStatus(
        selectedRoom.id,
        values.status,
        values.reason
      )
      if (response.data.success) {
        message.success('房间状态更新成功')
        setStatusModalVisible(false)
        setRoomModalVisible(false)
        fetchRooms()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新状态失败')
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>房态图</h2>

      <Card
        loading={loading}
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchRooms}>
            刷新
          </Button>
        }
      >
        <div className="status-legend">
          <div className="status-legend-item">
            <div className="status-legend-color room-status-vacant" />
            <span>空闲房</span>
          </div>
          <div className="status-legend-item">
            <div className="status-legend-color room-status-occupied" />
            <span>在住房</span>
          </div>
          <div className="status-legend-item">
            <div className="status-legend-color room-status-dirty" />
            <span>脏房</span>
          </div>
          <div className="status-legend-item">
            <div className="status-legend-color room-status-maintenance" />
            <span>维修房</span>
          </div>
          <div className="status-legend-item">
            <div className="status-legend-color room-status-reserved" />
            <span>预订房</span>
          </div>
        </div>

        <div className="floor-selector">
          <Button
            className="floor-btn"
            type={selectedFloor === null ? 'primary' : 'default'}
            onClick={() => setSelectedFloor(null)}
          >
            全部
          </Button>
          {floors.map((floor) => (
            <Button
              key={floor}
              className="floor-btn"
              type={selectedFloor === floor ? 'primary' : 'default'}
              onClick={() => setSelectedFloor(floor)}
            >
              {floor}楼
            </Button>
          ))}
        </div>

        <div className="room-grid">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className={`room-card ${getStatusColor(room.status)}`}
              onClick={() => handleRoomClick(room)}
            >
              <div className="room-number">{room.roomNumber}</div>
              <div className="room-type">{getRoomTypeLabel(room.type)}</div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        title={`房间详情 - ${selectedRoom?.roomNumber}`}
        open={roomModalVisible}
        onCancel={() => setRoomModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setRoomModalVisible(false)}>
            关闭
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={handleStatusChange}>
            修改状态
          </Button>,
        ]}
      >
        {selectedRoom && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="基本信息">
                  <p>
                    <strong>房号：</strong>
                    {selectedRoom.roomNumber}
                  </p>
                  <p>
                    <strong>楼层：</strong>
                    {selectedRoom.floor}楼
                  </p>
                  <p>
                    <strong>房型：</strong>
                    {getRoomTypeLabel(selectedRoom.type)}
                  </p>
                  <p>
                    <strong>基础价格：</strong>
                    ¥{selectedRoom.basePrice}
                  </p>
                  <p>
                    <strong>最大入住：</strong>
                    {selectedRoom.maxGuests}人
                  </p>
                  <p>
                    <strong>设施：</strong>
                    {selectedRoom.amenities?.join('、') || '无'}
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="当前状态">
                  <p>
                    <strong>状态：</strong>
                    <Tag color={
                      selectedRoom.status === 'VACANT' ? 'success' :
                      selectedRoom.status === 'OCCUPIED' ? 'processing' :
                      selectedRoom.status === 'DIRTY' ? 'warning' :
                      selectedRoom.status === 'MAINTENANCE' ? 'error' : 'purple'
                    }>
                      {getStatusLabel(selectedRoom.status)}
                    </Tag>
                  </p>
                  {selectedRoom.checkIns?.[0] && (
                    <div>
                      <p>
                        <strong>当前客人：</strong>
                        {selectedRoom.checkIns[0].guest?.name}
                      </p>
                      <p>
                        <strong>入住时间：</strong>
                        {new Date(selectedRoom.checkIns[0].checkInTime).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedRoom.reservations?.[0] && (
                    <div>
                      <p>
                        <strong>预订客人：</strong>
                        {selectedRoom.reservations[0].guest?.name}
                      </p>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      <Modal
        title="修改房间状态"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleStatusSubmit}>
          <Form.Item
            name="status"
            label="目标状态"
            rules={[{ required: true, message: '请选择目标状态' }]}
          >
            <Radio.Group>
              <Radio value="VACANT">空闲</Radio>
              <Radio value="OCCUPIED">在住</Radio>
              <Radio value="DIRTY">脏房</Radio>
              <Radio value="MAINTENANCE">维修</Radio>
              <Radio value="RESERVED">预订</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="reason" label="变更原因">
            <Input.TextArea rows={3} placeholder="请输入变更原因（可选）" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RoomStatus
