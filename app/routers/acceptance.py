from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.services.acceptance import (
    acceptance_engine,
    AcceptanceCriterion,
    AcceptanceCategory,
)
from app.schemas import (
    AcceptanceCriterionResponse,
    AcceptanceReportResponse,
    ApiResponse,
)

router = APIRouter(prefix="/acceptance", tags=["验收口径"])


@router.get("/criteria")
async def get_acceptance_criteria(
    category: Optional[AcceptanceCategory] = Query(None),
):
    if category:
        criteria = acceptance_engine.get_criteria_by_category(category)
    else:
        criteria = acceptance_engine.get_all_criteria()
    
    return {
        "total": len(criteria),
        "criteria": [
            AcceptanceCriterionResponse(
                code=c.code,
                name=c.name,
                category=c.category.value,
                description=c.description,
                required=c.required,
                severity=c.severity,
            )
            for c in criteria
        ],
    }


@router.get("/criteria/{code}")
async def get_acceptance_criterion(code: str):
    criterion = acceptance_engine.get_criterion(code)
    if not criterion:
        raise HTTPException(status_code=404, detail="验收标准不存在")
    
    return AcceptanceCriterionResponse(
        code=criterion.code,
        name=criterion.name,
        category=criterion.category.value,
        description=criterion.description,
        required=criterion.required,
        severity=criterion.severity,
    )


@router.post("/check/{batch_uid}")
async def run_acceptance_check(
    batch_uid: str,
    categories: Optional[List[AcceptanceCategory]] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    from app.services.batch_service import BatchService
    
    batch_service = BatchService(session)
    batch = await batch_service.get_batch_by_uid(batch_uid)
    
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    
    report = await acceptance_engine.run_acceptance_check(
        batch_uid=batch_uid,
        batch_code=batch.batch_code,
        context={
            "session": session,
            "batch": batch,
        },
        category_filter=categories,
    )
    
    return AcceptanceReportResponse(
        batch_uid=report.batch_uid,
        batch_code=report.batch_code,
        overall_passed=report.overall_passed,
        passed_count=report.passed_count,
        failed_count=report.failed_count,
        required_failed_count=report.required_failed_count,
        success_rate=report.success_rate,
        results=[
            {
                "criterion_code": r.criterion_code,
                "criterion_name": r.criterion_name,
                "category": r.category.value if hasattr(r.category, 'value') else str(r.category),
                "passed": r.passed,
                "message": r.message,
                "details": r.details,
                "timestamp": r.timestamp,
            }
            for r in report.results
        ],
        generated_at=report.generated_at,
    )


@router.get("/categories")
async def get_acceptance_categories():
    return {
        "categories": [
            {
                "type": category.value,
                "name": {
                    AcceptanceCategory.FARMING: "农事作业",
                    AcceptanceCategory.QUALITY: "质量检测",
                    AcceptanceCategory.FLOW: "流通追踪",
                    AcceptanceCategory.BATCH: "批次管理",
                    AcceptanceCategory.RECALL: "质量召回",
                    AcceptanceCategory.TAG: "标签管理",
                }.get(category, category.value),
                "description": {
                    AcceptanceCategory.FARMING: "农事记录完整性、地理位置、数字时间戳等验收",
                    AcceptanceCategory.QUALITY: "质检报告、农残检测、重金属检测等验收",
                    AcceptanceCategory.FLOW: "流通记录、扫码交接、温湿度记录等验收",
                    AcceptanceCategory.BATCH: "批次UID唯一、状态有效性、编码规范等验收",
                    AcceptanceCategory.RECALL: "召回流程、终端定位等验收",
                    AcceptanceCategory.TAG: "标签数据一致性、数量匹配等验收",
                }.get(category, ""),
            }
            for category in AcceptanceCategory
        ]
    }


@router.get("/severities")
async def get_severity_levels():
    return {
        "severities": [
            {
                "level": "critical",
                "name": "致命",
                "description": "系统核心功能不可用，必须立即修复",
            },
            {
                "level": "high",
                "name": "高",
                "description": "影响主要业务流程，需要优先修复",
            },
            {
                "level": "medium",
                "name": "中",
                "description": "影响部分功能，建议修复",
            },
            {
                "level": "low",
                "name": "低",
                "description": "不影响核心功能，可选择性修复",
            },
        ]
    }


@router.get("/summary/{batch_uid}")
async def get_acceptance_summary(
    batch_uid: str,
    session: AsyncSession = Depends(get_session),
):
    from app.services.batch_service import BatchService
    from app.services.farming_service import FarmingService
    from app.services.quality_service import QualityService
    from app.services.flow_service import FlowService
    
    batch_service = BatchService(session)
    batch = await batch_service.get_batch_by_uid(batch_uid)
    
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    
    farming_service = FarmingService(session)
    quality_service = QualityService(session)
    flow_service = FlowService(session)
    
    farming_records = await farming_service.get_records_by_batch(batch_uid)
    quality_inspections = await quality_service.get_inspections_by_batch(batch_uid)
    flow_records = await flow_service.get_flow_history_by_batch(batch_uid)
    
    latest_quality = None
    quality_passed = None
    if quality_inspections:
        latest_quality = quality_inspections[0]
        quality_passed = latest_quality.overall_result
    
    return {
        "batch_uid": batch_uid,
        "batch_code": batch.batch_code,
        "product_name": batch.product_name,
        "status": batch.status.value,
        "farming": {
            "total_records": len(farming_records),
            "has_photos": any(r.photo_urls for r in farming_records),
            "has_location": any(r.latitude and r.longitude for r in farming_records),
            "has_pesticide_records": any(r.pesticide_name for r in farming_records),
            "has_fertilizer_records": any(r.fertilizer_name for r in farming_records),
        },
        "quality": {
            "total_inspections": len(quality_inspections),
            "latest_result": quality_passed,
            "latest_status": latest_quality.status.value if latest_quality else None,
            "tags_enabled": batch.tags_enabled,
        },
        "flow": {
            "total_records": len(flow_records),
            "has_scan_codes": any(r.scan_code for r in flow_records),
            "has_temperature_records": any(r.temperature is not None for r in flow_records),
            "has_humidity_records": any(r.humidity is not None for r in flow_records),
        },
        "readiness": {
            "farming_ready": len(farming_records) > 0,
            "quality_ready": len(quality_inspections) > 0 and quality_passed,
            "flow_ready": len(flow_records) > 0,
            "tags_ready": batch.tags_enabled,
            "overall_ready": (
                len(farming_records) > 0 
                and len(quality_inspections) > 0 
                and quality_passed 
                and batch.tags_enabled
            ),
        },
    }
