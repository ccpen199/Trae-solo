from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import (
    Case, CaseMaterial, AuditRecord, User, ServiceItem
)
from app.auth import get_current_user, require_role
from app.state_machine import CaseStatus, ActionType, StateMachine
from app.routers.cases import _transition_case_status, _log_action, _record_status_history

router = APIRouter(prefix="/audits", tags=["审核"])


class AuditReviewRequest(BaseModel):
    case_id: int
    material_id: Optional[int] = None
    audit_result: str
    audit_opinion: Optional[str] = None
    correction_suggestion: Optional[str] = None


class CaseForAuditResponse(BaseModel):
    id: int
    case_number: str
    citizen_name: str
    citizen_id_card: str
    service_item_name: str
    department: str
    status: str
    status_text: str
    created_at: datetime
    materials: List[dict] = []

    class Config:
        from_attributes = True


@router.get("/pending", response_model=List[CaseForAuditResponse])
async def get_pending_audits(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["AUDITOR"])),
):
    query = select(Case).options(
        selectinload(Case.citizen),
        selectinload(Case.service_item),
        selectinload(Case.materials),
    ).where(
        Case.status == CaseStatus.MATERIAL_PRE_REVIEW.value
    ).order_by(Case.created_at.asc())

    result = await db.execute(query)
    cases = list(result.scalars().all())

    responses = []
    for case in cases:
        responses.append(
            CaseForAuditResponse(
                id=case.id,
                case_number=case.case_number,
                citizen_name=case.citizen.real_name if case.citizen else "",
                citizen_id_card=case.citizen.id_card if case.citizen else "",
                service_item_name=case.service_item.item_name if case.service_item else "",
                department=case.service_item.department if case.service_item else "",
                status=case.status,
                status_text=StateMachine.get_status_description(CaseStatus(case.status)),
                created_at=case.created_at,
                materials=[
                    {
                        "id": m.id,
                        "material_name": m.material_name,
                        "material_type": m.material_type,
                        "file_name": m.file_name,
                        "ocr_status": m.ocr_status,
                        "ocr_confidence": m.ocr_confidence,
                        "is_verified": m.is_verified,
                    }
                    for m in case.materials
                ],
            )
        )

    return responses


@router.get("/my", response_model=List[CaseForAuditResponse])
async def get_my_audits(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["AUDITOR"])),
):
    query = select(AuditRecord).options(
        selectinload(AuditRecord.case_obj),
        selectinload(AuditRecord.case_obj).selectinload(Case.citizen),
        selectinload(AuditRecord.case_obj).selectinload(Case.service_item),
        selectinload(AuditRecord.case_obj).selectinload(Case.materials),
    ).where(AuditRecord.auditor_id == current_user.id)

    query = query.order_by(AuditRecord.created_at.desc())
    result = await db.execute(query)
    audits = list(result.scalars().all())

    case_ids = {a.case_id for a in audits}
    responses = []
    added_case_ids = set()

    for audit in audits:
        if audit.case_id in added_case_ids:
            continue
        added_case_ids.add(audit.case_id)

        case = audit.case_obj
        if not case:
            continue

        if status and case.status != status:
            continue

        responses.append(
            CaseForAuditResponse(
                id=case.id,
                case_number=case.case_number,
                citizen_name=case.citizen.real_name if case.citizen else "",
                citizen_id_card=case.citizen.id_card if case.citizen else "",
                service_item_name=case.service_item.item_name if case.service_item else "",
                department=case.service_item.department if case.service_item else "",
                status=case.status,
                status_text=StateMachine.get_status_description(CaseStatus(case.status)),
                created_at=case.created_at,
                materials=[
                    {
                        "id": m.id,
                        "material_name": m.material_name,
                        "material_type": m.material_type,
                        "file_name": m.file_name,
                        "ocr_status": m.ocr_status,
                        "ocr_confidence": m.ocr_confidence,
                        "is_verified": m.is_verified,
                    }
                    for m in case.materials
                ],
            )
        )

    return responses


@router.post("/review")
async def review_case(
    request: AuditReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["AUDITOR"])),
):
    case_query = select(Case).options(
        selectinload(Case.materials)
    ).where(Case.id == request.case_id)
    case_result = await db.execute(case_query)
    case = case_result.scalar_one_or_none()

    if not case:
        raise HTTPException(status_code=404, detail="办件不存在")

    current_status = CaseStatus(case.status)
    if current_status != CaseStatus.MATERIAL_PRE_REVIEW:
        raise HTTPException(status_code=400, detail="当前状态不可审核")

    if request.audit_result not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="审核结果必须是 APPROVED 或 REJECTED")

    material = None
    if request.material_id:
        material_query = select(CaseMaterial).where(
            CaseMaterial.id == request.material_id,
            CaseMaterial.case_id == case.id,
        )
        material_result = await db.execute(material_query)
        material = material_result.scalar_one_or_none()

    audit = AuditRecord(
        case_id=case.id,
        auditor_id=current_user.id,
        material_id=request.material_id,
        audit_type="MATERIAL_PREVIEW",
        audit_result=request.audit_result,
        audit_opinion=request.audit_opinion,
        correction_suggestion=request.correction_suggestion,
    )
    db.add(audit)

    if request.audit_result == "APPROVED":
        case = await _transition_case_status(
            db, case, ActionType.AUDITOR_APPROVE, current_user, request.audit_opinion or "材料审核通过"
        )
        
        old_status = case.status
        case.status = CaseStatus.MATERIAL_APPROVED.value
        
        await _record_status_history(
            db,
            case.id,
            old_status,
            CaseStatus.MATERIAL_APPROVED.value,
            current_user.id,
            current_user.role,
            "材料审核通过，开启预约通道",
        )
        
        old_status = case.status
        case.status = CaseStatus.RESERVATION_AVAILABLE.value
        
        await _record_status_history(
            db,
            case.id,
            old_status,
            CaseStatus.RESERVATION_AVAILABLE.value,
            None,
            "SYSTEM",
            "系统自动开启预约通道",
        )

        await _log_action(
            db,
            "AUDIT_APPROVE",
            "材料审核通过",
            case.id,
            current_user.id,
            current_user.role,
            target_type="Case",
            target_id=case.id,
            after_data={
                "audit_opinion": request.audit_opinion,
                "new_status": CaseStatus.RESERVATION_AVAILABLE.value,
            },
        )
    else:
        case = await _transition_case_status(
            db, case, ActionType.AUDITOR_REJECT, current_user, request.audit_opinion or "材料需补正"
        )

        if material:
            material.is_verified = False
            material.verification_remark = request.correction_suggestion

        await _log_action(
            db,
            "AUDIT_REJECT",
            "材料审核驳回",
            case.id,
            current_user.id,
            current_user.role,
            target_type="Case",
            target_id=case.id,
            after_data={
                "audit_opinion": request.audit_opinion,
                "correction_suggestion": request.correction_suggestion,
            },
        )

    await db.commit()

    return {
        "success": True,
        "message": "审核完成",
        "case_id": case.id,
        "new_status": case.status,
        "new_status_text": StateMachine.get_status_description(CaseStatus(case.status)),
    }
