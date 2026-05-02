import React, { useEffect, useState } from 'react';
import { Card, Spin, Empty, List, Tag } from 'antd';

export const AdminReports: React.FC = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <Spin spinning={loading}>
      <Card title="统计报告">
        <Empty description="统计报告功能开发中" />
      </Card>
    </Spin>
  );
};
