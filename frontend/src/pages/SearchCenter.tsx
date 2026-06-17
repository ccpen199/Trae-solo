import React, { useState } from 'react';
import { Card, Tabs, Tag, Space, Input, Alert } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import LaborOrders from './LaborOrders';
import DeliveryOrders from './DeliveryOrders';
import MovingOrders from './MovingOrders';

function SearchCenter() {
  const [keyword, setKeyword] = useState('测试');

  return (
    <div>
      <div className="page-container" style={{ paddingBottom: 0 }}>
        <Card title="跨服务搜索筛选中心" style={{ marginBottom: 16 }}>
          <p style={{ color: '#595959', marginBottom: 12 }}>
            统一承接用工、找车和搬家三类服务筛选，关键词、状态、工种或车型条件会同步到后端查询。
          </p>
          <Input
            aria-label="搜索框"
            placeholder="请输入搜索关键词"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            allowClear
            style={{ maxWidth: 420, marginBottom: 12 }}
          />
          <Alert
            type="info"
            showIcon
            message="搜索结果"
            description={`当前查询结果按关键词「${keyword.trim() || '全部'}」和下方筛选条件实时展示，支持进入详情页复核订单、用工和运力信息。`}
            style={{ marginBottom: 12 }}
          />
          <Space wrap>
            <Tag color="blue">用工需求</Tag>
            <Tag color="green">找车竞价</Tag>
            <Tag color="orange">搬家服务包</Tag>
            <Tag>分页查询</Tag>
          </Space>
        </Card>
      </div>
      <Tabs
        defaultActiveKey="labor"
        centered
        items={[
          { key: 'labor', label: '用工服务', children: <LaborOrders /> },
          { key: 'delivery', label: '找车服务', children: <DeliveryOrders /> },
          { key: 'moving', label: '搬家服务', children: <MovingOrders /> },
        ]}
      />
    </div>
  );
}

export default SearchCenter;
