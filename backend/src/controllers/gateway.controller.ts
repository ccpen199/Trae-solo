import { Router, Request, Response } from 'express';
import { GatewayService } from '../services/gateway.service.js';

const gatewayService = new GatewayService();

export const gatewayRouter = Router();

gatewayRouter.all('/:serviceCode/*', async (req: Request, res: Response) => {
  try {
    const { serviceCode } = req.params;
    const apiPath = req.params[0] || '/';

    const result = await gatewayService.handleGatewayRequest(serviceCode, apiPath, req);

    for (const [key, value] of Object.entries(result.response.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => res.append(key, v));
        } else {
          res.setHeader(key, value);
        }
      }
    }

    res.setHeader('X-Trace-Id', result.response.traceId);

    if (result.error) {
      res.status(result.error.status).json({
        error: result.error.message,
        code: result.error.code,
        traceId: result.response.traceId,
      });
      return;
    }

    res.status(result.response.statusCode).send(result.response.body);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message,
    });
  }
});
