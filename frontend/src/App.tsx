import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import TicketList from "@/pages/TicketList";
import TicketNew from "@/pages/TicketNew";
import TicketDetail from "@/pages/TicketDetail";
import ExceptionQueue from "@/pages/ExceptionQueue";
import Reports from "@/pages/Reports";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="tickets" element={<TicketList />} />
          <Route path="tickets/new" element={<TicketNew />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="exceptions" element={<ExceptionQueue />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}
