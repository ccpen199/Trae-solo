const express = require('express');
const DocAssembler = require('../engines/DocAssembler');
const LegalTimeline = require('../engines/LegalTimeline');
const db = require('../database/init');
const { authMiddleware, roleMiddleware, caseAccessMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/templates', (req, res) => {
  const templates = DocAssembler.getTemplates();
  res.json(templates);
});

router.post('/templates/:templateId/fill', (req, res) => {
  try {
    const { templateId } = req.params;
    const variables = req.body;
    const result = DocAssembler.fillTemplate(templateId, variables);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/:caseId', caseAccessMiddleware, async (req, res) => {
  try {
    const documents = await DocAssembler.getCaseDocuments(req.params.caseId);
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取文书列表失败' });
  }
});

router.post('/:caseId', 
  roleMiddleware('lead_lawyer', 'assistant'),
  caseAccessMiddleware,
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const userId = req.user.id;
      const { title, type, templateId, content } = req.body;

      const result = await DocAssembler.createDocument(
        caseId,
        title,
        type,
        templateId,
        userId,
        content
      );

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '创建文书失败' });
    }
  }
);

router.get('/:caseId/:documentId', caseAccessMiddleware, (req, res) => {
  const { documentId } = req.params;
  
  db.get(
    `SELECT d.*, dv.content, dv.version
     FROM documents d
     JOIN document_versions dv ON d.id = dv.document_id AND d.current_version = dv.version
     WHERE d.id = ?`,
    [documentId],
    (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '查询文书失败' });
      }
      if (!row) {
        return res.status(404).json({ error: '文书不存在' });
      }
      res.json(row);
    }
  );
});

router.put('/:caseId/:documentId',
  roleMiddleware('lead_lawyer', 'assistant'),
  caseAccessMiddleware,
  async (req, res) => {
    try {
      const { documentId, caseId } = req.params;
      const userId = req.user.id;
      const { content } = req.body;

      const result = await DocAssembler.updateDocument(documentId, content, userId);
      
      await LegalTimeline.createDocumentUpdatedEvent(caseId, documentId, result.newVersion, userId);

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '更新文书失败' });
    }
  }
);

router.get('/:caseId/:documentId/versions', caseAccessMiddleware, async (req, res) => {
  try {
    const versions = await DocAssembler.getDocumentVersions(req.params.documentId);
    res.json(versions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取版本历史失败' });
  }
});

router.get('/:caseId/:documentId/diff/:version1/:version2', caseAccessMiddleware, (req, res) => {
  const { documentId, version1, version2 } = req.params;

  db.all(
    `SELECT version, content FROM document_versions 
     WHERE document_id = ? AND version IN (?, ?)
     ORDER BY version`,
    [documentId, parseInt(version1), parseInt(version2)],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: '查询版本失败' });
      }
      if (rows.length < 2) {
        return res.status(404).json({ error: '版本不存在' });
      }

      const diff = require('diff');
      const diffResult = diff.diffLines(rows[0].content || '', rows[1].content || '');
      
      res.json({
        documentId,
        version1: rows[0].version,
        version2: rows[1].version,
        diff: diffResult
      });
    }
  );
});

module.exports = router;
