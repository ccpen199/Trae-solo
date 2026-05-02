import { Router, Request, Response } from 'express';
import { ManagementService } from '../services/management.service.js';
import { TelemetryEngine } from '../engines/index.js';

const managementService = new ManagementService();
const telemetryEngine = new TelemetryEngine();

export const managementRouter = Router();

managementRouter.get('/services', async (req: Request, res: Response) => {
  try {
    const services = managementService.getAllServices();
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.get('/services/:id', async (req: Request, res: Response) => {
  try {
    const service = managementService.getServiceById(req.params.id);
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.post('/services', async (req: Request, res: Response) => {
  try {
    const { name, description, base_url } = req.body;
    const createdBy = req.headers['x-user-id'] as string || 'system';

    if (!name || !base_url) {
      res.status(400).json({ success: false, error: 'Name and base_url are required' });
      return;
    }

    const result = await managementService.createService({
      name,
      description: description || null,
      base_url,
      created_by: createdBy,
    });

    res.status(201).json({
      success: true,
      data: {
        service: result.service,
        apiKey: result.apiKey,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.post('/services/:id/probe', async (req: Request, res: Response) => {
  try {
    const result = await managementService.probeServiceAvailability(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.patch('/services/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const actorId = req.headers['x-user-id'] as string || 'system';

    if (!['OFFLINE', 'RUNNING', 'MAINTENANCE', 'DEGRADED'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const service = managementService.updateServiceStatus(req.params.id, status, actorId);
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.get('/services/:id/apis', async (req: Request, res: Response) => {
  try {
    const apis = managementService.getAPIsByServiceId(req.params.id);
    res.json({ success: true, data: apis });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.post('/services/:id/apis', async (req: Request, res: Response) => {
  try {
    const { name, path, method, description, timeout, is_public } = req.body;
    const actorId = req.headers['x-user-id'] as string || 'system';

    if (!name || !path || !method) {
      res.status(400).json({ success: false, error: 'Name, path, and method are required' });
      return;
    }

    const api = managementService.createAPI(
      {
        service_id: req.params.id,
        name,
        path,
        method,
        description: description || null,
        timeout,
        is_public,
      },
      actorId
    );

    res.status(201).json({ success: true, data: api });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.get('/services/:id/rate-limit-rules', async (req: Request, res: Response) => {
  try {
    const rules = managementService.getRateLimitRules(req.params.id);
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.post('/services/:id/rate-limit-rules', async (req: Request, res: Response) => {
  try {
    const { name, limit_type, requests_per_second, burst_size, window_size, api_id } = req.body;
    const actorId = req.headers['x-user-id'] as string || 'system';

    if (!name || requests_per_second === undefined) {
      res.status(400).json({ success: false, error: 'Name and requests_per_second are required' });
      return;
    }

    const rule = managementService.createRateLimitRule(
      {
        service_id: req.params.id,
        api_id: api_id || null,
        name,
        limit_type: limit_type || 'GLOBAL',
        requests_per_second,
        burst_size: burst_size || 200,
        window_size: window_size || 60,
      },
      actorId
    );

    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.get('/services/:id/circuit-breaker-rules', async (req: Request, res: Response) => {
  try {
    const rules = managementService.getCircuitBreakerRules(req.params.id);
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.post('/services/:id/circuit-breaker-rules', async (req: Request, res: Response) => {
  try {
    const { name, failure_threshold, timeout, reset_timeout, min_requests, api_id } = req.body;
    const actorId = req.headers['x-user-id'] as string || 'system';

    if (!name || failure_threshold === undefined) {
      res.status(400).json({ success: false, error: 'Name and failure_threshold are required' });
      return;
    }

    const rule = managementService.createCircuitBreakerRule(
      {
        service_id: req.params.id,
        api_id: api_id || null,
        name,
        failure_threshold,
        timeout: timeout || 10000,
        reset_timeout: reset_timeout || 30000,
        min_requests: min_requests || 10,
      },
      actorId
    );

    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.get('/services/:id/api-keys', async (req: Request, res: Response) => {
  try {
    const keys = managementService.getAPIKeys(req.params.id);
    res.json({ success: true, data: keys });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.post('/services/:id/api-keys', async (req: Request, res: Response) => {
  try {
    const actorId = req.headers['x-user-id'] as string || 'system';
    const { rate_limit, rate_window, expires_at } = req.body;
    
    const result = managementService.createAPIKey(req.params.id, actorId, {
      rate_limit: rate_limit ? parseInt(rate_limit) : undefined,
      rate_window: rate_window ? parseInt(rate_window) : undefined,
      expires_at: expires_at ? parseInt(expires_at) : null,
    });
    
    res.status(201).json({
      success: true,
      data: {
        apiKey: result.apiKey,
        key: result.key,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.post('/services/:id/deploy', async (req: Request, res: Response) => {
  try {
    const actorId = req.headers['x-user-id'] as string || 'system';
    const result = managementService.deployConfigToCluster(req.params.id, actorId);
    res.json({ success: result.success, data: { message: result.message } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = telemetryEngine.getRealTimeMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.get('/metrics/services/:id', async (req: Request, res: Response) => {
  try {
    const metrics = telemetryEngine.getServiceMetrics(req.params.id);
    if (!metrics) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.get('/alerts', async (req: Request, res: Response) => {
  try {
    const alerts = telemetryEngine.getRecentAlerts(100);
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.post('/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const actorId = req.headers['x-user-id'] as string || 'system';
    const result = managementService.acknowledgeAlert(req.params.id, actorId);
    if (!result) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }
    res.json({ success: true, data: { message: 'Alert acknowledged' } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const logs = telemetryEngine.getAuditLogs(100);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.get('/trace/:traceId', async (req: Request, res: Response) => {
  try {
    const logs = telemetryEngine.queryByTraceId(req.params.traceId);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

managementRouter.get('/fingerprint/:fingerprint', async (req: Request, res: Response) => {
  try {
    const logs = telemetryEngine.queryByFingerprint(req.params.fingerprint, 100);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
