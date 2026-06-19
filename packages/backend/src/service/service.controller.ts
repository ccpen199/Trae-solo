import { Controller, Get, Query, Param, Post, Body, UseGuards, Put, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role, OrderStatus, ServiceStatus } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { PaginationDto, buildPagination, buildPaginationResult } from '../common/dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';

@Controller('service/categories')
export class ServiceCategoryController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(@Query('parentId') parentId?: string, @Query('status') status?: string) {
    const where: any = { parentId: parentId || null };
    if (status !== undefined) where.status = parseInt(status);

    return this.prisma.serviceCategory.findMany({
      where,
      include: { children: true },
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() body: { name: string; icon?: string; sort?: number; parentId?: string }) {
    return this.prisma.serviceCategory.create({ data: body });
  }
}

@Controller('service/providers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ServiceProviderController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PROPERTY_ADMIN)
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: ServiceStatus,
  ) {
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.serviceProvider.findMany({
        ...buildPagination(pagination),
        where,
        include: { user: { select: { id: true, nickname: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceProvider.count({ where }),
    ]);
    return buildPaginationResult(items, total, pagination);
  }

  @Get('mine')
  async getMine(@CurrentUser() user: any) {
    return this.prisma.serviceProvider.findUnique({ where: { userId: user.id } });
  }

  @Post('apply')
  async apply(
    @Body() body: {
      name: string;
      logo?: string;
      description?: string;
      contactName: string;
      contactPhone: string;
      businessLicense?: string;
      idCardFront?: string;
      idCardBack?: string;
    },
    @CurrentUser() user: any,
  ) {
    const existing = await this.prisma.serviceProvider.findUnique({ where: { userId: user.id } });
    if (existing) {
      if (existing.status === ServiceStatus.PENDING_REVIEW) {
        throw new HttpException('入驻申请正在审核中', HttpStatus.BAD_REQUEST);
      }
      if (existing.status === ServiceStatus.APPROVED) {
        throw new HttpException('已入驻成功，请直接使用', HttpStatus.BAD_REQUEST);
      }
    }

    if (existing) {
      return this.prisma.serviceProvider.update({
        where: { userId: user.id },
        data: { ...body, status: ServiceStatus.PENDING_REVIEW },
      });
    }

    return this.prisma.serviceProvider.create({
      data: { userId: user.id, ...body },
    });
  }

  @Put(':id/review')
  @Roles(Role.SUPER_ADMIN, Role.PROPERTY_ADMIN)
  async review(
    @Param('id') id: string,
    @Body() body: { status: ServiceStatus; reviewComment?: string },
    @CurrentUser() user: any,
  ) {
    return this.prisma.serviceProvider.update({
      where: { id },
      data: {
        status: body.status,
        reviewComment: body.reviewComment,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
    });
  }
}

@Controller('service/items')
export class ServiceItemController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('categoryId') categoryId?: string,
    @Query('providerId') providerId?: string,
    @Query('keyword') keyword?: string,
  ) {
    const where: any = { status: ServiceStatus.APPROVED };
    if (categoryId) where.categoryId = categoryId;
    if (providerId) where.providerId = providerId;
    if (keyword) where.OR = [
      { name: { contains: keyword } },
      { description: { contains: keyword } },
    ];

    const [items, total] = await Promise.all([
      this.prisma.serviceItem.findMany({
        ...buildPagination(pagination),
        where,
        include: { provider: true, category: true },
        orderBy: [{ sort: 'desc' }, { sales: 'desc' }],
      }),
      this.prisma.serviceItem.count({ where }),
    ]);
    return buildPaginationResult(items, total, pagination);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.serviceItem.findUnique({
      where: { id },
      include: { provider: true, category: true },
    });
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.SERVICE_PROVIDER, Role.SUPER_ADMIN)
  async create(
    @Body() body: {
      categoryId: string;
      name: string;
      description: string;
      images?: any;
      price: number;
      originalPrice?: number;
      unit: string;
      stock?: number;
    },
    @CurrentUser() user: any,
  ) {
    const provider = await this.prisma.serviceProvider.findUnique({ where: { userId: user.id } });
    if (!provider) throw new HttpException('请先入驻', HttpStatus.BAD_REQUEST);
    if (provider.status !== ServiceStatus.APPROVED) {
      throw new HttpException('服务商未通过审核', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.serviceItem.create({
      data: {
        ...body,
        price: body.price as any,
        originalPrice: body.originalPrice as any,
        providerId: provider.id,
        status: ServiceStatus.PENDING_REVIEW,
      },
    });
  }
}

@Controller('service/orders')
@UseGuards(AuthGuard('jwt'))
export class ServiceOrderController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: OrderStatus,
    @CurrentUser() user?: any,
  ) {
    const where: any = {};
    if (status) where.status = status;

    if (user.role === Role.SERVICE_PROVIDER) {
      const provider = await this.prisma.serviceProvider.findUnique({ where: { userId: user.id } });
      if (provider) where.providerId = provider.id;
    } else {
      where.userId = user.id;
    }

    const [items, total] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        ...buildPagination(pagination),
        where,
        include: {
          items: true,
          provider: { select: { id: true, name: true } },
          user: { select: { id: true, nickname: true, phone: true } },
          rating: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceOrder.count({ where }),
    ]);
    return buildPaginationResult(items, total, pagination);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        items: { include: { service: true } },
        provider: true,
        user: true,
        rating: true,
      },
    });
  }

  @Post()
  async create(
    @Body() body: {
      items: Array<{ serviceId: string; quantity: number }>;
      contactName: string;
      contactPhone: string;
      address: string;
      appointmentTime?: string;
      remark?: string;
    },
    @CurrentUser() user: any,
  ) {
    const serviceItems = await this.prisma.serviceItem.findMany({
      where: { id: { in: body.items.map(i => i.serviceId) } },
      include: { provider: true },
    });

    if (serviceItems.length === 0) throw new HttpException('服务不存在', HttpStatus.BAD_REQUEST);

    const providerId = serviceItems[0].providerId;
    let totalAmount = 0;
    const orderItems = body.items.map(item => {
      const service = serviceItems.find(s => s.id === item.serviceId);
      if (!service) throw new HttpException('服务不存在', HttpStatus.BAD_REQUEST);
      const subtotal = parseFloat(service.price.toString()) * item.quantity;
      totalAmount += subtotal;
      return {
        serviceId: item.serviceId,
        serviceName: service.name,
        quantity: item.quantity,
        unitPrice: service.price,
        subtotal,
      };
    });

    const commissionRate = parseFloat(serviceItems[0].provider.commissionRate.toString());
    const commissionAmount = (totalAmount * commissionRate) / 100;

    const orderNo = `SO${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const order = await this.prisma.serviceOrder.create({
      data: {
        orderNo,
        userId: user.id,
        providerId,
        totalAmount: totalAmount as any,
        discountAmount: 0 as any,
        payAmount: totalAmount as any,
        commissionAmount: commissionAmount as any,
        status: OrderStatus.PENDING_PAYMENT,
        contactName: body.contactName,
        contactPhone: body.contactPhone,
        address: body.address,
        appointmentTime: body.appointmentTime ? new Date(body.appointmentTime) : undefined,
        remark: body.remark,
        items: { create: orderItems as any },
      },
    });

    return order;
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
    @CurrentUser() user: any,
  ) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id } });
    if (!order) throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);

    const updateData: any = { status: body.status };
    if (body.status === OrderStatus.PAID) updateData.paidAt = new Date();
    if (body.status === OrderStatus.ACCEPTED) updateData.acceptedAt = new Date();
    if (body.status === OrderStatus.COMPLETED) {
      updateData.completedAt = new Date();

      const provider = await this.prisma.serviceProvider.findUnique({ where: { id: order.providerId } });
      const commissionRate = provider ? parseFloat(provider.commissionRate.toString()) : 10;
      const orderAmount = parseFloat(order.totalAmount.toString());
      const commission = (orderAmount * commissionRate) / 100;

      await this.prisma.commissionSettlement.create({
        data: {
          providerId: order.providerId,
          orderId: order.id,
          orderAmount: order.totalAmount,
          commissionRate: commissionRate as any,
          commissionAmount: commission as any,
          providerEarning: (orderAmount - commission) as any,
        },
      });
    }

    return this.prisma.serviceOrder.update({ where: { id }, data: updateData });
  }

  @Post(':id/rating')
  async rate(
    @Param('id') id: string,
    @Body() body: { score: number; content?: string; images?: any },
    @CurrentUser() user: any,
  ) {
    const order = await this.prisma.serviceOrder.findUnique({ where: { id } });
    if (!order) throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);
    if (order.userId !== user.id) throw new HttpException('无权限', HttpStatus.FORBIDDEN);

    return this.prisma.serviceOrderRating.create({
      data: {
        orderId: id,
        userId: user.id,
        score: body.score,
        content: body.content,
        images: body.images,
      },
    });
  }
}

@Controller('service/commissions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CommissionController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.PROPERTY_ADMIN, Role.SERVICE_PROVIDER)
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('providerId') providerId?: string,
    @CurrentUser() user?: any,
  ) {
    const where: any = {};
    if (providerId) where.providerId = providerId;
    if (user.role === Role.SERVICE_PROVIDER) {
      const provider = await this.prisma.serviceProvider.findUnique({ where: { userId: user.id } });
      if (provider) where.providerId = provider.id;
    }

    const [items, total] = await Promise.all([
      this.prisma.commissionSettlement.findMany({
        ...buildPagination(pagination),
        where,
        include: { provider: true, order: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commissionSettlement.count({ where }),
    ]);
    return buildPaginationResult(items, total, pagination);
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.PROPERTY_ADMIN, Role.SERVICE_PROVIDER)
  async getStats(@CurrentUser() user: any) {
    const where: any = {};
    if (user.role === Role.SERVICE_PROVIDER) {
      const provider = await this.prisma.serviceProvider.findUnique({ where: { userId: user.id } });
      if (provider) where.providerId = provider.id;
    }

    const settlements = await this.prisma.commissionSettlement.findMany({ where });
    const totalCommission = settlements.reduce(
  (sum, s) => sum + parseFloat(s.commissionAmount.toString()),
  0,
);
    const totalEarning = settlements.reduce(
  (sum, s) => sum + parseFloat(s.providerEarning.toString()),
  0,
);

    return {
      totalOrders: settlements.length,
      totalCommission,
      totalEarning,
    };
  }
}
