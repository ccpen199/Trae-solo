import { Route } from 'react-router-dom';
import QrCodePage from '../pages/people/QrCodePage';
import CustomerListPage from '../pages/people/CustomerListPage';
import CustomerDetailPage from '../pages/people/CustomerDetailPage';
import ShareCenterPage from '../pages/people/ShareCenterPage';

const peopleRoutes = (
  <>
    <Route path="people/qrcode" element={<QrCodePage />} />
    <Route path="people/customers" element={<CustomerListPage />} />
    <Route path="people/customers/:id" element={<CustomerDetailPage />} />
    <Route path="people/share" element={<ShareCenterPage />} />
  </>
);

export default peopleRoutes;
