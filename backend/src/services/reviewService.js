const db = require('../config/database');
const VoucherEngine = require('../engines/voucherEngine');
const VoucherService = require('./voucherService');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class ReviewService {
  static async lockVoucher(voucherId, user) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const existingVoucher = await VoucherService.getVoucherById(voucherId);
    if (!existingVoucher) {
      return { success: false, error: '凭证不存在' };
    }

    if (!VoucherEngine.canReview(existingVoucher.status)) {
      return { success: false, error: '当前状态不可审核' };
    }

    if (existingVoucher.is_locked) {
      return { success: false, error: '凭证已被其他用户锁定' };
    }

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE vouchers SET is_locked = 1, locked_by = ?, locked_at = ?, updated_at = ? WHERE id = ?`,
        [user.id, now, now, voucherId],
        (err) => {
          if (err) {
            return resolve({ success: false, error: err.message });
          }

          const nextStatus = VoucherEngine.getNextStatus(existingVoucher.status, 'review');
          if (nextStatus) {
            db.run(
              `UPDATE vouchers SET status = ? WHERE id = ?`,
              [nextStatus, voucherId]
            );
            VoucherService.logStatusFlow(
              voucherId, existingVoucher.status, nextStatus,
              user, 'lock', '锁定凭证开始审核', 'backend'
            );
          }

          VoucherService.logOperation(
            voucherId, user, 'lock_voucher',
            JSON.stringify({ is_locked: false }),
            JSON.stringify({ is_locked: true, locked_by: user.id }),
            'backend'
          );

          resolve({ success: true, voucherId, lockedBy: user.name });
        }
      );
    });
  }

  static async unlockVoucher(voucherId, user) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const existingVoucher = await VoucherService.getVoucherById(voucherId);
    if (!existingVoucher) {
      return { success: false, error: '凭证不存在' };
    }

    if (!existingVoucher.is_locked) {
      return { success: false, error: '凭证未被锁定' };
    }

    if (existingVoucher.locked_by !== user.id) {
      return { success: false, error: '只能解锁自己锁定的凭证' };
    }

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE vouchers SET is_locked = 0, locked_by = NULL, locked_at = NULL, updated_at = ? WHERE id = ?`,
        [now, voucherId],
        (err) => {
          if (err) {
            return resolve({ success: false, error: err.message });
          }

          db.run(
            `UPDATE vouchers SET status = ? WHERE id = ?`,
            [VoucherEngine.VOUCHER_STATUSES.PENDING_REVIEW, voucherId]
          );

          VoucherService.logStatusFlow(
            voucherId, existingVoucher.status, VoucherEngine.VOUCHER_STATUSES.PENDING_REVIEW,
            user, 'unlock', '解锁凭证', 'backend'
          );

          VoucherService.logOperation(
            voucherId, user, 'unlock_voucher',
            JSON.stringify({ is_locked: true }),
            JSON.stringify({ is_locked: false }),
            'backend'
          );

          resolve({ success: true, voucherId });
        }
      );
    });
  }

  static async passReview(voucherId, user, comment) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const existingVoucher = await VoucherService.getVoucherById(voucherId);
    if (!existingVoucher) {
      return { success: false, error: '凭证不存在' };
    }

    if (existingVoucher.status !== VoucherEngine.VOUCHER_STATUSES.UNDER_REVIEW) {
      return { success: false, error: '当前状态不可通过审核' };
    }

    if (!existingVoucher.is_locked || existingVoucher.locked_by !== user.id) {
      return { success: false, error: '请先锁定凭证' };
    }

    const nextStatus = VoucherEngine.getNextStatus(existingVoucher.status, 'pass');
    if (!nextStatus) {
      return { success: false, error: '状态流转错误' };
    }

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `UPDATE vouchers SET status = ?, is_locked = 0, locked_by = NULL, locked_at = NULL, updated_at = ? WHERE id = ?`,
          [nextStatus, now, voucherId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return resolve({ success: false, error: err.message });
            }

            VoucherService.logStatusFlow(
              voucherId, existingVoucher.status, nextStatus,
              user, 'pass', comment || '审核通过', 'backend'
            );

            VoucherService.logOperation(
              voucherId, user, 'review_pass',
              JSON.stringify({ status: existingVoucher.status }),
              JSON.stringify({ status: nextStatus, comment }),
              'backend'
            );

            const ledgerStatus = VoucherEngine.getNextStatus(nextStatus, 'ledger');
            if (ledgerStatus) {
              db.run(
                `UPDATE vouchers SET status = ?, updated_at = ? WHERE id = ?`,
                [ledgerStatus, now, voucherId]
              );
              VoucherService.logStatusFlow(
                voucherId, nextStatus, ledgerStatus,
                user, 'ledger', '审核通过后自动进入待生成账簿', 'backend'
              );
              VoucherService.createMessage(
                null, '会计/出纳', '待办',
                `凭证 ${existingVoucher.voucher_no} 审核通过，待生成账簿`,
                voucherId
              );
            }

            db.run('COMMIT');
            resolve({ 
              success: true, 
              voucher: { id: voucherId, status: ledgerStatus || nextStatus }
            });
          }
        );
      });
    });
  }

  static async rejectReview(voucherId, user, comment) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const existingVoucher = await VoucherService.getVoucherById(voucherId);
    if (!existingVoucher) {
      return { success: false, error: '凭证不存在' };
    }

    if (!['under_review', 'pending_review'].includes(existingVoucher.status)) {
      return { success: false, error: '当前状态不可驳回' };
    }

    const nextStatus = VoucherEngine.VOUCHER_STATUSES.REVIEW_REJECTED;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `UPDATE vouchers SET status = ?, is_locked = 0, locked_by = NULL, locked_at = NULL, updated_at = ? WHERE id = ?`,
          [nextStatus, now, voucherId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return resolve({ success: false, error: err.message });
            }

            VoucherService.logStatusFlow(
              voucherId, existingVoucher.status, nextStatus,
              user, 'reject', comment || '审核驳回', 'backend'
            );

            VoucherService.logOperation(
              voucherId, user, 'review_reject',
              JSON.stringify({ status: existingVoucher.status }),
              JSON.stringify({ status: nextStatus, comment }),
              'backend'
            );

            VoucherService.createMessage(
              existingVoucher.creator_id, existingVoucher.creator_name, '通知',
              `您的凭证 ${existingVoucher.voucher_no} 被驳回：${comment || '请查看详情'}`,
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

  static async supplementReview(voucherId, user, comment, requiredItems) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const existingVoucher = await VoucherService.getVoucherById(voucherId);
    if (!existingVoucher) {
      return { success: false, error: '凭证不存在' };
    }

    if (existingVoucher.status !== VoucherEngine.VOUCHER_STATUSES.UNDER_REVIEW) {
      return { success: false, error: '当前状态不可要求补充资料' };
    }

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `UPDATE vouchers SET is_locked = 0, locked_by = NULL, locked_at = NULL, updated_at = ? WHERE id = ?`,
          [now, voucherId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return resolve({ success: false, error: err.message });
            }

            VoucherService.logStatusFlow(
              voucherId, existingVoucher.status, VoucherEngine.VOUCHER_STATUSES.REVIEW_REJECTED,
              user, 'supplement', 
              `需要补充资料：${comment}\n要求内容：${JSON.stringify(requiredItems)}`,
              'backend'
            );

            VoucherService.logOperation(
              voucherId, user, 'review_supplement',
              JSON.stringify({ status: existingVoucher.status }),
              JSON.stringify({ comment, requiredItems }),
              'backend'
            );

            VoucherService.createMessage(
              existingVoucher.creator_id, existingVoucher.creator_name, '通知',
              `您的凭证 ${existingVoucher.voucher_no} 需要补充资料：${comment}`,
              voucherId
            );

            db.run('COMMIT');
            resolve({ success: true, voucherId });
          }
        );
      });
    });
  }

  static async transferReview(voucherId, user, targetUserId, targetUserName, comment) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const existingVoucher = await VoucherService.getVoucherById(voucherId);
    if (!existingVoucher) {
      return { success: false, error: '凭证不存在' };
    }

    if (existingVoucher.status !== VoucherEngine.VOUCHER_STATUSES.UNDER_REVIEW) {
      return { success: false, error: '当前状态不可转派' };
    }

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `UPDATE vouchers SET locked_by = ?, locked_at = ?, updated_at = ? WHERE id = ?`,
          [targetUserId, now, now, voucherId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return resolve({ success: false, error: err.message });
            }

            VoucherService.logStatusFlow(
              voucherId, existingVoucher.status, existingVoucher.status,
              user, 'transfer', 
              `转派给 ${targetUserName}：${comment || ''}`,
              'backend'
            );

            VoucherService.logOperation(
              voucherId, user, 'review_transfer',
              JSON.stringify({ locked_by: user.id }),
              JSON.stringify({ locked_by: targetUserId, targetUserName, comment }),
              'backend'
            );

            VoucherService.createMessage(
              targetUserId, targetUserName, '待办',
              `凭证 ${existingVoucher.voucher_no} 已转派给您审核`,
              voucherId
            );

            db.run('COMMIT');
            resolve({ success: true, voucherId });
          }
        );
      });
    });
  }
}

module.exports = ReviewService;
