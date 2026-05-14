import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const Test = () => {
  return (
    <div style={{ padding: 50 }}>
      <Title>测试页面 - 正常渲染</Title>
      <p>如果你能看到这个，说明 React 应用正常工作了！</p>
    </div>
  );
};

export default Test;
