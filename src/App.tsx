import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from '@/layouts/MainLayout';
import DashboardPage from '@/pages/DashboardPage';
import WaybillsPage from '@/pages/WaybillsPage';
import TrackingPage from '@/pages/TrackingPage';
import FreightPage from '@/pages/FreightPage';
import DispatchPage from '@/pages/DispatchPage';
import InvoicesPage from '@/pages/customer/InvoicesPage';
import StatementsPage from '@/pages/customer/StatementsPage';
import AddressesPage from '@/pages/customer/AddressesPage';
import CreditPage from '@/pages/admin/CreditPage';
import GreenChannelPage from '@/pages/admin/GreenChannelPage';
import CustomsPage from '@/pages/integration/CustomsPage';
import AirportPage from '@/pages/integration/AirportPage';
import 'dayjs/locale/zh-cn';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/waybills" element={<WaybillsPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/freight" element={<FreightPage />} />
            <Route path="/dispatch" element={<DispatchPage />} />
            <Route path="/customer-service/invoices" element={<InvoicesPage />} />
            <Route path="/customer-service/statements" element={<StatementsPage />} />
            <Route path="/customer-service/addresses" element={<AddressesPage />} />
            <Route path="/admin/credit" element={<CreditPage />} />
            <Route path="/admin/green-channel" element={<GreenChannelPage />} />
            <Route path="/integration/customs" element={<CustomsPage />} />
            <Route path="/integration/airport" element={<AirportPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </MainLayout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
