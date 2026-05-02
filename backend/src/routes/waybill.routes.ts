import { Router } from 'express';
import { WaybillController } from '../controllers';

const router = Router();
const waybillController = new WaybillController();

router.get('/list', waybillController.getWaybillList.bind(waybillController));
router.get('/spaces', waybillController.getAvailableSpaces.bind(waybillController));
router.get('/:waybillId', waybillController.getWaybillDetail.bind(waybillController));
router.post('/draft', waybillController.createDraftWaybill.bind(waybillController));
router.post('/:waybillId/submit', waybillController.submitBooking.bind(waybillController));
router.post('/:waybillId/confirm', waybillController.confirmBooking.bind(waybillController));
router.post('/:waybillId/receiving/start', waybillController.startReceiving.bind(waybillController));
router.post('/receiving/complete', waybillController.completeReceiving.bind(waybillController));
router.post('/:waybillId/security/start', waybillController.startSecurityCheck.bind(waybillController));
router.post('/security/process', waybillController.processSecurityCheck.bind(waybillController));
router.get('/:waybillId/loading/actions', waybillController.getLoadingActions.bind(waybillController));
router.post('/:waybillId/loading/action', waybillController.processLoadingAction.bind(waybillController));
router.post('/:waybillId/loading/transit', waybillController.markInTransit.bind(waybillController));
router.post('/:waybillId/arrival', waybillController.markArrived.bind(waybillController));
router.post('/:waybillId/pickup', waybillController.completePickup.bind(waybillController));

export { router as waybillRouter };
