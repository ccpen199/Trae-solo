import { useState } from 'react';
import { Card, Row, Col, Badge, List, Tag, Space, Calendar, Modal, Descriptions, Button } from 'antd';
import { CheckCircleOutlined, WarningOutlined, MedicineBoxOutlined, CalendarOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

interface VaccinationCalendarItem {
  id: string;
  date: string;
  earTagId: string;
  vaccine: string;
  type: 'upcoming' | 'overdue' | 'completed';
}

const VaccinationCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDayItems, setSelectedDayItems] = useState<VaccinationCalendarItem[]>([]);

  const calendarData: VaccinationCalendarItem[] = [
    { id: '1', date: '2026-04-20', earTagId: 'E12345', vaccine: '口蹄疫', type: 'completed' },
    { id: '2', date: '2026-04-15', earTagId: 'E12346', vaccine: '猪瘟', type: 'completed' },
    { id: '3', date: '2026-04-27', earTagId: 'E12347', vaccine: '蓝耳病', type: 'overdue' },
    { id: '4', date: '2026-04-30', earTagId: 'E12348', vaccine: '猪瘟', type: 'upcoming' },
    { id: '5', date: '2026-05-05', earTagId: 'E20001', vaccine: '口蹄疫', type: 'upcoming' },
    { id: '6', date: '2026-05-10', earTagId: 'E12349', vaccine: '蓝耳病', type: 'upcoming' },
    { id: '7', date: '2026-05-15', earTagId: 'E12350', vaccine: '伪狂犬病', type: 'upcoming' },
  ];

  const vaccineStats = {
    upcoming: calendarData.filter(d => d.type === 'upcoming').length,
    overdue: calendarData.filter(d => d.type === 'overdue').length,
    completed: calendarData.filter(d => d.type === 'completed').length,
  };

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayItems = calendarData.filter(item => item.date === dateStr);

    if (dayItems.length === 0) return null;

    const hasOverdue = dayItems.some(item => item.type === 'overdue');
    const hasUpcoming = dayItems.some(item => item.type === 'upcoming');
    
    let badgeColor = '#52c41a';
    if (hasOverdue) badgeColor = '#ff4d4f';
    else if (hasUpcoming) badgeColor = '#faad14';

    return (
      <div style={{ padding: '4px 0' }}>
        <Badge count={dayItems.length} color={badgeColor} style={{ cursor: 'pointer' }} onClick={() => showDayDetails(dateStr)} />
      </div>
    );
  };

  const showDayDetails = (dateStr: string) => {
    const items = calendarData.filter(item => item.date === dateStr);
    setSelectedDayItems(items);
    setSelectedDate(dayjs(dateStr));
    setModalVisible(true);
  };

  const getTypeTag = (type: string) => {
    const typeMap = {
      completed: { color: 'green', text: '已接种', icon: <CheckCircleOutlined /> },
      upcoming: { color: 'blue', text: '待接种', icon: <CalendarOutlined /> },
      overdue: { color: 'red', text: '已逾期', icon: <WarningOutlined /> }
    };
    const config = typeMap[type as keyof typeof typeMap] || typeMap.upcoming;
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getVaccineText = (value: string) => {
    const vaccineMap: Record<string, string> = {
      fmd: '口蹄疫',
      swine_fever: '猪瘟',
      prrs: '蓝耳病',
      pseudorabies: '伪狂犬病',
      circovirus: '圆环病毒',
      parvovirus: '细小病毒',
      infectious_bursal: '法氏囊',
    };
    return vaccineMap[value] || value;
  };

  const upcomingItems = calendarData.filter(item => item.type === 'upcoming');
  const overdueItems = calendarData.filter(item => item.type === 'overdue');

  return (
    <div>
      <Row gutter={24}>
        <Col span={14}>
          <Card title="防疫日历">
            <Calendar
              onSelect={(value) => setSelectedDate(value)}
              cellRender={(current, info) => {
                if (info.type === 'date') return dateCellRender(current);
                return info.originNode;
              }}
            />
          </Card>
        </Col>

        <Col span={10}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                <div style={{ fontSize: 20, color: '#52c41a', fontWeight: 'bold' }}>{vaccineStats.completed}</div>
                <div>已接种</div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
                <div style={{ fontSize: 20, color: '#faad14', fontWeight: 'bold' }}>{vaccineStats.upcoming}</div>
                <div>待接种</div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center', background: '#fff2f0' }}>
                <div style={{ fontSize: 20, color: '#ff4d4f', fontWeight: 'bold' }}>{vaccineStats.overdue}</div>
                <div>已逾期</div>
              </Card>
            </Col>
          </Row>

          {overdueItems.length > 0 && (
            <Card title={<Space><WarningOutlined style={{ color: '#ff4d4f' }} /> <span style={{ color: '#ff4d4f' }}>紧急！逾期未接种</span></Space>} style={{ marginBottom: 16 }}>
              <List
                dataSource={overdueItems}
                renderItem={(item) => (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div><strong>{item.earTagId}</strong> - {getVaccineText(item.vaccine)}</div>
                      <div style={{ color: '#ff4d4f' }}>逾期日期: {item.date}</div>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}

          <Card title={<Space><CalendarOutlined /> 待接种计划</Space>}>
            <List
              dataSource={upcomingItems}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div><strong>{item.earTagId}</strong> - {getVaccineText(item.vaccine)}</div>
                    <div style={{ color: '#666' }}>计划日期: {item.date}</div>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={`${selectedDate.format('YYYY年MM月DD日')} - 防疫安排`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>关闭</Button>
        ]}
        width={600}
      >
        <List
          dataSource={selectedDayItems}
          renderItem={(item) => (
            <List.Item>
              <Card size="small" style={{ width: '100%' }}>
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="耳标编号" span={2}>{item.earTagId}</Descriptions.Item>
                  <Descriptions.Item label="疫苗">{getVaccineText(item.vaccine)}</Descriptions.Item>
                  <Descriptions.Item label="状态">{getTypeTag(item.type)}</Descriptions.Item>
                </Descriptions>
              </Card>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default VaccinationCalendar;
