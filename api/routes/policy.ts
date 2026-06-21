import { Router } from 'express';
import type { Request, Response } from 'express';
import { sendResponse } from '../utils';
import { policyDocuments } from '../../shared/mockData';
import type { CityCode } from '../../shared/types';

const router = Router();

const allCategories = ['养老保险', '医疗保险', '失业保险', '工伤保险', '生育保险', '住房公积金', '综合', '基础法律', '税务法规'];

router.get('/search', (req: Request, res: Response) => {
  const { keyword, cityCode, category, status, tag, page = 1, pageSize = 10 } = req.query;
  let filtered = [...policyDocuments];
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      p.content.toLowerCase().includes(kw) ||
      p.tags.some(t => t.toLowerCase().includes(kw))
    );
  }
  if (cityCode && cityCode !== 'ALL') {
    filtered = filtered.filter(p => p.cityCode === cityCode || p.cityCode === 'NATIONAL');
  }
  if (category && category !== 'ALL') {
    filtered = filtered.filter(p => p.category === category);
  }
  if (status) {
    filtered = filtered.filter(p => p.status === status);
  }
  if (tag) {
    filtered = filtered.filter(p => p.tags.includes(String(tag)));
  }
  filtered.sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
  const start = (Number(page) - 1) * Number(pageSize);
  const paged = filtered.slice(start, start + Number(pageSize));
  res.json(sendResponse({
    list: paged,
    total: filtered.length,
    page: Number(page),
    pageSize: Number(pageSize),
    facets: {
      categories: allCategories,
      cities: ['NATIONAL', 'BJ', 'SH', 'GZ', 'SZ', 'HZ', 'TJ'],
      tags: [...new Set(policyDocuments.flatMap(p => p.tags))],
    },
  }));
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const doc = policyDocuments.find(p => p.id === id);
  if (!doc) return res.json(sendResponse(null, '政策文件不存在', 404));
  const relatedDocs = policyDocuments
    .filter(p => doc.relatedDocIds.includes(p.id))
    .map(p => ({ id: p.id, title: p.title, cityName: p.cityName, effectiveDate: p.effectiveDate }));
  res.json(sendResponse({ ...doc, relatedDocs }));
});

router.get('/', (_req: Request, res: Response) => {
  res.json(sendResponse(policyDocuments));
});

router.get('/graph/nodes', (_req: Request, res: Response) => {
  const nodes = policyDocuments.map(p => ({
    id: p.id,
    label: p.title.slice(0, 15) + (p.title.length > 15 ? '...' : ''),
    fullTitle: p.title,
    category: p.category,
    cityCode: p.cityCode,
    status: p.status,
    group: p.cityCode === 'NATIONAL' ? 0 : (['BJ','SH','GZ','SZ','HZ','TJ'].indexOf(p.cityCode) + 1),
  }));
  res.json(sendResponse(nodes));
});

router.get('/graph/edges', (_req: Request, res: Response) => {
  const edges: Array<{ id: string; source: string; target: string; type: string }> = [];
  policyDocuments.forEach(p => {
    p.relatedDocIds.forEach(rid => {
      if (policyDocuments.find(x => x.id === rid)) {
        edges.push({
          id: `${p.id}-${rid}`,
          source: p.id,
          target: rid,
          type: 'REFERENCES',
        });
      }
    });
  });
  res.json(sendResponse(edges));
});

router.get('/graph/all', (_req: Request, res: Response) => {
  const nodes = policyDocuments.map(p => ({
    id: p.id,
    label: p.title.slice(0, 15) + (p.title.length > 15 ? '...' : ''),
    fullTitle: p.title,
    category: p.category,
    cityCode: p.cityCode,
    status: p.status,
    group: p.cityCode === 'NATIONAL' ? 0 : (['BJ','SH','GZ','SZ','HZ','TJ'].indexOf(p.cityCode as CityCode) + 1),
  }));
  const edges: Array<{ id: string; source: string; target: string; type: string }> = [];
  policyDocuments.forEach(p => {
    p.relatedDocIds.forEach(rid => {
      if (policyDocuments.find(x => x.id === rid)) {
        edges.push({ id: `${p.id}-${rid}`, source: p.id, target: rid, type: 'REFERENCES' });
      }
    });
  });
  res.json(sendResponse({ nodes, edges }));
});

export default router;
