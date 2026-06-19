import ReactECharts from "echarts-for-react";
import { Heart, Users, Building2, TrendingUp } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getDonationDistributionOption } from "./chartOptions";

const stageColors: Record<string, string> = {
  "用户提交": "#10B981",
  "快递取件": "#14B8A6",
  "质检完成": "#06B6D4",
  "款项打款": "#0EA5E9",
  "完成捐赠": "#059669",
  "受捐确认": "#34D399",
};

export default function DonationTab() {
  const analytics = useStore((s) => s.analytics);
  if (!analytics) return null;

  const { donation } = analytics;
  const totalBeneficiaries = donation.beneficiaryOrgs.reduce((s, o) => s + o.beneficiaryCount, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-6 text-center md:col-span-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-6 h-6 text-eco-500" />
            <h3 className="text-sm font-medium text-neutral-500">累计捐赠总额</h3>
          </div>
          <p className="text-4xl font-bold text-eco-500">
            ¥{donation.totalDonation.toLocaleString()}
          </p>
          <p className="text-xs text-neutral-400 mt-2">每一笔回收都在为公益贡献力量</p>
        </div>
        <div className="card p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="w-6 h-6 text-teal-500" />
            <h3 className="text-sm font-medium text-neutral-500">合作机构</h3>
          </div>
          <p className="text-4xl font-bold text-teal-500">{donation.beneficiaryOrgs.length}</p>
          <p className="text-xs text-neutral-400 mt-2">家公益组织</p>
        </div>
        <div className="card p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="w-6 h-6 text-cyan-500" />
            <h3 className="text-sm font-medium text-neutral-500">受益人数</h3>
          </div>
          <p className="text-4xl font-bold text-cyan-500">{totalBeneficiaries.toLocaleString()}</p>
          <p className="text-xs text-neutral-400 mt-2">人次受助</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h4 className="font-semibold text-neutral-800 mb-4">捐赠分类分布</h4>
          <ReactECharts option={getDonationDistributionOption(analytics)} style={{ height: 320 }} />
        </div>

        <div className="card p-5">
          <h4 className="font-semibold text-neutral-800 mb-4">受捐机构</h4>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {donation.beneficiaryOrgs.map((org) => (
              <div
                key={org.id}
                className="p-4 rounded-xl border border-neutral-100 hover:border-eco-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-neutral-800">{org.name}</h5>
                  <span className="text-eco-500 font-bold">¥{org.amount.toLocaleString()}</span>
                </div>
                <p className="text-sm text-neutral-500 mb-2">{org.projectDescription}</p>
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    受益 {org.beneficiaryCount.toLocaleString()} 人
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-eco-500" />
          <h4 className="font-semibold text-neutral-800">捐赠流向时间轴</h4>
        </div>
        <div className="space-y-6">
          {donation.traces.map((trace) => (
            <div key={trace.id} className="border border-neutral-100 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                <div>
                  <span className="font-semibold text-neutral-800">{trace.itemName}</span>
                  <span className="text-sm text-neutral-400 ml-3">{trace.orderNo}</span>
                </div>
                <div className="text-right">
                  <span className="text-eco-500 font-bold">¥{trace.amount}</span>
                  <span className="text-xs text-neutral-400 ml-2">→ {trace.beneficiary}</span>
                </div>
              </div>
              <div className="relative pl-6">
                {trace.nodes.map((node, i) => (
                  <div key={i} className="relative pb-6 last:pb-0">
                    <div
                      className="absolute left-[-24px] top-1 w-4 h-4 rounded-full border-2 bg-white z-10"
                      style={{ borderColor: stageColors[node.stage] ?? "#10B981" }}
                    />
                    {i < trace.nodes.length - 1 && (
                      <div className="absolute left-[-18px] top-5 bottom-0 w-0.5 bg-eco-200" />
                    )}
                    <div className="ml-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-medium text-sm"
                          style={{ color: stageColors[node.stage] ?? "#10B981" }}
                        >
                          {node.stage}
                        </span>
                        <span className="text-xs text-neutral-400">{node.time}</span>
                      </div>
                      <p className="text-sm text-neutral-600 mt-0.5">{node.description}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{node.operator}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
