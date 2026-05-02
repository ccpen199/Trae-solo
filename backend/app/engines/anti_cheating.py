import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.models import (
    TaskUnit, TaskDelivery, AntiCheatingRecord, TaskAssignment,
    User, TaskStatus, CheatingRiskLevel, OperationTrace
)


class AntiCheatingEngine:
    """
    Anti-Cheating 防作弊引擎
    职责：IP检测、设备指纹识别、异常标记
    输入：交付数据、IP地址、设备指纹
    输出：风险评分、风险等级、标记状态
    """

    def __init__(self, db: Session):
        self.db = db
        self._suspicious_ips: set = set()
        self._ip_submission_counts: Dict[str, int] = {}
        self._fingerprint_submission_counts: Dict[str, int] = {}

    def analyze_delivery(
        self,
        task_unit_id: int,
        worker_id: int,
        ip_address: Optional[str],
        device_fingerprint: Optional[str]
    ) -> AntiCheatingRecord:
        """
        分析交付数据，检测作弊风险
        输入：任务单元ID、接单员ID、IP地址、设备指纹
        输出：防作弊记录
        """
        ip_risk_score = self._analyze_ip_risk(ip_address, worker_id)
        fingerprint_risk_score = self._analyze_fingerprint_risk(device_fingerprint, worker_id)

        total_risk_score = ip_risk_score * 0.5 + fingerprint_risk_score * 0.5

        risk_level = self._calculate_risk_level(total_risk_score)

        risk_factors = self._build_risk_factors(
            ip_address, device_fingerprint, ip_risk_score, fingerprint_risk_score
        )

        is_flagged = total_risk_score >= 60

        record = AntiCheatingRecord(
            task_unit_id=task_unit_id,
            worker_id=worker_id,
            ip_address=ip_address,
            device_fingerprint=device_fingerprint,
            ip_risk_score=ip_risk_score,
            fingerprint_risk_score=fingerprint_risk_score,
            total_risk_score=total_risk_score,
            risk_level=risk_level,
            risk_factors=json.dumps(risk_factors, ensure_ascii=False),
            is_flagged=is_flagged,
            checked_at=datetime.utcnow()
        )

        self.db.add(record)

        task_unit = self.db.query(TaskUnit).filter(TaskUnit.id == task_unit_id).first()
        if task_unit and is_flagged:
            task_unit.status = TaskStatus.PENDING_REVIEW
            self._create_operation_trace(
                user_id=worker_id,
                task_unit_id=task_unit_id,
                operation="cheating_flagged",
                old_value=TaskStatus.DELIVERED.value if task_unit.status == TaskStatus.DELIVERED else task_unit.status.value,
                new_value=TaskStatus.PENDING_REVIEW.value
            )

        self.db.commit()

        return record

    def _analyze_ip_risk(self, ip_address: Optional[str], worker_id: int) -> float:
        """
        分析IP风险
        风险因素：
        1. 同一IP多个账户使用
        2. 高频提交
        3. 可疑IP段
        """
        if not ip_address:
            return 0.0

        risk_score = 0.0

        workers_with_same_ip = self.db.query(TaskAssignment).join(
            TaskDelivery, TaskAssignment.task_unit_id == TaskDelivery.task_unit_id
        ).filter(
            TaskDelivery.ip_address == ip_address,
            TaskAssignment.worker_id != worker_id
        ).distinct(TaskAssignment.worker_id).count()

        if workers_with_same_ip >= 3:
            risk_score += 50
        elif workers_with_same_ip >= 2:
            risk_score += 30

        recent_submissions = self.db.query(TaskDelivery).filter(
            TaskDelivery.ip_address == ip_address,
            TaskDelivery.delivered_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
        ).count()

        if recent_submissions >= 50:
            risk_score += 40
        elif recent_submissions >= 30:
            risk_score += 20

        if ip_address in self._suspicious_ips:
            risk_score += 30

        return min(risk_score, 100.0)

    def _analyze_fingerprint_risk(self, fingerprint: Optional[str], worker_id: int) -> float:
        """
        分析设备指纹风险
        风险因素：
        1. 同一指纹多个账户使用
        2. 高频提交
        """
        if not fingerprint:
            return 0.0

        risk_score = 0.0

        workers_with_same_fp = self.db.query(TaskAssignment).join(
            TaskDelivery, TaskAssignment.task_unit_id == TaskDelivery.task_unit_id
        ).filter(
            TaskDelivery.device_fingerprint == fingerprint,
            TaskAssignment.worker_id != worker_id
        ).distinct(TaskAssignment.worker_id).count()

        if workers_with_same_fp >= 2:
            risk_score += 60

        recent_submissions = self.db.query(TaskDelivery).filter(
            TaskDelivery.device_fingerprint == fingerprint,
            TaskDelivery.delivered_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
        ).count()

        if recent_submissions >= 100:
            risk_score += 30
        elif recent_submissions >= 50:
            risk_score += 15

        return min(risk_score, 100.0)

    def _calculate_risk_level(self, score: float) -> CheatingRiskLevel:
        """
        根据分数计算风险等级
        """
        if score >= 70:
            return CheatingRiskLevel.HIGH
        elif score >= 40:
            return CheatingRiskLevel.MEDIUM
        else:
            return CheatingRiskLevel.LOW

    def _build_risk_factors(
        self,
        ip_address: Optional[str],
        fingerprint: Optional[str],
        ip_score: float,
        fp_score: float
    ) -> Dict:
        """
        构建风险因素详情
        """
        factors = {
            "ip_analysis": {
                "ip_address": ip_address,
                "risk_score": ip_score,
                "checks": [
                    {"name": "multi_account_sharing", "risk": ip_score >= 30},
                    {"name": "high_frequency_submission", "risk": ip_score >= 20}
                ]
            },
            "fingerprint_analysis": {
                "fingerprint": fingerprint,
                "risk_score": fp_score,
                "checks": [
                    {"name": "multi_account_sharing", "risk": fp_score >= 60},
                    {"name": "high_frequency_submission", "risk": fp_score >= 15}
                ]
            }
        }
        return factors

    def get_flagged_tasks(self, limit: int = 100) -> List[TaskUnit]:
        """
        获取被标记为异常的任务
        """
        flagged_task_ids = self.db.query(AntiCheatingRecord.task_unit_id).filter(
            AntiCheatingRecord.is_flagged == True
        ).subquery()

        tasks = self.db.query(TaskUnit).filter(
            TaskUnit.id.in_(flagged_task_ids),
            TaskUnit.status == TaskStatus.PENDING_REVIEW
        ).limit(limit).all()

        return tasks

    def validate_after_review(self, task_unit_id: int, is_valid: bool) -> Tuple[bool, str]:
        """
        审核后验证结果
        输入：任务单元ID、是否有效
        输出：是否成功、消息
        """
        record = self.db.query(AntiCheatingRecord).filter(
            AntiCheatingRecord.task_unit_id == task_unit_id
        ).first()

        if not record:
            return False, "防作弊记录不存在"

        task_unit = self.db.query(TaskUnit).filter(TaskUnit.id == task_unit_id).first()
        if not task_unit:
            return False, "任务不存在"

        if is_valid:
            task_unit.status = TaskStatus.QUALIFIED
            self._create_operation_trace(
                user_id=None,
                task_unit_id=task_unit_id,
                operation="cheating_review_passed",
                old_value=TaskStatus.PENDING_REVIEW.value,
                new_value=TaskStatus.QUALIFIED.value
            )
        else:
            task_unit.status = TaskStatus.DISQUALIFIED
            self._create_operation_trace(
                user_id=None,
                task_unit_id=task_unit_id,
                operation="cheating_review_failed",
                old_value=TaskStatus.PENDING_REVIEW.value,
                new_value=TaskStatus.DISQUALIFIED.value
            )

        self.db.commit()
        return True, "审核结果已更新"

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
