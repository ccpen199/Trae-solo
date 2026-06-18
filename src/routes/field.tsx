import { Route } from 'react-router-dom';
import StoreListPage from '../pages/field/StoreListPage';
import AppointmentListPage from '../pages/field/AppointmentListPage';
import AppointmentCreatePage from '../pages/field/AppointmentCreatePage';
import ServiceRecordPage from '../pages/field/ServiceRecordPage';
import ReviewListPage from '../pages/field/ReviewListPage';

const fieldRoutes = (
  <>
    <Route path="field/stores" element={<StoreListPage />} />
    <Route path="field/appointments" element={<AppointmentListPage />} />
    <Route path="field/appointments/create" element={<AppointmentCreatePage />} />
    <Route path="field/services" element={<ServiceRecordPage />} />
    <Route path="field/reviews" element={<ReviewListPage />} />
  </>
);

export default fieldRoutes;
