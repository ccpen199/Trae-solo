import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Button, 
  Spin, 
  message,
  Space
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const STATUS_MAP = {
  active: { text: '正常', color: 'success' },
  inactive: { text: '停用', color: 'default' },
  moved: { text: '已迁出', color: 'warning' },
  deleted: { text: '已注销', color: 'error' }
};

const GENDER_MAP = {
  male: '男',
  female: '女'
};

const HouseholdDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [household, setHousehold] = useState(null);

  useEffect(() => {
    if (id) {
      fetchHouseholdDetail();
    }
  }, [id]);

  const fetchHouseholdDetail = async () => {
    setLoading(true);
    try {
      const response = await api.getHouseholdById(id);
      if (response.success) {
        setHousehold(response.data.household);
      }
    } catch (error) {
      console.error('获取户籍详情失败:', error);
      message.error('获取户籍详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!household) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <p>户籍信息不存在</p>
        <Button onClick={() => navigate('/households')}>返回列表</Button>
      </div>
    );
  }

  return (
    <div>
      <Card
        title="户籍详情"
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/households')}>
            返回列表
          </Button>
        }
      >
        <Descriptions bordered column={2} size="middle">
          <Descriptions.Item label="姓名" span={1}>{household.name}</Descriptions.Item>
          <Descriptions.Item label="身份证号" span={1}>{household.idCard}</Descriptions.Item>
          <Descriptions.Item label="性别" span={1}>{GENDER_MAP[household.gender]}</Descriptions.Item>
          <Descriptions.Item label="年龄" span={1}>{household.age}</Descriptions.Item>
          <Descriptions.Item label="民族" span={1}>{household.ethnicity || '-'}</Descriptions.Item>
          <Descriptions.Item label="学历" span={1}>{household.education || '-'}</Descriptions.Item>
          <Descriptions.Item label="职业" span={1}>{household.occupation || '-'}</Descriptions.Item>
          <Descriptions.Item label="婚姻状况" span={1}>{household.maritalStatus || '-'}</Descriptions.Item>
          <Descriptions.Item label="联系电话" span={1}>{household.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="户口类型" span={1}>{household.householdType || '-'}</Descriptions.Item>
          <Descriptions.Item label="现住址" span={2}>{household.currentAddress}</Descriptions.Item>
          <Descriptions.Item label="户籍地址" span={2}>{household.householdAddress}</Descriptions.Item>
          <Descriptions.Item label="紧急联系人" span={1}>{household.emergencyContact || '-'}</Descriptions.Item>
          <Descriptions.Item label="紧急联系电话" span={1}>{household.emergencyPhone || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态" span={1}>
            <Tag color={STATUS_MAP[household.status]?.color || 'default'}>
              {STATUS_MAP[household.status]?.text || household.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间" span={1}>{household.createdAt}</Descriptions.Item>
          <Descriptions.Item label="更新时间" span={1}>{household.updatedAt || '-'}</Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>{household.note || '无'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default HouseholdDetail;
