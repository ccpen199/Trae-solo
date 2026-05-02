const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const EvidenceBlock = require('../engines/EvidenceBlock');
const LegalTimeline = require('../engines/LegalTimeline');
const { authMiddleware, roleMiddleware, caseAccessMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

router.get('/:caseId', caseAccessMiddleware, async (req, res) => {
  try {
    const evidences = await EvidenceBlock.getCaseEvidences(req.params.caseId);
    res.json(evidences);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取证据列表失败' });
  }
});

router.post('/:caseId/upload', 
  roleMiddleware('lead_lawyer', 'assistant'),
  caseAccessMiddleware,
  upload.single('file'),
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const userId = req.user.id;
      const { title, type, description } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: '未上传文件' });
      }

      const result = await EvidenceBlock.storeEvidence(
        caseId,
        userId,
        title || req.file.originalname,
        type || 'document',
        req.file.path,
        req.file.originalname,
        req.file.size,
        description
      );

      await LegalTimeline.createEvidenceUploadedEvent(caseId, result.id, userId);

      res.json({
        ...result,
        message: '证据上传成功，已完成区块链存证'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '证据上传失败' });
    }
  }
);

router.get('/:caseId/:evidenceId/verify', caseAccessMiddleware, async (req, res) => {
  try {
    const result = await EvidenceBlock.verifyEvidence(req.params.evidenceId);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '验证失败' });
  }
});

module.exports = router;
