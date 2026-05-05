import { Router, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler, BadRequestError, NotFoundError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';
import multer from 'multer';
import { Readable } from 'stream';

const router = Router();
const upload = multer();

router.get(
  '/distribution-centers',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const dcList = await prisma.distributionCenter.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: dcList
    });
  })
);

router.post(
  '/distribution-centers',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { code, name } = req.body;

    if (!code || !name) {
      throw new BadRequestError('Code and name are required');
    }

    const existing = await prisma.distributionCenter.findUnique({
      where: { code }
    });

    if (existing) {
      throw new BadRequestError('Distribution center code already exists');
    }

    const dc = await prisma.distributionCenter.create({
      data: { code, name }
    });

    res.json({
      success: true,
      data: dc
    });
  })
);

router.get(
  '/distribution-centers/:dcId/warehouses',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { dcId } = req.params;

    const warehouses = await prisma.warehouse.findMany({
      where: {
        distributionCenterId: dcId,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: warehouses
    });
  })
);

router.post(
  '/distribution-centers/:dcId/warehouses',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { dcId } = req.params;
    const { code, name } = req.body;

    if (!code || !name) {
      throw new BadRequestError('Code and name are required');
    }

    const dc = await prisma.distributionCenter.findUnique({
      where: { id: dcId }
    });

    if (!dc) {
      throw new NotFoundError('Distribution center not found');
    }

    const existing = await prisma.warehouse.findUnique({
      where: { code }
    });

    if (existing) {
      throw new BadRequestError('Warehouse code already exists');
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        code,
        name,
        distributionCenterId: dcId
      }
    });

    res.json({
      success: true,
      data: warehouse
    });
  })
);

router.get(
  '/schedule-configs',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, pageSize = 20, isActive } = req.query;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [configs, total] = await Promise.all([
      prisma.scheduleConfig.findMany({
        where,
        skip,
        take: Number(pageSize),
        include: {
          distributionCenter: true,
          warehouse: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.scheduleConfig.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        configs,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  })
);

router.post(
  '/schedule-configs',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      name,
      distributionCenterId,
      warehouseId,
      orderType,
      minPieceCount,
      maxPieceCount,
      minVolume,
      maxVolume,
      minWeight,
      maxWeight
    } = req.body;

    if (!name) {
      throw new BadRequestError('Config name is required');
    }

    if (warehouseId && distributionCenterId) {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId }
      });

      if (!warehouse || warehouse.distributionCenterId !== distributionCenterId) {
        throw new BadRequestError('Warehouse does not belong to the selected distribution center');
      }
    }

    const existingConfig = await prisma.scheduleConfig.findFirst({
      where: {
        name,
        isActive: true
      }
    });

    if (existingConfig) {
      throw new BadRequestError('Config name already exists');
    }

    const config = await prisma.scheduleConfig.create({
      data: {
        name,
        distributionCenterId,
        warehouseId,
        orderType,
        minPieceCount,
        maxPieceCount,
        minVolume,
        maxVolume,
        minWeight,
        maxWeight,
        createdBy: req.user?.id
      },
      include: {
        distributionCenter: true,
        warehouse: true
      }
    });

    res.json({
      success: true,
      data: config
    });
  })
);

router.put(
  '/schedule-configs/:id',
  authMiddleware,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const {
      name,
      distributionCenterId,
      warehouseId,
      orderType,
      minPieceCount,
      maxPieceCount,
      minVolume,
      maxVolume,
      minWeight,
      maxWeight,
      isActive
    } = req.body;

    const config = await prisma.scheduleConfig.findUnique({
      where: { id }
    });

    if (!config) {
      throw new NotFoundError('Schedule config not found');
    }

    if (warehouseId && distributionCenterId) {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId }
      });

      if (!warehouse || warehouse.distributionCenterId !== distributionCenterId) {
        throw new BadRequestError('Warehouse does not belong to the selected distribution center');
      }
    }

    const updatedConfig = await prisma.scheduleConfig.update({
      where: { id },
      data: {
        name,
        distributionCenterId,
        warehouseId,
        orderType,
        minPieceCount,
        maxPieceCount,
        minVolume,
        maxVolume,
        minWeight,
        maxWeight,
        isActive
      },
      include: {
        distributionCenter: true,
        warehouse: true
      }
    });

    res.json({
      success: true,
      data: updatedConfig
    });
  })
);

router.post(
  '/schedule-configs/import',
  authMiddleware,
  requireRole('admin'),
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    let configs: any[] = [];
    try {
      const fileContent = req.file.buffer.toString('utf-8');
      configs = JSON.parse(fileContent);
    } catch (error) {
      throw new BadRequestError('Invalid JSON file format');
    }

    if (!Array.isArray(configs) || configs.length === 0) {
      throw new BadRequestError('No valid configs found in file');
    }

    const existingNames = await prisma.scheduleConfig.findMany({
      where: {
        name: { in: configs.map(c => c.name) },
        isActive: true
      },
      select: { name: true }
    });

    const duplicateNames = existingNames.map(c => c.name);
    if (duplicateNames.length > 0) {
      throw new BadRequestError(`Duplicate config names: ${duplicateNames.join(', ')}`);
    }

    const createdConfigs = await prisma.$transaction(
      configs.map(config =>
        prisma.scheduleConfig.create({
          data: {
            name: config.name,
            distributionCenterId: config.distributionCenterId,
            warehouseId: config.warehouseId,
            orderType: config.orderType,
            minPieceCount: config.minPieceCount,
            maxPieceCount: config.maxPieceCount,
            minVolume: config.minVolume,
            maxVolume: config.maxVolume,
            minWeight: config.minWeight,
            maxWeight: config.maxWeight,
            createdBy: req.user?.id
          }
        })
      )
    );

    res.json({
      success: true,
      data: {
        imported: createdConfigs.length,
        configs: createdConfigs
      }
    });
  })
);

export default router;
