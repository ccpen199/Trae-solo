import { prisma } from '../lib/prisma';
import { ApiScope, RoleType } from '@prisma/client';

interface ApiToScopeMapping {
  [key: string]: {
    [method: string]: ApiScope[];
  };
}

const API_SCOPE_MAPPING: ApiToScopeMapping = {
  '/users': {
    GET: [ApiScope.USER_READ],
    POST: [ApiScope.USER_WRITE],
    PUT: [ApiScope.USER_WRITE],
    DELETE: [ApiScope.USER_WRITE]
  },
  '/orders': {
    GET: [ApiScope.ORDER_READ],
    POST: [ApiScope.ORDER_WRITE],
    PUT: [ApiScope.ORDER_WRITE],
    DELETE: [ApiScope.ORDER_WRITE]
  },
  '/products': {
    GET: [ApiScope.PRODUCT_READ],
    POST: [ApiScope.PRODUCT_WRITE],
    PUT: [ApiScope.PRODUCT_WRITE],
    DELETE: [ApiScope.PRODUCT_WRITE]
  },
  '/trades': {
    GET: [ApiScope.TRADE_READ],
    POST: [ApiScope.TRADE_WRITE],
    PUT: [ApiScope.TRADE_WRITE]
  },
  '/logistics': {
    GET: [ApiScope.LOGISTICS_READ],
    POST: [ApiScope.LOGISTICS_WRITE],
    PUT: [ApiScope.LOGISTICS_WRITE]
  },
  '/finance': {
    GET: [ApiScope.FINANCE_READ],
    POST: [ApiScope.FINANCE_WRITE],
    PUT: [ApiScope.FINANCE_WRITE]
  },
  '/messages': {
    GET: [ApiScope.MESSAGE_RECEIVE],
    POST: [ApiScope.MESSAGE_SEND],
    PUT: [ApiScope.MESSAGE_SEND]
  }
};

const ROLE_DEFAULT_SCOPES: Record<RoleType, ApiScope[]> = {
  [RoleType.BUYER]: [
    ApiScope.USER_READ,
    ApiScope.USER_WRITE,
    ApiScope.ORDER_READ,
    ApiScope.PRODUCT_READ
  ],
  [RoleType.SELLER]: [
    ApiScope.USER_READ,
    ApiScope.USER_WRITE,
    ApiScope.ORDER_READ,
    ApiScope.ORDER_WRITE,
    ApiScope.PRODUCT_READ,
    ApiScope.PRODUCT_WRITE,
    ApiScope.TRADE_READ,
    ApiScope.LOGISTICS_READ
  ],
  [RoleType.VIP_SELLER]: [
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
  [RoleType.MERCHANT_ADMIN]: [
    ...Object.values(ApiScope)
  ],
  [RoleType.PLATFORM_ADMIN]: [
    ...Object.values(ApiScope)
  ]
};

const DEVELOPER_DEFAULT_SCOPES: Record<string, ApiScope[]> = {
  REGULAR: [
    ApiScope.USER_READ,
    ApiScope.ORDER_READ,
    ApiScope.PRODUCT_READ
  ],
  ADVANCED: [
    ApiScope.USER_READ,
    ApiScope.USER_WRITE,
    ApiScope.ORDER_READ,
    ApiScope.ORDER_WRITE,
    ApiScope.PRODUCT_READ,
    ApiScope.PRODUCT_WRITE
  ],
  PLATINUM: [
    ApiScope.USER_READ,
    ApiScope.USER_WRITE,
    ApiScope.ORDER_READ,
    ApiScope.ORDER_WRITE,
    ApiScope.PRODUCT_READ,
    ApiScope.PRODUCT_WRITE,
    ApiScope.TRADE_READ,
    ApiScope.TRADE_WRITE,
    ApiScope.LOGISTICS_READ,
    ApiScope.FINANCE_READ
  ],
  CERTIFIED: [
    ...Object.values(ApiScope)
  ]
};

export class PermissionService {
  static getScopesForEndpoint(endpoint: string, method: string): ApiScope[] {
    const basePath = endpoint.split('/').slice(0, 3).join('/') || endpoint;
    
    for (const [pattern, methods] of Object.entries(API_SCOPE_MAPPING)) {
      if (basePath.includes(pattern.replace('/', '')) || endpoint.includes(pattern)) {
        if (methods[method]) {
          return methods[method];
        }
      }
    }
    
    return [];
  }

  static hasRequiredScopes(userScopes: string[], requiredScopes: string[]): boolean {
    if (requiredScopes.length === 0) return true;
    return requiredScopes.every(scope => userScopes.includes(scope));
  }

  static getDefaultScopesForRole(roleType: RoleType): ApiScope[] {
    return ROLE_DEFAULT_SCOPES[roleType] || [];
  }

  static getDefaultScopesForDeveloper(level: string): ApiScope[] {
    return DEVELOPER_DEFAULT_SCOPES[level] || DEVELOPER_DEFAULT_SCOPES.REGULAR;
  }

  static async getUserGrantedScopes(userId: string, applicationId: string): Promise<ApiScope[]> {
    const grant = await prisma.userApiGrant.findFirst({
      where: {
        userId,
        applicationId,
        isActive: true
      },
      include: {
        role: true
      }
    });

    if (!grant) return [];

    return grant.grantedScopes;
  }

  static scopesIntersect(scopes1: string[], scopes2: string[]): boolean {
    return scopes1.some(scope => scopes2.includes(scope));
  }

  static canAccess(
    appScopes: string[],
    userScopes: string[],
    requiredScopes: string[]
  ): { allowed: boolean; missingScopes: string[] } {
    const appHasScopes = this.hasRequiredScopes(appScopes, requiredScopes);
    const userHasScopes = this.hasRequiredScopes(userScopes, requiredScopes);
    
    const missingFromApp = requiredScopes.filter(s => !appScopes.includes(s));
    const missingFromUser = requiredScopes.filter(s => !userScopes.includes(s));
    const allMissing = [...new Set([...missingFromApp, ...missingFromUser])];

    return {
      allowed: appHasScopes && userHasScopes,
      missingScopes: allMissing
    };
  }

  static getAllApiScopes(): ApiScope[] {
    return Object.values(ApiScope);
  }

  static getAllRoleTypes(): RoleType[] {
    return Object.values(RoleType);
  }
}
