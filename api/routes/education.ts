import { Router } from 'express';
import * as educationController from '../controllers/educationController';

const router = Router();

router.get('/schools', educationController.getSchools);
router.get('/school-by-address', educationController.getSchoolByAddress);
router.post('/enrollment', educationController.submitEnrollment);
router.get('/enrollment/:applicationId', educationController.getEnrollmentStatus);
router.get('/enrollments', educationController.getEnrollmentList);
router.get('/enrollment-guidelines', educationController.getEnrollmentGuidelines);

export default router;
