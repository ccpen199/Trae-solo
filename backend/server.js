const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const db = require('./database');
const auth = require('./auth');

const PROJECT_DIR = path.resolve(__dirname, '..');
const ENV_FILE = path.join(PROJECT_DIR, '.env');

function loadEnv() {
  const env = {};
  if (!fs.existsSync(ENV_FILE)) return env;
  for (const rawLine of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index === -1) continue;
    env[line.slice(0, index)] = line.slice(index + 1);
  }
  return env;
}

const env = loadEnv();
const HOST = env.HOST || '127.0.0.1';
const PORT = Number(env.BACKEND_PORT || 59086);
const FRONTEND_PORT = Number(env.FRONTEND_PORT || 49086);
const FRONTEND_ORIGIN = `http://127.0.0.1:${FRONTEND_PORT}`;

db.initDatabase();

const routes = {
  GET: [],
  POST: [],
  PUT: [],
  DELETE: [],
  PATCH: []
};

function createApp() {
  const app = {
    routes: {
      GET: [],
      POST: [],
      PUT: [],
      DELETE: [],
      PATCH: []
    }
  };

  ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
    app[method.toLowerCase()] = (path, ...handlers) => {
      app.routes[method].push({ path, handlers });
    };
  });

  return app;
}

function matchRoute(routes, pathname, method) {
  const methodRoutes = routes[method] || [];
  
  for (const route of methodRoutes) {
    const params = {};
    const pattern = route.path.replace(/:([^\/]+)/g, (_, name) => {
      return `([^\/]+)`;
    });
    const regex = new RegExp(`^${pattern}$`);
    const match = pathname.match(regex);
    
    if (match) {
      const paramNames = (route.path.match(/:([^\/]+)/g) || []).map(p => p.slice(1));
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      return { ...route, params };
    }
  }
  
  return null;
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': FRONTEND_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
    req.on('error', reject);
  });
}

const app = createApp();

app.get('/api/health', (req, res) => {
  json(res, 200, {
    ok: true,
    service: 'may-89086-social-security-platform',
    timestamp: new Date().toISOString(),
    port: PORT,
    host: HOST
  });
});

const { registerInsuranceRoutes } = require('./routes/insurance');
const { registerEmploymentRoutes } = require('./routes/employment');
const { registerExamRoutes } = require('./routes/exam');
const { registerPolicyRoutes } = require('./routes/policy');
const { registerAnalyticsRoutes } = require('./routes/analytics');

registerInsuranceRoutes(app);
registerEmploymentRoutes(app);
registerExamRoutes(app);
registerPolicyRoutes(app);
registerAnalyticsRoutes(app);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    const pathname = url.pathname;
    const method = req.method;

    res.json = (status, body) => {
      if (typeof status === 'object') {
        body = status;
        status = 200;
      }
      const payload = JSON.stringify(body);
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload),
        'Access-Control-Allow-Origin': FRONTEND_ORIGIN,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      });
      res.end(payload);
    };

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': FRONTEND_ORIGIN,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      });
      return res.end();
    }

    req.query = Object.fromEntries(url.searchParams);
    req.body = null;

    const matched = matchRoute(app.routes, pathname, method);
    
    if (!matched) {
      return json(res, 404, { ok: false, message: '接口不存在', path: pathname, method });
    }

    req.params = matched.params;

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      try {
        req.body = await readBody(req);
      } catch (e) {
        return json(res, 400, { ok: false, message: '请求体解析失败: ' + e.message });
      }
    }

    let handlerIndex = 0;
    const handlers = matched.handlers;
    
    const next = (err) => {
      if (err) {
        return json(res, 500, { ok: false, message: err.message || '服务器内部错误' });
      }
      
      if (handlerIndex >= handlers.length) {
        return json(res, 500, { ok: false, message: '处理器链未完成' });
      }
      
      const handler = handlers[handlerIndex++];
      
      try {
        const result = handler(req, res, next);
        if (result && typeof result.then === 'function') {
          result.catch(next);
        }
      } catch (e) {
        next(e);
      }
    };
    
    next();
    
  } catch (error) {
    console.error('Server error:', error);
    json(res, 500, { ok: false, message: error.message || '服务器内部错误' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`========================================`);
  console.log(`  省级人社公共服务一体化平台 - 后端服务`);
  console.log(`========================================`);
  console.log(`  服务地址: http://${HOST}:${PORT}`);
  console.log(`  健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(`  前端地址: http://127.0.0.1:${FRONTEND_PORT}`);
  console.log(`  数据库: ${path.join(PROJECT_DIR, 'data', 'app.sqlite')}`);
  console.log(`  启动时间: ${new Date().toISOString()}`);
  console.log(`========================================`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请使用备用端口或停止占用进程`);
    process.exit(1);
  }
  console.error('服务器错误:', error);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
