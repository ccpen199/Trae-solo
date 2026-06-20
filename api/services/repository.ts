import type { Factory, Job, Worker, Broker, InterviewOrder, ResignWarning, RegionHeatmap, WhitelistStatus, InterviewStatus, CreditDistribution } from '../../shared/types.js';
import { factoriesData } from '../data/factories.js';
import { jobsData } from '../data/jobs.js';
import { workersData } from '../data/workers.js';
import { brokersData, interviewOrdersData, resignWarningsData, heatmapData } from '../data/misc.js';

class DataRepository {
  private factories: Factory[] = [...factoriesData];
  private jobs: Job[] = [...jobsData];
  private workers: Worker[] = [...workersData];
  private brokers: Broker[] = [...brokersData];
  private interviewOrders: InterviewOrder[] = [...interviewOrdersData];
  private resignWarnings: ResignWarning[] = [...resignWarningsData];
  private heatmap: RegionHeatmap[] = [...heatmapData];

  // ============ 工厂相关 ============
  getFactories(status?: WhitelistStatus, region?: string): Factory[] {
    let result = this.factories;
    if (status) result = result.filter(f => f.whitelistStatus === status);
    if (region) result = result.filter(f => f.region.includes(region) || region.includes(f.region));
    return result;
  }

  getFactoryById(id: string): Factory | undefined {
    return this.factories.find(f => f.id === id);
  }

  updateFactoryWhitelist(id: string, status: WhitelistStatus): Factory | undefined {
    const idx = this.factories.findIndex(f => f.id === id);
    if (idx >= 0) {
      this.factories[idx] = { ...this.factories[idx], whitelistStatus: status };
      return this.factories[idx];
    }
    return undefined;
  }

  // ============ 岗位相关 ============
  getJobs(options?: { factoryId?: string; status?: Job['status']; urgent?: boolean }): Job[] {
    let result = this.jobs;
    if (options?.factoryId) result = result.filter(j => j.factoryId === options.factoryId);
    if (options?.status) result = result.filter(j => j.status === options.status);
    return result;
  }

  getPublishedJobsWithFactory(factoryStatus?: WhitelistStatus) {
    const published = this.jobs.filter(j => j.status === 'published');
    return published.map(job => {
      const factory = this.factories.find(f => f.id === job.factoryId);
      if (factoryStatus && factory?.whitelistStatus !== factoryStatus) return null;
      return { job, factory: factory || null };
    }).filter(Boolean) as { job: Job; factory: Factory | null }[];
  }

  getJobById(id: string): Job | undefined {
    return this.jobs.find(j => j.id === id);
  }

