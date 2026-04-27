from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.services.quality_service import QualityService
from app.services.rule_engine import quality_rule_engine
from app.schemas import (
    QualityInspectionCreate,
    QualityInspectionResponse,
    TestResultsSubmit,
    RuleEvaluationResponse,
    ApiResponse,
)

router = APIRouter(prefix="/quality", tags=["质量检测"])


@router.post("/inspections", response_model=QualityInspectionResponse)
async def create_quality_inspection(
    inspection_data: QualityInspectionCreate,
    session: AsyncSession = Depends(get_session),
):
    service = QualityService(session)
    try:
        inspection = await service.create_inspection(
            batch_uid=inspection_data.batch_uid,
            inspector_uid=inspection_data.inspector_uid,
            inspector_name=inspection_data.inspector_name,
            lab_name=inspection_data.lab_name,
            lab_code=inspection_data.lab_code,
            sampling_time=inspection_data.sampling_time,
            sample_count=inspection_data.sample_count,
            sample_location=inspection_data.sample_location,
            extra_data=inspection_data.metadata,
        )
        await session.commit()
        return inspection
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/inspections/{inspection_uid}", response_model=QualityInspectionResponse)
async def get_quality_inspection(
    inspection_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = QualityService(session)
    inspection = await service.get_inspection_by_uid(inspection_uid)
    if not inspection:
        raise HTTPException(status_code=404, detail="质检记录不存在")
    return inspection


@router.get("/inspections/code/{inspection_code}", response_model=QualityInspectionResponse)
async def get_quality_inspection_by_code(
    inspection_code: str,
    session: AsyncSession = Depends(get_session),
):
    service = QualityService(session)
    inspection = await service.get_inspection_by_code(inspection_code)
    if not inspection:
        raise HTTPException(status_code=404, detail="质检记录不存在")
    return inspection


@router.get("/batch/{batch_uid}", response_model=List[QualityInspectionResponse])
async def get_quality_inspections_by_batch(
    batch_uid: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    service = QualityService(session)
    inspections = await service.get_inspections_by_batch(
        batch_uid=batch_uid,
        limit=limit,
        offset=offset,
    )
    return inspections


@router.post("/inspections/{inspection_uid}/start-testing", response_model=QualityInspectionResponse)
async def start_testing(
    inspection_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = QualityService(session)
    inspection = await service.start_testing(inspection_uid)
    
    if not inspection:
        raise HTTPException(status_code=404, detail="质检记录不存在或状态不允许")
    
    await session.commit()
    return inspection


@router.post("/inspections/{inspection_uid}/submit-results", response_model=RuleEvaluationResponse)
async def submit_test_results(
    inspection_uid: str,
    results_data: TestResultsSubmit,
    session: AsyncSession = Depends(get_session),
):
    service = QualityService(session)
    
    try:
        result = await service.submit_test_results(
            inspection_uid=inspection_uid,
            pesticide_results=results_data.pesticide_results,
            heavy_metal_results=results_data.heavy_metal_results,
            result_description=results_data.result_description,
            report_attachment_url=results_data.report_attachment_url,
        )
        await session.commit()
        
        return RuleEvaluationResponse(
            success=result.success,
            rule_name=result.rule_name,
            message=result.message,
            failed_items=result.failed_items,
            passed_items=result.passed_items,
            details=result.details,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/inspections/{inspection_uid}/re-inspection", response_model=QualityInspectionResponse)
async def request_re_inspection(
    inspection_uid: str,
    reason: str,
    session: AsyncSession = Depends(get_session),
):
    service = QualityService(session)
    inspection = await service.request_re_inspection(inspection_uid, reason)
    
    if not inspection:
        raise HTTPException(status_code=404, detail="质检记录不存在或状态不允许")
    
    await session.commit()
    return inspection


@router.post("/inspections/{inspection_uid}/reject", response_model=QualityInspectionResponse)
async def reject_inspection(
    inspection_uid: str,
    reason: str,
    session: AsyncSession = Depends(get_session),
):
    service = QualityService(session)
    inspection = await service.reject_inspection(inspection_uid, reason)
    
    if not inspection:
        raise HTTPException(status_code=404, detail="质检记录不存在")
    
    await session.commit()
    return inspection


@router.get("/batch/{batch_uid}/history")
async def get_batch_quality_history(
    batch_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = QualityService(session)
    history = await service.get_batch_quality_history(batch_uid)
    return history


@router.get("/rules/standards")
async def get_quality_standards():
    from app.config import settings
    
    heavy_metal_rules = {
        "铅": 0.3,
        "镉": 0.05,
        "砷": 0.5,
        "汞": 0.01,
    }
    
    return {
        "pesticide_standards": settings.GB2763_PESTICIDE_THRESHOLDS,
        "heavy_metal_standards": heavy_metal_rules,
        "standard_reference": "GB 2763-2021 食品安全国家标准 食品中农药最大残留限量",
    }


@router.post("/rules/evaluate", response_model=RuleEvaluationResponse)
async def evaluate_pesticide_results(
    pesticide_results: dict,
    session: AsyncSession = Depends(get_session),
):
    result = quality_rule_engine.evaluate_pesticide_results(pesticide_results)
    
    return RuleEvaluationResponse(
        success=result.success,
        rule_name=result.rule_name,
        message=result.message,
        failed_items=result.failed_items,
        passed_items=result.passed_items,
        details=result.details,
    )
