from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Case, Evaluation, User
from app.auth import get_current_user, require_role
from app.state_machine import CaseStatus, ActionType, StateMachine
from app.engines import satisfaction_index_engine
from app.routers.cases import _transition_case_status, _log_action

router = APIRouter(prefix="/evaluations", tags=["评价"])


class EvaluationCreateRequest(BaseModel):
    case_id: int
    overall_score: int
    attitude_score: Optional[int] = None
    efficiency_score: Optional[int] = None
    environment_score: Optional[int] = None
    comment: Optional[str] = None
    is_anonymous: bool = False


class EvaluationResponse(BaseModel):
    id: int
    case_id: int
    case_number: str
    service_item_name: str
    overall_score: int
    score_level: str
    attitude_score: Optional[int]
    efficiency_score: Optional[int]
    environment_score: Optional[int]
    comment: Optional[str]
    is_anonymous: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=EvaluationResponse)
async def submit_evaluation(
    request: EvaluationCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["CITIZEN"])),
):
    case_query = select(Case).options(
        selectinload(Case.service_item)
    ).where(
        Case.id == request.case_id,
        Case.citizen_id == current_user.id,
    )
    case_result = await db.execute(case_query)
    case = case_result.scalar_one_or_none()

    if not case:
        raise HTTPException(status_code=404, detail="办件不存在")

    current_status = CaseStatus(case.status)
    if current_status not in [CaseStatus.COMPLETED, CaseStatus.EVALUATED]:
        raise HTTPException(status_code=400, detail="当前状态不可评价")

    if current_status == CaseStatus.EVALUATED:
        raise HTTPException(status_code=400, detail="已提交过评价")

    result = await satisfaction_index_engine.submit_evaluation(
        db,
        case_id=case.id,
        citizen_id=current_user.id,
        overall_score=request.overall_score,
        attitude_score=request.attitude_score,
        efficiency_score=request.efficiency_score,
        environment_score=request.environment_score,
        comment=request.comment,
        is_anonymous=request.is_anonymous,
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "评价提交失败"),
        )

    case = await _transition_case_status(
        db, case, ActionType.SUBMIT_EVALUATION, current_user, "提交评价"
    )

    await _log_action(
        db,
        "SUBMIT_EVALUATION",
        f"提交评价: {request.overall_score}分",
        case.id,
        current_user.id,
        current_user.role,
        target_type="Evaluation",
        target_id=None,
        after_data={
            "overall_score": request.overall_score,
            "comment": request.comment,
        },
    )

    await db.commit()

    eval_data = result.get("evaluation", {})
    return EvaluationResponse(
        id=eval_data.get("id"),
        case_id=case.id,
        case_number=case.case_number,
        service_item_name=case.service_item.item_name if case.service_item else "",
        overall_score=request.overall_score,
        score_level=eval_data.get("score_level", ""),
        attitude_score=request.attitude_score,
        efficiency_score=request.efficiency_score,
        environment_score=request.environment_score,
        comment=request.comment,
        is_anonymous=request.is_anonymous,
        created_at=datetime.utcnow(),
    )


@router.get("/my", response_model=List[EvaluationResponse])
async def get_my_evaluations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["CITIZEN"])),
):
    query = select(Evaluation).options(
        selectinload(Evaluation.case_obj),
        selectinload(Evaluation.case_obj).selectinload(Case.service_item),
    ).where(Evaluation.citizen_id == current_user.id)

    query = query.order_by(Evaluation.created_at.desc())
    result = await db.execute(query)
    evaluations = list(result.scalars().all())

    responses = []
    for e in evaluations:
        responses.append(
            EvaluationResponse(
                id=e.id,
                case_id=e.case_id,
                case_number=e.case_obj.case_number if e.case_obj else "",
                service_item_name=e.case_obj.service_item.item_name if e.case_obj and e.case_obj.service_item else "",
                overall_score=e.overall_score,
                score_level=satisfaction_index_engine.SCORE_LEVELS.get(e.overall_score, {}).get("name", ""),
                attitude_score=e.attitude_score,
                efficiency_score=e.efficiency_score,
                environment_score=e.environment_score,
                comment=e.comment,
                is_anonymous=e.is_anonymous,
                created_at=e.created_at,
            )
        )

    return responses


@router.get("/stats")
async def get_evaluation_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    service_item_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "AUDITOR"])),
):
    from datetime import datetime as dt

    start = None
    end = None
    if start_date:
        start = dt.strptime(start_date, "%Y-%m-%d").date()
    if end_date:
        end = dt.strptime(end_date, "%Y-%m-%d").date()

    stats = await satisfaction_index_engine.get_evaluation_stats(
        db, start, end, service_item_id
    )

    return stats


@router.get("/dashboard")
async def get_dashboard_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "AUDITOR"])),
):
    data = await satisfaction_index_engine.get_dashboard_data(db)
    return data


@router.get("/ranking")
async def get_service_item_ranking(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    top_n: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "AUDITOR"])),
):
    from datetime import datetime as dt

    start = None
    end = None
    if start_date:
        start = dt.strptime(start_date, "%Y-%m-%d").date()
    if end_date:
        end = dt.strptime(end_date, "%Y-%m-%d").date()

    ranking = await satisfaction_index_engine.get_service_item_ranking(
        db, start, end, top_n
    )

    return {"ranking": ranking}
