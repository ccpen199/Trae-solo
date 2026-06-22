import { Empty as AntdEmpty } from 'antd';

interface EmptyProps {
  description?: string;
  image?: React.ReactNode;
}

const Empty: React.FC<EmptyProps> = ({ description = '暂无数据', image }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <AntdEmpty
        image={image || AntdEmpty.PRESENTED_IMAGE_SIMPLE}
        description={description}
      />
    </div>
  );
};

export default Empty;
