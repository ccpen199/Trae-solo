import { useEffect } from "react";
import { Users, UserCheck, UserPlus, Shield } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";
import { useStore } from "@/store";
import StatCard from "@/components/StatCard";

export default function DataAnalytics() {
  const { memberStats, funnel, trends, fetchMemberStats, fetchFunnel, fetchTrends } = useStore();

  useEffect(() => {
    fetchMemberStats();
    fetchFunnel();
    fetchTrends();
  }, [fetchMemberStats, fetchFunnel, fetchTrends]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-serif">数据分析</h1>
        <p className="text-gray-500 mt-1">会员统计、漏斗分析与趋势报表</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="总会员数"
          value={memberStats?.totalMembers ?? 0}
          color="red"
        />
        <StatCard
          icon={UserCheck}
          label="活跃会员"
          value={memberStats?.activeMembers ?? 0}
          color="green"
        />
        <StatCard
          icon={UserPlus}
          label="本月新增"
          value={memberStats?.newMembersThisMonth ?? 0}
          color="blue"
        />
        <StatCard
          icon={Shield}
          label="福利覆盖率"
          value={memberStats ? `${memberStats.benefitCoverageRate}%` : "0%"}
          color="gold"
        />
      </div>

      <div className="card mb-6">
        <h3 className="text-base font-bold text-gray-900 mb-4">权益使用率漏斗</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnel} layout="vertical" margin={{ left: 80, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="stage" tick={{ fontSize: 13 }} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "count") return [value.toLocaleString(), "人数"];
                return [value, name];
              }}
            />
            <Bar dataKey="count" fill="#C41E3A" radius={[0, 6, 6, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-4">会员趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trends} margin={{ top: 5, right: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="newMembers"
                name="新增会员"
                stroke="#C41E3A"
                fill="#C41E3A"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="activeMembers"
                name="活跃会员"
                stroke="#D4A843"
                fill="#D4A843"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-4">福利趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trends} margin={{ top: 5, right: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="vouchersIssued"
                name="发放券数"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="totalAmount"
                name="总金额"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
