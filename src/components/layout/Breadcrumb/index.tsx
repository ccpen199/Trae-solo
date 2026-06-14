import React, { useMemo } from 'react';
import { Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface BreadcrumbNavProps {
  items?: Array<{
    title: React.ReactNode;
    path?: string;
  }>;
  className?: string;
  showHome?: boolean;
}

const routeNameMap: Record<string, string> = {
  dashboard: '数据概览',
  place: '场所管理',
  list: '场所列表',
  audit: '审核管理',
  type: '类型管理',
  verification: '核验管理',
  record: '核验记录',
  device: '设备管理',
  reservation: '预约管理',
  config: '预约配置',
  alarm: '告警中心',
  handle: '待处理告警',
  history: '历史告警',
  inspection: '检查管理',
  task: '检查任务',
  item: '检查项配置',
  analytics: '数据分析',
  overview: '综合分析',
  visitor: '游客分析',
  revenue: '营收分析',
  system: '系统管理',
  user: '用户管理',
  role: '角色管理',
  permission: '权限管理',
  log: '操作日志',
  security: '安全配置',
  login: '登录',
};

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items, className, showHome = true }) => {
  const location = useLocation();

  const breadcrumbItems = useMemo(() => {
    if (items && items.length > 0) {
      return items.map((item, index) => ({
        title: index === 0 && showHome ? (
          <span className="flex items-center gap-1">
            <HomeOutlined />
            {item.title}
          </span>
        ) : item.title,
        href: undefined,
        ...(item.path && {
          title: <Link to={item.path}>{item.title}</Link>,
        }),
      }));
    }

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const generatedItems = pathSegments.map((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      const name = routeNameMap[segment] || segment;

      return {
        title: index === 0 && showHome ? (
          <span className="flex items-center gap-1">
            <HomeOutlined />
            {name}
          </span>
        ) : (
          <Link to={path}>{name}</Link>
        ),
      };
    });

    if (generatedItems.length === 0) {
      return [
        {
          title: (
            <span className="flex items-center gap-1">
              <HomeOutlined />
              首页
            </span>
          ),
        },
      ];
    }

    return generatedItems;
  }, [location.pathname, items, showHome]);

  return (
    <Breadcrumb
      items={breadcrumbItems}
      className={cn('text-sm', className)}
      separator=">"
    />
  );
};

export default BreadcrumbNav;
