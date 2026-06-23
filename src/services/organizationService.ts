import { Organization, Employee, OrgSyncRecord } from '@/types/organization';
import { mockOrgTree, mockEmployees, mockSyncRecords } from '@/data/mockOrganization';

export const organizationService = {
  async getOrgTree(): Promise<Organization[]> {
    console.log('[OrgService] Get org tree');
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockOrgTree;
  },

  async getOrgDetail(orgId: string): Promise<Organization> {
    console.log('[OrgService] Get org detail:', orgId);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    function findOrg(list: Organization[], id: string): Organization | null {
      for (const org of list) {
        if (org.id === id) return org;
        if (org.children) {
          const found = findOrg(org.children, id);
          if (found) return found;
        }
      }
      return null;
    }
    
    const org = findOrg(mockOrgTree, orgId);
    if (!org) throw new Error('组织不存在');
    return org;
  },

  async getOrgEmployees(orgId: string, page: number = 1, pageSize: number = 20): Promise<{ list: Employee[]; total: number }> {
    console.log('[OrgService] Get org employees:', orgId, page, pageSize);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const deptEmployees = mockEmployees.filter(e => e.departmentId === orgId);
    return {
      list: deptEmployees.slice((page - 1) * pageSize, page * pageSize),
      total: deptEmployees.length
    };
  },

  async searchEmployees(keyword: string): Promise<Employee[]> {
    console.log('[OrgService] Search employees:', keyword);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const lowerKeyword = keyword.toLowerCase();
    return mockEmployees.filter(e => 
      e.name.toLowerCase().includes(lowerKeyword) ||
      e.position.toLowerCase().includes(lowerKeyword) ||
      e.departmentName.toLowerCase().includes(lowerKeyword) ||
      e.workNo.toLowerCase().includes(lowerKeyword)
    );
  },

  async getEmployeeDetail(employeeId: string): Promise<Employee> {
    console.log('[OrgService] Get employee detail:', employeeId);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const employee = mockEmployees.find(e => e.id === employeeId);
    if (!employee) throw new Error('员工不存在');
    return employee;
  },

  async getSyncRecords(page: number = 1, pageSize: number = 10): Promise<{ list: OrgSyncRecord[]; total: number }> {
    console.log('[OrgService] Get sync records');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      list: mockSyncRecords.slice((page - 1) * pageSize, page * pageSize),
      total: mockSyncRecords.length
    };
  },

  async triggerSync(syncType: 'full' | 'incremental'): Promise<void> {
    console.log('[OrgService] Trigger sync:', syncType);
    await new Promise(resolve => setTimeout(resolve, 1000));
  },

  async getOrgStats(): Promise<{ totalOrgs: number; totalEmployees: number; syncStatus: string }> {
    console.log('[OrgService] Get org stats');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let totalOrgs = 0;
    function countOrgs(list: Organization[]) {
      list.forEach(org => {
        totalOrgs++;
        if (org.children) countOrgs(org.children);
      });
    }
    countOrgs(mockOrgTree);
    
    return {
      totalOrgs,
      totalEmployees: mockEmployees.length,
      syncStatus: 'synced'
    };
  },

  async getOrganizationTree(): Promise<Organization[]> {
    return this.getOrgTree();
  },

  async getEmployeeList(orgId: string, page: number = 1, pageSize: number = 20): Promise<{ list: Employee[]; total: number }> {
    return this.getOrgEmployees(orgId, page, pageSize);
  },

  async syncFromHR(syncType: 'full' | 'incremental' = 'full'): Promise<void> {
    return this.triggerSync(syncType);
  }
};

export default organizationService;
