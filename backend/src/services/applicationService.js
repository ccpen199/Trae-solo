import { db } from '../database/init.js';
import { runFraudCheck, getRecentApplications } from '../engines/antiFraudEngine.js';
import { calculateCreditScore, simulateCreditReport } from '../engines/creditScoringEngine.js';
import { executeRuleTree, getApprovalFlowConfig } from '../engines/ruleTreeEngine.js';
import { createElectronicContract, disburseLoan } from '../engines/collectionBillingEngine.js';

const generateApplicationNo = () => {
  const date = new Date();
  const dateStr = date.getFullYear().toString() + 
                  (date.getMonth() + 1).toString().padStart(2, '0') + 
                  date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LN${dateStr}${random}`;
};

const createApplication = (userId, loanData) => {
  const applicationNo = generateApplicationNo();
  const borrower = db.prepare(`
    SELECT * FROM borrowers WHERE user_id = ?
  `).get(userId);

  if (!borrower) {
    throw new Error('借款人信息不存在');
  }

  const insertResult = db.prepare(`
    INSERT INTO loan_applications 
    (application_no, borrower_id, loan_amount, loan_term, interest_rate, purpose, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    applicationNo,
    borrower.id,
    loanData.loan_amount,
    loanData.loan_term,
    loanData.interest_rate || 0.0065,
    loanData.purpose || '',
    'draft'
  );

  const applicationId = insertResult.lastInsertRowid;

  logAudit(userId, 'create_application', 'loan_applications', applicationId, null, JSON.stringify({
    application_no: applicationNo,
    loan_amount: loanData.loan_amount,
    loan_term: loanData.loan_term
  }));

  return {
    id: applicationId,
    applicationNo,
    status: 'draft'
  };
};

const updateApplication = (applicationId, userId, loanData) => {
  const application = db.prepare(`
    SELECT la.*
    FROM loan_applications la
    JOIN borrowers b ON la.borrower_id = b.id
    WHERE la.id = ? AND b.user_id = ?
  `).get(applicationId, userId);

  if (!application) {
    throw new Error('贷款申请不存在或权限不足');
  }

  if (application.status !== 'draft' && application.status !== 'returned_for_edit') {
    throw new Error('只能修改草稿或退回修改状态的申请');
  }

  const oldData = {
    loan_amount: application.loan_amount,
    loan_term: application.loan_term,
    purpose: application.purpose
  };

  const updateFields = [];
  const updateValues = [];

  if (loanData.loan_amount !== undefined) {
    updateFields.push('loan_amount = ?');
    updateValues.push(parseFloat(loanData.loan_amount));
  }
  if (loanData.loan_term !== undefined) {
    updateFields.push('loan_term = ?');
    updateValues.push(parseInt(loanData.loan_term));
  }
  if (loanData.purpose !== undefined) {
    updateFields.push('purpose = ?');
    updateValues.push(loanData.purpose || '');
  }

  if (updateFields.length === 0) {
    return { applicationId, updated: false };
  }

  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  updateValues.push(applicationId);

  db.prepare(`
    UPDATE loan_applications 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `).run(...updateValues);

  logAudit(userId, 'update_application', 'loan_applications', applicationId, JSON.stringify(oldData), JSON.stringify({
    loan_amount: loanData.loan_amount || oldData.loan_amount,
    loan_term: loanData.loan_term || oldData.loan_term,
    purpose: loanData.purpose || oldData.purpose
  }));

  const updatedApp = getApplicationById(applicationId);

  return {
    applicationId,
    updated: true,
    application: updatedApp
  };
};

