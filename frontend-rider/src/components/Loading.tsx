import { Spin } from 'antd';

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ text = '加载中...', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-3 text-gray-500">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <Spin />
        <p className="mt-2 text-gray-500 text-sm">{text}</p>
      </div>
    </div>
  );
};

export default Loading;
