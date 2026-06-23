import { Repository } from 'typeorm';
import { WorkOrder } from '../entities/WorkOrder';
import { User } from '../entities/User';
import { v4 as uuidv4 } from 'uuid';

export class DispatchService {
  private workOrderRepo: Repository<WorkOrder>;
  private userRepo: Repository<User>;

  constructor(workOrderRepo: Repository<WorkOrder>, userRepo: Repository<User>) {
    this.workOrderRepo = workOrderRepo;
    this.userRepo = userRepo;
  }

  async autoDispatch(workOrderId: string): Promise<WorkOrder | null> {
    const workOrder = await this.workOrderRepo.findOne({ where: { id: workOrderId } });
    if (!workOrder || workOrder.status !== 'pending') return null;

    const workers = await this.userRepo.find({
      where: {
        communityId: workOrder.communityId,
        role: 'worker',
        status: 'active',
      },
    });

    if (workers.length === 0) return null;

    const workerLoad = await Promise.all(
      workers.map(async (w) => {
        const count = await this.workOrderRepo.count({
          where: { assignedToId: w.id, status: 'processing' },
        });
        return { worker: w, count };
      })
    );

    workerLoad.sort((a, b) => a.count - b.count);
    const selectedWorker = workerLoad[0].worker;

    workOrder.assignedToId = selectedWorker.id;
    workOrder.status = 'processing';

    return this.workOrderRepo.save(workOrder);
  }

  async manualDispatch(workOrderId: string, workerId: string): Promise<WorkOrder | null> {
    const workOrder = await this.workOrderRepo.findOne({ where: { id: workOrderId } });
    if (!workOrder) return null;

    const worker = await this.userRepo.findOne({ where: { id: workerId } });
    if (!worker || worker.role !== 'worker') return null;

    workOrder.assignedToId = workerId;
    workOrder.status = 'processing';

    return this.workOrderRepo.save(workOrder);
  }

  async completeWorkOrder(workOrderId: string): Promise<WorkOrder | null> {
    const workOrder = await this.workOrderRepo.findOne({ where: { id: workOrderId } });
    if (!workOrder) return null;

    workOrder.status = 'completed';
    workOrder.completedAt = new Date().toISOString();

    return this.workOrderRepo.save(workOrder);
  }

  async rateWorkOrder(workOrderId: string, rating: number, comment: string): Promise<WorkOrder | null> {
    const workOrder = await this.workOrderRepo.findOne({ where: { id: workOrderId } });
    if (!workOrder || workOrder.status !== 'completed') return null;

    workOrder.rating = rating;
    workOrder.ratingComment = comment;
    workOrder.status = 'closed';

    return this.workOrderRepo.save(workOrder);
  }
}
