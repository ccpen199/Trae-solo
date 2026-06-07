import { Request, Response } from 'express';
import { ServiceItemService } from '../services/ServiceItemService.js';

const serviceItemService = new ServiceItemService();

export class ServiceItemController {
  static search(req: Request, res: Response) {
    const keyword = (req.query.keyword as string) || '';
    const category = (req.query.category as string) || 'all';
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const result = serviceItemService.search(keyword, category, page, pageSize);
    res.json(result);
  }

  static getById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的ID' });
    }

    const item = serviceItemService.findById(id);
    if (!item) {
      return res.status(404).json({ error: '服务事项不存在' });
    }
    res.json(item);
  }

  static getCategories(req: Request, res: Response) {
    const categories = serviceItemService.getAllCategories();
    res.json(categories);
  }

  static getScenarioGuide(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const answersParam = req.query.answers as string;
    const answers = answersParam ? JSON.parse(answersParam) : [];

    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的ID' });
    }

    const guide = serviceItemService.getScenarioGuide(id, answers);
    if (!guide) {
      return res.status(404).json({ error: '服务事项不存在' });
    }
    res.json(guide);
  }

  static getFormSchema(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const scenarioPathParam = req.query.scenarioPath as string;
    const scenarioPath = scenarioPathParam ? JSON.parse(scenarioPathParam) : [];

    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的ID' });
    }

    const schema = serviceItemService.getFormSchema(id, scenarioPath);
    if (!schema) {
      return res.status(404).json({ error: '服务事项不存在' });
    }
    res.json(schema);
  }

  static getMaterials(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const scenarioPathParam = req.query.scenarioPath as string;
    const scenarioPath = scenarioPathParam ? JSON.parse(scenarioPathParam) : [];

    if (isNaN(id)) {
      return res.status(400).json({ error: '无效的ID' });
    }

    const materials = serviceItemService.getMaterials(id, scenarioPath);
    if (!materials) {
      return res.status(404).json({ error: '服务事项不存在' });
    }
    res.json(materials);
  }
}
