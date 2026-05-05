const EventEmitter = require('events');

console.log('✓ 使用内存队列（Bull 降级方案）');

const queues = new Map();

class MemoryQueue extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.jobs = [];
    this.processors = [];
    this.isProcessing = false;
  }

  add(data, options = {}) {
    const job = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      data,
      options,
      status: 'waiting',
      createdAt: new Date(),
    };
    this.jobs.push(job);
    console.log(`[Queue] Job added to ${this.name}: ${job.id}`);
    this.process();
    return Promise.resolve(job);
  }

  process(handler) {
    if (handler) {
      this.processors.push(handler);
    }
    
    if (this.isProcessing || this.processors.length === 0) return;
    
    this.isProcessing = true;
    
    const processNext = async () => {
      const job = this.jobs.find(j => j.status === 'waiting');
      if (!job) {
        this.isProcessing = false;
        return;
      }
      
      job.status = 'active';
      console.log(`[Queue] Processing job ${job.id} from ${this.name}`);
      
      try {
        for (const processor of this.processors) {
          await processor(job);
        }
        job.status = 'completed';
        job.completedAt = new Date();
        this.emit('completed', job);
        console.log(`[Queue] Job ${job.id} completed`);
      } catch (error) {
        job.status = 'failed';
        job.failedReason = error.message;
        job.failedAt = new Date();
        this.emit('failed', job, error);
        console.error(`[Queue] Job ${job.id} failed:`, error.message);
      }
      
      processNext();
    };
    
    processNext();
  }

  getJobCounts() {
    const counts = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
    
    for (const job of this.jobs) {
      if (counts[job.status] !== undefined) {
        counts[job.status]++;
      }
    }
    
    return Promise.resolve(counts);
  }

  clean(maxAge, status = 'completed') {
    const now = Date.now();
    const maxAgeMs = maxAge * 1000;
    
    const removed = [];
    this.jobs = this.jobs.filter(job => {
      if (job.status !== status) return true;
      const jobTime = job.completedAt || job.failedAt || job.createdAt;
      if (now - jobTime.getTime() > maxAgeMs) {
        removed.push(job.id);
        return false;
      }
      return true;
    });
    
    console.log(`[Queue] Cleaned ${removed.length} jobs from ${this.name}`);
    return Promise.resolve(removed);
  }
}

const getQueue = (name) => {
  if (!queues.has(name)) {
    queues.set(name, new MemoryQueue(name));
  }
  return queues.get(name);
};

module.exports = {
  getQueue,
  queues,
};