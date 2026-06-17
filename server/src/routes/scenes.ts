import { Router } from 'express';
import { mockScenes } from '../data/mockData';

const router = Router();

router.get('/', (req, res) => {
  res.json({ code: 0, data: mockScenes });
});

router.get('/:id', (req, res) => {
  const scene = mockScenes.find((s) => s.id === req.params.id);
  if (!scene) {
    return res.status(404).json({ code: 1, message: '场景不存在' });
  }
  res.json({ code: 0, data: scene });
});

router.post('/', (req, res) => {
  const newScene = {
    ...req.body,
    id: `scene_${Date.now()}`,
  };
  mockScenes.push(newScene);
  res.json({ code: 0, data: newScene });
});

router.put('/:id', (req, res) => {
  const scene = mockScenes.find((s) => s.id === req.params.id);
  if (!scene) {
    return res.status(404).json({ code: 1, message: '场景不存在' });
  }
  Object.assign(scene, req.body);
  res.json({ code: 0, data: scene });
});

router.put('/:id/toggle', (req, res) => {
  const scene = mockScenes.find((s) => s.id === req.params.id);
  if (!scene) {
    return res.status(404).json({ code: 1, message: '场景不存在' });
  }
  scene.enabled = !scene.enabled;
  res.json({ code: 0, data: { enabled: scene.enabled } });
});

router.delete('/:id', (req, res) => {
  const index = mockScenes.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ code: 1, message: '场景不存在' });
  }
  mockScenes.splice(index, 1);
  res.json({ code: 0, message: '删除成功' });
});

router.post('/:id/trigger', (req, res) => {
  const scene = mockScenes.find((s) => s.id === req.params.id);
  if (!scene) {
    return res.status(404).json({ code: 1, message: '场景不存在' });
  }
  res.json({ code: 0, message: '场景已触发' });
});

export default router;
