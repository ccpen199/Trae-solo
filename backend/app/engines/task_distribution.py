import json
from typing import List, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models import (
    TaskBatch, TaskUnit, TaskAssignment, User, UserRole,
    TaskStatus, OperationTrace
)


class TaskDistributionEngine:
    """
    Task-Distribution 路由引擎
    职责：任务分解、等级匹配、推送调度
    输入：任务批次数据、发布方配置
    输出：分解后的任务单元、分配记录
    """

    def __init__(self, db: Session):
        self.db = db

    def decompose_batch(
        self,
        publisher_id: int,
        batch_name: str,
        description: Optional[str],
        unit_reward: float,
        requirements: Optional[str],
        min_worker_level: int,
        task_data_list: List[Any]
    ) -> Tuple[TaskBatch, List[TaskUnit]]:
        """
        任务分解：将批量导入的任务分解为独立任务单元
        输入：发布方ID、批次信息、任务数据列表
        输出：任务批次对象、任务单元列表
        """
        total_units = len(task_data_list)
        total_reward = total_units * unit_reward

        batch = TaskBatch(
            publisher_id=publisher_id,
            batch_name=batch_name,
            description=description,
            total_units=total_units,
            completed_units=0,
            unit_reward=unit_reward,
            total_reward=total_reward,
            requirements=requirements,
            min_worker_level=min_worker_level,
            status=TaskStatus.PENDING
        )
        self.db.add(batch)
        self.db.flush()

        task_units = []
        for index, task_data in enumerate(task_data_list):
            unit = TaskUnit(
                batch_id=batch.id,
                unit_index=index,
                task_data=json.dumps(task_data, ensure_ascii=False) if isinstance(task_data, (dict, list)) else str(task_data),
                reward=unit_reward,
                status=TaskStatus.PENDING,
                min_worker_level=min_worker_level
            )
            self.db.add(unit)
            task_units.append(unit)

        self.db.commit()

        self._create_operation_trace(
            user_id=publisher_id,
            operation="batch_created",
            old_value=None,
            new_value=f"批次ID: {batch.id}, 任务数: {total_units}"
        )

        return batch, task_units

    def assign_task(self, worker_id: int, task_unit_id: int) -> Tuple[bool, str]:
        """
        任务分配：将任务单元分配给接单员
        输入：接单员ID、任务单元ID
        输出：是否成功、消息
        """
        task_unit = self.db.query(TaskUnit).filter(TaskUnit.id == task_unit_id).first()
        if not task_unit:
            return False, "任务不存在"

        if task_unit.status != TaskStatus.PENDING:
            return False, "任务不可领取"

        worker = self.db.query(User).filter(User.id == worker_id).first()
        if not worker or worker.role != UserRole.WORKER:
            return False, "无效的接单员"

        if not worker.is_active:
            return False, "接单员账户已被禁用"

        if worker.level < task_unit.min_worker_level:
            return False, f"需要等级 {task_unit.min_worker_level} 才能领取此任务"

        active_assignments = self.db.query(TaskAssignment).filter(
            TaskAssignment.worker_id == worker_id,
            TaskAssignment.is_active == True
        ).count()
        if active_assignments >= 10:
            return False, "已达到最大进行中任务数量"

        existing_assignment = self.db.query(TaskAssignment).filter(
            TaskAssignment.task_unit_id == task_unit_id
        ).first()
        if existing_assignment:
            return False, "任务已被领取"

        assignment = TaskAssignment(
            task_unit_id=task_unit_id,
            worker_id=worker_id,
            deadline_at=datetime.utcnow() + timedelta(hours=24),
            is_active=True
        )
        self.db.add(assignment)

        task_unit.status = TaskStatus.IN_PROGRESS

        self._create_operation_trace(
            user_id=worker_id,
            task_unit_id=task_unit_id,
            operation="task_assigned",
            old_value=TaskStatus.PENDING.value,
            new_value=TaskStatus.IN_PROGRESS.value
        )

        self.db.commit()
        return True, "任务领取成功"

    def get_available_tasks(
        self,
        worker_id: int,
        limit: int = 20,
        offset: int = 0
    ) -> List[TaskUnit]:
        """
        获取可领取任务列表
        输入：接单员ID、分页参数
        输出：匹配等级的待领取任务列表
        """
        worker = self.db.query(User).filter(User.id == worker_id).first()
        if not worker:
            return []

        tasks = self.db.query(TaskUnit).filter(
            TaskUnit.status == TaskStatus.PENDING,
            TaskUnit.min_worker_level <= worker.level
        ).order_by(TaskUnit.created_at).offset(offset).limit(limit).all()

        return tasks

    def get_assigned_tasks(
        self,
        worker_id: int,
        status: Optional[TaskStatus] = None
    ) -> List[TaskUnit]:
        """
        获取已分配的任务
        输入：接单员ID、可选状态过滤
        输出：任务单元列表
        """
        query = self.db.query(TaskUnit).join(TaskAssignment).filter(
            TaskAssignment.worker_id == worker_id,
            TaskAssignment.is_active == True
        )

        if status:
            query = query.filter(TaskUnit.status == status)

        return query.all()

    def release_task(self, worker_id: int, task_unit_id: int) -> Tuple[bool, str]:
        """
        释放任务（放弃领取）
        输入：接单员ID、任务单元ID
        输出：是否成功、消息
        """
        assignment = self.db.query(TaskAssignment).filter(
            TaskAssignment.task_unit_id == task_unit_id,
            TaskAssignment.worker_id == worker_id,
            TaskAssignment.is_active == True
        ).first()

        if not assignment:
            return False, "任务分配记录不存在"

        task_unit = self.db.query(TaskUnit).filter(TaskUnit.id == task_unit_id).first()
        if task_unit.status not in [TaskStatus.IN_PROGRESS, TaskStatus.PENDING]:
            return False, "任务状态不可释放"

        assignment.is_active = False
        task_unit.status = TaskStatus.PENDING

        self._create_operation_trace(
            user_id=worker_id,
            task_unit_id=task_unit_id,
            operation="task_released",
            old_value=TaskStatus.IN_PROGRESS.value,
            new_value=TaskStatus.PENDING.value
        )

        self.db.commit()
        return True, "任务已释放"

    def _create_operation_trace(
        self,
        user_id: Optional[int],
        task_unit_id: Optional[int] = None,
        operation: str = "",
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
        ip_address: Optional[str] = None
    ):
        """
        创建操作轨迹记录
        """
        trace = OperationTrace(
            user_id=user_id,
            task_unit_id=task_unit_id,
            operation=operation,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address
        )
        self.db.add(trace)
