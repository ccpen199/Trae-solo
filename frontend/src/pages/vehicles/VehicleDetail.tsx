import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, Divider, Table, Empty } from 'antd';
import { ArrowLeftOutlined, CarOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleApi } from '../../services/api';
import { Vehicle, VehicleStatusMap, FuelTypeMap } from '../../types';

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (id) {
      loadVehicle();
    }
  }, [id]);

  const loadVehicle = async () => {
    setLoading(true);
    try {
      const res = await vehicleApi.detail(Number(id));
      setVehicle(res.data);
    } catch (err) {
      console.error('加载车辆详情失败', err);
    } finally {
      setLoading(false);
    }
  };

  if (!vehicle && !loading) {
    return <Empty description="车辆不存在" />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
          车辆详情 - {vehicle?.plate_number}
        </h2>
        <Space>
          <Button type="primary" onClick={() => navigate(`/orders/create?vehicle_id=${vehicle?.id}`)}>
            创建订单
          </Button>
        </Space>
      </div>

      <Card loading={loading}>
        <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
          <div className="vehicle-image" style={{ width: 300, height: 200, borderRadius: 8 }}>
            <CarOutlined style={{ fontSize: 64 }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>
              {vehicle?.brand} {vehicle?.model}
              <Tag color={VehicleStatusMap[vehicle?.status || '']?.color} style={{ marginLeft: 12 }}>
                {VehicleStatusMap[vehicle?.status || '']?.text}
              </Tag>
            </h2>
            <p style={{ fontSize: 20, color: '#1677ff', fontWeight: 600, marginBottom: 16 }}>
              ¥{vehicle?.daily_rate} <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}>/天</span>
            </p>
            <p style={{ color: 'rgba(0,0,0,0.65)', marginBottom: 16 }}>{vehicle?.description}</p>
            <Space size="large">
              <div>
                <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>押金</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>¥{vehicle?.deposit_amount}</div>
              </div>
              <div>
                <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>保险费</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>¥{vehicle?.insurance_fee}/天</div>
              </div>
              <div>
                <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>当前里程</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{vehicle?.mileage} km</div>
              </div>
              <div>
                <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>所属门店</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{vehicle?.store_name}</div>
              </div>
            </Space>
          </div>
        </div>

        <Divider />

        <div className="detail-section">
          <h3 className="detail-section-title">基本信息</h3>
          <Descriptions column={3} bordered size="small">
            <Descriptions.Item label="车牌号">{vehicle?.plate_number}</Descriptions.Item>
            <Descriptions.Item label="品牌">{vehicle?.brand}</Descriptions.Item>
            <Descriptions.Item label="车型">{vehicle?.model}</Descriptions.Item>
            <Descriptions.Item label="颜色">{vehicle?.color}</Descriptions.Item>
            <Descriptions.Item label="年款">{vehicle?.year}年</Descriptions.Item>
            <Descriptions.Item label="燃油类型">{FuelTypeMap[vehicle?.fuel_type || ''] || vehicle?.fuel_type}</Descriptions.Item>
            <Descriptions.Item label="变速箱">{vehicle?.transmission === 'auto' ? '自动' : '手动'}</Descriptions.Item>
            <Descriptions.Item label="座位数">{vehicle?.seats}座</Descriptions.Item>
            <Descriptions.Item label="当前里程">{vehicle?.mileage} km</Descriptions.Item>
          </Descriptions>
        </div>

        {vehicle?.features && (
          <>
            <Divider />
            <div className="detail-section">
              <h3 className="detail-section-title">配置功能</h3>
              <Space wrap>
                {vehicle.features.split(',').map((f, i) => (
                  <Tag key={i} color="blue">{f}</Tag>
                ))}
              </Space>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default VehicleDetail;
