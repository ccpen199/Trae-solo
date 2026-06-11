import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Home from "@/pages/Home";
import PaymentCenter from "@/pages/payment/PaymentCenter";
import AutoDeduct from "@/pages/payment/AutoDeduct";
import PaymentReminder from "@/pages/payment/PaymentReminder";
import InvoicePage from "@/pages/payment/InvoicePage";
import CorrectionPage from "@/pages/payment/CorrectionPage";
import FinanceMarket from "@/pages/finance/FinanceMarket";
import RiskAssessment from "@/pages/finance/RiskAssessment";
import LoanCalculator from "@/pages/finance/LoanCalculator";
import ContractPage from "@/pages/finance/ContractPage";
import FundSupervision from "@/pages/finance/FundSupervision";
import DataCenter from "@/pages/DataCenter";
import MerchantSettlement from "@/pages/MerchantSettlement";
import PromotionCenter from "@/pages/PromotionCenter";
import DiagnosisPage from "@/pages/DiagnosisPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/payment" element={<PaymentCenter />} />
          <Route path="/payment/auto-deduct" element={<AutoDeduct />} />
          <Route path="/payment/reminder" element={<PaymentReminder />} />
          <Route path="/payment/invoice" element={<InvoicePage />} />
          <Route path="/payment/correction" element={<CorrectionPage />} />
          <Route path="/finance" element={<FinanceMarket />} />
          <Route path="/finance/risk-assessment" element={<RiskAssessment />} />
          <Route path="/finance/calculator" element={<LoanCalculator />} />
          <Route path="/finance/contract" element={<ContractPage />} />
          <Route path="/finance/fund-supervision" element={<FundSupervision />} />
          <Route path="/data-center" element={<DataCenter />} />
          <Route path="/merchant" element={<MerchantSettlement />} />
          <Route path="/promotion" element={<PromotionCenter />} />
          <Route path="/diagnosis" element={<DiagnosisPage />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </Router>
  );
}
