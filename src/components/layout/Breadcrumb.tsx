import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/utils";

const breadcrumbMap: Record<string, string> = {
  dashboard: "工作台",
  council: "民主议事",
  motions: "议案列表",
  new: "新建",
  finance: "财务透明",
  overview: "财务总览",
  invoices: "票据管理",
  audit: "审计报告",
  seal: "印章管控",
  applications: "用章申请",
  cabinet: "印章柜监控",
  property: "物业协同",
  tickets: "报修工单",
  supervision: "街道督办",
  economy: "邻里经济",
  home: "首页",
  swap: "旧物置换",
  crowdfunding: "众筹预售",
  exchange: "能量兑换",
  admin: "基础管理",
  owners: "业主管理",
  street: "街道监管",
};

export function Breadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  const isIdParam = (segment: string) => {
    return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      segment
    );
  };

  const buildPath = (index: number) => {
    return "/" + pathSegments.slice(0, index + 1).join("/");
  };

  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 text-slate-500 hover:text-primary-600 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      {pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;
        const isId = isIdParam(segment);
        const label = isId ? "详情" : breadcrumbMap[segment] || segment;
        const path = buildPath(index);

        return (
          <div key={path} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-slate-300" />
            {isLast ? (
              <span className={cn("font-medium", isLast ? "text-slate-800" : "text-slate-500")}>
                {label}
              </span>
            ) : (
              <Link
                to={path}
                className="text-slate-500 hover:text-primary-600 transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
