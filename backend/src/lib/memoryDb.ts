import { v4 as uuidv4 } from 'uuid';
import { 
  DeveloperLevel, 
  ApplicationType, 
  AppStatus, 
  RoleType, 
  ApiScope, 
  EventType 
} from '@prisma/client';

interface Developer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  level: DeveloperLevel;
  companyName?: string;
  description?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Application {
  id: string;
  name: string;
  appKey: string;
  appSecret: string;
  type: ApplicationType;
  description?: string;
  developerId: string;
  status: AppStatus;
  callbackUrl?: string;
  notifyUrl?: string;
  defaultScopes: ApiScope[];
  approvedScopes: ApiScope[];
  requestedScopes: ApiScope[];
  rateLimitPerMin: number;
  dailyLimit: number;
  isSandbox: boolean;
  approvedAt?: Date;
  suspendedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ApiKey {
  id: string;
  key: string;
  applicationId: string;
  developerId: string;
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

interface Role {
  id: string;
  type: RoleType;
  name: string;
  description?: string;
  defaultApiScopes: ApiScope[];
  createdAt: Date;
  updatedAt: Date;
}

interface UserApiGrant {
  id: string;
  userId: string;
  roleId: string;
  applicationId: string;
  grantedScopes: ApiScope[];
  isActive: boolean;
  grantedAt: Date;
  revokedAt?: Date;
}

interface WebhookSubscription {
  id: string;
  applicationId: string;
  eventTypes: EventType[];
  endpointUrl: string;
  secretKey: string;
  isActive: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
}

interface ApiCallLog {
  id: string;
  timestamp: Date;
  appKey: string;
  applicationId?: string;
  userId?: string;
  roleType?: RoleType;
  apiEndpoint: string;
  apiMethod: string;
  requestedScopes: ApiScope[];
  responseStatus: number;
  responseTimeMs: number;
  ipAddress?: string;
  userAgent?: string;
  isSuccess: boolean;
}

interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  targetType?: string;
  targetId?: string;
  operatorType?: string;
  operatorId?: string;
  applicationId?: string;
  developerId?: string;
  details?: string;
  ipAddress?: string;
  isSuccess: boolean;
}

interface Notification {
  id: string;
  eventType: EventType;
  applicationId?: string;
  developerId?: string;
  payload: string;
  status: string;
  sentAt?: Date;
  failedAt?: Date;
  retryCount: number;
  createdAt: Date;
}

class MemoryDatabase {
  private developers: Map<string, Developer> = new Map();
  private applications: Map<string, Application> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();
  private roles: Map<string, Role> = new Map();
  private userApiGrants: Map<string, UserApiGrant> = new Map();
  private webhookSubscriptions: Map<string, WebhookSubscription> = new Map();
  private apiCallLogs: ApiCallLog[] = [];
  private auditLogs: AuditLog[] = [];
  private notifications: Notification[] = [];

  constructor() {
    this.initDefaultData();
  }

  private initDefaultData() {
    const defaultScopes = [
      ApiScope.USER_READ,
      ApiScope.ORDER_READ,
      ApiScope.PRODUCT_READ
    ];

    const roles: Role[] = [
      {
        id: uuidv4(),
        type: RoleType.BUYER,
        name: '买家',
        defaultApiScopes: [
          ApiScope.USER_READ,
          ApiScope.USER_WRITE,
          ApiScope.ORDER_READ,
          ApiScope.PRODUCT_READ
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        type: RoleType.SELLER,
        name: '卖家',
        defaultApiScopes: [
          ApiScope.USER_READ,
          ApiScope.USER_WRITE,
          ApiScope.ORDER_READ,
          ApiScope.ORDER_WRITE,
          ApiScope.PRODUCT_READ,
          ApiScope.PRODUCT_WRITE,
          ApiScope.TRADE_READ,
          ApiScope.LOGISTICS_READ
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        type: RoleType.VIP_SELLER,
        name: '高级卖家',
        defaultApiScopes: [
          ApiScope.USER_READ,
          ApiScope.USER_WRITE,
          ApiScope.ORDER_READ,
          ApiScope.ORDER_WRITE,
          ApiScope.PRODUCT_READ,
          ApiScope.PRODUCT_WRITE,
          ApiScope.TRADE_READ,
          ApiScope.TRADE_WRITE,
          ApiScope.LOGISTICS_READ,
          ApiScope.LOGISTICS_WRITE,
          ApiScope.FINANCE_READ,
          ApiScope.MESSAGE_SEND,
          ApiScope.MESSAGE_RECEIVE
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    roles.forEach(role => this.roles.set(role.id, role));
  }

  get developer() {
    return {
      findUnique: async (args: { where: { id?: string; email?: string } }) => {
        if (args.where.id) {
          return this.developers.get(args.where.id) || null;
        }
        if (args.where.email) {
          for (const dev of this.developers.values()) {
            if (dev.email === args.where.email) {
              return dev;
            }
          }
        }
        return null;
      },
      findMany: async (args?: { 
        where?: Record<string, unknown>; 
        skip?: number; 
        take?: number; 
        orderBy?: Record<string, string>;
        include?: Record<string, unknown>;
      }) => {
        let result = Array.from(this.developers.values());
        
        if (args?.where?.OR) {
          const orConditions = args.where.OR as Array<Record<string, { contains: string }>>;
          result = result.filter(dev => {
            return orConditions.some(condition => {
              for (const [key, value] of Object.entries(condition)) {
                if (dev[key as keyof Developer] && 
                    String(dev[key as keyof Developer]).toLowerCase().includes(value.contains.toLowerCase())) {
                  return true;
                }
              }
              return false;
            });
          });
        }

        if (args?.orderBy) {
          const [field, order] = Object.entries(args.orderBy)[0];
          result.sort((a, b) => {
            const aVal = a[field as keyof Developer];
            const bVal = b[field as keyof Developer];
            if (aVal instanceof Date && bVal instanceof Date) {
              return order === 'desc' ? bVal.getTime() - aVal.getTime() : aVal.getTime() - bVal.getTime();
            }
            return order === 'desc' ? String(bVal).localeCompare(String(aVal)) : String(aVal).localeCompare(String(bVal));
          });
        }

        const skip = args?.skip || 0;
        const take = args?.take || result.length;
        return result.slice(skip, skip + take);
      },
      count: async (args?: { where?: Record<string, unknown> }) => {
        let result = Array.from(this.developers.values());
        return result.length;
      },
      create: async (args: { data: Omit<Developer, 'id' | 'createdAt' | 'updatedAt'> }) => {
        const now = new Date();
        const developer: Developer = {
          id: uuidv4(),
          ...args.data,
          createdAt: now,
          updatedAt: now
        };
        this.developers.set(developer.id, developer);
        return developer;
      },
      update: async (args: { 
        where: { id: string }; 
        data: Partial<Omit<Developer, 'id' | 'createdAt'>> 
      }) => {
        const developer = this.developers.get(args.where.id);
        if (!developer) {
          throw new Error('Developer not found');
        }
        const updated = {
          ...developer,
          ...args.data,
          updatedAt: new Date()
        };
        this.developers.set(developer.id, updated);
        return updated;
      }
    };
  }

  get application() {
    return {
      findUnique: async (args: { 
        where: { id?: string; appKey?: string; id_developerId?: { id: string; developerId: string } };
        include?: { apiKeys?: { where?: { isActive: boolean }; take?: number }; developer?: { select?: Record<string, boolean> } }
      }) => {
        if (args.where.id && args.where.id_developerId) {
          const app = this.applications.get(args.where.id);
          if (app && app.developerId === args.where.id_developerId.developerId) {
            return this.enrichApplication(app, args.include);
          }
          return null;
        }
        if (args.where.id) {
          const app = this.applications.get(args.where.id);
          return app ? this.enrichApplication(app, args.include) : null;
        }
        if (args.where.appKey) {
          for (const app of this.applications.values()) {
            if (app.appKey === args.where.appKey) {
              return this.enrichApplication(app, args.include);
            }
          }
        }
        return null;
      },
      findMany: async (args?: { 
        where?: { developerId?: string; status?: string };
        skip?: number;
        take?: number;
        orderBy?: Record<string, string>;
        include?: Record<string, { where?: { isActive: boolean }; take?: number }>;
      }) => {
        let result = Array.from(this.applications.values());
        
        if (args?.where?.developerId) {
          result = result.filter(app => app.developerId === args.where?.developerId);
        }
        if (args?.where?.status) {
          result = result.filter(app => app.status === args.where?.status);
        }

        if (args?.orderBy) {
          const [field, order] = Object.entries(args.orderBy)[0];
          result.sort((a, b) => {
            const aVal = a[field as keyof Application];
            const bVal = b[field as keyof Application];
            if (aVal instanceof Date && bVal instanceof Date) {
              return order === 'desc' ? bVal.getTime() - aVal.getTime() : aVal.getTime() - bVal.getTime();
            }
            return order === 'desc' ? String(bVal).localeCompare(String(aVal)) : String(aVal).localeCompare(String(bVal));
          });
        }

        const skip = args?.skip || 0;
        const take = args?.take || result.length;
        
        return result.slice(skip, skip + take).map(app => this.enrichApplication(app, args?.include));
      },
      count: async (args?: { where?: { developerId?: string; status?: string } }) => {
        let result = Array.from(this.applications.values());
        if (args?.where?.developerId) {
          result = result.filter(app => app.developerId === args.where?.developerId);
        }
        if (args?.where?.status) {
          result = result.filter(app => app.status === args.where?.status);
        }
        return result.length;
      },
      create: async (args: { data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'> }) => {
        const now = new Date();
        const application: Application = {
          id: uuidv4(),
          ...args.data,
          createdAt: now,
          updatedAt: now
        };
        this.applications.set(application.id, application);
        return application;
      },
      update: async (args: { 
        where: { id: string }; 
        data: Partial<Omit<Application, 'id' | 'createdAt'>> 
      }) => {
        const application = this.applications.get(args.where.id);
        if (!application) {
          throw new Error('Application not found');
        }
        const updated = {
          ...application,
          ...args.data,
          updatedAt: new Date()
        };
        this.applications.set(application.id, updated);
        return updated;
      }
    };
  }

  get apiKey() {
    return {
      findFirst: async (args: { 
        where: { key: string; isActive: boolean };
        include?: { application?: boolean }
      }) => {
        for (const apiKey of this.apiKeys.values()) {
          if (apiKey.key === args.where.key && apiKey.isActive === args.where.isActive) {
            const result: any = { ...apiKey };
            if (args.include?.application) {
              result.application = this.applications.get(apiKey.applicationId) || null;
            }
            return result;
          }
        }
        return null;
      },
      create: async (args: { data: Omit<ApiKey, 'id' | 'createdAt'> }) => {
        const apiKey: ApiKey = {
          id: uuidv4(),
          ...args.data,
          createdAt: new Date()
        };
        this.apiKeys.set(apiKey.id, apiKey);
        return apiKey;
      },
      update: async (args: { 
        where: { id: string }; 
        data: Partial<Omit<ApiKey, 'id' | 'createdAt'>> 
      }) => {
        const apiKey = this.apiKeys.get(args.where.id);
        if (!apiKey) {
          throw new Error('ApiKey not found');
        }
        const updated = {
          ...apiKey,
          ...args.data
        };
        this.apiKeys.set(apiKey.id, updated);
        return updated;
      }
    };
  }

  get role() {
    return {
      findUnique: async (args: { where: { type?: RoleType; id?: string } }) => {
        if (args.where.type) {
          for (const role of this.roles.values()) {
            if (role.type === args.where.type) {
              return role;
            }
          }
        }
        if (args.where.id) {
          return this.roles.get(args.where.id) || null;
        }
        return null;
      },
      create: async (args: { data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'> }) => {
        const now = new Date();
        const role: Role = {
          id: uuidv4(),
          ...args.data,
          createdAt: now,
          updatedAt: now
        };
        this.roles.set(role.id, role);
        return role;
      }
    };
  }

  get userApiGrant() {
    return {
      findFirst: async (args: { 
        where: { userId: string; applicationId: string; isActive?: boolean };
        include?: { role?: boolean }
      }) => {
        for (const grant of this.userApiGrants.values()) {
          if (grant.userId === args.where.userId && 
              grant.applicationId === args.where.applicationId &&
              (args.where.isActive === undefined || grant.isActive === args.where.isActive)) {
            const result: any = { ...grant };
            if (args.include?.role) {
              result.role = this.roles.get(grant.roleId) || null;
            }
            return result;
          }
        }
        return null;
      },
      findUnique: async (args: { where: { userId_applicationId: { userId: string; applicationId: string } } }) => {
        for (const grant of this.userApiGrants.values()) {
          if (grant.userId === args.where.userId_applicationId.userId && 
              grant.applicationId === args.where.userId_applicationId.applicationId) {
            return grant;
          }
        }
        return null;
      },
      create: async (args: { data: Omit<UserApiGrant, 'id' | 'grantedAt' | 'revokedAt'> }) => {
        const grant: UserApiGrant = {
          id: uuidv4(),
          ...args.data,
          grantedAt: new Date(),
          revokedAt: undefined
        };
        this.userApiGrants.set(grant.id, grant);
        return grant;
      },
      update: async (args: { 
        where: { id: string }; 
        data: Partial<Omit<UserApiGrant, 'id' | 'grantedAt'>> 
      }) => {
        const grant = this.userApiGrants.get(args.where.id);
        if (!grant) {
          throw new Error('UserApiGrant not found');
        }
        const updated = {
          ...grant,
          ...args.data
        };
        this.userApiGrants.set(grant.id, updated);
        return updated;
      }
    };
  }

  get webhookSubscription() {
    return {
      findMany: async (args?: { 
        where?: { applicationId?: string };
        include?: { application?: { select?: Record<string, boolean> } }
      }) => {
        let result = Array.from(this.webhookSubscriptions.values());
        
        if (args?.where?.applicationId) {
          result = result.filter(wh => wh.applicationId === args.where?.applicationId);
        }
        
        return result.map(wh => {
          const result: any = { ...wh };
          if (args?.include?.application) {
            result.application = this.applications.get(wh.applicationId) || null;
          }
          return result;
        });
      },
      findUnique: async (args: { 
        where: { id: string };
        include?: { application?: { select?: Record<string, boolean> } }
      }) => {
        const wh = this.webhookSubscriptions.get(args.where.id);
        if (!wh) return null;
        
        const result: any = { ...wh };
        if (args.include?.application) {
          result.application = this.applications.get(wh.applicationId) || null;
        }
        return result;
      },
      create: async (args: { data: Omit<WebhookSubscription, 'id' | 'createdAt' | 'lastTriggeredAt'> }) => {
        const wh: WebhookSubscription = {
          id: uuidv4(),
          ...args.data,
          createdAt: new Date(),
          lastTriggeredAt: undefined
        };
        this.webhookSubscriptions.set(wh.id, wh);
        return wh;
      },
      update: async (args: { 
        where: { id: string }; 
        data: Partial<Omit<WebhookSubscription, 'id' | 'createdAt'>> 
      }) => {
        const wh = this.webhookSubscriptions.get(args.where.id);
        if (!wh) {
          throw new Error('WebhookSubscription not found');
        }
        const updated = {
          ...wh,
          ...args.data
        };
        this.webhookSubscriptions.set(wh.id, updated);
        return updated;
      },
      delete: async (args: { where: { id: string } }) => {
        const wh = this.webhookSubscriptions.get(args.where.id);
        if (!wh) {
          throw new Error('WebhookSubscription not found');
        }
        this.webhookSubscriptions.delete(args.where.id);
        return wh;
      }
    };
  }

  get apiCallLog() {
    return {
      create: async (args: { data: Omit<ApiCallLog, 'id' | 'timestamp'> }) => {
        const log: ApiCallLog = {
          id: uuidv4(),
          ...args.data,
          timestamp: new Date()
        };
        this.apiCallLogs.push(log);
        return log;
      }
    };
  }

  get auditLog() {
    return {
      create: async (args: { data: Omit<AuditLog, 'id' | 'timestamp'> }) => {
        const log: AuditLog = {
          id: uuidv4(),
          ...args.data,
          timestamp: new Date()
        };
        this.auditLogs.push(log);
        return log;
      }
    };
  }

  get notification() {
    return {
      findMany: async (args?: { 
        where?: { developerId?: string; applicationId?: string; eventType?: string };
        skip?: number;
        take?: number;
        orderBy?: Record<string, string>;
      }) => {
        let result = [...this.notifications];
        
        if (args?.where?.developerId) {
          result = result.filter(n => n.developerId === args.where?.developerId);
        }
        if (args?.where?.applicationId) {
          result = result.filter(n => n.applicationId === args.where?.applicationId);
        }
        if (args?.where?.eventType) {
          result = result.filter(n => n.eventType === args.where?.eventType);
        }

        if (args?.orderBy) {
          const [field, order] = Object.entries(args.orderBy)[0];
          result.sort((a, b) => {
            const aVal = a[field as keyof Notification];
            const bVal = b[field as keyof Notification];
            if (aVal instanceof Date && bVal instanceof Date) {
              return order === 'desc' ? bVal.getTime() - aVal.getTime() : aVal.getTime() - bVal.getTime();
            }
            return order === 'desc' ? String(bVal).localeCompare(String(aVal)) : String(aVal).localeCompare(String(bVal));
          });
        }

        const skip = args?.skip || 0;
        const take = args?.take || result.length;
        return result.slice(skip, skip + take);
      },
      count: async (args?: { where?: { developerId?: string; applicationId?: string; eventType?: string } }) => {
        let result = [...this.notifications];
        if (args?.where?.developerId) {
          result = result.filter(n => n.developerId === args.where?.developerId);
        }
        return result.length;
      }
    };
  }

  $transaction = async <T>(fn: (prisma: unknown) => Promise<T>): Promise<T> => {
    return fn(this);
  };

  private enrichApplication(app: Application, include?: unknown): any {
    const result: any = { ...app };
    
    const includeObj = include as Record<string, unknown>;
    if (includeObj?.apiKeys) {
      const apiKeyArgs = includeObj.apiKeys as Record<string, unknown>;
      let keys = Array.from(this.apiKeys.values()).filter(k => k.applicationId === app.id);
      if (apiKeyArgs.where) {
        const where = apiKeyArgs.where as Record<string, boolean>;
        if (where.isActive !== undefined) {
          keys = keys.filter(k => k.isActive === where.isActive);
        }
      }
      if (typeof apiKeyArgs.take === 'number') {
        keys = keys.slice(0, apiKeyArgs.take);
      }
      result.apiKeys = keys;
    }
    
    if (includeObj?.developer) {
      const developer = this.developers.get(app.developerId);
      if (developer) {
        const select = (includeObj.developer as Record<string, Record<string, boolean>>)?.select;
        if (select) {
          result.developer = {};
          for (const [key, value] of Object.entries(select)) {
            if (value && developer[key as keyof Developer] !== undefined) {
              result.developer[key] = developer[key as keyof Developer];
            }
          }
        } else {
          result.developer = developer;
        }
      }
    }
    
    return result;
  }
}

export const memoryDb = new MemoryDatabase();

export type {
  Developer,
  Application,
  ApiKey,
  Role,
  UserApiGrant,
  WebhookSubscription,
  ApiCallLog,
  AuditLog,
  Notification
};
