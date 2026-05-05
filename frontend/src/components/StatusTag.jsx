import { Tag } from 'antd';
import { getStatusLabel, getStatusColor } from '../utils/status';

const StatusTag = ({ status }) => {
  return (
    <Tag color={getStatusColor(status)}>
      {getStatusLabel(status)}
    </Tag>
  );
};

export default StatusTag;
