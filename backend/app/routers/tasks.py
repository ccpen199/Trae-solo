import json
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import User, UserRole, TaskBatch, TaskUnit, TaskStatus
from app.schemas import (
    TaskBatchCreate, TaskBatchResponse, TaskUnitResponse,
    TaskDeliveryCreate, TaskDeliveryResponse
)
from app.auth import get_current_user, require_roles, create_audit_log
from app.engines import TaskDistributionEngine, AntiCheatingEngine, SmartSettlementEngine

router = APIRouter(prefix="/tasks", tags=["任务管理"])


@router.post("/batch", response_model=TaskBatchResponse)
def create_task_batch(
    batch_data: TaskBatchCreate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.PUBLISHER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    发布方创建任务批次
    """
    engine = TaskDistributionEngine(db)
    batch, task_units = engine.decompose_batch(
        publisher_id=current_user.id,
        batch_name=batch_data.batch_name,
        description=batch_data.description,
        unit_reward=batch_data.unit_reward,
        requirements=batch_data.requirements,
        min_worker_level=batch_data.min_worker_level,
        task_data_list=batch_data.task_data_list
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="batch_created",
        resource="task_batch",
        resource_id=batch.id,
        details=f"创建任务批次: {batch.batch_name}, 任务数: {batch.total_units}",
        ip_address=request.client.host if request.client else None
    )

    return batch


@router.get("/batches", response_model=List[TaskBatchResponse])
def get_task_batches(
    status: Optional[TaskStatus] = None,
    current_user: User = Depends(require_roles(UserRole.PUBLISHER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    获取任务批次列表
    """
    query = db.query(TaskBatch).filter(TaskBatch.publisher_id == current_user.id)
    if status:
        query = query.filter(TaskBatch.status == status)
    return query.order_by(TaskBatch.created_at.desc()).all()


@router.get("/batches/{batch_id}", response_model=TaskBatchResponse)
def get_task_batch(
    batch_id: int,
    current_user: User = Depends(require_roles(UserRole.PUBLISHER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    获取任务批次详情
    """
    batch = db.query(TaskBatch).filter(
        TaskBatch.id == batch_id,
        TaskBatch.publisher_id == current_user.id
    ).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务批次不存在"
        )
    return batch


@router.get("/batches/{batch_id}/units", response_model=List[TaskUnitResponse])
def get_batch_task_units(
    batch_id: int,
    status: Optional[TaskStatus] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_roles(UserRole.PUBLISHER, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    获取批次下的任务单元列表
    """
    batch = db.query(TaskBatch).filter(
        TaskBatch.id == batch_id,
        TaskBatch.publisher_id == current_user.id
    ).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务批次不存在"
        )

    query = db.query(TaskUnit).filter(TaskUnit.batch_id == batch_id)
    if status:
        query = query.filter(TaskUnit.status == status)
    return query.order_by(TaskUnit.unit_index).offset(offset).limit(limit).all()


@router.get("/units/{unit_id}", response_model=TaskUnitResponse)
def get_task_unit(
    unit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取任务单元详情
    """
    task = db.query(TaskUnit).filter(TaskUnit.id == unit_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    return task


@router.post("/deliver", response_model=TaskDeliveryResponse)
def deliver_task(
    delivery_data: TaskDeliveryCreate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.WORKER)),
    db: Session = Depends(get_db)
):
    """
    接单员交付任务
    """
    from app.models import TaskDelivery, TaskAssignment

    task_unit = db.query(TaskUnit).filter(
        TaskUnit.id == delivery_data.task_unit_id
    ).first()
    if not task_unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )

    assignment = db.query(TaskAssignment).filter(
        TaskAssignment.task_unit_id == task_unit.id,
        TaskAssignment.worker_id == current_user.id,
        TaskAssignment.is_active == True
    ).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权交付此任务"
        )

    if task_unit.status != TaskStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"任务状态 {task_unit.status.value} 不可交付"
        )

    existing_delivery = db.query(TaskDelivery).filter(
        TaskDelivery.task_unit_id == task_unit.id
    ).first()
    if existing_delivery:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="任务已交付"
        )

    ip_address = request.client.host if request.client else None

    delivery = TaskDelivery(
        task_unit_id=task_unit.id,
        worker_id=current_user.id,
        delivery_data=json.dumps(delivery_data.delivery_data, ensure_ascii=False) if isinstance(delivery_data.delivery_data, (dict, list)) else str(delivery_data.delivery_data),
        ip_address=ip_address,
        device_fingerprint=delivery_data.device_fingerprint,
        version=1
    )
    db.add(delivery)

    task_unit.status = TaskStatus.DELIVERED

    from app.models import OperationTrace
    trace = OperationTrace(
        user_id=current_user.id,
        task_unit_id=task_unit.id,
        operation="task_delivered",
        old_value=TaskStatus.IN_PROGRESS.value,
        new_value=TaskStatus.DELIVERED.value,
        ip_address=ip_address
    )
    db.add(trace)

    db.commit()
    db.refresh(delivery)

    anti_cheating_engine = AntiCheatingEngine(db)
    anti_cheating_engine.analyze_delivery(
        task_unit_id=task_unit.id,
        worker_id=current_user.id,
        ip_address=ip_address,
        device_fingerprint=delivery_data.device_fingerprint
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="task_delivered",
        resource="task_unit",
        resource_id=task_unit.id,
        details=f"交付任务: {task_unit.id}",
        ip_address=ip_address
    )

    return delivery