const submitApplication = async (applicationId, userId) => {
  const application = db.prepare(`
    SELECT la.*, b.*, u.id as user_id
    FROM loan_applications la
    JOIN borrowers b ON la.borrower_id = b.id
    JOIN users u ON b.user_id = u.id
    WHERE la.id = ?
  `).get(applicationId);

  if (!application) {
    throw new Error('贷款申请不存在');
  }

  if (application.status !== 'draft' && application.status !== 'returned_for_edit') {
    throw new Error('只能提交草稿或退回修改状态的申请');
  }

  db.prepare(`
    UPDATE loan_applications 
    SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(applicationId);

  logAudit(userId, 'submit_application', 'loan_applications', applicationId, 'draft', 'submitted');

  setTimeout(async () => {
    await processFraudCheck(applicationId);
  }, 100);

  return {
    applicationId,
    status: 'submitted',
    message: '申请已提交，正在进行欺诈检测'
  };
};

const processFraudCheck = async (applicationId) => {
  const fullApp = db.prepare(`
    SELECT la.*, b.*
    FROM loan_applications la
    JOIN borrowers b ON la.borrower_id = b.id
    WHERE la.id = ?
  `).get(applicationId);

  const recentApps = getRecentApplications(fullApp.borrower_id, 30);
  const borrower = { id: fullApp.borrower_id, id_card: fullApp.id_card };

  db.prepare(`
    UPDATE loan_applications 
    SET status = 'fraud_checking', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(applicationId);

  const fraudResult = await runFraudCheck(applicationId, borrower, recentApps);

  if (fraudResult.riskLevel === 'critical') {
    db.prepare(`
      UPDATE loan_applications 
      SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(applicationId);
  } else {
    db.prepare(`
      UPDATE loan_applications 
      SET status = 'pending_initial_review', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(applicationId);
  }

  return fraudResult;
};

const assignToManager = (applicationId, managerId, assigneeId) => {
  const application = db.prepare(`
    SELECT * FROM loan_applications WHERE id = ?
  `).get(applicationId);

  if (!application) {
    throw new Error('贷款申请不存在');
  }

  if (application.status !== 'pending_initial_review' && application.status !== 'submitted') {
    throw new Error('申请状态不支持分配');
  }

  db.prepare(`
    UPDATE loan_applications 
    SET manager_id = ?, status = 'manager_processing', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(assigneeId, applicationId);

  logAudit(managerId, 'assign_to_manager', 'loan_applications', applicationId, application.status, 'manager_processing');

  return {
    applicationId,
    managerId: assigneeId,
    status: 'manager_processing'
  };
};

const managerReview = async (applicationId, managerId, action, comment) => {
  const application = db.prepare(`
    SELECT la.*, b.*, cl.total_limit, cl.available_limit, cl.max_single_loan
    FROM loan_applications la
    JOIN borrowers b ON la.borrower_id = b.id
    LEFT JOIN credit_limits cl ON b.id = cl.borrower_id
    WHERE la.id = ?
  `).get(applicationId);

  if (!application) {
    throw new Error('贷款申请不存在');
  }

  if (application.manager_id && application.manager_id !== managerId) {
    throw new Error('您不是该申请的经办人');
  }

  const creditReport = simulateCreditReport(application.id_card, application);

  db.prepare(`
    UPDATE loan_applications 
    SET credit_report_data = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(JSON.stringify(creditReport), applicationId);

  const creditResult = await calculateCreditScore(application, application, JSON.stringify(creditReport));

  const context = {
    application: { ...application, credit_score: creditResult.creditScore },
    borrower: application,
    creditLimits: {
      total_limit: application.total_limit,
      available_limit: application.available_limit,
      max_single_loan: application.max_single_loan
    }
  };

  const ruleResult = await executeRuleTree(context);

  db.prepare(`
    INSERT INTO approval_comments 
    (application_id, user_id, role, action, comment, decision)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(applicationId, managerId, 'manager', 'review', comment, action);

  logAudit(managerId, `manager_${action}`, 'loan_applications', applicationId, application.status, null);

  let nextStatus = application.status;

  if (action === 'reject') {
    db.prepare(`
      UPDATE loan_applications 
      SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(applicationId);
    nextStatus = 'rejected';
  } else if (action === 'return') {
    db.prepare(`
      UPDATE loan_applications 
      SET status = 'returned_for_edit', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(applicationId);
    nextStatus = 'returned_for_edit';
  } else if (action === 'approve' || action === 'escalate') {
    db.prepare(`
      UPDATE loan_applications 
      SET status = 'pending_risk_review', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(applicationId);
    nextStatus = 'pending_risk_review';
  }

  return {
    applicationId,
    action,
    nextStatus,
    creditScore: creditResult.creditScore,
    creditLevel: creditResult.creditLevel,
    ruleResult,
    suggestion: creditResult.suggestion
  };
};

const riskReview = async (applicationId, riskExpertId, action, comment) => {
  const application = db.prepare(`
    SELECT b.*, cl.total_limit, cl.available_limit, cl.max_single_loan, la.*
    FROM loan_applications la
    JOIN borrowers b ON la.borrower_id = b.id
    LEFT JOIN credit_limits cl ON b.id = cl.borrower_id
    WHERE la.id = ?
  `).get(applicationId);

  if (!application) {
    throw new Error('贷款申请不存在');
  }

  db.prepare(`
    INSERT INTO approval_comments 
    (application_id, user_id, role, action, comment, decision)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(applicationId, riskExpertId, 'risk_expert', 'review', comment, action);

  logAudit(riskExpertId, `risk_${action}`, 'loan_applications', applicationId, application.status, null);

  let nextStatus = application.status;

  if (action === 'reject') {
    db.prepare(`
      UPDATE loan_applications 
      SET status = 'rejected', risk_expert_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(riskExpertId, applicationId);
    nextStatus = 'rejected';
  } else if (action === 'return') {
    db.prepare(`
      UPDATE loan_applications 
      SET status = 'manager_processing', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(applicationId);
    nextStatus = 'manager_processing';
  } else if (action === 'approve') {
    const flowConfig = getApprovalFlowConfig(application);

    if (flowConfig.flowType === 'auto') {
      const context = {
        application,
        borrower: application,
        creditLimits: {
          total_limit: application.total_limit,
          available_limit: application.available_limit,
          max_single_loan: application.max_single_loan
        }
      };
      const ruleResult = await executeRuleTree(context);

      if (ruleResult.passed) {
        const contract = createElectronicContract(application);
        db.prepare(`
          UPDATE loan_applications 
          SET status = 'awaiting_confirmation', risk_expert_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(riskExpertId, applicationId);
        nextStatus = 'awaiting_confirmation';
      } else {
        db.prepare(`
          UPDATE loan_applications 
          SET status = 'pending_approval', risk_expert_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(riskExpertId, applicationId);
        nextStatus = 'pending_approval';
      }
    } else if (flowConfig.flowType === 'single_level') {
      const contract = createElectronicContract(application);
      db.prepare(`
        UPDATE loan_applications 
        SET status = 'awaiting_confirmation', risk_expert_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(riskExpertId, applicationId);
      nextStatus = 'awaiting_confirmation';
    } else {
      db.prepare(`
        UPDATE loan_applications 
        SET status = 'pending_approval', risk_expert_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(riskExpertId, applicationId);
      nextStatus = 'pending_approval';
    }
  }

  return {
    applicationId,
    action,
    nextStatus
  };
};

const finalApproval = async (applicationId, directorId, action, comment) => {
  const application = db.prepare(`
    SELECT * FROM loan_applications WHERE id = ?
  `).get(applicationId);

  if (!application) {
    throw new Error('贷款申请不存在');
  }

  db.prepare(`
    INSERT INTO approval_comments 
    (application_id, user_id, role, action, comment, decision)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(applicationId, directorId, 'approval_director', 'final_review', comment, action);

  logAudit(directorId, `director_${action}`, 'loan_applications', applicationId, application.status, null);

  let nextStatus = application.status;

  if (action === 'reject') {
    db.prepare(`
      UPDATE loan_applications 
      SET status = 'rejected', approval_director_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(directorId, applicationId);
    nextStatus = 'rejected';
  } else if (action === 'return') {
    db.prepare(`
      UPDATE loan_applications 
      SET status = 'pending_risk_review', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(applicationId);
    nextStatus = 'pending_risk_review';
  } else if (action === 'approve') {
    const contract = createElectronicContract(application);

    db.prepare(`
      UPDATE loan_applications 
      SET status = 'awaiting_confirmation', approval_director_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(directorId, applicationId);
    nextStatus = 'awaiting_confirmation';
  }

  return {
    applicationId,
    action,
    nextStatus
  };
};

const confirmContract = (applicationId, borrowerUserId) => {
  const application = db.prepare(`
    SELECT la.*, ec.id as contract_id, ec.contract_no
    FROM loan_applications la
    JOIN borrowers b ON la.borrower_id = b.id
    LEFT JOIN electronic_contracts ec ON la.id = ec.application_id
    WHERE la.id = ? AND b.user_id = ?
  `).get(applicationId, borrowerUserId);

  if (!application) {
    throw new Error('贷款申请不存在或权限不足');
  }

  if (application.status !== 'awaiting_confirmation') {
    throw new Error('合同不在确认状态');
  }

  if (application.contract_id) {
    db.prepare(`
      UPDATE electronic_contracts 
      SET borrower_confirmed_at = CURRENT_TIMESTAMP, signed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(application.contract_id);
  }

  const disburseResult = disburseLoan(applicationId);

  logAudit(borrowerUserId, 'confirm_contract', 'loan_applications', applicationId, 'awaiting_confirmation', 'active');

  return {
    ...disburseResult,
    contractNo: application.contract_no,
    confirmed: true
  };
};

const getApplicationById = (applicationId) => {
  return db.prepare(`
    SELECT la.*, 
           u_b.name as borrower_name,
           u_m.name as manager_name,
           u_r.name as risk_expert_name,
           u_d.name as approval_director_name
    FROM loan_applications la
    JOIN borrowers b ON la.borrower_id = b.id
    JOIN users u_b ON b.user_id = u_b.id
    LEFT JOIN users u_m ON la.manager_id = u_m.id
    LEFT JOIN users u_r ON la.risk_expert_id = u_r.id
    LEFT JOIN users u_d ON la.approval_director_id = u_d.id
    WHERE la.id = ?
  `).get(applicationId);
};

const getApplicationsByBorrower = (borrowerUserId) => {
  return db.prepare(`
    SELECT la.*, 
           u_m.name as manager_name
    FROM loan_applications la
    JOIN borrowers b ON la.borrower_id = b.id
    LEFT JOIN users u_m ON la.manager_id = u_m.id
    WHERE b.user_id = ?
    ORDER BY la.created_at DESC
  `).all(borrowerUserId);
};

const getApplicationsForManager = (managerId, status = null) => {
  let query = `
    SELECT la.*, 
           u_b.name as borrower_name,
           b.id_card as borrower_id_card
    FROM loan_applications la
    JOIN borrowers b ON la.borrower_id = b.id
    JOIN users u_b ON b.user_id = u_b.id
    WHERE la.status IN ('pending_initial_review', 'manager_processing', 'submitted')
  `;
  let params = [];

  if (status) {
    query += ' AND la.status = ?';
    params.push(status);
  } else {
    query += ' OR la.manager_id = ?';
    params.push(managerId);
  }

  query += ' ORDER BY la.created_at DESC';

  return db.prepare(query).all(...params);
};

const getApplicationsForRisk = () => {
  return db.prepare(`
    SELECT la.*, 
           u_b.name as borrower_name,
           u_m.name as manager_name,
           la.credit_score,
           la.fraud_risk_level
    FROM loan_applications la
    JOIN borrowers b ON la.borrower_id = b.id
    JOIN users u_b ON b.user_id = u_b.id
    LEFT JOIN users u_m ON la.manager_id = u_m.id
    WHERE la.status = 'pending_risk_review'
    ORDER BY la.created_at DESC
  `).all();
};

const getApplicationsForApproval = () => {
  return db.prepare(`
    SELECT la.*, 
           u_b.name as borrower_name,
           u_m.name as manager_name,
           u_r.name as risk_expert_name
    FROM loan_applications la
    JOIN borrowers b ON la.borrower_id = b.id
    JOIN users u_b ON b.user_id = u_b.id
    LEFT JOIN users u_m ON la.manager_id = u_m.id
    LEFT JOIN users u_r ON la.risk_expert_id = u_r.id
    ORDER BY la.created_at DESC
  `).all();
};

const logAudit = (userId, action, targetType, targetId, beforeState, afterState) => {
  if (!userId) return;

  const user = db.prepare('SELECT username, role FROM users WHERE id = ?').get(userId);
  
  db.prepare(`
    INSERT INTO audit_logs 
    (user_id, username, role, action, target_type, target_id, before_state, after_state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    user?.username,
    user?.role,
    action,
    targetType,
    targetId,
    beforeState ? JSON.stringify(beforeState) : null,
    afterState ? JSON.stringify(afterState) : null
  );
};

const getAuditLogs = (filters = {}) => {
  let query = `SELECT * FROM audit_logs WHERE 1=1`;
  const params = [];

  if (filters.userId) {
    query += ' AND user_id = ?';
    params.push(filters.userId);
  }
  if (filters.action) {
    query += ' AND action LIKE ?';
    params.push(`%${filters.action}%`);
  }
  if (filters.startDate) {
    query += ' AND created_at >= ?';
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ' AND created_at <= ?';
    params.push(filters.endDate + ' 23:59:59');
  }

  query += ' ORDER BY created_at DESC LIMIT 500';

  return db.prepare(query).all(...params);
};

const getDashboardStats = (role, userId) => {
  const stats = {};

  if (role === 'borrower') {
    const borrower = db.prepare('SELECT id FROM borrowers WHERE user_id = ?').get(userId);
    
    stats.totalApplications = db.prepare(`
      SELECT COUNT(*) as cnt FROM loan_applications WHERE borrower_id = ?
    `).get(borrower?.id || 0).cnt;

    stats.activeLoans = db.prepare(`
      SELECT COUNT(*) as cnt FROM loan_applications 
      WHERE borrower_id = ? AND status IN ('active', 'overdue')
    `).get(borrower?.id || 0).cnt;

    stats.completedLoans = db.prepare(`
      SELECT COUNT(*) as cnt FROM loan_applications 
      WHERE borrower_id = ? AND status = 'repaid'
    `).get(borrower?.id || 0).cnt;
  } else if (role === 'manager') {
    stats.pendingAssignment = db.prepare(`
      SELECT COUNT(*) as cnt FROM loan_applications 
      WHERE status = 'pending_initial_review'
    `).get().cnt;

    stats.assignedToMe = db.prepare(`
      SELECT COUNT(*) as cnt FROM loan_applications 
      WHERE manager_id = ? AND status = 'manager_processing'
    `).get(userId).cnt;
  } else if (role === 'risk_expert') {
    stats.pendingRisk = db.prepare(`
      SELECT COUNT(*) as cnt FROM loan_applications 
      WHERE status = 'pending_risk_review'
    `).get().cnt;
  } else if (role === 'approval_director') {
    stats.pendingApproval = db.prepare(`
      SELECT COUNT(*) as cnt FROM loan_applications 
      WHERE status = 'pending_approval'
    `).get().cnt;
  }

  stats.todayApplications = db.prepare(`
    SELECT COUNT(*) as cnt FROM loan_applications 
    WHERE date(created_at) = date('now')
  `).get().cnt;

  stats.totalApproved = db.prepare(`
    SELECT COUNT(*) as cnt FROM loan_applications 
    WHERE status IN ('active', 'repaid', 'awaiting_confirmation', 'approved')
  `).get().cnt;

  stats.totalRejected = db.prepare(`
    SELECT COUNT(*) as cnt FROM loan_applications 
    WHERE status = 'rejected'
  `).get().cnt;

  return stats;
};

export {
  createApplication,
  updateApplication,
  submitApplication,
  processFraudCheck,
  assignToManager,
  managerReview,
  riskReview,
  finalApproval,
  confirmContract,
  getApplicationById,
  getApplicationsByBorrower,
  getApplicationsForManager,
  getApplicationsForRisk,
  getApplicationsForApproval,
  logAudit,
  getAuditLogs,
  getDashboardStats
};
