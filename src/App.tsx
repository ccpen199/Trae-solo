import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import AdminLayout from "@/components/AdminLayout"
import MerchantLayout from "@/components/MerchantLayout"
import CitizenLayout from "@/components/CitizenLayout"
import Toast from "@/components/Toast"
import Dashboard from "@/pages/Dashboard"
import CouponList from "@/pages/CouponList"
import CouponCreate from "@/pages/CouponCreate"
import StrategyConfig from "@/pages/StrategyConfig"
import VerifyOverview from "@/pages/VerifyOverview"
import VerifyRecords from "@/pages/VerifyRecords"
import Reconciliation from "@/pages/Reconciliation"
import RiskOverview from "@/pages/RiskOverview"
import DeviceMonitor from "@/pages/DeviceMonitor"
import HoardingAlert from "@/pages/HoardingAlert"
import PathAnalysis from "@/pages/PathAnalysis"
import MerchantOverview from "@/pages/merchant/MerchantOverview"
import MerchantCoupons from "@/pages/merchant/MerchantCoupons"
import MerchantVerify from "@/pages/merchant/MerchantVerify"
import MerchantReconciliation from "@/pages/merchant/MerchantReconciliation"
import MerchantAlert from "@/pages/merchant/MerchantAlert"
import CitizenHome from "@/pages/citizen/CitizenHome"
import CitizenExplore from "@/pages/citizen/CitizenExplore"
import CitizenWallet from "@/pages/citizen/CitizenWallet"
import CitizenHistory from "@/pages/citizen/CitizenHistory"
import Settlement from "@/pages/Settlement"
import Subsidy from "@/pages/Subsidy"
import MerchantAudit from "@/pages/MerchantAudit"

export default function App() {
  return (
    <Router>
      <Toast />
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/coupon/list" element={<CouponList />} />
          <Route path="/coupon/create" element={<CouponCreate />} />
          <Route path="/coupon/edit/:id" element={<CouponCreate />} />
          <Route path="/coupon/strategy" element={<StrategyConfig />} />
          <Route path="/verify/overview" element={<VerifyOverview />} />
          <Route path="/verify/records" element={<VerifyRecords />} />
          <Route path="/verify/reconciliation" element={<Reconciliation />} />
          <Route path="/risk/overview" element={<RiskOverview />} />
          <Route path="/risk/device-monitor" element={<DeviceMonitor />} />
          <Route path="/risk/hoarding-alert" element={<HoardingAlert />} />
          <Route path="/risk/path-analysis" element={<PathAnalysis />} />
          <Route path="/system/settlement" element={<Settlement />} />
          <Route path="/system/subsidy" element={<Subsidy />} />
          <Route path="/system/merchant-audit" element={<MerchantAudit />} />
        </Route>

        <Route path="/merchant" element={<MerchantLayout />}>
          <Route index element={<MerchantOverview />} />
          <Route path="coupons" element={<MerchantCoupons />} />
          <Route path="verify" element={<MerchantVerify />} />
          <Route path="reconciliation" element={<MerchantReconciliation />} />
          <Route path="alert" element={<MerchantAlert />} />
        </Route>

        <Route path="/citizen" element={<CitizenLayout />}>
          <Route index element={<CitizenHome />} />
          <Route path="explore" element={<CitizenExplore />} />
          <Route path="wallet" element={<CitizenWallet />} />
          <Route path="history" element={<CitizenHistory />} />
        </Route>
      </Routes>
    </Router>
  )
}
