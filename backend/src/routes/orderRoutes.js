const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRoles, ROLES } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.use(authenticateToken);

router.post('/', 
  authorizeRoles(ROLES.DESIGN_OPERATION, ROLES.MERCHANT, ROLES.ADMIN),
  orderController.createOrder
);

router.get('/', orderController.getOrders);

router.get('/statistics', orderController.getStatistics);

router.get('/todos', orderController.getTodoCount);

router.get('/statuses', orderController.getStatusInfo);

router.get('/:id', orderController.getOrderById);

router.post('/:id/upload', 
  authorizeRoles(ROLES.DESIGN_OPERATION, ROLES.CREATOR, ROLES.ADMIN),
  upload.single('image'),
  orderController.uploadImage
);

router.post('/:id/layers', 
  authorizeRoles(ROLES.CREATOR, ROLES.DESIGN_OPERATION, ROLES.ADMIN),
  orderController.addLayer
);

router.put('/:id/layers/:layerId', 
  authorizeRoles(ROLES.CREATOR, ROLES.DESIGN_OPERATION, ROLES.ADMIN),
  orderController.updateLayer
);

router.post('/:id/templates', 
  authorizeRoles(ROLES.CREATOR, ROLES.DESIGN_OPERATION, ROLES.ADMIN),
  orderController.applyTemplate
);

router.post('/:id/review', 
  authorizeRoles(ROLES.AUDITOR, ROLES.ADMIN),
  orderController.reviewTemplate
);

router.post('/:id/export', 
  authorizeRoles(ROLES.CREATOR, ROLES.DESIGN_OPERATION, ROLES.ADMIN),
  orderController.exportImage
);

module.exports = router;
