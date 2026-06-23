import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Bill } from '../entities/Bill';
import { WorkOrder } from '../entities/WorkOrder';
import { User } from '../entities/User';
import { Order } from '../entities/Order';
import { Activity } from '../entities/Activity';
import { Announcement } from '../entities/Announcement';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', auth(), async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    const communityId = user.role === 'admin' ? undefined : user.communityId;

    const billRepo = AppDataSource.getRepository(Bill);
    const workOrderRepo = AppDataSource.getRepository(WorkOrder);
    const userRepo = AppDataSource.getRepository(User);
    const orderRepo = AppDataSource.getRepository(Order);
    const activityRepo = AppDataSource.getRepository(Activity);
    const announcementRepo = AppDataSource.getRepository(Announcement);

    const billWhere: any = {};
    const woWhere: any = {};
    const userWhere: any = { role: 'owner' };
    const orderWhere: any = {};
    const activityWhere: any = { status: 'published' };
    const announcementWhere: any = { status: 'published' };

    if (communityId) {
      billWhere.communityId = communityId;
      woWhere.communityId = communityId;
      userWhere.communityId = communityId;
      orderWhere.communityId = communityId;
      activityWhere.communityId = communityId;
      announcementWhere.communityId = communityId;
    }

    const [
      totalBills, paidBills, unpaidBills,
      totalWorkOrders, pendingWorkOrders, processingWorkOrders, completedWorkOrders,
      totalOwners,
      totalOrders, paidOrders,
      totalActivities,
      totalAnnouncements,
    ] = await Promise.all([
      billRepo.count({ where: billWhere }),
      billRepo.count({ where: { ...billWhere, status: 'paid' } }),
      billRepo.count({ where: { ...billWhere, status: 'unpaid' } }),
      workOrderRepo.count({ where: woWhere }),
      workOrderRepo.count({ where: { ...woWhere, status: 'pending' } }),
      workOrderRepo.count({ where: { ...woWhere, status: 'processing' } }),
      workOrderRepo.count({ where: { ...woWhere, status: 'completed' } }),
      userRepo.count({ where: userWhere }),
      orderRepo.count({ where: orderWhere }),
      orderRepo.count({ where: { ...orderWhere, status: 'paid' } }),
      activityRepo.count({ where: activityWhere }),
      announcementRepo.count({ where: announcementWhere }),
    ]);

    const recentWorkOrders = await workOrderRepo.find({
      where: woWhere,
      relations: ['user', 'assignedTo'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    res.json({
      bills: { total: totalBills, paid: paidBills, unpaid: unpaidBills },
      workOrders: {
        total: totalWorkOrders,
        pending: pendingWorkOrders,
        processing: processingWorkOrders,
        completed: completedWorkOrders,
      },
      users: { totalOwners },
      orders: { total: totalOrders, paid: paidOrders },
      activities: { total: totalActivities },
      announcements: { total: totalAnnouncements },
      recentWorkOrders,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
