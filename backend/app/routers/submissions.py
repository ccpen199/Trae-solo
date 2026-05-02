from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import Depends, HTTPException, status, APIRouter, Request, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import (
    get_db, User, FormDefinition, FormField, FormSubmission, SubmissionHistory, Notification
)
from app.routers.auth import get_current_user
from app.services.modeling_engine import ModelingEngine
from app.services.state_machine import state_machine, rules_engine, SubmissionStatus
from app.services.audit_service import audit_service, notification_service, report_service
from app.services.dsl_engine import dsl_engine
from app.config import settings
import json
import os

router = APIRouter(prefix="/api/submissions", tags=["表单填报"])


class SubmissionCreate(BaseModel):
    form_id: Optional[int] = None
    form_code: Optional[str] = None
    data: Dict[str, Any]
    save_as_draft: bool = False


class SubmissionUpdate(BaseModel):
    data: Dict[str, Any]


class SubmissionResponse(BaseModel):
    id: int
    form_id: int
    user_id: int
    submission_data: Dict[str, Any]
    status: str
    version: int
    created_at: datetime
    updated_at: Optional[datetime]
    submitted_at: Optional[datetime]
    
    class Config:
        from_attributes = True


@router.post("", response_model=Dict[str, Any])
def create_submission(
    request: Request,
    submission_data: SubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    form_id = submission_data.form_id
    form = None
    
    if form_id:
        form = db.query(FormDefinition).filter(FormDefinition.id == form_id).first()
    elif submission_data.form_code:
        form = db.query(FormDefinition).filter(
            FormDefinition.code == submission_data.form_code,
            FormDefinition.status == "published"
        ).first()
        if form:
            form_id = form.id
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="表单不存在或未发布"
        )
    
    if form.status != "published":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="表单未发布，无法填报"
        )
    
    fields = db.query(FormField).filter(FormField.form_id == form_id).all()
    fields_config = [{
        "field_name": f.field_name,
        "field_type": f.field_type,
        "is_required": f.is_required,
        "is_unique": f.is_unique,
        "validation_rules": f.validation_rules,
        "options": f.options
    } for f in fields]
    
    schema = form.schema_json or {}
    
    validation_result = rules_engine.validate_data(
        submission_data.data,
        fields_config,
        schema
    )
    
    from app.database import FormLogic
    logics = db.query(FormLogic).filter(
        FormLogic.form_id == form_id,
        FormLogic.is_active == True
    ).all()
    
    for logic in logics:
        if logic.ast_json and "rules" in logic.ast_json:
            logic_validation = dsl_engine.validate_data(
                logic.ast_json,
                submission_data.data,
                schema
            )
            if not logic_validation["valid"]:
                validation_result["valid"] = False
                validation_result["field_errors"].update(
                    {e["field"]: [e] for e in logic_validation["errors"]}
                )
    
    if not submission_data.save_as_draft and not validation_result["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "数据校验失败",
                "errors": validation_result
            }
        )
    
    submission_status = SubmissionStatus.DRAFT if submission_data.save_as_draft else SubmissionStatus.SUBMITTED
    
    submission = FormSubmission(
        form_id=form_id,
        user_id=current_user.id,
        submission_data=submission_data.data,
        status=submission_status,
        version=1,
        submitted_at=datetime.utcnow() if not submission_data.save_as_draft else None
    )
    db.add(submission)
    db.flush()
    
    history = SubmissionHistory(
        submission_id=submission.id,
        version=1,
        data_snapshot=submission_data.data,
        status=submission_status,
        created_by=current_user.id
    )
    db.add(history)
    
    if not submission_data.save_as_draft:
        data_id = ModelingEngine.insert_data(
            table_name=form.table_name,
            form_id=form_id,
            user_id=current_user.id,
            data=submission_data.data,
            submission_id=submission.id
        )
    
    db.commit()
    db.refresh(submission)
    
    action = "submit" if not submission_data.save_as_draft else "create"
    audit_service.log(
        db,
        user_id=current_user.id,
        action=action,
        resource_type="submission",
        resource_id=submission.id,
        details={
            "form_id": form_id,
            "form_name": form.name,
            "status": submission_status,
            "data_keys": list(submission_data.data.keys())
        },
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    if not submission_data.save_as_draft:
        notification_service.create(
            db,
            user_id=form.creator_id,
            title=f"新表单提交: {form.name}",
            content=f"用户 {current_user.username} 提交了新的表单数据，请查看。",
            notification_type="info",
            resource_type="submission",
            resource_id=submission.id
        )
    
    return {
        "id": submission.id,
        "status": submission.status,
        "version": submission.version,
        "message": "保存成功" if submission_data.save_as_draft else "提交成功"
    }


@router.get("", response_model=Dict[str, Any])
def list_submissions(
    form_id: Optional[int] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(FormSubmission)
    
    if form_id:
        query = query.filter(FormSubmission.form_id == form_id)
    if status:
        query = query.filter(FormSubmission.status == status)
    
    if current_user.role != "admin":
        query = query.filter(FormSubmission.user_id == current_user.id)
    
    total = query.count()
    submissions = query.order_by(
        FormSubmission.updated_at.desc()
    ).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": [{
            "id": s.id,
            "form_id": s.form_id,
            "user_id": s.user_id,
            "status": s.status,
            "version": s.version,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None
        } for s in submissions]
    }


