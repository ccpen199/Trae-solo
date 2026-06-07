import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleRoute from "@/components/RoleRoute";
import Dashboard from "@/pages/Dashboard";
import Taxpayers from "@/pages/Taxpayers";
import TaxTypes from "@/pages/TaxTypes";
import Declarations from "@/pages/Declarations";
import DeclarationForm from "@/pages/DeclarationForm";
import DeclarationDetail from "@/pages/DeclarationDetail";
import Payments from "@/pages/Payments";
import Invoices from "@/pages/Invoices";
import Certificates from "@/pages/Certificates";
import Policies from "@/pages/Policies";
import Tickets from "@/pages/Tickets";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="taxpayers" element={<Taxpayers />} />
          <Route path="tax-types" element={<TaxTypes />} />
          <Route path="declarations" element={<Declarations />} />
          <Route path="declarations/new" element={<DeclarationForm />} />
          <Route path="declarations/:id" element={<DeclarationDetail />} />
          <Route path="payments" element={<Payments />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="policies" element={<Policies />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="account" element={<Account />} />
          <Route path="admin" element={
            <RoleRoute allowedRoles={['admin']}>
              <Admin />
            </RoleRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}
