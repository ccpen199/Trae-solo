import { useState, useMemo } from 'react';
import { Tabs, List, Tag, Button, message } from 'antd';
import {
  BellOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/PageHeader';
import Empty from '@/components/Empty';
import { useMessageStore, type Message, type MessageCategory } from '@/store/messageStore';

const { TabPane } = Tabs;

const categoryIcons: Record<MessageCategory, React.ReactNode> = {
  system: <BellOutlined className="text-blue-500" />,
  dispatch: <FileTextOutlined className="text-green-500" />,
  timeout: <ExclamationCircleOutlined className="text-orange-500" />,
  appeal: <CheckCircleOutlined className="text-purple-500" />,
};

const categoryColors: Record<MessageCategory, string> = {
  system: 'blue',
  dispatch: 'green',
  timeout: 'orange',
  appeal: 'purple',
};

const categoryLabels: Record<MessageCategory, string> = {
  system: '系统通知',
  dispatch: '派单消息',
  timeout: '超时预警',
  appeal: '申诉结果',
};

const formatTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`;

  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const mockMessages: Message[] = [
  {
    id: '1',
    category: 'dispatch',
    title: '新订单派发',
    content: '您有一个新订单待接取，订单号：DD20240601001，距离2.3km，预估收入18.5元',
    read: false,
    createdAt: Date.now() - 5 * 60 * 1000,
  },
  {
    id: '2',
    category: 'system',
    title: '系统维护通知',
    content: '系统将于今晚23:00-次日02:00进行维护升级，期间可能无法正常接单',
    read: false,
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: '3',
    category: 'timeout',
    title: '配送超时预警',
    content: '订单DD20240601002距离超时仅剩10分钟，请尽快完成配送',
    read: false,
    createdAt: Date.now() - 30 * 60 * 1000,
  },
  {
    id: '4',
    category: 'appeal',
    title: '申诉处理结果',
    content: '您提交的申诉（订单DD20240531008）已通过审核，相关处罚已撤销',
    read: true,
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    id: '5',
    category: 'dispatch',
    title: '批量订单提醒',
    content: '当前区域订单量激增，建议保持在线状态以获得更多派单机会',
    read: true,
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
];

const MessageCenter: React.FC = () => {
  const { messages, markAsRead, markAllAsRead, setMessages } = useMessageStore();
  const [activeTab, setActiveTab] = useState<MessageCategory | 'all'>('all');

  const displayMessages = useMemo(() => {
    const all = messages.length > 0 ? messages : mockMessages;
    if (activeTab === 'all') return all;
    return all.filter((m) => m.category === activeTab);
  }, [messages, activeTab]);

  const handleMessageClick = (msg: Message) => {
    if (!msg.read) {
      markAsRead(msg.id);
    }
  };

  const handleMarkAllRead = () => {
    if (messages.length === 0) {
      setMessages(mockMessages.map((m) => ({ ...m, read: true })));
    } else {
      markAllAsRead();
    }
    message.success('已全部标为已读');
  };

  const headerRight = (
    <Button type="link" size="small" onClick={handleMarkAllRead}>
      全部标为已读
    </Button>
  );

  const getTabCount = (category: MessageCategory | 'all') => {
    const all = messages.length > 0 ? messages : mockMessages;
    if (category === 'all') {
      return all.filter((m) => !m.read).length;
    }
    return all.filter((m) => m.category === category && !m.read).length;
  };

  return (
    <div className="page-container pb-20">
      <PageHeader title="消息中心" rightContent={headerRight} />

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as MessageCategory | 'all')}
        className="px-4"
      >
        <TabPane
          tab={
            <span>
              全部
              {getTabCount('all') > 0 && (
                <Tag color="red" className="ml-1">{getTabCount('all')}</Tag>
              )}
            </span>
          }
          key="all"
        />
        {(['system', 'dispatch', 'timeout', 'appeal'] as MessageCategory[]).map((cat) => (
          <TabPane
            key={cat}
            tab={
              <span>
                {categoryLabels[cat]}
                {getTabCount(cat) > 0 && (
                  <Tag color="red" className="ml-1">{getTabCount(cat)}</Tag>
                )}
              </span>
            }
          />
        ))}
      </Tabs>

      <div className="px-4">
        {displayMessages.length === 0 ? (
          <Empty description="暂无消息" />
        ) : (
          <List
            dataSource={displayMessages}
            renderItem={(item) => (
              <List.Item
                onClick={() => handleMessageClick(item)}
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                  !item.read ? 'bg-blue-50/30' : ''
                }`}
              >
                <List.Item.Meta
                  avatar={
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                      {categoryIcons[item.category]}
                    </div>
                  }
                  title={
                    <div className="flex items-center gap-2">
                      <Tag color={categoryColors[item.category]} className="mr-0">
                        {categoryLabels[item.category]}
                      </Tag>
                      <span className={`font-medium ${!item.read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {item.title}
                      </span>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                      )}
                    </div>
                  }
                  description={
                    <div>
                      <p className={`text-sm ${!item.read ? 'text-gray-700' : 'text-gray-500'}`}>
                        {item.content.length > 60
                          ? `${item.content.substring(0, 60)}...`
                          : item.content}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <ClockCircleOutlined />
                        {formatTime(item.createdAt)}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default MessageCenter;
