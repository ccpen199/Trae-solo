import express, { Router } from 'express';
import {
  generateRealtimeBoxOffice, generateTrendData, generateFilmRank, generatePipelineStatus,
  generateCityHeatmap, generateTheaterHeatmap, generateScreenHeatmap,
  generateCompetitors, generateSchedulePrediction,
  generateAudienceProfile, generateAudienceMigration,
  generateMatchMatrix, generateCertificate,
  generatePermissions, generateAuditLogs, generateReports,
} from '../../shared/mock-generator.js';
import type { AudienceFilterReq } from '../../shared/types.js';

const router = Router();

const wrap = <T>(data: T) => ({
  code: 0,
  message: 'success',
  data,
  timestamp: Date.now(),
});

router.get('/boxoffice/realtime', (_req, res) => {
  res.json(wrap(generateRealtimeBoxOffice()));
});

router.get('/boxoffice/trend', (_req, res) => {
  res.json(wrap(generateTrendData()));
});

router.get('/boxoffice/ranking', (req, res) => {
  const limit = Number(req.query.limit) || 10;
  res.json(wrap(generateFilmRank().slice(0, limit)));
});

router.get('/pipeline/status', (_req, res) => {
  res.json(wrap(generatePipelineStatus()));
});

router.get('/heatmap/cities', (_req, res) => {
  res.json(wrap(generateCityHeatmap()));
});

router.get('/heatmap/theaters', (req, res) => {
  const cityCode = String(req.query.cityCode || '110000');
  res.json(wrap(generateTheaterHeatmap(cityCode)));
});

router.get('/heatmap/screen', (_req, res) => {
  res.json(wrap(generateScreenHeatmap()));
});

router.get('/prediction/competitor', (_req, res) => {
  res.json(wrap(generateCompetitors()));
});

router.post('/prediction/schedule', (_req, res) => {
  res.json(wrap(generateSchedulePrediction()));
});

router.post('/audience/filter', (req, res) => {
  const filter = (req.body || {}) as Partial<AudienceFilterReq>;
  res.json(wrap(generateAudienceProfile(filter)));
});

router.get('/audience/migration', (_req, res) => {
  res.json(wrap(generateAudienceMigration()));
});

router.get('/crew/match', (req, res) => {
  const role = String(req.query.role || '');
  res.json(wrap(generateMatchMatrix(role)));
});

router.get('/crew/certificate', (_req, res) => {
  res.json(wrap(generateCertificate()));
});

router.get('/admin/permissions', (_req, res) => {
  res.json(wrap(generatePermissions()));
});

router.get('/admin/audit/export', (_req, res) => {
  res.json(wrap(generateAuditLogs()));
});

router.post('/admin/reports/generate', (_req, res) => {
  setTimeout(() => {
    res.json(wrap(generateReports()[0]));
  }, 500);
});

router.get('/admin/reports', (_req, res) => {
  res.json(wrap(generateReports()));
});

router.get('/sse/boxoffice', (_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  const send = () => {
    res.write(`data: ${JSON.stringify(generateRealtimeBoxOffice())}\n\n`);
  };
  send();
  const timer = setInterval(send, 3000);
  (_req as unknown as { on: (ev: string, cb: () => void) => void }).on('close', () => clearInterval(timer));
});

export default router;
