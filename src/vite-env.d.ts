/// <reference types="vite/client" />

declare module 'msw' {
  export const http: {
    get: (url: string, handler: (...args: any[]) => any) => any;
    post: (url: string, handler: (...args: any[]) => any) => any;
    put: (url: string, handler: (...args: any[]) => any) => any;
    delete: (url: string, handler: (...args: any[]) => any) => any;
  };
  export class HttpResponse {
    static json(body: any, init?: ResponseInit | string): Response;
  }
}

declare module 'msw/browser' {
  export function setupWorker(...handlers: any[]): { start: (options?: any) => Promise<void> };
}
