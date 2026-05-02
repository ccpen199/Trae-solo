const db = require('../config/database');
const VoucherEngine = require('../engines/voucherEngine');
const SubjectEngine = require('../engines/subjectEngine');
const DifferenceEngine = require('../engines/differenceEngine');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class VoucherService {
  static async createVoucher(voucherData, user) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    
    const validation = VoucherEngine.validateVoucher(voucherData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const detailsValidation = VoucherEngine.validateDetails(voucherData.details);
    if (!detailsValidation.valid) {
      return { success: false, error: detailsValidation.errors.join('; ') };
    }

    const voucherNo = VoucherEngine.generateVoucherNo(voucherData.period, voucherData.voucher_type);
    const voucherId = uuidv4();

    const totalDebit = voucherData.details.reduce((sum, d) => sum + (d.debit_amount || 0), 0);
    const totalCredit = voucherData.details.reduce((sum, d) => sum + (d.credit_amount || 0), 0);

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `INSERT INTO vouchers (
            id, voucher_no, voucher_type, voucher_date, period, status,
            creator_id, creator_name, responsible_id, responsible_name,
            expected_completion_time, total_debit, total_credit, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            voucherId, voucherNo, voucherData.voucher_type, voucherData.voucher_date,
            voucherData.period, VoucherEngine.VOUCHER_STATUSES.DRAFT,
            user.id, user.name,
            voucherData.responsible_id, voucherData.responsible_name,
            voucherData.expected_completion_time,
            totalDebit, totalCredit, now, now
          ],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return resolve({ success: false, error: err.message });
            }

            const detailStmt = db.prepare(
              `INSERT INTO voucher_details (
                id, voucher_id, subject_id, subject_code, subject_name,
                debit_amount, credit_amount, summary, sort_order, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            );

            voucherData.details.forEach((detail, index) => {
              detailStmt.run(
                uuidv4(), voucherId, detail.subject_id, detail.subject_code, detail.subject_name,
                detail.debit_amount || 0, detail.credit_amount || 0, detail.summary,
                index + 1, now, now
              );
            });

            detailStmt.finalize((detailErr) => {
              if (detailErr) {
                db.run('ROLLBACK');
                return resolve({ success: false, error: detailErr.message });
              }

              this.logOperation(
                voucherId, user, 'create_voucher',
                null, JSON.stringify({ voucherNo, voucherData }), 'backend'
              );

              this.createMessage(
                user.id, user.name, '待办',
                `您创建的凭证 ${voucherNo} 已保存为草稿`,
                voucherId
              );

              db.run('COMMIT');
              resolve({ 
                success: true, 
                voucher: {
                  id: voucherId,
                  voucher_no: voucherNo,
                  status: VoucherEngine.VOUCHER_STATUSES.DRAFT
                }
              });
            });
          }
        );
      });
    });
  }

  static async updateVoucher(voucherId, voucherData, user) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const existingVoucher = await this.getVoucherById(voucherId);
    if (!existingVoucher) {
      return { success: false, error: '凭证不存在' };
    }

    if (!VoucherEngine.canEdit(existingVoucher.status)) {
      return { success: false, error: '当前状态不可编辑' };
    }

    if (voucherData.details) {
      const validation = VoucherEngine.validateVoucher({
        ...voucherData,
        details: voucherData.details
      });
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const detailsValidation = VoucherEngine.validateDetails(voucherData.details);
      if (!detailsValidation.valid) {
        return { success: false, error: detailsValidation.errors.join('; ') };
      }
    }

    const totalDebit = voucherData.details 
      ? voucherData.details.reduce((sum, d) => sum + (d.debit_amount || 0), 0)
      : existingVoucher.total_debit;
    const totalCredit = voucherData.details
      ? voucherData.details.reduce((sum, d) => sum + (d.credit_amount || 0), 0)
      : existingVoucher.total_credit;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const updateFields = [];
        const updateValues = [];

        if (voucherData.voucher_type) {
          updateFields.push('voucher_type = ?');
          updateValues.push(voucherData.voucher_type);
        }
        if (voucherData.voucher_date) {
          updateFields.push('voucher_date = ?');
          updateValues.push(voucherData.voucher_date);
        }
        if (voucherData.period) {
          updateFields.push('period = ?');
          updateValues.push(voucherData.period);
        }
        if (voucherData.responsible_id !== undefined) {
          updateFields.push('responsible_id = ?');
          updateValues.push(voucherData.responsible_id);
        }
        if (voucherData.responsible_name !== undefined) {
          updateFields.push('responsible_name = ?');
          updateValues.push(voucherData.responsible_name);
        }
        if (voucherData.expected_completion_time !== undefined) {
          updateFields.push('expected_completion_time = ?');
          updateValues.push(voucherData.expected_completion_time);
        }

        updateFields.push('total_debit = ?');
        updateValues.push(totalDebit);
        updateFields.push('total_credit = ?');
        updateValues.push(totalCredit);
        updateFields.push('updated_at = ?');
        updateValues.push(now);
        updateValues.push(voucherId);

        db.run(
          `UPDATE vouchers SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues,
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return resolve({ success: false, error: err.message });
            }

            if (voucherData.details) {
              db.run('DELETE FROM voucher_details WHERE voucher_id = ?', [voucherId], (delErr) => {
                if (delErr) {
                  db.run('ROLLBACK');
                  return resolve({ success: false, error: delErr.message });
                }

                const detailStmt = db.prepare(
                  `INSERT INTO voucher_details (
                    id, voucher_id, subject_id, subject_code, subject_name,
                    debit_amount, credit_amount, summary, sort_order, created_at, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                );

                voucherData.details.forEach((detail, index) => {
                  detailStmt.run(
                    uuidv4(), voucherId, detail.subject_id, detail.subject_code, detail.subject_name,
                    detail.debit_amount || 0, detail.credit_amount || 0, detail.summary,
                    index + 1, now, now
                  );
                });

                detailStmt.finalize((detailErr) => {
                  if (detailErr) {
                    db.run('ROLLBACK');
                    return resolve({ success: false, error: detailErr.message });
                  }
                  this.logOperation(
                    voucherId, user, 'update_voucher',
                    JSON.stringify(existingVoucher), JSON.stringify(voucherData), 'backend'
                  );
                  db.run('COMMIT');
                  resolve({ success: true, voucherId });
                });
              });
            } else {
              this.logOperation(
                voucherId, user, 'update_voucher',
                JSON.stringify(existingVoucher), JSON.stringify(voucherData), 'backend'
              );
              db.run('COMMIT');
              resolve({ success: true, voucherId });
            }
          }
        );
      });
    });
  }

  static async submitVoucher(voucherId, user) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const existingVoucher = await this.getVoucherById(voucherId);
    if (!existingVoucher) {
      return { success: false, error: '凭证不存在' };
    }

    if (!VoucherEngine.canSubmit(existingVoucher.status)) {
      return { success: false, error: '当前状态不可提交' };
    }

    const balanceCheck = await DifferenceEngine.checkVoucherBalance(voucherId);
    if (!balanceCheck.balanced) {
      await DifferenceEngine.createAmountDifference(
        voucherId, balanceCheck.debit, balanceCheck.credit,
        '提交时借贷不平'
      );
      return { success: false, error: '借贷不平，已创建差异记录' };
    }

    const nextStatus = VoucherEngine.getNextStatus(existingVoucher.status, 'submit');
    if (!nextStatus) {
      return { success: false, error: '状态流转错误' };
    }

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `UPDATE vouchers SET status = ?, updated_at = ? WHERE id = ?`,
          [nextStatus, now, voucherId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return resolve({ success: false, error: err.message });
            }

            this.logStatusFlow(
              voucherId, existingVoucher.status, nextStatus,
              user, 'submit', '提交审核', 'backend'
            );

            this.logOperation(
              voucherId, user, 'submit_voucher',
              JSON.stringify({ status: existingVoucher.status }),
              JSON.stringify({ status: nextStatus }),
              'backend'
            );

            this.createMessage(
              null, '审计员', '待办',
              `凭证 ${existingVoucher.voucher_no} 已提交审核，请处理`,
              voucherId
            );

            db.run('COMMIT');
            resolve({ 
              success: true, 
              voucher: { id: voucherId, status: nextStatus }
            });
          }
        );
      });
    });
  }

  static async cancelVoucher(voucherId, user, reason) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const existingVoucher = await this.getVoucherById(voucherId);
    if (!existingVoucher) {
      return { success: false, error: '凭证不存在' };
    }

    if (!VoucherEngine.canCancel(existingVoucher.status)) {
      return { success: false, error: '当前状态不可取消' };
    }

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `UPDATE vouchers SET status = ?, updated_at = ? WHERE id = ?`,
          [VoucherEngine.VOUCHER_STATUSES.CANCELLED, now, voucherId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return resolve({ success: false, error: err.message });
            }

            this.logStatusFlow(
              voucherId, existingVoucher.status, VoucherEngine.VOUCHER_STATUSES.CANCELLED,
              user, 'cancel', reason || '取消凭证', 'backend'
            );

            this.logOperation(
              voucherId, user, 'cancel_voucher',
              JSON.stringify({ status: existingVoucher.status }),
              JSON.stringify({ status: VoucherEngine.VOUCHER_STATUSES.CANCELLED, reason }),
              'backend'
            );

            db.run('COMMIT');
            resolve({ 
              success: true, 
              voucher: { id: voucherId, status: VoucherEngine.VOUCHER_STATUSES.CANCELLED }
            });
          }
        );
      });
    });
  }

  static async deleteVoucher(voucherId, user) {
    const existingVoucher = await this.getVoucherById(voucherId);
    if (!existingVoucher) {
      return { success: false, error: '凭证不存在' };
    }

    if (existingVoucher.status !== VoucherEngine.VOUCHER_STATUSES.DRAFT) {
      return { success: false, error: '只能删除草稿状态的凭证' };
    }

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run('DELETE FROM voucher_details WHERE voucher_id = ?', [voucherId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return resolve({ success: false, error: err.message });
          }

          db.run('DELETE FROM vouchers WHERE id = ?', [voucherId], (delErr) => {
            if (delErr) {
              db.run('ROLLBACK');
              return resolve({ success: false, error: delErr.message });
            }

            this.logOperation(
              voucherId, user, 'delete_voucher',
              JSON.stringify(existingVoucher), null, 'backend'
            );

            db.run('COMMIT');
            resolve({ success: true, voucherId });
          });
        });
      });
    });
  }

  static async getVoucherById(voucherId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM vouchers WHERE id = ?', [voucherId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async getVoucherWithDetails(voucherId) {
    const voucher = await this.getVoucherById(voucherId);
    if (!voucher) return null;

    const details = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM voucher_details WHERE voucher_id = ? ORDER BY sort_order',
        [voucherId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const statusFlows = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM status_flows WHERE voucher_id = ? ORDER BY created_at ASC',
        [voucherId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    return {
      ...voucher,
      details,
      statusFlows,
      statusLabel: VoucherEngine.getStatusLabel(voucher.status)
    };
  }

  static async getVoucherList(filters = {}) {
    let query = `SELECT v.*, 
      (SELECT COUNT(*) FROM voucher_details WHERE voucher_id = v.id) as detail_count
      FROM vouchers v WHERE 1=1`;
    const params = [];

    if (filters.status) {
      query += ' AND v.status = ?';
      params.push(filters.status);
    }
    if (filters.period) {
      query += ' AND v.period = ?';
      params.push(filters.period);
    }
    if (filters.voucher_type) {
      query += ' AND v.voucher_type = ?';
      params.push(filters.voucher_type);
    }
    if (filters.keyword) {
      query += ' AND (v.voucher_no LIKE ? OR v.creator_name LIKE ?)';
      params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
    }

    query += ' ORDER BY v.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }
    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          statusLabel: VoucherEngine.getStatusLabel(row.status)
        })));
      });
    });
  }

  static logOperation(voucherId, user, operation, beforeValue, afterValue, source) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    db.run(
      `INSERT INTO operation_logs (
        id, voucher_id, operator_id, operator_name, operation,
        before_value, after_value, source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(), voucherId, user.id, user.name, operation,
        beforeValue, afterValue, source, now
      ]
    );
  }

  static logStatusFlow(voucherId, fromStatus, toStatus, user, operation, comment, source) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    db.run(
      `INSERT INTO status_flows (
        id, voucher_id, from_status, to_status, operator_id, operator_name,
        operation, comment, source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(), voucherId, fromStatus, toStatus, user.id, user.name,
        operation, comment, source, now
      ]
    );
  }

  static createMessage(recipientId, recipientName, messageType, title, voucherId) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    db.run(
      `INSERT INTO messages (
        id, voucher_id, recipient_id, recipient_name, message_type,
        title, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(), voucherId, recipientId || '', recipientName, messageType,
        title, now
      ]
    );
  }

  static async getPendingCount(role) {
    let statuses = [];
    
    switch (role) {
      case 'accountant':
        statuses = [
          VoucherEngine.VOUCHER_STATUSES.DRAFT,
          VoucherEngine.VOUCHER_STATUSES.REVIEW_REJECTED,
          VoucherEngine.VOUCHER_STATUSES.PENDING_LEDGER
        ];
        break;
      case 'auditor':
        statuses = [
          VoucherEngine.VOUCHER_STATUSES.PENDING_REVIEW,
          VoucherEngine.VOUCHER_STATUSES.PENDING_REPORT
        ];
        break;
      case 'cashier':
        statuses = [VoucherEngine.VOUCHER_STATUSES.PENDING_LEDGER];
        break;
      case 'boss':
        statuses = [VoucherEngine.VOUCHER_STATUSES.PENDING_CLOSURE];
        break;
      default:
        return 0;
    }

    return new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count FROM vouchers WHERE status IN (${statuses.map(() => '?').join(',')})`,
        statuses,
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });
  }
}

module.exports = VoucherService;
