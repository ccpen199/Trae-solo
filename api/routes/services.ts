import { Router, type Request, type Response } from 'express';
import { mockServices, serviceCategories, type ApiResponse, type ServiceItem } from '../data/mockData.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, keyword, page = 1, pageSize = 10, sortBy = 'hotLevel', sortOrder = 'desc' } = req.query;

    let services = [...mockServices];

    if (category && category !== 'all') {
      services = services.filter(s => s.category === category);
    }

    if (keyword) {
      const keywordStr = String(keyword).toLowerCase();
      services = services.filter(s => 
        s.name.toLowerCase().includes(keywordStr) || 
        s.description.toLowerCase().includes(keywordStr) ||
        s.department.toLowerCase().includes(keywordStr)
      );
    }

    if (sortBy) {
      const sortKey = String(sortBy) as keyof ServiceItem;
      const order = String(sortOrder) === 'asc' ? 1 : -1;
      services.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * order;
        }
        return String(aVal).localeCompare(String(bVal)) * order;
      });
    }

    const pageNum = Number(page);
    const size = Number(pageSize);
    const total = services.length;
    const startIndex = (pageNum - 1) * size;
    const paginatedServices = services.slice(startIndex, startIndex + size);

    res.status(200).json({
      success: true,
      data: {
        list: paginatedServices,
        total,
        page: pageNum,
        pageSize: size,
        totalPages: Math.ceil(total / size),
      },
      message: '获取事项列表成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取事项列表失败',
    } as ApiResponse);
  }
});

router.get('/hot', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 5 } = req.query;
    const hotServices = [...mockServices]
      .sort((a, b) => b.hotLevel - a.hotLevel)
      .slice(0, Number(limit));

    res.status(200).json({
      success: true,
      data: hotServices,
      message: '获取热门事项成功',
    } as ApiResponse<ServiceItem[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取热门事项失败',
    } as ApiResponse);
  }
});

router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: serviceCategories,
      message: '获取事项分类成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取事项分类失败',
    } as ApiResponse);
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const service = mockServices.find(s => s.id === id);

    if (!service) {
      res.status(404).json({
        success: false,
        message: '事项不存在',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: service,
      message: '获取事项详情成功',
    } as ApiResponse<ServiceItem>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取事项详情失败',
    } as ApiResponse);
  }
});

router.get('/department/:departmentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId } = req.params;
    const services = mockServices.filter(s => s.departmentId === departmentId);

    res.status(200).json({
      success: true,
      data: services,
      message: '获取部门事项成功',
    } as ApiResponse<ServiceItem[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取部门事项失败',
    } as ApiResponse);
  }
});

export default router;
