import { useState } from "react";
import { motion as m } from "framer-motion";
import ReactECharts from "echarts-for-react";
import {
  Building2,
  FileText,
  User,
  Phone,
  MapPin,
  Star,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Award,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  DataTable,
  type Column,
} from "@/components/ui";
import { useAppStore } from "@/stores";
import { cn, formatDate, getTimeRemaining } from "@/utils";
import type { MaintenanceStaff } from "@/types";

export default function PropertyCompany() {
  const propertyCompany = useAppStore((s) => s.propertyCompany);
  const maintenanceStaff = useAppStore((s) => s.maintenanceStaff);
  const [staffPage, setStaffPage] = useState(1);

  const radarOption = {
    radar: {
      indicator: [
        { name: "服务态度", max: 100 },
        { name: "响应速度", max: 100 },
        { name: "维修质量", max: 100 },
        { name: "卫生保洁", max: 100 },
        { name: "安全管理", max: 100 },
      ],
      radius: "70%",
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: [
              propertyCompany.serviceScores?.attitude ?? 0,
              propertyCompany.serviceScores?.response ?? 0,
              propertyCompany.serviceScores?.quality ?? 0,
              propertyCompany.serviceScores?.cleanliness ?? 0,
              propertyCompany.serviceScores?.safety ?? 0,
            ],
            name: "服务评分",
            areaStyle: {
              color: {
                type: "radial",
                x: 0.5,
                y: 0.5,
                r: 0.5,
                colorStops: [
                  { offset: 0, color: "rgba(37, 99, 235, 0.3)" },
                  { offset: 1, color: "rgba(37, 99, 235, 0.1)" },
                ],
              },
            },
            lineStyle: { color: "#2563eb", width: 2 },
            itemStyle: { color: "#2563eb" },
          },
        ],
      },
    ],
  };

  const contractStatus = () => {
    const remaining = getTimeRemaining(propertyCompany.contractEndDate);
    if (remaining.days < 0) return { label: "已过期", variant: "danger" as const };
    if (remaining.days < 30) return { label: "即将到期", variant: "warning" as const };
    return { label: "正常履行", variant: "success" as const };
  };

  const staffColumns: Column<MaintenanceStaff>[] = [
    { key: "name", title: "姓名", dataIndex: "name", width: 100 },
    { key: "skills", title: "技能", dataIndex: "skills",
      render: (v) => (
        <div className="flex flex-wrap gap-1">
          {(v as string[]).map((s) => (
            <Badge key={s} variant="secondary" size="sm">{s}</Badge>
          ))}
        </div>
      ) },
    { key: "status", title: "状态", dataIndex: "status", width: 100,
      render: (v) => {
        const s = v as string;
        return s === "available" ? (
          <Badge variant="success">空闲</Badge>
        ) : s === "working" ? (
          <Badge variant="warning">工作中</Badge>
        ) : (
          <Badge variant="default">休假</Badge>
        );
      } },
    { key: "completedOrders", title: "完成工单", dataIndex: "completedOrders", width: 100, align: "center" },
    { key: "rating", title: "评分", dataIndex: "rating", width: 100,
      render: (v) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="font-medium">{v}</span>
        </div>
      ) },
  ];

  const status = contractStatus();
  const remaining = getTimeRemaining(propertyCompany.contractEndDate);

  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">物业公司管理</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              物业公司信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-12 h-12 text-slate-400" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{propertyCompany.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{propertyCompany.overallRating}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">营业执照：</span>
                    <span className="font-medium">{propertyCompany.businessLicense}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">法人：</span>
                    <span className="font-medium">{propertyCompany.legalPerson}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">电话：</span>
                    <span className="font-medium">{propertyCompany.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">地址：</span>
                    <span className="font-medium">{propertyCompany.address}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              服务合同
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
              <div>
                <p className="text-sm text-slate-500">合同期限</p>
                <p className="font-medium">
                  {formatDate(propertyCompany.contractStartDate)} - {formatDate(propertyCompany.contractEndDate)}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">到期倒计时</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <div className={cn(
                  "p-3 rounded-lg text-center",
                  remaining.days < 30 ? "bg-rose-50 text-rose-600" : "bg-primary-50 text-primary-600"
                )}>
                  <div className="text-2xl font-bold">{remaining.days}</div>
                  <div className="text-xs">天</div>
                </div>
              </div>
            </div>
            <Button variant="primary" className="w-full">查看合同详情</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-600" />
              服务评分雷达图
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={radarOption} style={{ height: 300 }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary-600" />
              维修人员列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable<MaintenanceStaff>
              columns={staffColumns}
              data={maintenanceStaff}
              rowKey="id"
              pagination={{
                current: staffPage,
                pageSize: 5,
                total: maintenanceStaff.length,
                onChange: (p) => setStaffPage(p),
              }}
            />
          </CardContent>
        </Card>
      </div>
    </m.div>
  );
}
