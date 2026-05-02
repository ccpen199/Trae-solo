import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.models import (
    TaskUnit, TaskAssignment, Wallet, Transaction, SettlementRecord,
    User, TaskStatus, OperationTrace, TaskBatch
)


class SmartSettlementEngine:
    """
    Smart-Settlement 结算引擎
    职责：佣金计算、即时划拨、财务报表生成
    输入：合格任务、佣金规则
    输出：结算记录、交易记录、财务报表
    """

    def __init__(self, db: Session):
        self.db = db

    def settle_task(self, task_unit_id: int) -> Tuple[bool, str, Optional[SettlementRecord]]:
        """
        结算单个任务
        输入：任务单元ID
        输出：是否成功、消息、结算记录
        """
        task_unit = self.db.query(TaskUnit).filter(TaskUnit.id == task_unit_id).first()
        if not task_unit:
            return False, "任务不存在", None

        if task_unit.status not in [TaskStatus.QUALIFIED, TaskStatus.PENDING_REVIEW]:
            return False, f"任务状态 {task_unit.status.value} 不支持结算", None

        assignment = self.db.query(TaskAssignment).filter(
            TaskAssignment.task_unit_id == task_unit_id,
            TaskAssignment.is_active == True
        ).first()
        if not assignment:
            return False, "任务分配记录不存在", None

        worker = self.db.query(User).filter(User.id == assignment.worker_id).first()
        if not worker:
            return False, "接单员不存在", None

        wallet = self.db.query(Wallet).filter(Wallet.user_id == worker.id).first()
        if not wallet:
            wallet = Wallet(
                user_id=worker.id,
                balance=0.0,
                total_income=0.0,
                total_withdraw=0.0
            )
            self.db.add(wallet)
            self.db.flush()

        amount = task_unit.reward
        balance_before = wallet.balance
        balance_after = balance_before + amount

        transaction = Transaction(
            wallet_id=wallet.id,
            task_unit_id=task_unit_id,
            type="income",
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            description=f"任务结算: 任务ID {task_unit_id}"
        )
        self.db.add(transaction)
        self.db.flush()

        wallet.balance = balance_after
        wallet.total_income += amount

        report_reference = self._generate_report_reference(task_unit)

        settlement = SettlementRecord(
            task_unit_id=task_unit_id,
            worker_id=worker.id,
            amount=amount,
            transaction_id=transaction.id,
            report_reference=report_reference
        )
        self.db.add(settlement)

        task_unit.status = TaskStatus.SETTLED
        assignment.is_active = False

        batch = self.db.query(TaskBatch).filter(TaskBatch.id == task_unit.batch_id).first()
        if batch:
            batch.completed_units += 1

        self._create_operation_trace(
            user_id=worker.id,
            task_unit_id=task_unit_id,
            operation="task_settled",
            old_value=task_unit.status.value if task_unit.status else None,
            new_value=TaskStatus.SETTLED.value
        )

        self.db.commit()

        return True, "结算成功", settlement

    def batch_settle_qualified_tasks(self, limit: int = 100) -> Tuple[int, List[str]]:
        """
        批量结算合格任务
        输入：批量限制
        输出：结算数量、错误列表
        """
        qualified_tasks = self.db.query(TaskUnit).filter(
            TaskUnit.status == TaskStatus.QUALIFIED
        ).limit(limit).all()

        success_count = 0
        errors = []

        for task in qualified_tasks:
            success, message, _ = self.settle_task(task.id)
            if success:
                success_count += 1
            else:
                errors.append(f"任务ID {task.id}: {message}")

        return success_count, errors

    def get_worker_wallet(self, worker_id: int) -> Optional[Wallet]:
        """
        获取接单员钱包信息
        """
        return self.db.query(Wallet).filter(Wallet.user_id == worker_id).first()

    def get_transaction_history(
        self,
        worker_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> List[Transaction]:
        """
        获取交易历史
        """
        wallet = self.db.query(Wallet).filter(Wallet.user_id == worker_id).first()
        if not wallet:
            return []

        return self.db.query(Transaction).filter(
            Transaction.wallet_id == wallet.id
        ).order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()

    def generate_financial_report(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict:
        """
        生成财务报表
        """
        query = self.db.query(SettlementRecord)

        if start_date:
            query = query.filter(SettlementRecord.settled_at >= start_date)
        if end_date:
            query = query.filter(SettlementRecord.settled_at <= end_date)

        settlements = query.all()

        total_settlements = len(settlements)
        total_amount = sum(s.amount for s in settlements)

        worker_stats = {}
        for s in settlements:
            if s.worker_id not in worker_stats:
                worker_stats[s.worker_id] = {"count": 0, "amount": 0.0}
            worker_stats[s.worker_id]["count"] += 1
            worker_stats[s.worker_id]["amount"] += s.amount

        top_workers = sorted(
            worker_stats.items(),
            key=lambda x: x[1]["amount"],
            reverse=True
        )[:10]

        return {
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            },
            "summary": {
                "total_settlements": total_settlements,
                "total_amount": total_amount
            },
            "worker_stats": {
                "unique_workers": len(worker_stats),
                "top_workers": [
                    {
                        "worker_id": w[0],
                        "settlement_count": w[1]["count"],
                        "total_amount": w[1]["amount"]
                    }
                    for w in top_workers
                ]
            }
        }

    def _generate_report_reference(self, task_unit: TaskUnit) -> str:
        """
        生成报表参考号
        """
        now = datetime.utcnow()
        return f"SR{now.year}{now.month:02d}{now.day:02d}-{task_unit.id}"

    def _create_operation_trace(
        self,
        user_id: Optional[int],
        task_unit_id: Optional[int],
        operation: str,
        old_value: Optional[str],
        new_value: Optional[str]
    ):
        trace = OperationTrace(
            user_id=user_id,
            task_unit_id=task_unit_id,
            operation=operation,
            old_value=old_value,
            new_value=new_value
        )
        self.db.add(trace)
