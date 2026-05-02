from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import (
    Case, CaseMaterial, ServiceItem, User, StatusHistory, ActionLog, Reservation
)
from app.auth import get_current_user, require_role
from app.state_machine import CaseStatus, ActionType, StateMachine
from app.engines import service_standard_engine, doc_ocr_engine, time_slot_engine
import aiofiles
import os
import uuid

router = APIRouter(prefix="/cases", tags=["办件"])

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class CaseCreateRequest(BaseModel):
    service_item_id: int


class CaseResponse(BaseModel):
    id: int
    case_number: str
    service_item_id: int
    service_item_name: Optional[str] = None
    status: str
    status_text: str
    current_step: int
    application_data: dict
    is_urgent: bool
    created_at: datetime
    updated_at: Optional[datetime]
    completed_at: Optional[datetime]
    allowed_actions: List[str]

    class Config:
        from_attributes = True


class CaseDetailResponse(CaseResponse):
    materials: List[dict] = []
    audits: List[dict] = []
    reservation: Optional[dict] = None
    status_histories: List[dict] = []


def _generate_case_number() -> str:
    now = datetime.now()
    timestamp = now.strftime("%Y%m%d%H%M%S")
    random_suffix = str(uuid.uuid4().hex)[:4].upper()
    return f"CASE{timestamp}{random_suffix}"


async def _log_action(
    db: AsyncSession,
    action_type: str,
    action_name: str,
    case_id: Optional[int],
    operator_id: Optional[int],
    operator_role: Optional[str],
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    before_data: Optional[dict] = None,
    after_data: Optional[dict] = None,
    remark: Optional[str] = None,
):
    action = ActionLog(
        action_type=action_type,
        action_name=action_name,
        case_id=case_id,
        operator_id=operator_id,
        operator_role=operator_role,
        target_type=target_type,
        target_id=target_id,
        before_data=before_data,
        after_data=after_data,
        remark=remark,
    )
    db.add(action)


async def _record_status_history(
    db: AsyncSession,
    case_id: int,
    from_status: Optional[str],
    to_status: str,
    operator_id: Optional[int],
    operator_role: Optional[str],
    reason: Optional[str] = None,
    snapshot_data: Optional[dict] = None,
):
    history = StatusHistory(
        case_id=case_id,
        from_status=from_status,
        to_status=to_status,
        operator_id=operator_id,
        operator_role=operator_role,
        reason=reason,
        snapshot_data=snapshot_data,
    )
    db.add(history)


async def _transition_case_status(
    db: AsyncSession,
    case: Case,
    action: ActionType,
    operator: User,
    reason: Optional[str] = None,
) -> Case:
    current_status = CaseStatus(case.status)

    if not StateMachine.can_transition(current_status, action, operator.role):
        raise HTTPException(
            status_code=400,
            detail=f"当前状态下无法执行此操作: {current_status.value} -> {action.value}",
        )

    next_status = StateMachine.get_next_status(current_status, action)
    if not next_status:
        raise HTTPException(status_code=400, detail="无法确定下一个状态")

    old_status = case.status
    case.status = next_status.value

    await _record_status_history(
        db,
        case.id,
        old_status,
        next_status.value,
        operator.id,
        operator.role,
        reason,
        {"application_data": case.application_data},
    )

    await _log_action(
        db,
        action.value,
        f"状态变更: {old_status} -> {next_status.value}",
        case.id,
        operator.id,
        operator.role,
        target_type="Case",
        target_id=case.id,
        before_data={"status": old_status},
        after_data={"status": next_status.value},
        remark=reason,
    )

    return case


