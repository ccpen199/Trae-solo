import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import DrugList from "@/pages/DrugList";
import ReportList from "@/pages/ReportList";
import ReportForm from "@/pages/ReportForm";
import ReportDetail from "@/pages/ReportDetail";
import AssessmentForm from "@/pages/AssessmentForm";
import Analytics from "@/pages/Analytics";
import AdminView from "@/pages/AdminView";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="drugs" element={<DrugList />} />
          <Route path="reports" element={<ReportList />} />
          <Route path="reports/new" element={<ReportForm />} />
          <Route path="reports/:id" element={<ReportDetail />} />
          <Route path="reports/:id/edit" element={<ReportForm />} />
          <Route path="reports/:id/assess" element={<AssessmentForm />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="admin" element={<AdminView />} />
        </Route>
      </Routes>
    </Router>
  );
}
