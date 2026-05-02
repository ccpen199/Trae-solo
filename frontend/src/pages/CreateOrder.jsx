import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Input, InputNumber, Button, Card, message, Typography, Divider, AutoComplete, Spin, Select } from 'antd';
import { SaveOutlined, GlobalOutlined, EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderApi, geocodeApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CreateOrder = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [originLocation, setOriginLocation] = useState({
    lat: 39.9042,
    lng: 116.4074,
  });

  const [destLocation, setDestLocation] = useState({
    lat: 39.9834,
    lng: 116.3169,
  });

  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [originLoading, setOriginLoading] = useState(false);
  const [destLoading, setDestLoading] = useState(false);

  const originTimerRef = useRef(null);
  const destTimerRef = useRef(null);

  const fetchSuggestions = useCallback(async (keyword, type) => {
    if (!keyword || keyword.trim().length < 2) {
      if (type === 'origin') {
        setOriginSuggestions([]);
      } else {
        setDestSuggestions([]);
      }
      return;
    }

    try {
      if (type === 'origin') {
        setOriginLoading(true);
      } else {
        setDestLoading(true);
      }

      const response = await geocodeApi.suggest(keyword, { limit: 8 });

      if (response.data.success && response.data.data.suggestions) {
        const options = response.data.data.suggestions.map(item => ({
          value: item.name,
          label: (
            <div style={{ padding: '4px 0' }}>
              <div style={{ fontWeight: 500 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {item.address} · {item.category}
              </div>
            </div>
          ),
          lat: item.lat,
          lng: item.lng,
          address: item.address,
        }));

        if (type === 'origin') {
          setOriginSuggestions(options);
        } else {
          setDestSuggestions(options);
        }
      }
    } catch (error) {
      console.error('获取地址建议失败:', error);
    } finally {
      if (type === 'origin') {
        setOriginLoading(false);
      } else {
        setDestLoading(false);
      }
    }
  }, []);

  const handleOriginAddressChange = useCallback((value) => {
    if (originTimerRef.current) {
      clearTimeout(originTimerRef.current);
    }

    originTimerRef.current = setTimeout(() => {
      fetchSuggestions(value, 'origin');
    }, 300);
  }, [fetchSuggestions]);

  const handleDestAddressChange = useCallback((value) => {
    if (destTimerRef.current) {
      clearTimeout(destTimerRef.current);
    }

    destTimerRef.current = setTimeout(() => {
      fetchSuggestions(value, 'dest');
    }, 300);
  }, [fetchSuggestions]);

  const handleOriginSelect = useCallback((value, option) => {
    if (option) {
      setOriginLocation({
        lat: option.lat,
        lng: option.lng,
      });
      setOriginSuggestions([]);
    }
  }, []);

  const handleDestSelect = useCallback((value, option) => {
    if (option) {
      setDestLocation({
        lat: option.lat,
        lng: option.lng,
      });
      setDestSuggestions([]);
    }
  }, []);

  const resolveAddress = useCallback(async (address, type) => {
    if (!address || address.trim() === '') {
      return;
    }

    try {
      if (type === 'origin') {
        setOriginLoading(true);
      } else {
        setDestLoading(true);
      }

      const response = await geocodeApi.geocode(address);

      if (response.data.success && response.data.data) {
        const { lat, lng, formattedAddress, isFallback } = response.data.data;

        if (type === 'origin') {
          setOriginLocation({ lat, lng });
          if (isFallback) {
            message.warning('未找到精确地址，已使用近似坐标');
          }
        } else {
          setDestLocation({ lat, lng });
          if (isFallback) {
            message.warning('未找到精确地址，已使用近似坐标');
          }
        }
      }
    } catch (error) {
      message.error('地址解析失败，请手动输入坐标');
      console.error('地址解析失败:', error);
    } finally {
      if (type === 'origin') {
        setOriginLoading(false);
      } else {
        setDestLoading(false);
      }
    }
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await orderApi.create({
        origin_lat: originLocation.lat,
        origin_lng: originLocation.lng,
        origin_address: values.origin_address,
        dest_lat: destLocation.lat,
        dest_lng: destLocation.lng,
        dest_address: values.dest_address,
        priority: values.priority || 0,
        remark: values.remark,
        userName: user?.name,
        userRole: user?.role,
      });

      if (response.data.success) {
        message.success('订单创建成功');
        navigate('/');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="创建导航订单">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            priority: 0,
          }}
        >
          <Title level={4}>
            <GlobalOutlined style={{ marginRight: 8 }} />
            起点信息
          </Title>
          <Divider />

          <Form.Item
            name="origin_address"
            label="起点地址"
            rules={[{ required: true, message: '请输入起点地址' }]}
          >
            <AutoComplete
              options={originSuggestions}
              onSearch={handleOriginAddressChange}
              onSelect={handleOriginSelect}
              notFoundContent={originLoading ? <Spin size="small" /> : null}
            >
              <Input
                prefix={<EnvironmentOutlined />}
                suffix={
                  <Button
                    type="link"
                    size="small"
                    icon={<SearchOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      const address = form.getFieldValue('origin_address');
                      resolveAddress(address, 'origin');
                    }}
                  >
                    解析
                  </Button>
                }
                placeholder="请输入起点地址，支持地点名称搜索"
                size="large"
              />
            </AutoComplete>
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="起点纬度" style={{ flex: 1, marginBottom: 0 }}>
              <InputNumber
                style={{ width: '100%' }}
                placeholder="纬度"
                value={originLocation.lat}
                onChange={(v) => setOriginLocation(prev => ({ ...prev, lat: v || 0 }))}
                step={0.0001}
                precision={6}
                min={-90}
                max={90}
              />
            </Form.Item>
            <Form.Item label="起点经度" style={{ flex: 1, marginBottom: 0 }}>
              <InputNumber
                style={{ width: '100%' }}
                placeholder="经度"
                value={originLocation.lng}
                onChange={(v) => setOriginLocation(prev => ({ ...prev, lng: v || 0 }))}
                step={0.0001}
                precision={6}
                min={-180}
                max={180}
              />
            </Form.Item>
          </div>

          <div style={{ height: 16 }} />

          <Title level={4}>
            <GlobalOutlined style={{ marginRight: 8 }} />
            终点信息
          </Title>
          <Divider />

          <Form.Item
            name="dest_address"
            label="终点地址"
            rules={[{ required: true, message: '请输入终点地址' }]}
          >
            <AutoComplete
              options={destSuggestions}
              onSearch={handleDestAddressChange}
              onSelect={handleDestSelect}
              notFoundContent={destLoading ? <Spin size="small" /> : null}
            >
              <Input
                prefix={<EnvironmentOutlined />}
                suffix={
                  <Button
                    type="link"
                    size="small"
                    icon={<SearchOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      const address = form.getFieldValue('dest_address');
                      resolveAddress(address, 'dest');
                    }}
                  >
                    解析
                  </Button>
                }
                placeholder="请输入终点地址，支持地点名称搜索"
                size="large"
              />
            </AutoComplete>
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="终点纬度" style={{ flex: 1, marginBottom: 0 }}>
              <InputNumber
                style={{ width: '100%' }}
                placeholder="纬度"
                value={destLocation.lat}
                onChange={(v) => setDestLocation(prev => ({ ...prev, lat: v || 0 }))}
                step={0.0001}
                precision={6}
                min={-90}
                max={90}
              />
            </Form.Item>
            <Form.Item label="终点经度" style={{ flex: 1, marginBottom: 0 }}>
              <InputNumber
                style={{ width: '100%' }}
                placeholder="经度"
                value={destLocation.lng}
                onChange={(v) => setDestLocation(prev => ({ ...prev, lng: v || 0 }))}
                step={0.0001}
                precision={6}
                min={-180}
                max={180}
              />
            </Form.Item>
          </div>

          <div style={{ height: 16 }} />

          <Title level={4}>
            其他信息
          </Title>
          <Divider />

          <Form.Item
            name="priority"
            label="优先级"
          >
            <Select
              options={[
                { value: 0, label: '普通' },
                { value: 1, label: '紧急' },
                { value: 2, label: '特急' },
              ]}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea
              placeholder="请输入备注信息"
              rows={3}
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<SaveOutlined />}
              loading={loading}
            >
              创建订单
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateOrder;
