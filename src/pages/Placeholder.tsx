import { Result, Button } from 'antd';
import { FileProtectOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface PlaceholderProps {
  title?: string;
  description?: string;
  extra?: React.ReactNode;
}

export default function Placeholder({
  title,
  description = '该页面正在开发中，敬请期待...',
  extra,
}: PlaceholderProps) {
  const navigate = useNavigate();
  const pageTitle = title || document.title?.split(' - ')[0] || '页面';

  const defaultExtra = (
    <Button type="primary" onClick={() => navigate(-1)}>
      返回上一页
    </Button>
  );

  return (
    <div className="min-h-[500px] flex items-center justify-center bg-white rounded-lg shadow-sm">
      <Result
        icon={<FileProtectOutlined className="!text-primary-500" />}
        title={<span className="text-primary-700 font-semibold">{pageTitle}</span>}
        subTitle={<span className="text-gray-500">{description}</span>}
        extra={extra || defaultExtra}
        status="info"
      />
    </div>
  );
}
