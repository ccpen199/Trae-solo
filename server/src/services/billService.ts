import { Repository } from 'typeorm';
import { Bill } from '../entities/Bill';
import { User } from '../entities/User';
import { v4 as uuidv4 } from 'uuid';

export class BillService {
  private billRepo: Repository<Bill>;
  private userRepo: Repository<User>;

  constructor(billRepo: Repository<Bill>, userRepo: Repository<User>) {
    this.billRepo = billRepo;
    this.userRepo = userRepo;
  }

  async generateMonthlyBills(communityId: string, projectId: string, period: string): Promise<Bill[]> {
    const users = await this.userRepo.find({
      where: { communityId, projectId, role: 'owner', status: 'active' },
    });

    const bills: Bill[] = [];
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    for (const user of users) {
      const bill = this.billRepo.create({
        id: uuidv4(),
        userId: user.id,
        communityId,
        projectId,
        type: 'property',
        amount: 150,
        period,
        dueDate: dueDateStr,
        status: 'unpaid',
      });
      bills.push(await this.billRepo.save(bill));
    }

    return bills;
  }

  async generateCustomBill(data: {
    userId: string;
    communityId: string;
    projectId: string;
    type: string;
    amount: number;
    period: string;
    dueDate: string;
  }): Promise<Bill> {
    const bill = this.billRepo.create({
      id: uuidv4(),
      ...data,
      status: 'unpaid',
    });
    return this.billRepo.save(bill);
  }

  async processPayment(billId: string, paymentMethod: string): Promise<Bill | null> {
    const bill = await this.billRepo.findOne({ where: { id: billId } });
    if (!bill || bill.status === 'paid') return null;

    bill.status = 'paid';
    bill.paidAt = new Date().toISOString();
    bill.paymentMethod = paymentMethod;
    bill.transactionId = uuidv4().replace(/-/g, '').substring(0, 20);

    return this.billRepo.save(bill);
  }
}
