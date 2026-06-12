import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import NotFound from '@/pages/NotFound';
import Forbidden from '@/pages/Forbidden';

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream-100">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-hero-gradient">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12">{children}</main>
    </div>
  );
}

function PagePlaceholder({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="page-container flex flex-col items-center justify-center text-center py-24 animate-fade-in-up">
      <div className="w-20 h-20 rounded-3xl bg-brand-gradient shadow-float flex items-center justify-center mb-6 text-white text-3xl font-bold font-num animate-float">
        {title.charAt(0)}
      </div>
      <h1 className="text-3xl font-bold text-ink-900 mb-3 tracking-tight">{title}</h1>
      <p className="text-ink-500 max-w-md leading-relaxed">{desc}</p>
      <div className="mt-8 px-5 py-2 rounded-full bg-white border border-ink-100 text-xs text-ink-400 shadow-soft">
        模块建设中，敬请期待 ✨
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />
        <Route
          path="/jobs"
          element={
            <PublicLayout>
              <PagePlaceholder
                title="实习岗位"
                desc="海量经过资质审核的实习岗位，按城市/薪资/专业精准筛选，匹配属于你的优质机会。"
              />
            </PublicLayout>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <PublicLayout>
              <PagePlaceholder title="岗位详情" desc="岗位详情、公司介绍、带教人信息、投递申请入口。" />
            </PublicLayout>
          }
        />
        <Route
          path="/company/:id"
          element={
            <PublicLayout>
              <PagePlaceholder title="公司详情" desc="企业资质、在招岗位、学长学姐真实评价与雷达评分。" />
            </PublicLayout>
          }
        />
        <Route
          path="/radar"
          element={
            <PublicLayout>
              <PagePlaceholder
                title="公司雷达"
                desc="企业六维雷达评分：薪资/转正/导师/成长/环境/工作量，避开实习坑，选对好平台。"
              />
            </PublicLayout>
          }
        />
        <Route
          path="/community"
          element={
            <PublicLayout>
              <PagePlaceholder
                title="萌新互助社区"
                desc="按学校/专业/城市分组，学长学姐在线答疑，匿名提问不社恐。"
              />
            </PublicLayout>
          }
        />
        <Route
          path="/community/:id"
          element={
            <PublicLayout>
              <PagePlaceholder title="问答详情" desc="问题详情、学长回答、采纳点赞、评论讨论。" />
            </PublicLayout>
          }
        />
        <Route
          path="/referral"
          element={
            <PublicLayout>
              <PagePlaceholder
                title="内推中心"
                desc="学工老师精准对接，企业绿色通道，简历直达HR，内推进度全透明。"
              />
            </PublicLayout>
          }
        />
        <Route
          path="/referral/:id"
          element={
            <PublicLayout>
              <PagePlaceholder title="内推进度" desc="内推节点时间轴，每一步都看得见。" />
            </PublicLayout>
          }
        />
        <Route
          path="/tools"
          element={
            <PublicLayout>
              <PagePlaceholder
                title="赋能工具箱"
                desc="AI简历优化、实习日志打卡、职业性格测评，一站式提升你的就业竞争力。"
              />
            </PublicLayout>
          }
        />
        <Route
          path="/tools/resume"
          element={
            <PublicLayout>
              <PagePlaceholder title="AI简历优化" desc="上传简历，AI智能点评，一键生成大厂风格版本。" />
            </PublicLayout>
          }
        />
        <Route
          path="/tools/journal"
          element={
            <PublicLayout>
              <PagePlaceholder title="实习日志" desc="每日打卡自动归档，自动生成周报月报，方便汇报。" />
            </PublicLayout>
          }
        />
        <Route
          path="/tools/assessment"
          element={
            <PublicLayout>
              <PagePlaceholder title="职业测评" desc="MBTI+霍兰德双模型，生成专属职业匹配报告。" />
            </PublicLayout>
          }
        />
        <Route
          path="/student/profile"
          element={
            <PublicLayout>
              <PagePlaceholder title="实习档案" desc="学籍验证、技能证书、实训项目，打造你的数字名片。" />
            </PublicLayout>
          }
        />
        <Route
          path="/enterprise/dashboard"
          element={
            <PublicLayout>
              <PagePlaceholder title="企业工作台" desc="岗位发布、简历管理、带教人配置、资质认证。" />
            </PublicLayout>
          }
        />
        <Route
          path="/enterprise/publish"
          element={
            <PublicLayout>
              <PagePlaceholder title="岗位发布" desc="发布实习岗位、编辑JD、配置福利与转正率。" />
            </PublicLayout>
          }
        />
        <Route
          path="/enterprise/qualification"
          element={
            <PublicLayout>
              <PagePlaceholder title="资质认证" desc="上传营业执照，配置带教人信息，完成企业认证。" />
            </PublicLayout>
          }
        />
        <Route
          path="/me"
          element={
            <PublicLayout>
              <PagePlaceholder title="个人中心" desc="账号设置、消息通知、收藏夹、浏览历史。" />
            </PublicLayout>
          }
        />
        <Route
          path="/me/applications"
          element={
            <PublicLayout>
              <PagePlaceholder title="投递记录" desc="每一次投递的进度时间轴，让求职过程清晰可见。" />
            </PublicLayout>
          }
        />

        <Route
          path="/login"
          element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          }
        />
        <Route
          path="/register"
          element={
            <AuthLayout>
              <Register />
            </AuthLayout>
          }
        />

        <Route
          path="/403"
          element={
            <PublicLayout>
              <Forbidden />
            </PublicLayout>
          }
        />
        <Route
          path="*"
          element={
            <PublicLayout>
              <NotFound />
            </PublicLayout>
          }
        />
      </Routes>
    </Router>
  );
}
