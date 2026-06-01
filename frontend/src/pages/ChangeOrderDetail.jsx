import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography } from 'antd';

const { Title } = Typography;

function ChangeOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="table-container">
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>变更单详情</Title>
      </div>
      <Card>
        <p>变更单 ID: {id}</p>
        <p>详细信息请在变更单列表页点击"详情"查看</p>
      </Card>
    </div>
  );
}

export default ChangeOrderDetail;
