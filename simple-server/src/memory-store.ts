interface FrequencyRecord {
  targetType: string;
  targetValue: string;
  count: number;
  windowStart: number;
  timeWindow: number;
}

const frequencyStore = new Map<string, FrequencyRecord>();

const queueStore: any[] = [];
let queueProcessing = false;

export function getFrequencyCount(
  targetType: string,
  targetValue: string,
  timeWindow: number
): number {
  const now = Date.now();
  const windowStart = Math.floor(now / (timeWindow * 1000)) * (timeWindow * 1000);
  const key = `${targetType}:${targetValue}:${windowStart}`;

  const record = frequencyStore.get(key);
  if (!record) {
    return 0;
  }
  return record.count;
}

export function incrementFrequencyCount(
  targetType: string,
  targetValue: string,
  timeWindow: number
): number {
  const now = Date.now();
  const windowStart = Math.floor(now / (timeWindow * 1000)) * (timeWindow * 1000);
  const key = `${targetType}:${targetValue}:${windowStart}`;

  const existing = frequencyStore.get(key);
  const newCount = (existing?.count || 0) + 1;

  frequencyStore.set(key, {
    targetType,
    targetValue,
    count: newCount,
    windowStart,
    timeWindow,
  });

  setInterval(() => {
    cleanupExpiredWindows();
  }, 60000);

  return newCount;
}

function cleanupExpiredWindows() {
  const now = Date.now();
  for (const [key, record] of frequencyStore.entries()) {
    if (now > record.windowStart + record.timeWindow * 1000) {
      frequencyStore.delete(key);
    }
  }
}

export function addToQueue(job: any) {
  queueStore.push(job);
  processQueue();
}

function processQueue() {
  if (queueProcessing || queueStore.length === 0) return;
  
  queueProcessing = true;
  
  setTimeout(() => {
    while (queueStore.length > 0) {
      const job = queueStore.shift();
      console.log('Processing queue job:', job?.smsCode || 'unknown');
    }
    queueProcessing = false;
  }, 100);
}

export function getQueueStatus() {
  return {
    pending: queueStore.length,
    processing: queueProcessing,
  };
}

export default {
  getFrequencyCount,
  incrementFrequencyCount,
  addToQueue,
  getQueueStatus,
};
