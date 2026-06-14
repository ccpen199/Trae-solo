import {
  Award,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileCheck,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Star,
  Upload,
  Users,
} from 'lucide-react';

const serviceAreas = ['徐汇区', '长宁区', '浦东新区', '闵行区', '静安区'];

const qualificationRows = [
  ['营业执照', '91310104MA1K88XXXX', '2028-05-31', '已核验'],
  ['建筑装修装饰工程专业承包一级', 'D2310XXXXX', '2027-11-20', '已核验'],
  ['设计专项乙级资质', 'A2310XXXXX', '2026-12-18', '待年审'],
];

const teamMembers = [
  ['张工', '项目经理', '12年', '35个在管项目'],
  ['陈予安', '主案设计师', '9年', '现代简约/老房改造'],
  ['周明', '质检负责人', '11年', '水电与泥瓦验收'],
];

export default function CompanyProfile() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="section-title mb-1">公司信息维护</h1>
          <p className="text-ivory-600">维护服务商公开资料、资质证照、服务范围和审核材料</p>
        </div>
        <button className="btn-primary">
          <Save className="w-4 h-4" />
          保存资料
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ['资料完整度', '92%', BadgeCheck],
          ['平台评分', '4.86', Star],
          ['已服务业主', '1,286', Users],
          ['资质状态', '已认证', ShieldCheck],
        ].map(([label, value, Icon]) => (
          <section key={label as string} className="card-base p-5">
            <Icon className="w-5 h-5 text-terracotta-600 mb-3" />
            <div className="text-sm text-ivory-500">{label as string}</div>
            <div className="text-2xl font-mono font-semibold text-carbon-800 mt-1">{value as string}</div>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <section className="card-base p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-wood-400 to-terracotta-500 flex items-center justify-center text-white shadow-glow-wood">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-xl text-carbon-800">华筑精工装饰</h2>
                <span className="badge-success">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  官方认证
                </span>
              </div>
              <p className="text-sm text-ivory-600 mt-2">老房改造、别墅大宅、全案设计一体化服务商</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-carbon-700">公司简称</span>
              <input className="input-base mt-2" defaultValue="华筑精工装饰" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-carbon-700">服务电话</span>
              <input className="input-base mt-2" defaultValue="400-888-89177" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-carbon-700">公司地址</span>
              <input className="input-base mt-2" defaultValue="上海市徐汇区漕河泾开发区科技绿洲 3 号楼" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-carbon-700">公开简介</span>
              <textarea
                className="input-base mt-2 min-h-28 resize-y"
                defaultValue="深耕上海家装市场 12 年，提供设计、施工、主材集采、第三方验收协同服务。平台订单均支持节点验收、资金托管和报价透明拆分。"
              />
            </label>
          </div>
        </section>

        <section className="card-base p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl text-carbon-800">资质证照</h2>
            <button className="btn-secondary text-sm">
              <Upload className="w-4 h-4" />
              上传证照
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="text-left text-ivory-500 border-b border-ivory-300">
                  <th className="py-3 font-medium">证照名称</th>
                  <th className="py-3 font-medium">编号</th>
                  <th className="py-3 font-medium">有效期</th>
                  <th className="py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {qualificationRows.map(([name, code, expire, status]) => (
                  <tr key={name} className="border-b border-ivory-200 last:border-0">
                    <td className="py-4 text-carbon-800 font-medium">{name}</td>
                    <td className="py-4 text-ivory-600 font-mono">{code}</td>
                    <td className="py-4 text-ivory-600">{expire}</td>
                    <td className="py-4">
                      <span className={status === '已核验' ? 'badge-success' : 'badge-warning'}>{status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="card-base p-6">
          <h2 className="font-serif text-xl text-carbon-800 mb-5">服务范围</h2>
          <div className="flex flex-wrap gap-2 mb-5">
            {serviceAreas.map((area) => (
              <span key={area} className="badge-wood">
                <MapPin className="w-3.5 h-3.5" />
                {area}
              </span>
            ))}
          </div>
          <div className="rounded-xl bg-ivory-50 border border-ivory-300 p-4">
            <div className="text-sm text-ivory-500">接单半径</div>
            <div className="font-mono text-2xl font-semibold text-carbon-800 mt-1">18 km</div>
            <p className="text-sm text-ivory-600 mt-2">支持老房改造、整装、局部翻新和别墅大宅。</p>
          </div>
        </section>

        <section className="card-base p-6">
          <h2 className="font-serif text-xl text-carbon-800 mb-5">核心团队</h2>
          <div className="space-y-3">
            {teamMembers.map(([name, role, years, desc]) => (
              <div key={name} className="flex items-center gap-3 rounded-xl border border-ivory-300 p-4">
                <div className="w-10 h-10 rounded-xl bg-wood-100 text-wood-700 flex items-center justify-center font-serif font-semibold">
                  {name[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-carbon-800">{name} · {role}</div>
                  <div className="text-xs text-ivory-500 mt-1">{years} · {desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card-base p-6">
          <h2 className="font-serif text-xl text-carbon-800 mb-5">审核动态</h2>
          <div className="space-y-4">
            {[
              [FileCheck, '资料复核通过', '平台运营已完成公司基础资料复核'],
              [Award, '设计专项资质待年审', '请在 2026-11-18 前上传新证照'],
              [Phone, '服务电话抽检通过', '客服响应时长 38 秒'],
              [CalendarClock, '下次例行复核', '2026-07-01 10:00'],
            ].map(([Icon, title, desc]) => (
              <div key={title as string} className="flex gap-3">
                <Icon className="w-5 h-5 text-terracotta-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-carbon-800">{title as string}</div>
                  <div className="text-sm text-ivory-600 mt-1">{desc as string}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
