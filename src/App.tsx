import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import HomePage from "@/pages/home/HomePage";
import LoginPage from "@/pages/LoginPage";
import PersonalPage from "@/pages/personal/PersonalPage";
import SocialInsurancePage from "@/pages/personal/SocialInsurancePage";
import MedicalPage from "@/pages/personal/MedicalPage";
import ExamPage from "@/pages/personal/ExamPage";
import EsscPage from "@/pages/personal/EsscPage";
import EnterprisePage from "@/pages/enterprise/EnterprisePage";
import InsuranceDeclarationPage from "@/pages/enterprise/InsuranceDeclarationPage";
import UnemploymentPage from "@/pages/enterprise/UnemploymentPage";
import EContractPage from "@/pages/enterprise/EContractPage";
import AdminPage from "@/pages/admin/AdminPage";
import TimeoutWarningPage from "@/pages/admin/TimeoutWarningPage";
import PolicyTagsPage from "@/pages/admin/PolicyTagsPage";
import IdentityAuditPage from "@/pages/admin/IdentityAuditPage";
import { useAppStore } from "@/stores/appStore";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

function ForbiddenPage({ requiredRole }: { requiredRole: string }) {
  const roleLabel: Record<string, string> = { personal: '个人用户', enterprise: '企业HR', admin: '管理员' }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto mt-20 text-center"
    >
      <div className="gov-card p-10">
        <div className="w-20 h-20 mx-auto rounded-full bg-gov-red/10 flex items-center justify-center mb-5">
          <AlertTriangle className="w-10 h-10 text-gov-red" />
        </div>
        <h2 className="text-xl font-semibold text-gov-text mb-2">访问权限不足</h2>
        <p className="text-sm text-gov-text-secondary mb-2">
          该功能仅限 <span className="font-medium text-gov-red">{roleLabel[requiredRole] || requiredRole}</span> 使用
        </p>
        <p className="text-xs text-gov-text-muted mb-6">
          当前登录身份无此权限。请切换至对应身份后重新登录认证。
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => window.location.href = '/login?role=' + requiredRole} className="gov-btn-primary">
            切换身份重新登录
          </button>
          <button onClick={() => window.location.href = '/'} className="gov-btn-secondary">
            返回首页
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function RoleGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode
  requiredRole: 'personal' | 'enterprise' | 'admin'
}) {
  const { currentRole } = useAppStore()
  const location = useLocation()

  if (currentRole !== requiredRole) {
    return <ForbiddenPage requiredRole={requiredRole} />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/personal" element={<Layout><RoleGuard requiredRole="personal"><PersonalPage /></RoleGuard></Layout>} />
        <Route path="/personal/social-insurance" element={<Layout><RoleGuard requiredRole="personal"><SocialInsurancePage /></RoleGuard></Layout>} />
        <Route path="/personal/medical" element={<Layout><RoleGuard requiredRole="personal"><MedicalPage /></RoleGuard></Layout>} />
        <Route path="/personal/exam" element={<Layout><RoleGuard requiredRole="personal"><ExamPage /></RoleGuard></Layout>} />
        <Route path="/personal/essc" element={<Layout><RoleGuard requiredRole="personal"><EsscPage /></RoleGuard></Layout>} />
        <Route path="/enterprise" element={<Layout><RoleGuard requiredRole="enterprise"><EnterprisePage /></RoleGuard></Layout>} />
        <Route path="/enterprise/insurance-declaration" element={<Layout><RoleGuard requiredRole="enterprise"><InsuranceDeclarationPage /></RoleGuard></Layout>} />
        <Route path="/enterprise/unemployment" element={<Layout><RoleGuard requiredRole="enterprise"><UnemploymentPage /></RoleGuard></Layout>} />
        <Route path="/enterprise/e-contract" element={<Layout><RoleGuard requiredRole="enterprise"><EContractPage /></RoleGuard></Layout>} />
        <Route path="/admin" element={<Layout><RoleGuard requiredRole="admin"><AdminPage /></RoleGuard></Layout>} />
        <Route path="/admin/timeout-warning" element={<Layout><RoleGuard requiredRole="admin"><TimeoutWarningPage /></RoleGuard></Layout>} />
        <Route path="/admin/policy-tags" element={<Layout><RoleGuard requiredRole="admin"><PolicyTagsPage /></RoleGuard></Layout>} />
        <Route path="/admin/identity-audit" element={<Layout><RoleGuard requiredRole="admin"><IdentityAuditPage /></RoleGuard></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
