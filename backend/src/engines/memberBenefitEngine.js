const { get, all, run } = require('../config/database');

class MemberBenefitEngine {
  static getMemberBenefits(memberLevel) {
    return new Promise((resolve, reject) => {
      try {
        const benefits = all(
          'SELECT * FROM member_benefits WHERE member_level = ? AND is_active = 1',
          [memberLevel]
        );
        
        const benefitMap = {};
        benefits.forEach(b => {
          benefitMap[b.benefit_code] = {
            id: b.id,
            name: b.benefit_name,
            value: b.benefit_value,
            level: b.member_level
          };
        });
        
        resolve(benefitMap);
      } catch (err) {
        reject(err);
      }
    });
  }

  static checkBenefitAccess(memberLevel, benefitCode) {
    return new Promise(async (resolve, reject) => {
      try {
        const benefits = await this.getMemberBenefits(memberLevel);
        const benefit = benefits[benefitCode];
        
        if (!benefit) {
          resolve({ hasAccess: false, reason: '权益不存在' });
          return;
        }
        
        resolve({
          hasAccess: true,
          value: benefit.value
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  static getExportLimit(memberLevel) {
    return new Promise(async (resolve, reject) => {
      try {
        const access = await this.checkBenefitAccess(memberLevel, 'EXPORT_LIMIT');
        if (!access.hasAccess) {
          resolve(0);
          return;
        }
        
        if (access.value === 'unlimited') {
          resolve(Infinity);
        } else {
          resolve(parseInt(access.value) || 0);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  static canAccessTemplate(memberLevel, templateCategory) {
    return new Promise(async (resolve, reject) => {
      try {
        const access = await this.checkBenefitAccess(memberLevel, 'TEMPLATE_ACCESS');
        if (!access.hasAccess) {
          resolve(false);
          return;
        }
        
        if (access.value === 'all') {
          resolve(true);
        } else if (access.value === 'basic') {
          resolve(templateCategory === 'basic');
        } else {
          resolve(false);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  static getMemberHierarchy() {
    return [
      { level: 'basic', name: '基础会员', priority: 1 },
      { level: 'premium', name: '高级会员', priority: 2 },
      { level: 'vip', name: 'VIP会员', priority: 3 }
    ];
  }

  static compareMembership(levelA, levelB) {
    const hierarchy = this.getMemberHierarchy();
    const a = hierarchy.find(h => h.level === levelA);
    const b = hierarchy.find(h => h.level === levelB);
    
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    
    return a.priority - b.priority;
  }

  static addBenefit(benefitData) {
    return new Promise((resolve, reject) => {
      try {
        const result = run(
          `INSERT INTO member_benefits 
           (member_level, benefit_code, benefit_name, benefit_value, is_active)
           VALUES (?, ?, ?, ?, ?)`,
          [
            benefitData.memberLevel,
            benefitData.benefitCode,
            benefitData.benefitName,
            benefitData.benefitValue,
            benefitData.isActive !== undefined ? benefitData.isActive : 1
          ]
        );
        
        resolve({
          id: result.lastInsertRowid,
          ...benefitData
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = MemberBenefitEngine;
