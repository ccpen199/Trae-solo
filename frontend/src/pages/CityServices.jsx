import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Button, Tabs } from 'antd';
import { CloudOutlined, EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined } from '@ant-design/icons';
import api from '../utils/api';

function CityServices() {
  const [weather, setWeather] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    loadWeather();
    loadGovernmentMap();
    loadOutlets();
    loadEmergencyContacts();
  }, []);

  const loadWeather = async () => {
      try {
        const data = await api.get('/city/weather');
        setWeather(data);
      } catch (err) {
        console.error(err);
      }
    };

  const loadGovernmentMap = async () => {
      try {
        const data = await api.get('/city/government-map');
        setDepartments(data.departments || []);
      } catch (err) {
        console.error(err);
      }
    };

  const loadOutlets = async () => {
      try {
        const data = await api.get('/city/service-outlets');
        setOutlets(data);
      } catch (err) {
        console.error(err);
      }
    };

  const loadEmergencyContacts = async () => {
      try {
        const data = await api.get('/city/emergency-contacts');
        setContacts(data);
      } catch (err) {
        console.error(err);
      }
    };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <CloudOutlined style={{ fontSize: 64, color: '#1890ff' }} />
              <div>
                <h2 style={{ fontSize: 48, margin: 0 }}>{weather?.temperature}°C</h2>
                <div style={{ color: '#666' }}>{weather?.weather}</div>
              </div>
            </div>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic title="湿度" value={weather?.humidity} suffix="%" />
              </Col>
              <Col span={12}>
                <Statistic title="空气质量" value={weather?.airQuality?.level} />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title="未来三天预报">
            <Row gutter={[16, 16]}>
              {weather?.forecast?.map((item, idx) => (
                <Col xs={8} key={idx}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                    <div style={{ fontSize: 14, color: '#666' }}>{item.date}</div>
                    <div style={{ fontSize: 24, margin: '8px 0' }}>{item.weather}</div>
                    <div>
                      <span style={{ color: '#f5222d' }}>{item.high}°</span>
                      <span style={{ color: '#1890ff', marginLeft: 8 }}>{item.low}°</span>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="政务地图">
        <Row gutter={[16, 16]}>
          {departments.map((dept) => (
            <Col xs={12} md={8} key={dept.id}>
              <Card size="small">
                <Card.Meta
                  avatar={<EnvironmentOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                  title={dept.name}
                  description={
                    <div>
                      <div style={{ fontSize: 12, color: '#666' }}>{dept.address}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>距离：{dept.distance}</div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Tabs style={{ marginTop: 16 }}>
        <Tabs.TabPane tab="服务网点" key="outlets">
          <List
            dataSource={outlets}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<ClockCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                  title={item.name}
                  description={
                    <div>
                      <div>{item.address}</div>
                      <div style={{ color: '#666' }}>{item.businessHours}</div>
                    </div>
                  }
                />
                <div style={{ textAlign: 'right' }}>
                  <div>可办理事项：{item.services} 项</div>
                  <div>服务窗口：{item.windows} 个</div>
                </div>
              </List.Item>
            )}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="常用电话" key="contacts">
          <Row gutter={[16, 16]}>
            {contacts.map((item, idx) => (
              <Col xs={12} md={6} key={idx}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <PhoneOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ fontSize: 20, color: '#f5222d', margin: '8px 0' }}>{item.number}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{item.description}</div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default CityServices;
