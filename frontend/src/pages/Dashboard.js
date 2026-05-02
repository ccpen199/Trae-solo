import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress } from 'antd';
import axios from 'axios';

const Dashboard = ({ user }) => {
  const [statistics, setStatistics] = useState({
    totalEquipment: 0,
    maintenancePlans: 0,
    repairOrders: 0,
    spareParts: 0
  });

  useEffect(() => {
    // 获取统计数据
    const fetchStatistics = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // 获取设备总数
        const equipmentResponse = await axios.get('http://localhost:3001/api/equipment', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // 获取保养计划数
        const maintenanceResponse = await axios.get('http://localhost:3001/api/maintenance', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // 获取维修工单数
        const repairResponse = await axios.get('http://localhost:3001/api/repair', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // 获取备件数
        const sparePartResponse = await axios.get('http://localhost:3001/api/sparePart', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setStatistics({
          totalEquipment: equipmentResponse.data.equipments.length,
          maintenancePlans: maintenanceResponse.data.plans.length,
          repairOrders: repairResponse.data.orders.length,
          spareParts: sparePartResponse.data.spareParts.length
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    fetchStatistics();
  }, []);

  return (
    <div>
      <h2>仪表盘</h2>
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="设备总数" 
              value={statistics.totalEquipment} 
              prefix={<i className="anticon anticon-laptop"></i>} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="保养计划" 
              value={statistics.maintenancePlans} 
              prefix={<i className="anticon anticon-tool"></i>} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="维修工单" 
              value={statistics.repairOrders} 
              prefix={<i className="anticon anticon-build"></i>} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="备件总数" 
              value={statistics.spareParts} 
              prefix={<i className="anticon anticon-tool"></i>} 
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="设备状态分布">
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 24 }}>
              <div>
                <div style={{ fontSize: 14, marginBottom: 8 }}>正常运行</div>
                <Progress type="circle" percent={75} size={120} />
              </div>
              <div>
                <div style={{ fontSize: 14, marginBottom: 8 }}>维护中</div>
                <Progress type="circle" percent={15} size={120} />
              </div>
              <div>
                <div style={{ fontSize: 14, marginBottom: 8 }}>维修中</div>
                <Progress type="circle" percent={10} size={120} />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="近期任务">
            <div style={{ marginTop: 24 }}>
              <div style={{ marginBottom: 12 }}>• 设备保养：3项待完成</div>
              <div style={{ marginBottom: 12 }}>• 维修工单：2项待处理</div>
              <div style={{ marginBottom: 12 }}>• 备件库存：1项不足</div>
              <div>• 设备检查：5项待执行</div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;