from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.quality import QualityInspection, QualityStatus
from app.models.batch import Batch, BatchStatus
from app.services.rule_engine import quality_rule_engine, RuleResult
from app.services.state_machine import batch_state_machine

logger = structlog.get_logger()


class QualityService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _generate_inspection_code(self, batch_code: str, inspection_number: int) -> str:
        date_suffix = datetime.utcnow().strftime("%Y%m%d")
        num_suffix = f"{inspection_number:03d}"
        return f"QC-{batch_code}-{date_suffix}-{num_suffix}"
    
    async def create_inspection(
        self,
        batch_uid: str,
        inspector_uid: str,
        inspector_name: Optional[str] = None,
        lab_name: Optional[str] = None,
        lab_code: Optional[str] = None,
        sampling_time: Optional[datetime] = None,
        sample_count: int = 1,
        sample_location: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> QualityInspection:
        batch_service = BatchService(self.session)
        batch = await batch_service.get_batch_by_uid(batch_uid)
        
        if not batch:
            raise ValueError(f"Batch not found: {batch_uid}")
        
        existing_inspections = await self.get_inspections_by_batch(batch_uid)
        inspection_number = len(existing_inspections) + 1
        
        inspection_code = self._generate_inspection_code(batch.batch_code, inspection_number)
        
        inspection = QualityInspection(
            uid=str(uuid.uuid4()),
            batch_uid=batch_uid,
            inspection_code=inspection_code,
            inspector_uid=inspector_uid,
            inspector_name=inspector_name,
            lab_name=lab_name,
            lab_code=lab_code,
            sampling_time=sampling_time or datetime.utcnow(),
            sample_count=sample_count,
            sample_location=sample_location,
            status=QualityStatus.SAMPLING,
            standard_reference="GB 2763-2021",
            extra_data=extra_data,
        )
        
        self.session.add(inspection)
        await self.session.flush()
        
        if batch.status == BatchStatus.HARVESTED:
            await batch_service.transition_batch_status(batch_uid, "submit_quality")
        
        logger.info(
            "quality_inspection_created",
            inspection_uid=inspection.uid,
            inspection_code=inspection_code,
            batch_uid=batch_uid,
        )
        
        return inspection
    
    async def get_inspection_by_uid(self, inspection_uid: str) -> Optional[QualityInspection]:
        result = await self.session.execute(
            select(QualityInspection).where(QualityInspection.uid == inspection_uid)
        )
        return result.scalar_one_or_none()
    
    async def get_inspection_by_code(self, inspection_code: str) -> Optional[QualityInspection]:
        result = await self.session.execute(
            select(QualityInspection).where(QualityInspection.inspection_code == inspection_code)
        )
        return result.scalar_one_or_none()
    
    async def get_inspections_by_batch(
        self,
        batch_uid: str,
        limit: int = 50,
        offset: int = 0,
    ) -> List[QualityInspection]:
        result = await self.session.execute(
            select(QualityInspection)
            .where(QualityInspection.batch_uid == batch_uid)
            .order_by(QualityInspection.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())
    
    async def start_testing(
        self,
        inspection_uid: str,
    ) -> Optional[QualityInspection]:
        inspection = await self.get_inspection_by_uid(inspection_uid)
        if not inspection:
            return None
        
        if inspection.status != QualityStatus.SAMPLING:
            logger.warning(
                "invalid_status_for_testing",
                inspection_uid=inspection_uid,
                current_status=inspection.status.value,
            )
            return None
        
        inspection.status = QualityStatus.TESTING
        inspection.testing_start_time = datetime.utcnow()
        
        await self.session.flush()
        
        logger.info(
            "testing_started",
            inspection_uid=inspection_uid,
        )
        
        return inspection
    
    async def submit_test_results(
        self,
        inspection_uid: str,
        pesticide_results: Optional[Dict[str, float]] = None,
        heavy_metal_results: Optional[Dict[str, float]] = None,
        result_description: Optional[str] = None,
        report_attachment_url: Optional[str] = None,
    ) -> RuleResult:
        inspection = await self.get_inspection_by_uid(inspection_uid)
        if not inspection:
            raise ValueError(f"Inspection not found: {inspection_uid}")
        
        if inspection.status != QualityStatus.TESTING:
            raise ValueError(f"Inspection is not in testing status: {inspection.status.value}")
        
        inspection.pesticide_results = pesticide_results
        inspection.heavy_metal_results = heavy_metal_results
        inspection.testing_end_time = datetime.utcnow()
        
        rule_result = quality_rule_engine.evaluate_quality_inspection(
            pesticide_results=pesticide_results,
            heavy_metal_results=heavy_metal_results,
        )
        
        inspection.overall_result = rule_result.success
        inspection.result_description = result_description or rule_result.message
        inspection.report_attachment_url = report_attachment_url
        
        if rule_result.success:
            inspection.status = QualityStatus.PASSED
            event = "quality_pass"
        else:
            inspection.status = QualityStatus.FAILED
            event = "quality_fail"
        
        await self.session.flush()
        
        batch_service = BatchService(self.session)
        await batch_service.transition_batch_status(inspection.batch_uid, event)
        
        if inspection.status == QualityStatus.PASSED:
            batch = await batch_service.get_batch_by_uid(inspection.batch_uid)
            if batch and batch.estimated_quantity:
                await batch_service.enable_tags(
                    batch_uid=inspection.batch_uid,
                    tags_count=int(batch.estimated_quantity),
                )
        
        logger.info(
            "test_results_submitted",
            inspection_uid=inspection_uid,
            passed=rule_result.success,
            failed_count=rule_result.failed_count,
            passed_count=rule_result.passed_count,
        )
        
        return rule_result
    
    async def request_re_inspection(
        self,
        inspection_uid: str,
        reason: str,
    ) -> Optional[QualityInspection]:
        inspection = await self.get_inspection_by_uid(inspection_uid)
        if not inspection:
            return None
        
        if inspection.status not in [QualityStatus.FAILED, QualityStatus.REJECTED]:
            logger.warning(
                "invalid_status_for_re_inspection",
                inspection_uid=inspection_uid,
                current_status=inspection.status.value,
            )
            return None
        
        inspection.re_inspection_required = True
        inspection.re_inspection_count += 1
        inspection.status = QualityStatus.RE_INSPECTION
        inspection.notes = f"复检申请: {reason}\n---\n{inspection.notes or ''}"
        
        await self.session.flush()
        
        logger.info(
            "re_inspection_requested",
            inspection_uid=inspection_uid,
            reason=reason,
        )
        
        return inspection
    
    async def reject_inspection(
        self,
        inspection_uid: str,
        reason: str,
    ) -> Optional[QualityInspection]:
        inspection = await self.get_inspection_by_uid(inspection_uid)
        if not inspection:
            return None
        
        inspection.status = QualityStatus.REJECTED
        inspection.notes = f"拒绝原因: {reason}\n---\n{inspection.notes or ''}"
        
        await self.session.flush()
        
        batch_service = BatchService(self.session)
        batch = await batch_service.get_batch_by_uid(inspection.batch_uid)
        if batch:
            await batch_service.transition_batch_status(inspection.batch_uid, "block")
        
        logger.info(
            "inspection_rejected",
            inspection_uid=inspection_uid,
            reason=reason,
        )
        
        return inspection
    
    async def get_batch_quality_history(
        self,
        batch_uid: str,
    ) -> Dict[str, Any]:
        inspections = await self.get_inspections_by_batch(batch_uid)
        
        passed_count = sum(1 for i in inspections if i.status == QualityStatus.PASSED)
        failed_count = sum(1 for i in inspections if i.status == QualityStatus.FAILED)
        re_inspection_count = sum(1 for i in inspections if i.re_inspection_count > 0)
        
        latest_inspection = max(inspections, key=lambda x: x.created_at) if inspections else None
        
        all_failed_items: List[str] = []
        for inspection in inspections:
            if inspection.pesticide_results:
                result = quality_rule_engine.evaluate_pesticide_results(inspection.pesticide_results)
                all_failed_items.extend(result.failed_items)
        
        return {
            "batch_uid": batch_uid,
            "total_inspections": len(inspections),
            "passed_count": passed_count,
            "failed_count": failed_count,
            "re_inspection_count": re_inspection_count,
            "latest_status": latest_inspection.status.value if latest_inspection else None,
            "latest_overall_result": latest_inspection.overall_result if latest_inspection else None,
            "all_failed_items": list(set(all_failed_items)),
            "inspections": [
                {
                    "uid": i.uid,
                    "code": i.inspection_code,
                    "status": i.status.value,
                    "overall_result": i.overall_result,
                    "sampling_time": i.sampling_time,
                    "created_at": i.created_at,
                }
                for i in inspections
            ],
        }


from app.services.batch_service import BatchService
