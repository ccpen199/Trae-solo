import { Router, Request, Response } from 'express';
import { In, Like, Brackets } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Course, CourseCategory } from '../entities/Course';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const courseRepository = () => AppDataSource.getRepository(Course);
const categoryRepository = () => AppDataSource.getRepository(CourseCategory);

router.get('/categories', async (req: Request, res: Response) => {
  try {
    const level = req.query.level ? parseInt(req.query.level as string) : undefined;
    
    const queryBuilder = categoryRepository()
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.children', 'children')
      .where('category.isActive = :isActive', { isActive: true })
      .orderBy('category.sort', 'ASC')
      .addOrderBy('category.createdAt', 'DESC');

    if (level !== undefined) {
      queryBuilder.andWhere('category.level = :level', { level });
    } else {
      queryBuilder.andWhere('category.level = 0');
    }

    const categories = await queryBuilder.getMany();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取分类错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/categories/all', async (req: Request, res: Response) => {
  try {
    const categories = await categoryRepository().find({
      where: { isActive: true },
      order: { sort: 'ASC', createdAt: 'DESC' }
    });

    const buildTree = (items: CourseCategory[], parentId: string | null = null): CourseCategory[] => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };

    const categoryTree = buildTree(categories, null);

    res.json({
      success: true,
      data: categoryTree
    });
  } catch (error) {
    console.error('获取全部分类错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/list', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 12;
    const categoryId = req.query.categoryId as string;
    const keyword = req.query.keyword as string;
    const sort = req.query.sort as string || 'newest';

    const queryBuilder = courseRepository()
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category')
      .where('course.status = :status', { status: 'published' });

    if (categoryId) {
      const category = await categoryRepository().findOne({
        where: { id: categoryId }
      });

      if (category) {
        const allCategories = await categoryRepository().find();
        const getChildIds = (parentId: string): string[] => {
          const children = allCategories.filter(c => c.parentId === parentId);
          let ids: string[] = [parentId];
          children.forEach(child => {
            ids = [...ids, ...getChildIds(child.id)];
          });
          return ids;
        };

        const categoryIds = getChildIds(categoryId);
        queryBuilder.andWhere('course.categoryId IN (:...categoryIds)', { categoryIds });
      }
    }

    if (keyword) {
      queryBuilder.andWhere(new Brackets(qb => {
        qb.where('course.title LIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('course.description LIKE :keyword', { keyword: `%${keyword}%` });
      }));
    }

    switch (sort) {
      case 'popular':
        queryBuilder.orderBy('course.studentCount', 'DESC');
        break;
      case 'price_asc':
        queryBuilder.orderBy('course.price', 'ASC');
        break;
      case 'price_desc':
        queryBuilder.orderBy('course.price', 'DESC');
        break;
      default:
        queryBuilder.orderBy('course.createdAt', 'DESC');
    }

    const [courses, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        list: courses,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取课程列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/recent', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const courses = await courseRepository().find({
      where: { status: 'published' },
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit
    });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('获取最近更新课程错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/featured', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 8;

    const courses = await courseRepository().find({
      where: { status: 'published', isFeatured: true },
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit
    });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('获取精选课程错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const course = await courseRepository().findOne({
      where: { id },
      relations: ['category']
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('获取课程详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

export default router;
