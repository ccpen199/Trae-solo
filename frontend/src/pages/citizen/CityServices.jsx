import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Select, Tag } from 'antd';
import { citizenAPI } from '../../services/api';

const { Option } = Select;

function CityServices() {
  const [services, setServices] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [filteredMarkers, setFilteredMarkers] = useState([]);
  const [type, setType] = useState('all');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterMarkers();
  }, [markers, type, keyword]);

  const loadData = async () => {
    try {
      const [servicesRes, mapRes] = await Promise.all([
        citizenAPI.getCityServices(),
        citizenAPI.getLifeMap({})
      ]);
      setServices(servicesRes.data);
      setMarkers(mapRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filterMarkers = () => {
    let filtered = markers;
    if (type !== 'all') {
      filtered = filtered.filter(m => m.type === type);
    }
    if (keyword) {
      filtered = filtered.filter(m => 
        m.name.includes(keyword) || m.address.includes(keyword)
      );
    }
    setFilteredMarkers(filtered);
  };

  const typeOptions = [
    { value: 'all', label: '全部' },
    { value: 'government', label: '政务服务' },
    { value: 'shopping', label: '购物商场' },
    { value: 'scenic', label: '景点景区' },
    { value: 'hospital', label: '医疗机构' },
    { value: 'transport', label: '交通枢纽' },
    { value: 'business', label: '商务楼宇' }
  ];

  const getTypeColor = (type) => {
    const map = {
      government: 'blue',
      shopping: 'purple',
      scenic: 'green',
      hospital: 'red',
      transport: 'orange',
      business: 'cyan'
    };
    return map[type] || 'default';
  };

  const getStatusColor = (status) => {
    const map = {
      open: 'green',
      busy: 'orange',
      closed: 'red'
    };
    return map[status] || 'default';
  };

  const getStatusText = (status) => {
    const map = {
      open: '营业中',
      busy: '繁忙',
      closed: '已关闭'
    };
    return map[status] || status;
  };

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card title="城市服务" style={{ marginBottom: 16 }}>
            <Row gutter={[8, 8]}>
              {services.map(service => (
                <Col span={12} key={service.id}>
                  <Card 
                    size="small" 
                    hoverable
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{service.icon}</div>
                    <div style={{ fontSize: 12 }}>{service.name}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{service.count}项服务</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col span={18}>
          <Card title="生活地图">
            <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
              <Select
                style={{ width: 150 }}
                value={type}
                onChange={setType}
              >
                {typeOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
              <Input.Search
                style={{ width: 300 }}
                placeholder="搜索地点名称或地址"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>

            <Card 
              style={{ 
                height: 400, 
                marginBottom: 16,
                background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
                <p>GIS地图可视化区域</p>
                <p style={{ fontSize: 12 }}>共 {filteredMarkers.length} 个地点</p>
              </div>
              <div style={{ 
                position: 'absolute', 
                top: 16, 
                right: 16,
                background: 'white',
                padding: 8,
                borderRadius: 4,
                fontSize: 12
              }}>
                <div>📍 当前区域：杭州市</div>
                <div>缩放级别：12</div>
              </div>
            </Card>

            <Card size="small" title={`地点列表 (${filteredMarkers.length})`}>
              <Row gutter={[16, 16]}>
                {filteredMarkers.map(marker => (
                  <Col span={12} key={marker.id}>
                    <Card size="small" hoverable>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h4 style={{ marginBottom: 4 }}>{marker.name}</h4>
                          <div style={{ marginBottom: 4 }}>
                            <Tag color={getTypeColor(marker.type)}>{marker.type}</Tag>
                            <Tag color={getStatusColor(marker.status)}>
                              {getStatusText(marker.status)}
                            </Tag>
                          </div>
                          <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
                            📍 {marker.address}
                          </p>
                          <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
                            📍 坐标：{marker.lat}, {marker.lng}
                          </p>
                        </div>
                        <div style={{ fontSize: 24 }}>
                          {marker.type === 'government' && '🏢'}
                          {marker.type === 'shopping' && '🛍️'}
                          {marker.type === 'scenic' && '🏞️'}
                          {marker.type === 'hospital' && '🏥'}
                          {marker.type === 'transport' && '🚉'}
                          {marker.type === 'business' && '🏙️'}
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default CityServices;
