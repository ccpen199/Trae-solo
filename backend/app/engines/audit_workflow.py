import json
import random
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.models import (
    TaskUnit, TaskDelivery, ExpertReview, Appeal,
    User, UserRole, TaskStatus, ReviewResult, AppealStatus,
    OperationTrace, AntiCheatingRecord
)


class AuditWorkflowEngine:
    """
    Audit-Workflow 审核引擎
    职责：随机抽样、专家盲审、异议申诉处理
    输入：交付任务、申诉请求
    输出：审核结果、申诉处理结果
    """

    def __init__(self, db: Session):
        self.db = db
        self._sampling_rate = 0.3

    def sample_and_assign_experts(
        self,
        task_ids: Optional[List[int]] = None,
        sampling_rate: Optional[float] = None
    ) -> Tuple[int, List[int]]:
        """
        随机抽样并分配专家
        输入：可选任务ID列表、抽样率
        输出：抽样数量、已分配任务ID列表
        """
        rate = sampling_rate if sampling_rate is not None else self._sampling_rate

        if task_ids:
            delivered_tasks = self.db.query(TaskUnit).filter(
                TaskUnit.id.in_(task_ids),
                TaskUnit.status == TaskStatus.DELIVERED
            ).all()
        else:
            delivered_tasks = self.db.query(TaskUnit).filter(
                TaskUnit.status == TaskStatus.DELIVERED
            ).all()

        sample_size = max(1, int(len(delivered_tasks) * rate))
        sampled_tasks = random.sample(delivered_tasks, min(sample_size, len(delivered_tasks)))

        experts = self.db.query(User).filter(
            User.role == UserRole.EXPERT,
            User.is_active == True
        ).all()

        if not experts:
            return 0, []

        assigned_task_ids = []
        for task in sampled_tasks:
            expert = random.choice(experts)
            review = ExpertReview(
                task_unit_id=task.id,
                expert_id=expert.id,
                is_blind=True,
                result=ReviewResult.PENDING
            )
            self.db.add(review)

            task.status = TaskStatus.REVIEWING
            assigned_task_ids.append(task.id)

            self._create_operation_trace(
                user_id=expert.id,
                task_unit_id=task.id,
                operation="review_assigned",
                old_value=TaskStatus.DELIVERED.value,
                new_value=TaskStatus.REVIEWING.value
            )

        self.db.commit()

        return len(assigned_task_ids), assigned_task_ids

    def submit_review(
        self,
        expert_id: int,
        task_unit_id: int,
        result: ReviewResult,
        score: Optional[float] = None,
        comments: Optional[str] = None
    ) -> Tuple[bool, str]:
        """
        专家提交审核结果
        输入：专家ID、任务单元ID、审核结果
        输出：是否成功、消息
        """
        review = self.db.query(ExpertReview).filter(
            ExpertReview.task_unit_id == task_unit_id,
            ExpertReview.expert_id == expert_id,
            ExpertReview.result == ReviewResult.PENDING
        ).first()

        if not review:
            return False, "待审核记录不存在或已审核"

        task_unit = self.db.query(TaskUnit).filter(TaskUnit.id == task_unit_id).first()
        if not task_unit:
            return False, "任务不存在"

        review.result = result
        review.score = score
        review.comments = comments
        review.reviewed_at = datetime.utcnow()

        if result == ReviewResult.QUALIFIED:
            task_unit.status = TaskStatus.QUALIFIED
        else:
            task_unit.status = TaskStatus.DISQUALIFIED

        self._create_operation_trace(
            user_id=expert_id,
            task_unit_id=task_unit_id,
            operation="review_submitted",
            old_value=TaskStatus.REVIEWING.value,
            new_value=task_unit.status.value
        )

        self.db.commit()
        return True, "审核结果已提交"

    def get_expert_pending_reviews(self, expert_id: int) -> List[TaskUnit]:
        """
        获取专家待审核任务列表
        """
        pending_review_task_ids = self.db.query(ExpertReview.task_unit_id).filter(
            ExpertReview.expert_id == expert_id,
            ExpertReview.result == ReviewResult.PENDING
        ).subquery()

        tasks = self.db.query(TaskUnit).filter(
            TaskUnit.id.in_(pending_review_task_ids),
            TaskUnit.status == TaskStatus.REVIEWING
        ).all()

        return tasks

    def submit_appeal(
        self,
        requester_id: int,
        task_unit_id: int,
        reason: str,
        evidence: Optional[str] = None
    ) -> Tuple[bool, str, Optional[Appeal]]:
        """
        提交申诉
        输入：请求者ID、任务单元ID、申诉理由、证据
        输出：是否成功、消息、申诉记录
        """
        task_unit = self.db.query(TaskUnit).filter(TaskUnit.id == task_unit_id).first()
        if not task_unit:
            return False, "任务不存在", None

        existing_appeal = self.db.query(Appeal).filter(
            Appeal.task_unit_id == task_unit_id
        ).first()
        if existing_appeal:
            return False, "该任务已有申诉记录", None

        assignment = self.db.query(TaskUnit.__table__.c).filter(
            TaskUnit.id == task_unit_id
        ).first()

        old_status = task_unit.status.value
        appeal = Appeal(
            task_unit_id=task_unit_id,
            requester_id=requester_id,
            reason=reason,
            evidence=evidence,
            status=AppealStatus.PENDING
        )
        self.db.add(appeal)

        task_unit.status = TaskStatus.APPEALING

        self._create_operation_trace(
            user_id=requester_id,
            task_unit_id=task_unit_id,
            operation="appeal_submitted",
            old_value=old_status,
            new_value=TaskStatus.APPEALING.value
        )

        self.db.commit()
        return True, "申诉已提交", appeal

    def resolve_appeal(
        self,
        admin_id: int,
        appeal_id: int,
        status: AppealStatus,
        comments: str
    ) -> Tuple[bool, str]:
        """
        管理员终审申诉
        输入：管理员ID、申诉ID、处理结果、评论
        输出：是否成功、消息
        """
        appeal = self.db.query(Appeal).filter(
            Appeal.id == appeal_id,
            Appeal.status == AppealStatus.PENDING
        ).first()

        if not appeal:
            return False, "申诉不存在或已处理"

        task_unit = self.db.query(TaskUnit).filter(
            TaskUnit.id == appeal.task_unit_id
        ).first()
        if not task_unit:
            return False, "任务不存在"

        old_status = task_unit.status.value
        appeal.status = status
        appeal.admin_id = admin_id
        appeal.admin_comments = comments
        appeal.resolved_at = datetime.utcnow()

        if status == AppealStatus.APPROVED:
            task_unit.status = TaskStatus.QUALIFIED
            new_status_value = TaskStatus.QUALIFIED.value
        else:
            task_unit.status = TaskStatus.DISQUALIFIED
            new_status_value = TaskStatus.DISQUALIFIED.value

        self._create_operation_trace(
            user_id=admin_id,
            task_unit_id=task_unit.id,
            operation="appeal_resolved",
            old_value=old_status,
            new_value=new_status_value
        )

        self.db.commit()
        return True, "申诉已处理"

    def get_pending_appeals(self) -> List[Appeal]:
        """
        获取待处理申诉列表
        """
        return self.db.query(Appeal).filter(
            Appeal.status == AppealStatus.PENDING
        ).all()

    def get_task_traces(self, task_unit_id: int) -> List[OperationTrace]:
        """
        获取任务全轨迹快照
        """
        return self.db.query(OperationTrace).filter(
            OperationTrace.task_unit_id == task_unit_id
        ).order_by(OperationTrace.created_at).all()

    def get_task_detail_for_audit(self, task_unit_id: int) -> Dict:
        """
        获取任务详情用于审核
        包含：任务数据、交付数据、防作弊记录、操作轨迹
        """
        task_unit = self.db.query(TaskUnit).filter(TaskUnit.id == task_unit_id).first()
        if not task_unit:
            return {}

        delivery = self.db.query(TaskDelivery).filter(
            TaskDelivery.task_unit_id == task_unit_id
        ).first()

        anti_cheating = self.db.query(AntiCheatingRecord).filter(
            AntiCheatingRecord.task_unit_id == task_unit_id
        ).first()

        traces = self.get_task_traces(task_unit_id)

        return {
            "task_unit": {
                "id": task_unit.id,
                "batch_id": task_unit.batch_id,
                "status": task_unit.status.value,
                "reward": task_unit.reward,
                "task_data": task_unit.task_data
            },
            "delivery": {
                "delivery_data": delivery.delivery_data if delivery else None,
                "ip_address": delivery.ip_address if delivery else None,
                "device_fingerprint": delivery.device_fingerprint if delivery else None,
                "delivered_at": delivery.delivered_at.isoformat() if delivery else None
            } if delivery else None,
            "anti_cheating": {
                "total_risk_score": anti_cheating.total_risk_score if anti_cheating else None,
                "risk_level": anti_cheating.risk_level.value if anti_cheating else None,
                "is_flagged": anti_cheating.is_flagged if anti_cheating else None
            } if anti_cheating else None,
            "traces": [
                {
                    "operation": t.operation,
                    "old_value": t.old_value,
                    "new_value": t.new_value,
                    "created_at": t.created_at.isoformat(),
                    "version": t.version
                }
                for t in traces
            ]
        }

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
