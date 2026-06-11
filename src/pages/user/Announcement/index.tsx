import React, { useEffect, useState } from 'react';
import { Card, Select, Input, Pagination, Empty, Spin, Tag } from 'antd';
import { SearchOutlined, PushpinOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { announcementApi } from '@/services/announcement';
import { formatDateTime, serviceTypeMap } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import type { Announcement } from '@/types';

const { Option } = Select;
const { Search } = Input;

const typeColorMap: Record<string, string> = {
  outage: '#FF7D00',
  repair: '#F53F3F',
  notice: '#165DFF',
};

const typeNameMap: Record<string, string> = {
  outage: '停供',
  repair: '抢修',
  notice: '通知',
};

const pushStatusMap: Record<number, { text: string; color: string }> = {
  0: { text: '未推送', color: 'default' },
  1: { text: '已推送', color: 'green' },
  2: { text: '紧急推送', color: 'red' },
};

const AnnouncementList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [type, setType] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('');
  const [areaCode, setAreaCode] = useState<string>('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadData();
  }, [page, type, serviceType, areaCode, keyword]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await announcementApi.getAnnouncementList({
        type: type || undefined,
        serviceType: serviceType || undefined,
        areaCode: areaCode || undefined,
        keyword: keyword || undefined,
        page,
        pageSize,
      } as any);
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('加载公告列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm whitespace-nowrap">公告类型：</span>
            <Select
              value={type || undefined}
              onChange={(v) => { setType(v || ''); setPage(1); }}
              style={{ width: 140 }}
              allowClear
              placeholder="全部类型"
            >
              <Option value="outage">停供公告</Option>
              <Option value="repair">抢修公告</Option>
              <Option value="notice">通知公告</Option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm whitespace-nowrap">服务类型：</span>
            <Select
              value={serviceType || undefined}
              onChange={(v) => { setServiceType(v || ''); setPage(1); }}
              style={{ width: 120 }}
              allowClear
              placeholder="全部"
            >
              <Option value="water">水</Option>
              <Option value="electricity">电</Option>
              <Option value="gas">气</Option>
              <Option value="all">综合</Option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm whitespace-nowrap">影响区域：</span>
            <Select
              value={areaCode || undefined}
              onChange={(v) => { setAreaCode(v || ''); setPage(1); }}
              style={{ width: 140 }}
              allowClear
              placeholder="全部区域"
            >
              <Option value="510104">锦江区</Option>
              <Option value="510105">青羊区</Option>
              <Option value="510107">武侯区</Option>
              <Option value="510106">金牛区</Option>
              <Option value="510108">成华区</Option>
              <Option value="510109">高新区</Option>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Search
              placeholder="搜索公告标题、内容关键词"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={handleSearch}
              style={{ maxWidth: 400 }}
            />
          </div>
        </div>
      </Card>

      <Spin spinning={loading}>
        {list.length > 0 ? (
          <div className="space-y-4">
            {list.map((item: any) => (
              <Card
                key={item.id}
                className={`shadow-md card-hover cursor-pointer border-l-4`}
                style={{ borderLeftColor: typeColorMap[item.type] || '#165DFF' }}
                onClick={() => navigate(`/announcements/${item.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 min-w-[56px]">
                    <div
                      className="w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white"
                      style={{ backgroundColor: typeColorMap[item.type] || '#165DFF' }}
                    >
                      <span className="text-xs opacity-80">{typeNameMap[item.type]}</span>
                      <span className="text-sm font-bold">{item.serviceType === 'all' ? '综合' : serviceTypeMap[item.serviceType]?.name?.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-base font-medium text-gray-800 hover:text-primary-600 transition-colors">
                        {item.title}
                      </h3>
                      {item.type === 'repair' && <Tag color="red" className="animate-pulse">紧急</Tag>}
                      {(item as any).pushStatus !== undefined && (
                        <Tag color={pushStatusMap[(item as any).pushStatus]?.color}>
                          <PushpinOutlined /> {pushStatusMap[(item as any).pushStatus]?.text}
                        </Tag>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.summary}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span><ClockCircleOutlined /> {formatDateTime(item.publishTime || item.createTime, 'YYYY-MM-DD HH:mm')}</span>
                      <span><EnvironmentOutlined /> {(item.affectAreaNames || []).join('、') || '全市'}</span>
                      {item.serviceType && item.serviceType !== 'all' && (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: serviceTypeMap[item.serviceType]?.color }}
                        >
                          {serviceTypeMap[item.serviceType]?.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            <div className="flex justify-center pt-4">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(t) => `共 ${t} 条公告`}
                onChange={(p) => setPage(p)}
              />
            </div>
          </div>
        ) : (
          <Card className="shadow-md">
            <Empty description="暂无公告" className="py-12" />
          </Card>
        )}
      </Spin>
    </div>
  );
};

export default AnnouncementList;
