import { db } from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';

const generateRepaymentSchedule = (application, startDate = null) => {
  const { id: applicationId, loan_amount, loan_term, interest_rate = 0.0065 } = application;
  const principal = parseFloat(loan_amount);
  const monthlyRate = interest_rate;
  const term = loan_term;

  const schedules = [];
  const baseDate = startDate ? new Date(startDate) : new Date();
  let remainingPrincipal = principal;
  const monthlyPrincipal = principal / term;

  for (let period = 1; period <= term; period++) {
    const dueDate = new Date(baseDate);
    dueDate.setMonth(dueDate.getMonth() + period);
    dueDate.setHours(0, 0, 0, 0);

    const interestPayment = remainingPrincipal * monthlyRate;
    const totalPayment = monthlyPrincipal + interestPayment;

    schedules.push({
      application_id: applicationId,
      period,
      due_date: dueDate.toISOString().split('T')[0],
      principal_amount: parseFloat(monthlyPrincipal.toFixed(2)),
      interest_amount: parseFloat(interestPayment.toFixed(2)),
      total_amount: parseFloat(totalPayment.toFixed(2)),
      status: 'pending'
    });

    remainingPrincipal -= monthlyPrincipal;
  }

  return schedules;
};

const saveRepaymentSchedule = (application, startDate = null) => {
  const schedules = generateRepaymentSchedule(application, startDate);

  const insertStmt = db.prepare(`
    INSERT INTO repayment_schedules 
    (application_id, period, due_date, principal_amount, interest_amount, total_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const schedule of schedules) {
    insertStmt.run(
      schedule.application_id,
      schedule.period,
      schedule.due_date,
      schedule.principal_amount,
      schedule.interest_amount,
      schedule.total_amount,
      schedule.status
    );
  }

  return schedules;
};

const processRepayment = async (scheduleId, amount, paymentMethod = 'auto_deduct') => {
  const schedule = db.prepare(`
    SELECT rs.*, la.borrower_id, la.id as application_id
    FROM repayment_schedules rs
    JOIN loan_applications la ON rs.application_id = la.id
    WHERE rs.id = ?
  `).get(scheduleId);

  if (!schedule) {
    throw new Error('还款计划不存在');
  }

  if (schedule.status === 'paid') {
    throw new Error('该期已还款');
  }

  const transactionNo = `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  db.prepare(`
    INSERT INTO repayment_transactions 
    (schedule_id, application_id, transaction_no, amount, payment_method, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(scheduleId, schedule.application_id, transactionNo, amount, paymentMethod, 'success');

  db.prepare(`
    UPDATE repayment_schedules 
    SET status = ?, paid_at = CURRENT_TIMESTAMP, actual_paid_amount = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run('paid', amount, scheduleId);

  const allPaid = db.prepare(`
    SELECT COUNT(*) as cnt FROM repayment_schedules 
    WHERE application_id = ? AND status != 'paid'
  `).get(schedule.application_id);

  if (allPaid.cnt === 0) {
    db.prepare(`
      UPDATE loan_applications 
      SET status = 'repaid', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(schedule.application_id);

    updateCreditScoreAfterRepayment(schedule.borrower_id);
  }

  return {
    transactionNo,
    amount,
    scheduleId,
    period: schedule.period,
    status: 'success'
  };
};

const updateCreditScoreAfterRepayment = (borrowerId) => {
  const borrower = db.prepare(`
    SELECT credit_score FROM borrowers WHERE id = ?
  `).get(borrowerId);

  if (borrower) {
    const newScore = Math.min(950, borrower.credit_score + 5);
    const newLevel = newScore >= 850 ? 'S' : newScore >= 750 ? 'A' : newScore >= 650 ? 'B' : newScore >= 550 ? 'C' : 'D';

    db.prepare(`
      UPDATE borrowers 
      SET credit_score = ?, credit_level = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newScore, newLevel, borrowerId);
  }
};

const checkOverdue = () => {
  const today = new Date().toISOString().split('T')[0];

  const overdueSchedules = db.prepare(`
    SELECT rs.*, la.id as application_id, la.borrower_id
    FROM repayment_schedules rs
    JOIN loan_applications la ON rs.application_id = la.id
    WHERE rs.due_date < ? 
    AND rs.status = 'pending'
  `).all(today);

  for (const schedule of overdueSchedules) {
    db.prepare(`
      UPDATE repayment_schedules 
      SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(schedule.id);

    db.prepare(`
      UPDATE loan_applications 
      SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status != 'repaid'
    `).run(schedule.application_id);

    triggerCollection(schedule);
  }

  return overdueSchedules.length;
};

const triggerCollection = (schedule) => {
  const overdueDays = Math.floor((new Date() - new Date(schedule.due_date)) / (1000 * 60 * 60 * 24));

  let collectionType = 'sms_reminder';
  if (overdueDays > 7) collectionType = 'phone_collection';
  if (overdueDays > 30) collectionType = 'legal_collection';

  db.prepare(`
    INSERT INTO collection_records 
    (application_id, schedule_id, collection_type, collection_comment, next_follow_up_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    schedule.application_id,
    schedule.id,
    collectionType,
    `逾期第 ${overdueDays} 天，触发${collectionType}`,
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  if (overdueDays > 30) {
    generateLegalFile(schedule.application_id, schedule.borrower_id);
  }
};

const generateLegalFile = (applicationId, borrowerId) => {
  const legalDoc = {
    applicationId,
    borrowerId,
    generatedAt: new Date().toISOString(),
    documentType: 'collection_dossier',
    status: 'pending_legal_action'
  };

  console.log('生成维权卷宗:', legalDoc);
};

const createElectronicContract = (application) => {
  const contractNo = `CT${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  
  const contractContent = `
电子借款合同
合同编号：${contractNo}
签订日期：${new Date().toLocaleDateString()}

一、借款信息
借款金额：人民币 ${application.loan_amount} 元整
借款期限：${application.loan_term} 个月
月利率：${(application.interest_rate * 100).toFixed(2)}%

二、还款方式
按月等额本息（或等额本金）还款
还款日：每月对应借款发放日

三、双方权利义务
1. 借款人应按合同约定按时还款
2. 逾期还款将产生罚息及违约金
3. 借款人同意授权贷款人查询信用信息

四、违约责任
逾期还款按日计收罚息
连续逾期超过3期，贷款人有权宣布贷款提前到期
  `;

  db.prepare(`
    INSERT INTO electronic_contracts 
    (application_id, contract_no, contract_content)
    VALUES (?, ?, ?)
  `).run(application.id, contractNo, contractContent);

  return {
    contractNo,
    contractContent,
    applicationId: application.id
  };
};

const confirmContractByBorrower = (contractId) => {
  return db.prepare(`
    UPDATE electronic_contracts 
    SET borrower_confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(contractId);
};

const disburseLoan = (applicationId) => {
  const application = db.prepare(`
    SELECT la.*, cl.total_limit, cl.available_limit, cl.used_limit
    FROM loan_applications la
    JOIN borrowers b ON la.borrower_id = b.id
    LEFT JOIN credit_limits cl ON b.id = cl.borrower_id
    WHERE la.id = ?
  `).get(applicationId);

  if (!application) {
    throw new Error('贷款申请不存在');
  }

  const loanAmount = parseFloat(application.loan_amount);

  db.prepare(`
    UPDATE loan_applications 
    SET status = 'active', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(applicationId);

  if (application.total_limit) {
    const newUsedLimit = application.used_limit + loanAmount;
    const newAvailableLimit = application.available_limit - loanAmount;

    db.prepare(`
      UPDATE credit_limits 
      SET used_limit = ?, available_limit = ?, updated_at = CURRENT_TIMESTAMP
      WHERE borrower_id = ?
    `).run(newUsedLimit, newAvailableLimit, application.borrower_id);
  }

  saveRepaymentSchedule(application);

  return {
    status: 'disbursed',
    amount: loanAmount,
    applicationId
  };
};

export {
  generateRepaymentSchedule,
  saveRepaymentSchedule,
  processRepayment,
  checkOverdue,
  triggerCollection,
  createElectronicContract,
  confirmContractByBorrower,
  disburseLoan,
  updateCreditScoreAfterRepayment
};
