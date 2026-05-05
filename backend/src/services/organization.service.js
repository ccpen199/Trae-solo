const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

const OrganizationService = {
  async create({ orgNo, name, parentId, description, sortOrder = 0, status = 1 }) {
    const existingOrg = await prisma.organization.findFirst({
      where: {
        OR: [
          { orgNo },
          { name, parentId: parentId || null }
        ],
        deletedAt: null
      }
    });
    
    if (existingOrg) {
      if (existingOrg.orgNo === orgNo) {
        return { success: false, message: '组织编号已存在' };
      }
      return { success: false, message: '同级组织中名称已存在' };
    }
    
    if (parentId) {
      const parentOrg = await prisma.organization.findUnique({
        where: { id: parentId, deletedAt: null }
      });
      if (!parentOrg) {
        return { success: false, message: '父级组织不存在' };
      }
    }
    
    const org = await prisma.organization.create({
      data: {
        orgNo,
        name,
        parentId,
        description,
        sortOrder,
        status
      }
    });
    
    return { success: true, data: org };
  },
  
  async update(id, { orgNo, name, parentId, description, sortOrder, status }) {
    const existingOrg = await prisma.organization.findUnique({
      where: { id, deletedAt: null }
    });
    
    if (!existingOrg) {
      return { success: false, message: '组织不存在' };
    }
    
    if (orgNo || name) {
      const duplicateCheck = await prisma.organization.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { deletedAt: null },
            {
              OR: [
                orgNo ? { orgNo } : {},
                name ? { name, parentId: parentId !== undefined ? parentId : existingOrg.parentId } : {}
              ]
            }
          ]
        }
      });
      
      if (duplicateCheck) {
        if (duplicateCheck.orgNo === orgNo) {
          return { success: false, message: '组织编号已存在' };
        }
        return { success: false, message: '同级组织中名称已存在' };
      }
    }
    
    if (parentId) {
      if (parentId === id) {
        return { success: false, message: '不能将自己设为父级组织' };
      }
      
      const hasCircle = await this.checkParentCircle(id, parentId);
      if (hasCircle) {
        return { success: false, message: '存在循环引用的父子关系' };
      }
      
      const parentOrg = await prisma.organization.findUnique({
        where: { id: parentId, deletedAt: null }
      });
      if (!parentOrg) {
        return { success: false, message: '父级组织不存在' };
      }
    }
    
    const updateData = {};
    if (orgNo !== undefined) updateData.orgNo = orgNo;
    if (name !== undefined) updateData.name = name;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (description !== undefined) updateData.description = description;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (status !== undefined) updateData.status = status;
    
    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: updateData
    });
    
    return { success: true, data: updatedOrg };
  },
  
  async checkParentCircle(childId, parentId) {
    let currentParent = await prisma.organization.findUnique({
      where: { id: parentId }
    });
    
    while (currentParent) {
      if (currentParent.id === childId) {
        return true;
      }
      if (currentParent.parentId) {
        currentParent = await prisma.organization.findUnique({
          where: { id: currentParent.parentId }
        });
      } else {
        break;
      }
    }
    return false;
  },
  
  async delete(id) {
    const org = await prisma.organization.findUnique({
      where: { id, deletedAt: null }
    });
    
    if (!org) {
      return { success: false, message: '组织不存在' };
    }
    
    const hasChildren = await prisma.organization.findFirst({
      where: { parentId: id, deletedAt: null }
    });
    if (hasChildren) {
      return { success: false, message: '请先删除子组织' };
    }
    
    const hasUsers = await prisma.user.findFirst({
      where: { orgId: id, deletedAt: null }
    });
    if (hasUsers) {
      return { success: false, message: '该组织下还有用户，请先移除' };
    }
    
    await prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    
    return { success: true };
  },
  
  async getById(id) {
    return prisma.organization.findUnique({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        children: { where: { deletedAt: null } },
        users: { where: { deletedAt: null } }
      }
    });
  },
  
  async getList({ page = 1, pageSize = 10, keyword, orgNo, status, parentId }) {
    const skip = (page - 1) * pageSize;
    
    const where = { deletedAt: null };
    
    if (keyword) {
      where.OR = [
        { orgNo: { contains: keyword } },
        { name: { contains: keyword } }
      ];
    }
    if (orgNo) {
      where.orgNo = { contains: orgNo };
    }
    if (status !== undefined && status !== null) {
      where.status = parseInt(status);
    }
    if (parentId !== undefined) {
      where.parentId = parentId || null;
    }
    
    const [total, list] = await Promise.all([
      prisma.organization.count({ where }),
      prisma.organization.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          parent: true,
          _count: {
            select: {
              children: { where: { deletedAt: null } },
              users: { where: { deletedAt: null } }
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      })
    ]);
    
    return {
      list: list.map(org => ({
        ...org,
        childrenCount: org._count.children,
        userCount: org._count.users
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  },
  
  async getTree() {
    const allOrgs = await prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' }
    });
    
    const orgMap = new Map();
    const rootOrgs = [];
    
    allOrgs.forEach(org => {
      orgMap.set(org.id, { ...org, children: [] });
    });
    
    allOrgs.forEach(org => {
      const node = orgMap.get(org.id);
      if (org.parentId && orgMap.has(org.parentId)) {
        const parent = orgMap.get(org.parentId);
        parent.children.push(node);
      } else {
        rootOrgs.push(node);
      }
    });
    
    return rootOrgs;
  },
  
  async getAllEnabled() {
    return prisma.organization.findMany({
      where: { status: 1, deletedAt: null },
      orderBy: { sortOrder: 'asc' }
    });
  }
};

module.exports = OrganizationService;
