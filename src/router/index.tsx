import { Suspense } from 'react';
import { useRoutes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Spin } from 'antd';
import routes from './routes';
import type { AppRouteObject } from './routes';

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-neutral-50">
    <div className="text-center">
      <Spin size="large" />
      <div className="mt-4 text-sm text-neutral-500">加载中...</div>
    </div>
  </div>
);

function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const findTitle = (routeList: AppRouteObject[], pathname: string): string | undefined => {
      for (const route of routeList) {
        if (route.path === pathname && route.meta?.title) {
          return route.meta.title;
        }
        if (route.children) {
          const childTitle = findTitle(route.children, pathname);
          if (childTitle) return childTitle;
        }
      }
      return undefined;
    };

    const title = findTitle(routes, location.pathname);
    const baseTitle = '山东省文旅场所智慧监管服务平台';
    document.title = title ? `${title} - ${baseTitle}` : baseTitle;
  }, [location.pathname]);

  return null;
}

export default function AppRouter() {
  const element = useRoutes(routes as any);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <TitleUpdater />
      {element}
    </Suspense>
  );
}
