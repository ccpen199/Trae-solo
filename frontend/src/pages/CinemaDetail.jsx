import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Tag, Row, Col, message, Empty } from 'antd'
import { EnvironmentOutlined, PhoneOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { cinemaAPI } from '../utils/api'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography

function CinemaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cinema, setCinema] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))

  useEffect(() => {
    loadCinema()
    loadSessions()
  }, [id, selectedDate])

  const loadCinema = async () => {
    try {
      const data = await cinemaAPI.detail(id)
      setCinema(data)
    } catch (e) {
      message.error('加载失败')
    }
  }

  const loadSessions = async () => {
    try {
      const data = await cinemaAPI.sessions(id, selectedDate)
      setSessions(data || [])
    } catch (e) {
      message.error('加载失败')
    }
  }

  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = dayjs().add(i, 'day')
    dates.push({ value: d.format('YYYY-MM-DD'), label: i === 0 ? '今天' : d.format('MM/DD ddd') })
  }

  const groupedByMovie = {}
  sessions.forEach(s => {
    if (!groupedByMovie[s.title]) groupedByMovie[s.title] = []
    groupedByMovie[s.title].push(s)
  })

  if (!cinema) return <div style={{ textAlign: 'center', padding: 60 }}>加载中...</div>

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 16 }}>{cinema.name}</Title>
        <Paragraph style={{ color: '#666' }}>
          <EnvironmentOutlined /> {cinema.address}
        </Paragraph>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {cinema.equipment_types?.split(',').map(eq => (
            <Tag color="blue" key={eq}>{eq}</Tag>
          ))}
        </div>
      </Card>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {dates.map(d => (
            <Tag.CheckableTag
              key={d.value}
              checked={selectedDate === d.value}
              onChange={() => setSelectedDate(d.value)}
              style={{ padding: '8px 16px', fontSize: 14 }}
            >
              {d.label}
            </Tag.CheckableTag>
          ))}
        </div>
      </div>

      {Object.keys(groupedByMovie).length === 0 ? (
        <Card>
          <Empty description="暂无排期场次" />
        </Card>
      ) : (
        Object.entries(groupedByMovie).map(([title, movieSessions]) => (
          <Card key={title} title={title} style={{ marginBottom: 16 }}>
            <Row gutter={[12, 12]}>
              {movieSessions.map(s => (
                <Col key={s.id}>
                  <Card 
                    size="small"
                    hoverable
                    onClick={() => navigate(`/sessions/${s.id}`)}
                    style={{ width: 130, textAlign: 'center' }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                      {dayjs(s.start_time).format('HH:mm')}
                    </div>
                    <div style={{ color: '#999', fontSize: 12, margin: '4px 0' }}>
                      {s.hall_name}
                    </div>
                    <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                      ¥{s.base_price}
                    </div>
                    <Tag color="blue" style={{ marginTop: 4, fontSize: 11 }}>{s.version}</Tag>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        ))
      )}
    </div>
  )
}

export default CinemaDetail