  matchJobsByLocation(lat: number, lng: number, radiusKm = 50): (Job & { factory?: Factory; distanceKm: number })[] {
    const workerRegion = this.workers[0]?.currentLocation || { lat, lng };
    return this.jobs
      .filter(j => j.status === 'published')
      .map(job => {
        const factory = this.factories.find(f => f.id === job.factoryId);
        if (factory?.whitelistStatus === 'blacklist') return null;
        const dx = (workerRegion.lat - lat) * 111;
        const dy = (workerRegion.lng - lng) * 85;
        const distance = (Math.abs(dx) + Math.abs(dy)) * 3 + Math.random() * 25;
        const distanceKm = Math.max(1, Math.min(48, Math.round(distance)));
        return { ...job, factory, distanceKm };
      })
      .filter((item): item is (Job & { factory: Factory; distanceKm: number }) => {
        return item !== null && item.distanceKm <= radiusKm && !!item.factory;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  // ============ 工人相关 ============
  getWorkers(): Worker[] {
    return this.workers;
  }

  getWorkerById(id: string): Worker | undefined {
    return this.workers.find(w => w.id === id);
  }

  updateWorkerCreditScore(id: string, score: number, reason?: string): Worker | undefined {
    const idx = this.workers.findIndex(w => w.id === id);
    if (idx >= 0) {
      this.workers[idx] = { ...this.workers[idx], creditScore: Math.max(0, Math.min(100, score)) };
      return this.workers[idx];
    }
    return undefined;
  }

  verifyWorkerIdCard(id: string, data: { name: string; idNumber: string; address: string }): Worker | undefined {
    const idx = this.workers.findIndex(w => w.id === id);
    if (idx >= 0) {
      this.workers[idx] = { ...this.workers[idx], idCardVerified: true, idCardOcrData: data };
      return this.workers[idx];
    }
    return undefined;
  }

  getCreditDistribution(): CreditDistribution {
    const ranges = [
      { label: '优秀(85-100)', min: 85, max: 100, count: 0 },
      { label: '良好(70-84)', min: 70, max: 84, count: 0 },
      { label: '一般(55-69)', min: 55, max: 69, count: 0 },
      { label: '较差(40-54)', min: 40, max: 54, count: 0 },
      { label: '很差(0-39)', min: 0, max: 39, count: 0 },
    ];
    for (const w of this.workers) {
      for (const r of ranges) {
        if (w.creditScore >= r.min && w.creditScore <= r.max) {
          r.count++;
          break;
        }
      }
    }
    return {
      excellent: ranges[0].count,
      good: ranges[1].count,
      fair: ranges[2].count,
      poor: ranges[3].count,
      veryPoor: ranges[4].count,
      ranges,
    };
  }

  // ============ 经纪人相关 ============
  getBrokers(region?: string): Broker[] {
    let result = this.brokers;
    if (region) {
      result = result.filter(b => b.bindRegion.includes(region) || region.includes(b.bindRegion));
    }
    return result.sort((a, b) => b.orderWeight - a.orderWeight);
  }

  getBrokerById(id: string): Broker | undefined {
    return this.brokers.find(b => b.id === id);
  }

  getBrokerOrders(brokerId: string): InterviewOrder[] {
    return this.interviewOrders.filter(o => o.brokerId === brokerId);
  }

  // ============ 面试订单相关 ============
  getInterviewOrders(options?: { workerId?: string; brokerId?: string; factoryId?: string; status?: InterviewStatus }): InterviewOrder[] {
    let result = this.interviewOrders;
    if (options?.workerId) result = result.filter(o => o.workerId === options.workerId);
    if (options?.brokerId) result = result.filter(o => o.brokerId === options.brokerId);
    if (options?.factoryId) result = result.filter(o => o.factoryId === options.factoryId);
    if (options?.status) result = result.filter(o => o.status === options.status);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getInterviewOrderById(id: string): InterviewOrder | undefined {
    return this.interviewOrders.find(o => o.id === id);
  }

  createInterviewOrder(data: Partial<InterviewOrder> & { workerId: string; jobId: string; factoryId: string }): InterviewOrder {
    const worker = this.workers.find(w => w.id === data.workerId);
    const job = this.jobs.find(j => j.id === data.jobId);
    const factory = this.factories.find(f => f.id === data.factoryId);
    const now = new Date();
    const newOrder: InterviewOrder = {
      id: `o-${Date.now().toString(36)}`,
      workerId: data.workerId,
      workerName: worker?.name || '',
      workerPhone: worker?.phone || '',
      jobId: data.jobId,
      jobTitle: job?.title || '',
      factoryId: data.factoryId,
      factoryName: factory?.name || '',
      scheduledDate: data.scheduledDate || now.toISOString(),
      status: 'pending',
      serviceFee: 300,
      createdAt: now.toISOString(),
      timeline: [{
        time: now.toISOString(),
        type: '预约创建',
        description: `${worker?.name} 预约了 ${factory?.name} 的 ${job?.title} 面试`,
      }],
      ...data,
    };
    this.interviewOrders.push(newOrder);
    if (worker) {
      worker.status = 'interviewing';
    }
    return newOrder;
  }

  updateInterviewOrderStatus(id: string, status: InterviewStatus, event?: { type: string; description: string; operator?: string }): InterviewOrder | undefined {
    const idx = this.interviewOrders.findIndex(o => o.id === id);
    if (idx >= 0) {
      const now = new Date().toISOString();
      const events = [...this.interviewOrders[idx].timeline];
      if (event) events.push({ time: now, ...event });
      this.interviewOrders[idx] = { ...this.interviewOrders[idx], status, timeline: events };
      if (status === 'employed') {
        const worker = this.workers.find(w => w.id === this.interviewOrders[idx].workerId);
        if (worker) worker.status = 'employed';
      }
      return this.interviewOrders[idx];
    }
    return undefined;
  }

  assignBroker(orderId: string, brokerId: string): InterviewOrder | undefined {
    const orderIdx = this.interviewOrders.findIndex(o => o.id === orderId);
    const broker = this.brokers.find(b => b.id === brokerId);
    if (orderIdx >= 0 && broker) {
      const now = new Date().toISOString();
      this.interviewOrders[orderIdx] = {
        ...this.interviewOrders[orderIdx],
        brokerId,
        brokerName: broker.name,
        status: 'broker_assigned',
        timeline: [...this.interviewOrders[orderIdx].timeline, {
          time: now,
          type: '经纪人指派',
          description: `已指派经纪人「${broker.name}」`,
          operator: '系统',
        }],
      };
      return this.interviewOrders[orderIdx];
    }
    return undefined;
  }

  schedulePickup(orderId: string, pickupInfo: InterviewOrder['pickupInfo']): InterviewOrder | undefined {
    const idx = this.interviewOrders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      const now = new Date().toISOString();
      this.interviewOrders[idx] = {
        ...this.interviewOrders[idx],
        pickupInfo,
        status: 'pickup_scheduled',
        timeline: [...this.interviewOrders[idx].timeline, {
          time: now,
          type: '车接安排',
          description: `已安排 ${pickupInfo?.carPlate} ${pickupInfo?.driverName} 在 ${pickupInfo?.pickupPoint} 接送，时间 ${new Date(pickupInfo!.pickupTime).toLocaleString('zh-CN')}`,
          operator: this.interviewOrders[idx].brokerName,
        }],
      };
      return this.interviewOrders[idx];
    }
    return undefined;
  }

  // ============ 预警和热力图 ============
  getResignWarnings(): ResignWarning[] {
    return this.resignWarnings.sort((a, b) => b.riskScore - a.riskScore);
  }

  getHeatmapData(): RegionHeatmap[] {
    return this.heatmap;
  }
}

export const repo = new DataRepository();
export default repo;
