import { useUserStore } from '@/stores/useUserStore';
import { Avatar, Button, Space } from 'antd';
import {
  SafetyCertificateOutlined,
  FormOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const roleLabelMap: Record<string, string> = {
  '超级管理员': '监管端',
  '系统管理员': '监管端',
  '审核员': '监管端',
  '巡检员': '巡检员',
  '数据分析员': '监管端',
};

const WelcomeHeader: React.FC = () => {
  const { userInfo } = useUserStore();
  const today = dayjs().format('YYYY年MM月DD日 dddd');

  const roleLabel = roleLabelMap[userInfo?.role || ''] || '监管端';

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Avatar
          size={56}
          src={userInfo?.avatar}
          className="ring-2 ring-primary-100"
        >
          {userInfo?.realName?.[0] || 'U'}
        </Avatar>
        <div>
          <div className="text-lg font-semibold text-neutral-600">
            你好，{userInfo?.realName || '用户'}
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-500">
              {roleLabel}
            </span>
          </div>
          <div className="text-sm text-neutral-400 mt-1">
            {userInfo?.department || '未设置部门'} · {today}
          </div>
        </div>
      </div>

      <Space size="middle">
        <Button
          type="primary"
          icon={<SafetyCertificateOutlined />}
          className="shadow-sm"
        >
          发起核验
        </Button>
        <Button icon={<FormOutlined />} className="shadow-sm">
          创建巡检
        </Button>
        <Button icon={<AlertOutlined />} className="shadow-sm">
          查看告警
        </Button>
      </Space>
    </div>
  );
};

export default WelcomeHeader;
