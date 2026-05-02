from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import User, UserRole, ReviewResult
from app.schemas import (
    TaskUnitResponse, ExpertReviewCreate, ExpertReviewResponse
)
from app.auth import get_current_user, require_roles, create_audit_log
from app.engines import AuditWorkflowEngine

router = APIRouter(prefix="/experts", tags=["专家"])


@router.get("/tasks/pending", response_model=List[TaskUnitResponse])
def get_pending_reviews(
    current_user: User = Depends(require_roles(UserRole.EXPERT)),
    db: Session = Depends(get_db)
):
    """
    获取待审核任务列表
    """
    engine = AuditWorkflowEngine(db)
    tasks = engine.get_expert_pending_reviews(expert_id=current_user.id)
    return tasks


@router.post("/reviews", response_model=ExpertReviewResponse)
def submit_review(
    review_data: ExpertReviewCreate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.EXPERT)),
    db: Session = Depends(get_db)
):
    """
    提交审核结果
    """
    engine = AuditWorkflowEngine(db)
    success, message = engine.submit_review(
        expert_id=current_user.id,
        task_unit_id=review_data.task_unit_id,
        result=review_data.result,
        score=review_data.score,
        comments=review_data.comments
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    from app.models import ExpertReview
    review = db.query(ExpertReview).filter(
        ExpertReview.task_unit_id == review_data.task_unit_id,
        ExpertReview.expert_id == current_user.id
    ).first()

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="review_submitted",
        resource="expert_review",
        resource_id=review.id if review else None,
        details=f"提交审核: 任务ID {review_data.task_unit_id}, 结果: {review_data.result.value}",
        ip_address=request.client.host if request.client else None
    )

    return review


@router.get("/tasks/{task_id}/detail")
def get_task_detail_for_audit(
    task_id: int,
    current_user: User = Depends(require_roles(UserRole.EXPERT, UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    获取任务详情（用于审核，包含全轨迹）
    """
    engine = AuditWorkflowEngine(db)
    detail = engine.get_task_detail_for_audit(task_unit_id=task_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="任务不存在"
        )
    return detail
