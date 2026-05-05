const memoryCache = new Map();
const cacheTtl = new Map();

console.log('✓ 使用内存缓存（Redis 降级方案）');

const set = (key, value, options) => {
  let ttl = 3600;
  
  if (typeof options === 'number') {
    ttl = options;
  } else if (typeof options === 'object' && options !== null) {
    if (options.EX) {
      ttl = options.EX;
    } else if (options.ex) {
      ttl = options.ex;
    }
  }
  
  memoryCache.set(key, JSON.stringify(value));
  if (ttl > 0) {
    cacheTtl.set(key, Date.now() + ttl * 1000);
  }
  console.log(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
  return Promise.resolve('OK');
};

const get = (key) => {
  const now = Date.now();
  if (cacheTtl.has(key) && cacheTtl.get(key) < now) {
    memoryCache.delete(key);
    cacheTtl.delete(key);
    return Promise.resolve(null);
  }
  const value = memoryCache.get(key);
  console.log(`[Cache] GET: ${key} = ${value ? 'found' : 'not found'}`);
  return Promise.resolve(value ? JSON.parse(value) : null);
};

const del = (key) => {
  memoryCache.delete(key);
  cacheTtl.delete(key);
  console.log(`[Cache] DEL: ${key}`);
  return Promise.resolve(1);
};

const exists = (key) => {
  const now = Date.now();
  if (cacheTtl.has(key) && cacheTtl.get(key) < now) {
    memoryCache.delete(key);
    cacheTtl.delete(key);
    return Promise.resolve(0);
  }
  return Promise.resolve(memoryCache.has(key) ? 1 : 0);
};

const keys = (pattern) => {
  const regex = new RegExp(pattern.replace('*', '.*'));
  const result = [];
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      result.push(key);
    }
  }
  return Promise.resolve(result);
};

const ping = () => {
  return Promise.resolve('PONG');
};

const isConnected = () => {
  return true;
};

module.exports = {
  set,
  get,
  del,
  exists,
  keys,
  ping,
  isConnected,
};