@router.post("", response_model=CaseResponse)
async def create_case(
    request: CaseCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["CITIZEN"])),
):
    item_query = select(ServiceItem).where(ServiceItem.id == request.service_item_id)
    item_result = await db.execute(item_query)
    service_item = item_result.scalar_one_or_none()

    if not service_item:
        raise HTTPException(status_code=404, detail="服务事项不存在")

    if not service_item.is_active:
        raise HTTPException(status_code=400, detail="该事项已暂停办理")

    case = Case(
        case_number=_generate_case_number(),
        citizen_id=current_user.id,
        service_item_id=request.service_item_id,
        status=CaseStatus.DRAFT.value,
        current_step=1,
        application_data={},
    )
    db.add(case)
    await db.commit()
    await db.refresh(case)

    await _record_status_history(
        db,
        case.id,
        None,
        CaseStatus.DRAFT.value,
        current_user.id,
        current_user.role,
        "创建办件",
    )

    await _log_action(
        db,
        "CREATE_CASE",
        "创建办件",
        case.id,
        current_user.id,
        current_user.role,
        target_type="Case",
        target_id=case.id,
        after_data={
            "case_number": case.case_number,
            "service_item_id": service_item.id,
            "service_item_name": service_item.item_name,
        },
    )

    allowed_actions = StateMachine.get_allowed_actions(CaseStatus.DRAFT, current_user.role)

    return CaseResponse(
        id=case.id,
        case_number=case.case_number,
        service_item_id=case.service_item_id,
        service_item_name=service_item.item_name,
        status=case.status,
        status_text=StateMachine.get_status_description(CaseStatus(case.status)),
        current_step=case.current_step,
        application_data=case.application_data,
        is_urgent=case.is_urgent,
        created_at=case.created_at,
        updated_at=case.updated_at,
        completed_at=case.completed_at,
        allowed_actions=[a.value for a in allowed_actions],
    )


@router.get("", response_model=List[CaseResponse])
async def get_my_cases(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Case).options(
        selectinload(Case.service_item)
    ).where(Case.citizen_id == current_user.id)

    if status:
        query = query.where(Case.status == status)

    query = query.order_by(Case.created_at.desc())
    result = await db.execute(query)
    cases = list(result.scalars().all())

    responses = []
    for case in cases:
        allowed_actions = StateMachine.get_allowed_actions(
            CaseStatus(case.status), current_user.role
        )
        responses.append(
            CaseResponse(
                id=case.id,
                case_number=case.case_number,
                service_item_id=case.service_item_id,
                service_item_name=case.service_item.item_name if case.service_item else None,
                status=case.status,
                status_text=StateMachine.get_status_description(CaseStatus(case.status)),
                current_step=case.current_step,
                application_data=case.application_data,
                is_urgent=case.is_urgent,
                created_at=case.created_at,
                updated_at=case.updated_at,
                completed_at=case.completed_at,
                allowed_actions=[a.value for a in allowed_actions],
            )
        )

    return responses


@router.get("/{case_id}", response_model=CaseDetailResponse)
async def get_case_detail(
    case_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Case).options(
        selectinload(Case.service_item),
        selectinload(Case.materials),
        selectinload(Case.audits),
        selectinload(Case.reservation),
        selectinload(Case.status_histories),
    ).where(Case.id == case_id)

    result = await db.execute(query)
    case = result.scalar_one_or_none()

    if not case:
        raise HTTPException(status_code=404, detail="办件不存在")

    if current_user.role == "CITIZEN" and case.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权查看此办件")

    allowed_actions = StateMachine.get_allowed_actions(
        CaseStatus(case.status), current_user.role
    )

    return CaseDetailResponse(
        id=case.id,
        case_number=case.case_number,
        service_item_id=case.service_item_id,
        service_item_name=case.service_item.item_name if case.service_item else None,
        status=case.status,
        status_text=StateMachine.get_status_description(CaseStatus(case.status)),
        current_step=case.current_step,
        application_data=case.application_data,
        is_urgent=case.is_urgent,
        created_at=case.created_at,
        updated_at=case.updated_at,
        completed_at=case.completed_at,
        allowed_actions=[a.value for a in allowed_actions],
        materials=[
            {
                "id": m.id,
                "material_name": m.material_name,
                "material_type": m.material_type,
                "file_name": m.file_name,
                "file_size": m.file_size,
                "ocr_status": m.ocr_status,
                "ocr_confidence": m.ocr_confidence,
                "is_verified": m.is_verified,
                "verification_remark": m.verification_remark,
                "created_at": m.created_at,
            }
            for m in case.materials
        ],
        audits=[
            {
                "id": a.id,
                "audit_type": a.audit_type,
                "audit_result": a.audit_result,
                "audit_opinion": a.audit_opinion,
                "correction_suggestion": a.correction_suggestion,
                "created_at": a.created_at,
            }
            for a in case.audits
        ],
        reservation={
            "id": case.reservation.id,
            "reservation_number": case.reservation.reservation_number,
            "status": case.reservation.status,
            "check_in_time": case.reservation.check_in_time,
        } if case.reservation else None,
        status_histories=[
            {
                "id": h.id,
                "from_status": h.from_status,
                "to_status": h.to_status,
                "operator_role": h.operator_role,
                "reason": h.reason,
                "created_at": h.created_at,
            }
            for h in case.status_histories
        ],
    )


