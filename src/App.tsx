import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import EnterprisePage from "@/pages/EnterprisePage";
import ExecutorPage, { TaskDetailPage } from "@/pages/ExecutorPage";
import RiskControlPage from "@/pages/RiskControlPage";
import WalletPage from "@/pages/WalletPage";
import AdminPage from "@/pages/AdminPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/enterprise" element={<EnterprisePage />} />
        <Route path="/executor" element={<ExecutorPage />} />
        <Route path="/executor/task/:id" element={<TaskDetailPage />} />
        <Route path="/risk-control" element={<RiskControlPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}
