import { Router, Request, Response } from 'express';
import { Brackets } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Resource, ResourceType, ResourceAccessLevel } from '../entities/Resource';
import { optionalAuth, AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();
const resourceRepository = () => AppDataSource.getRepository(Resource);

router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 12;
    const type = req.query.type as ResourceType;
    const keyword = req.query.keyword as string;

    const queryBuilder = resourceRepository()
      .createQueryBuilder('resource')
      .where('resource.isActive = :isActive', { isActive: true });

    if (type) {
      queryBuilder.andWhere('resource.type = :type', { type });
    }

    if (keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('resource.title LIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('resource.description LIKE :keyword', { keyword: `%${keyword}%` });
      }));
    }

    const userRole = req.user?.role;
    if (!userRole) {
      queryBuilder.andWhere('resource.accessLevel = :public', { public: ResourceAccessLevel.PUBLIC });
    } else if (userRole !== 'admin' && userRole !== 'teacher') {
      queryBuilder.andWhere('resource.accessLevel IN (:...levels)', {
        levels: [ResourceAccessLevel.PUBLIC, ResourceAccessLevel.LOGIN_REQUIRED]
      });
    }

    queryBuilder.orderBy('resource.createdAt', 'DESC');

    const [resources, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        list: resources,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取资源列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const resource = await resourceRepository().findOne({
      where: { id, isActive: true }
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    const userRole = req.user?.role;
    if (resource.accessLevel !== ResourceAccessLevel.PUBLIC) {
      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: '请登录后查看'
        });
      }

      if (resource.accessLevel === ResourceAccessLevel.VIP_ONLY) {
        return res.status(403).json({
          success: false,
          message: '该资源仅VIP用户可访问'
        });
      }

      if (resource.accessLevel === ResourceAccessLevel.TEACHER_ONLY && 
          userRole !== 'teacher' && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '该资源仅教师可访问'
        });
      }
    }

    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('获取资源详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.post('/:id/download', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const resource = await resourceRepository().findOne({
      where: { id, isActive: true }
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    const userRole = req.user?.role;
    if (resource.accessLevel !== ResourceAccessLevel.PUBLIC && 
        resource.accessLevel !== ResourceAccessLevel.LOGIN_REQUIRED) {
      if (resource.accessLevel === ResourceAccessLevel.VIP_ONLY) {
        return res.status(403).json({
          success: false,
          message: '该资源仅VIP用户可下载'
        });
      }

      if (resource.accessLevel === ResourceAccessLevel.TEACHER_ONLY && 
          userRole !== 'teacher' && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '该资源仅教师可下载'
        });
      }
    }

    resource.downloadCount++;
    await resourceRepository().save(resource);

    res.json({
      success: true,
      message: '开始下载',
      data: {
        downloadUrl: resource.fileUrl,
        fileName: resource.fileName
      }
    });
  } catch (error) {
    console.error('下载资源错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

export default router;
