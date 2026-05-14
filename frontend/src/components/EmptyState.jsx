import { Empty, Button } from 'antd';

const EmptyState = ({ description = '暂无数据', actionText, onAction, icon }) => (
  <Empty
    image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
    description={description}
    style={{ padding: '60px 20px' }}
  >
    {actionText && onAction && (
      <Button type="primary" onClick={onAction}>{actionText}</Button>
    )}
  </Empty>
);

export default EmptyState;