@router.post("/{case_id}/submit-materials")
async def submit_materials(
    case_id: int,
    background_tasks: BackgroundTasks,
    material_type: str = Form(...),
    material_name: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["CITIZEN"])),
):
    query = select(Case).options(
        selectinload(Case.service_item)
    ).where(Case.id == case_id, Case.citizen_id == current_user.id)
    result = await db.execute(query)
    case = result.scalar_one_or_none()

    if not case:
        raise HTTPException(status_code=404, detail="办件不存在")

    current_status = CaseStatus(case.status)
    if current_status not in [CaseStatus.DRAFT, CaseStatus.MATERIAL_REJECTED]:
        raise HTTPException(status_code=400, detail="当前状态无法提交材料")

    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".pdf"
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    file_content = await file.read()
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(file_content)

    material = CaseMaterial(
        case_id=case.id,
        material_name=material_name,
        material_type=material_type,
        file_path=file_path,
        file_name=file.filename,
        file_size=len(file_content),
        ocr_status="PENDING",
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)

    if current_status == CaseStatus.DRAFT:
        case = await _transition_case_status(
            db, case, ActionType.SUBMIT_MATERIAL, current_user, "提交申请材料"
        )
    elif current_status == CaseStatus.MATERIAL_REJECTED:
        case = await _transition_case_status(
            db, case, ActionType.SUBMIT_MATERIAL, current_user, "重新提交补正材料"
        )

    background_tasks.add_task(
        _process_ocr_task, db, material.id, file_path, material_type, file.filename or ""
    )

    await _log_action(
        db,
        "UPLOAD_MATERIAL",
        f"上传材料: {material_name}",
        case.id,
        current_user.id,
        current_user.role,
        target_type="CaseMaterial",
        target_id=material.id,
        after_data={
            "material_name": material_name,
            "material_type": material_type,
            "file_name": file.filename,
        },
    )

    await db.commit()

    return {
        "success": True,
        "message": "材料已提交，OCR处理中",
        "material": {
            "id": material.id,
            "material_name": material.material_name,
            "material_type": material.material_type,
            "ocr_status": material.ocr_status,
        },
        "case_status": case.status,
    }


async def _process_ocr_task(
    db: AsyncSession,
    material_id: int,
    file_path: str,
    material_type: str,
    file_name: str,
):
    import asyncio

    await asyncio.sleep(2)

    async with async_session_maker() as session:
        try:
            query = select(CaseMaterial).where(CaseMaterial.id == material_id)
            result = await session.execute(query)
            material = result.scalar_one_or_none()

            if not material:
                return

            material.ocr_status = "PROCESSING"
            await session.commit()

            ocr_result = await doc_ocr_engine.process_document(
                file_path, material_type, file_name
            )

            material.ocr_result = ocr_result.get("ocr_result")
            material.ocr_confidence = ocr_result.get("confidence")
            material.ocr_status = ocr_result.get("status")
            material.is_verified = ocr_result.get("status") == "SUCCESS"

            case_query = select(Case).where(Case.id == material.case_id)
            case_result = await session.execute(case_query)
            case = case_result.scalar_one_or_none()

            if case and case.status == CaseStatus.MATERIAL_SUBMITTED.value:
                old_status = case.status
                case.status = CaseStatus.OCR_PROCESSING.value

                await _record_status_history(
                    session,
                    case.id,
                    old_status,
                    CaseStatus.OCR_PROCESSING.value,
                    None,
                    "SYSTEM",
                    "OCR引擎开始处理",
                )

                await session.commit()

                await asyncio.sleep(1)

                old_status = case.status
                case.status = CaseStatus.MATERIAL_PRE_REVIEW.value

                await _record_status_history(
                    session,
                    case.id,
                    old_status,
                    CaseStatus.MATERIAL_PRE_REVIEW.value,
                    None,
                    "SYSTEM",
                    "OCR处理完成，进入材料预审",
                )

                await _log_action(
                    session,
                    "OCR_COMPLETE",
                    "OCR处理完成",
                    case.id,
                    None,
                    "SYSTEM",
                    target_type="CaseMaterial",
                    target_id=material.id,
                    after_data={
                        "ocr_status": material.ocr_status,
                        "ocr_confidence": material.ocr_confidence,
                    },
                )

            await session.commit()
        except Exception as e:
            print(f"OCR处理错误: {e}")
            await session.rollback()


from app.database import async_session_maker
