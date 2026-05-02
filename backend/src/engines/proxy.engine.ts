import http from 'http';
import https from 'https';
import { URL } from 'url';
import { config } from '../config/index.js';
import { generateTraceId, now } from '../utils/index.js';
import { Service, API, ProxyRequest, ProxyResponse } from '../domains/core/types.js';

export class ReverseProxyEngine {
  private httpAgent: http.Agent;
  private httpsAgent: https.Agent;

  constructor() {
    this.httpAgent = new http.Agent({ keepAlive: true, maxSockets: 100 });
    this.httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 100 });
  }

  async execute(proxyRequest: ProxyRequest): Promise<ProxyResponse> {
    const traceId = generateTraceId();
    const startTime = Date.now();

    try {
      const targetUrl = this.buildTargetUrl(proxyRequest.service.base_url, proxyRequest.path);
      const timeout = proxyRequest.timeout || proxyRequest.api?.timeout || config.proxy.timeout;

      const options = this.buildRequestOptions(
        targetUrl,
        proxyRequest.method,
        proxyRequest.headers,
        timeout
      );

      const response = await this.sendRequest(options, proxyRequest.body);
      const duration = Date.now() - startTime;

      return {
        success: response.statusCode >= 200 && response.statusCode < 400,
        statusCode: response.statusCode,
        headers: response.headers,
        body: response.body,
        duration,
        traceId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        statusCode: 504,
        headers: {},
        body: JSON.stringify({ error: 'Gateway timeout', message: (error as Error).message }),
        duration,
        traceId,
        error: (error as Error).message,
      };
    }
  }

  private buildTargetUrl(baseUrl: string, path: string): URL {
    const base = new URL(baseUrl);
    const combinedPath = (base.pathname.endsWith('/') ? base.pathname : base.pathname + '/') +
      (path.startsWith('/') ? path.slice(1) : path);
    return new URL(combinedPath, base.origin);
  }

  private buildRequestOptions(
    url: URL,
    method: string,
    headers: Record<string, string | string[] | undefined>,
    timeout: number
  ): http.RequestOptions {
    const isHttps = url.protocol === 'https:';
    const agent = isHttps ? this.httpsAgent : this.httpAgent;

    const filteredHeaders: Record<string, string | string[]> = {};
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'host' && lowerKey !== 'content-length' && value !== undefined) {
        filteredHeaders[key] = value;
      }
    }

    return {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: filteredHeaders,
      agent,
      timeout,
    };
  }

  private sendRequest(
    options: http.RequestOptions,
    body?: string
  ): Promise<{ statusCode: number; headers: Record<string, string | string[]>; body: string }> {
    return new Promise((resolve, reject) => {
      const protocol = options.protocol === 'https:' ? https : http;
      const req = protocol.request(options, (res) => {
        let responseBody = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 500,
            headers: res.headers as Record<string, string | string[]>,
            body: responseBody,
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(body);
      }
      req.end();
    });
  }

  async probeAvailability(baseUrl: string): Promise<{ success: boolean; latency: number; statusCode?: number; error?: string }> {
    const startTime = Date.now();
    try {
      const url = new URL(baseUrl);
      const isHttps = url.protocol === 'https:';
      const protocol = isHttps ? https : http;

      const options = {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname || '/',
        method: 'HEAD',
        timeout: 5000,
      };

      const result = await this.sendRequest(options);
      const latency = Date.now() - startTime;

      return {
        success: result.statusCode >= 200 && result.statusCode < 400,
        latency,
        statusCode: result.statusCode,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        latency,
        error: (error as Error).message,
      };
    }
  }
}