@router.get("/{submission_id}", response_model=Dict[str, Any])
def get_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提交记录不存在"
        )
    
    if current_user.role != "admin" and submission.user_id != current_user.id:
        form = db.query(FormDefinition).filter(FormDefinition.id == submission.form_id).first()
        if not form or form.creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权限查看此提交记录"
            )
    
    histories = db.query(SubmissionHistory).filter(
        SubmissionHistory.submission_id == submission_id
    ).order_by(SubmissionHistory.version.desc()).all()
    
    return {
        "id": submission.id,
        "form_id": submission.form_id,
        "user_id": submission.user_id,
        "data": submission.submission_data,
        "status": submission.status,
        "version": submission.version,
        "created_at": submission.created_at.isoformat() if submission.created_at else None,
        "updated_at": submission.updated_at.isoformat() if submission.updated_at else None,
        "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
        "histories": [{
            "version": h.version,
            "status": h.status,
            "data": h.data_snapshot,
            "created_at": h.created_at.isoformat() if h.created_at else None
        } for h in histories]
    }


@router.put("/{submission_id}", response_model=Dict[str, Any])
def update_submission(
    request: Request,
    submission_id: int,
    update_data: SubmissionUpdate,
    save_as_draft: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提交记录不存在"
        )
    
    if current_user.role != "admin" and submission.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限修改此提交记录"
        )
    
    form = db.query(FormDefinition).filter(FormDefinition.id == submission.form_id).first()
    
    fields = db.query(FormField).filter(FormField.form_id == submission.form_id).all()
    fields_config = [{
        "field_name": f.field_name,
        "field_type": f.field_type,
        "is_required": f.is_required,
        "validation_rules": f.validation_rules,
        "options": f.options
    } for f in fields]
    
    schema = form.schema_json or {}
    
    if not save_as_draft:
        validation_result = rules_engine.validate_data(
            update_data.data,
            fields_config,
            schema
        )
        if not validation_result["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "数据校验失败", "errors": validation_result}
            )
    
    old_version = submission.version
    submission.submission_data = update_data.data
    submission.version = old_version + 1
    submission.updated_at = datetime.utcnow()
    
    new_status = SubmissionStatus.DRAFT if save_as_draft else SubmissionStatus.SUBMITTED
    submission.status = new_status
    if not save_as_draft:
        submission.submitted_at = datetime.utcnow()
    
    history = SubmissionHistory(
        submission_id=submission.id,
        version=submission.version,
        data_snapshot=update_data.data,
        status=new_status,
        created_by=current_user.id
    )
    db.add(history)
    
    db.commit()
    db.refresh(submission)
    
    audit_service.log(
        db,
        user_id=current_user.id,
        action="update",
        resource_type="submission",
        resource_id=submission.id,
        details={
            "old_version": old_version,
            "new_version": submission.version,
            "status": new_status
        },
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    return {
        "id": submission.id,
        "status": submission.status,
        "version": submission.version,
        "message": "更新成功"
    }


@router.post("/{submission_id}/approve")
def approve_submission(
    request: Request,
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提交记录不存在"
        )
    
    can_transition, new_status = state_machine.can_transition_submission(submission.status, "approve")
    if not can_transition:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无法从当前状态 {submission.status} 进行审批操作"
        )
    
    submission.status = new_status
    submission.updated_at = datetime.utcnow()
    
    history = SubmissionHistory(
        submission_id=submission.id,
        version=submission.version,
        data_snapshot=submission.submission_data,
        status=new_status,
        change_reason="审批通过",
        created_by=current_user.id
    )
    db.add(history)
    db.commit()
    
    audit_service.log(
        db,
        user_id=current_user.id,
        action="approve",
        resource_type="submission",
        resource_id=submission.id,
        details={"old_status": submission.status, "new_status": new_status},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    notification_service.create(
        db,
        user_id=submission.user_id,
        title="表单审批通过",
        content=f"您提交的表单已被审批通过。",
        notification_type="success",
        resource_type="submission",
        resource_id=submission.id
    )
    
    return {"message": "审批通过", "status": new_status}


@router.post("/{submission_id}/reject")
def reject_submission(
    request: Request,
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提交记录不存在"
        )
    
    can_transition, new_status = state_machine.can_transition_submission(submission.status, "reject")
    if not can_transition:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无法从当前状态 {submission.status} 进行驳回操作"
        )
    
    submission.status = new_status
    submission.updated_at = datetime.utcnow()
    
    history = SubmissionHistory(
        submission_id=submission.id,
        version=submission.version,
        data_snapshot=submission.submission_data,
        status=new_status,
        change_reason="驳回",
        created_by=current_user.id
    )
    db.add(history)
    db.commit()
    
    audit_service.log(
        db,
        user_id=current_user.id,
        action="reject",
        resource_type="submission",
        resource_id=submission.id,
        details={"old_status": submission.status, "new_status": new_status},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    notification_service.create(
        db,
        user_id=submission.user_id,
        title="表单被驳回",
        content=f"您提交的表单已被驳回，请修改后重新提交。",
        notification_type="warning",
        resource_type="submission",
        resource_id=submission.id
    )
    
    return {"message": "已驳回", "status": new_status}


@router.get("/{submission_id}/history/{version}")
def get_submission_version(
    submission_id: int,
    version: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提交记录不存在"
        )
    
    if current_user.role != "admin" and submission.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限查看此提交记录"
        )
    
    history = db.query(SubmissionHistory).filter(
        SubmissionHistory.submission_id == submission_id,
        SubmissionHistory.version == version
    ).first()
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"版本 {version} 不存在"
        )
    
    return {
        "submission_id": submission_id,
        "version": version,
        "status": history.status,
        "data": history.data_snapshot,
        "change_reason": history.change_reason,
        "created_at": history.created_at.isoformat() if history.created_at else None
    }
