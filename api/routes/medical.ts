import { Router } from 'express';
import * as medicalController from '../controllers/medicalController';

const router = Router();

router.get('/hospitals', medicalController.getHospitals);
router.get('/hospitals/:hospitalId/departments', medicalController.getHospitalDepartments);
router.get('/wait-times', medicalController.getWaitTimes);
router.post('/appointment', medicalController.createAppointment);
router.get('/appointments', medicalController.getAppointments);
router.post('/pay', medicalController.payMedicalBill);

export default router;
