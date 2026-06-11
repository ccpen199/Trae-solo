import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import TrademarkAISearch from './pages/Trademark/AISearch';
import TrademarkTracker from './pages/Trademark/Tracker';
import TrademarkContracts from './pages/Trademark/Contracts';
import PatentIPCNav from './pages/Patent/IPCNav';
import PatentFeeReminder from './pages/Patent/FeeReminder';
import PatentValueAssessment from './pages/Patent/ValueAssessment';
import CopyrightHashDeposit from './pages/Copyright/HashDeposit';
import CopyrightInfringement from './pages/Copyright/Infringement';
import CopyrightEvidence from './pages/Copyright/Evidence';
import AdminAgentWorkbench from './pages/Admin/AgentWorkbench';
import AdminSubsidyEngine from './pages/Admin/SubsidyEngine';
import Auth from './pages/Auth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/auth" element={<Auth />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trademark" element={<Navigate to="/trademark/ai-search" replace />} />
          <Route path="/trademark/ai-search" element={<TrademarkAISearch />} />
          <Route path="/trademark/tracker" element={<TrademarkTracker />} />
          <Route path="/trademark/contracts" element={<TrademarkContracts />} />
          <Route path="/patent" element={<Navigate to="/patent/ipc-nav" replace />} />
          <Route path="/patent/ipc-nav" element={<PatentIPCNav />} />
          <Route path="/patent/fee-reminder" element={<PatentFeeReminder />} />
          <Route path="/patent/value-assessment" element={<PatentValueAssessment />} />
          <Route path="/copyright" element={<Navigate to="/copyright/hash-deposit" replace />} />
          <Route path="/copyright/hash-deposit" element={<CopyrightHashDeposit />} />
          <Route path="/copyright/infringement" element={<CopyrightInfringement />} />
          <Route path="/copyright/evidence" element={<CopyrightEvidence />} />
          <Route path="/admin" element={<Navigate to="/admin/agent-workbench" replace />} />
          <Route path="/admin/agent-workbench" element={<AdminAgentWorkbench />} />
          <Route path="/admin/subsidy-engine" element={<AdminSubsidyEngine />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
