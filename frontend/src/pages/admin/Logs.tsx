import React, { useEffect, useState } from 'react';
import { Card, Spin, Empty, List, Tag } from 'antd';

export const AdminLogs: React.FC = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <Spin spinning={loading}>
      <Card title="操作日志">
        <Empty description="操作日志功能开发中" />
      </Card>
    </Spin>
  );
};
