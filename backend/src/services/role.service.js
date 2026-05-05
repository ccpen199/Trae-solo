const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

const RoleService = {
  async create({ name, code, description, parentId, sortOrder = 0, status = 1, permissionIds, resourceIds, operationIds }) {
    const existingRole = await prisma.role.findFirst({
      where: { code, deletedAt: null }
    });
    
    if (existingRole) {
      return { success: false, message: '角色编码已存在' };
    }
    
    if (parentId) {
      const parentRole = await prisma.role.findUnique({
        where: { id: parentId, deletedAt: null }
      });
      if (!parentRole) {
        return { success: false, message: '父级角色不存在' };
      }
    }
    
    const role = await prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: {
          name,
          code,
          description,
          parentId,
          sortOrder,
          status
        }
      });
      
      if (permissionIds && permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(pid => ({
            roleId: newRole.id,
            permissionId: pid
          })),
          skipDuplicates: true
        });
      }
      
      if (resourceIds && resourceIds.length > 0) {
        await tx.roleResource.createMany({
          data: resourceIds.map(rid => ({
            roleId: newRole.id,
            resourceId: rid
          })),
          skipDuplicates: true
        });
      }
      
      if (operationIds && operationIds.length > 0) {
        await tx.roleOperation.createMany({
          data: operationIds.map(oid => ({
            roleId: newRole.id,
            operationId: oid
          })),
          skipDuplicates: true
        });
      }
      
      return newRole;
    });
    
    return { success: true, data: role };
  },
  
  async update(id, { name, code, description, parentId, sortOrder, status, permissionIds, resourceIds, operationIds }) {
    const existingRole = await prisma.role.findUnique({
      where: { id, deletedAt: null }
    });
    
    if (!existingRole) {
      return { success: false, message: '角色不存在' };
    }
    
    if (code) {
      const duplicateCheck = await prisma.role.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { code },
            { deletedAt: null }
          ]
        }
      });
      if (duplicateCheck) {
        return { success: false, message: '角色编码已存在' };
      }
    }
    
    if (parentId) {
      if (parentId === id) {
        return { success: false, message: '不能将自己设为父级角色' };
      }
      
      const hasCircle = await this.checkParentCircle(id, parentId);
      if (hasCircle) {
        return { success: false, message: '存在循环引用的父子关系' };
      }
      
      const parentRole = await prisma.role.findUnique({
        where: { id: parentId, deletedAt: null }
      });
      if (!parentRole) {
        return { success: false, message: '父级角色不存在' };
      }
      
      if (permissionIds || resourceIds || operationIds) {
        const parentAuth = await this.getRoleAuthorizations(parentId);
        const currentAuth = await this.getRoleAuthorizations(id);
        
        if (permissionIds) {
          const newPerms = new Set(permissionIds);
          const parentPerms = new Set(parentAuth.permissions.map(p => p.id));
          for (const pid of newPerms) {
            if (!parentPerms.has(pid)) {
              return { success: false, message: '下级角色权限不能超过上级角色' };
            }
          }
        }
        
        if (resourceIds) {
          const newResources = new Set(resourceIds);
          const parentResources = new Set(parentAuth.resources.map(r => r.id));
          for (const rid of newResources) {
            if (!parentResources.has(rid)) {
              return { success: false, message: '下级角色资源权限不能超过上级角色' };
            }
          }
        }
        
        if (operationIds) {
          const newOperations = new Set(operationIds);
          const parentOperations = new Set(parentAuth.operations.map(o => o.id));
          for (const oid of newOperations) {
            if (!parentOperations.has(oid)) {
              return { success: false, message: '下级角色操作权限不能超过上级角色' };
            }
          }
        }
      }
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (status !== undefined) updateData.status = status;
    
    const updatedRole = await prisma.$transaction(async (tx) => {
      const role = await tx.role.update({
        where: { id },
        data: updateData
      });
      
      if (permissionIds !== undefined) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map(pid => ({ roleId: id, permissionId: pid })),
            skipDuplicates: true
          });
        }
      }
      
      if (resourceIds !== undefined) {
        await tx.roleResource.deleteMany({ where: { roleId: id } });
        if (resourceIds.length > 0) {
          await tx.roleResource.createMany({
            data: resourceIds.map(rid => ({ roleId: id, resourceId: rid })),
            skipDuplicates: true
          });
        }
      }
      
      if (operationIds !== undefined) {
        await tx.roleOperation.deleteMany({ where: { roleId: id } });
        if (operationIds.length > 0) {
          await tx.roleOperation.createMany({
            data: operationIds.map(oid => ({ roleId: id, operationId: oid })),
            skipDuplicates: true
          });
        }
      }
      
      return role;
    });
    
    return { success: true, data: updatedRole };
  },
  
  async checkParentCircle(childId, parentId) {
    let currentParent = await prisma.role.findUnique({
      where: { id: parentId }
    });
    
    while (currentParent) {
      if (currentParent.id === childId) {
        return true;
      }
      if (currentParent.parentId) {
        currentParent = await prisma.role.findUnique({
          where: { id: currentParent.parentId }
        });
      } else {
        break;
      }
    }
    return false;
  },
  
  async getRoleAuthorizations(roleId) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePerms: { include: { permission: true } },
        roleResources: { include: { resource: true } },
        roleOperations: { include: { operation: true } }
      }
    });
    
    if (!role) {
      return { permissions: [], resources: [], operations: [] };
    }
    
    return {
      permissions: role.rolePerms.map(rp => rp.permission).filter(p => p.status === 1),
      resources: role.roleResources.map(rr => rr.resource).filter(r => r.status === 1),
      operations: role.roleOperations.map(ro => ro.operation).filter(o => o.status === 1)
    };
  },
  
  async delete(id) {
    const role = await prisma.role.findUnique({
      where: { id, deletedAt: null }
    });
    
    if (!role) {
      return { success: false, message: '角色不存在' };
    }
    
    const hasChildren = await prisma.role.findFirst({
      where: { parentId: id, deletedAt: null }
    });
    if (hasChildren) {
      return { success: false, message: '请先删除子角色' };
    }
    
    const hasUsers = await prisma.userRole.findFirst({
      where: { roleId: id }
    });
    if (hasUsers) {
      return { success: false, message: '该角色下还有用户，请先移除' };
    }
    
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.roleResource.deleteMany({ where: { roleId: id } }),
      prisma.roleOperation.deleteMany({ where: { roleId: id } }),
      prisma.role.update({
        where: { id },
        data: { deletedAt: new Date() }
      })
    ]);
    
    return { success: true };
  },
  
  async getById(id) {
    return prisma.role.findUnique({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        children: { where: { deletedAt: null } },
        rolePerms: { include: { permission: true } },
        roleResources: { include: { resource: true } },
        roleOperations: { include: { operation: true } }
      }
    });
  },
  
  async getList({ page = 1, pageSize = 10, keyword, status, parentId }) {
    const skip = (page - 1) * pageSize;
    
    const where = { deletedAt: null };
    
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } }
      ];
    }
    if (status !== undefined && status !== null) {
      where.status = parseInt(status);
    }
    if (parentId !== undefined) {
      where.parentId = parentId || null;
    }
    
    const [total, list] = await Promise.all([
      prisma.role.count({ where }),
      prisma.role.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          parent: true,
          _count: {
            select: {
              children: { where: { deletedAt: null } },
              userRoles: true
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      })
    ]);
    
    return {
      list: list.map(role => ({
        ...role,
        childrenCount: role._count.children,
        userCount: role._count.userRoles
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  },
  
  async getTree() {
    const allRoles = await prisma.role.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' }
    });
    
    const roleMap = new Map();
    const rootRoles = [];
    
    allRoles.forEach(role => {
      roleMap.set(role.id, { ...role, children: [] });
    });
    
    allRoles.forEach(role => {
      const node = roleMap.get(role.id);
      if (role.parentId && roleMap.has(role.parentId)) {
        const parent = roleMap.get(role.parentId);
        parent.children.push(node);
      } else {
        rootRoles.push(node);
      }
    });
    
    return rootRoles;
  },
  
  async getAllEnabled() {
    return prisma.role.findMany({
      where: { status: 1, deletedAt: null },
      orderBy: { sortOrder: 'asc' }
    });
  }
};

module.exports = RoleService;
