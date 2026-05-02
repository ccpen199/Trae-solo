import React, { useEffect, useState } from 'react';
import { Card, Spin, Empty, List, Tag } from 'antd';

export const AdminMonitoring: React.FC = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <Spin spinning={loading}>
      <Card title="异常监控">
        <Empty description="异常监控功能开发中" />
      </Card>
    </Spin>
  );
};
