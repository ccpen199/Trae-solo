import { Breadcrumb as AntBreadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getMenuByRole, findMenuByPath } from '../menuConfig';
import { useMemo } from 'react';

const roleHomeMap: Record<string, { path: string; label: string }> = {
  jobseeker: { path: '/jobseeker/home', label: '求职者首页' },
  enterprise: { path: '/enterprise/dashboard', label: '企业工作台' },
  admin: { path: '/admin/summary', label: '管理总览' },
};

export default function Breadcrumb() {
  const location = useLocation();
  const { role } = useAuthStore();

  const items = useMemo(() => {
    const home = roleHomeMap[role] || roleHomeMap.jobseeker;
    const breadcrumbItems = [
      {
        title: (
          <Link to={home.path} className="flex items-center text-gray-600 hover:text-primary-500 transition-colors">
            <HomeOutlined className="mr-1" />
            <span>首页</span>
          </Link>
        ),
      },
    ];

    const menus = getMenuByRole(role);
    const matched = findMenuByPath(menus, location.pathname);

    if (matched.length > 0) {
      const last = matched[matched.length - 1];
      if (location.pathname !== home.path) {
        breadcrumbItems.push({
          title: <span className="text-gray-800 font-medium">{last.label}</span>,
        });
      }
    } else {
      const pathParts = location.pathname.split('/').filter(Boolean);
      if (pathParts.length > 1) {
        const lastPart = pathParts[pathParts.length - 1];
        const mapName: Record<string, string> = {
          detail: '详情',
          edit: '编辑',
          create: '新建',
        };
        breadcrumbItems.push({
          title: <span className="text-gray-800 font-medium">{mapName[lastPart] || lastPart}</span>,
        });
      }
    }

    return breadcrumbItems;
  }, [location.pathname, role]);

  return (
    <AntBreadcrumb
      items={items}
      className="text-sm"
      separator={<span className="text-gray-300">/</span>}
    />
  );
}
