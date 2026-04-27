from typing import Optional, List, Dict, Any, Callable, Awaitable
from datetime import datetime, timedelta
import uuid
import structlog
import traceback
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.models.compensation import (
    CompensationRecord,
    CompensationStatus,
    CompensationType,
)

logger = structlog.get_logger()


class CompensationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self._handlers: Dict[CompensationType, Callable[..., Awaitable[bool]]] = {}
    
    def _generate_compensation_code(self, operation_type: CompensationType) -> str:
        type_code = operation_type.value[:4].upper()
        date_suffix = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_suffix = uuid.uuid4().hex[:4].upper()
        return f"CMP-{type_code}-{date_suffix}-{random_suffix}"
    
    def register_handler(
        self,
        operation_type: CompensationType,
        handler: Callable[..., Awaitable[bool]],
    ) -> None:
        self._handlers[operation_type] = handler
        logger.info(
            "compensation_handler_registered",
            operation_type=operation_type.value,
        )
    
    async def record_failure(
        self,
        operation_type: CompensationType,
        original_action: str,
        error_message: str,
        operation_uid: Optional[str] = None,
        operation_description: Optional[str] = None,
        batch_uid: Optional[str] = None,
        initiator_uid: Optional[str] = None,
        initiator_name: Optional[str] = None,
        original_parameters: Optional[Dict[str, Any]] = None,
        error_stack: Optional[str] = None,
        error_code: Optional[str] = None,
        compensation_strategy: Optional[str] = None,
        rollback_required: bool = False,
        priority: int = 1,
        max_retries: int = 3,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> CompensationRecord:
        compensation_code = self._generate_compensation_code(operation_type)
        
        record = CompensationRecord(
            uid=str(uuid.uuid4()),
            compensation_code=compensation_code,
            operation_type=operation_type,
            operation_uid=operation_uid,
            operation_description=operation_description,
            batch_uid=batch_uid,
            initiator_uid=initiator_uid,
            initiator_name=initiator_name,
            original_action=original_action,
            original_parameters=original_parameters,
            error_message=error_message,
            error_stack=error_stack,
            error_code=error_code,
            status=CompensationStatus.PENDING,
            compensation_strategy=compensation_strategy,
            retry_count=0,
            max_retries=max_retries,
            rollback_required=rollback_required,
            rollback_completed=False,
            priority=priority,
            extra_data=extra_data,
        )
        
        self.session.add(record)
        await self.session.flush()
        
        logger.warning(
            "failure_recorded",
            compensation_uid=record.uid,
            compensation_code=compensation_code,
            operation_type=operation_type.value,
            error_message=error_message,
        )
        
        return record
    
    async def get_compensation_by_uid(self, compensation_uid: str) -> Optional[CompensationRecord]:
        result = await self.session.execute(
            select(CompensationRecord).where(CompensationRecord.uid == compensation_uid)
        )
        return result.scalar_one_or_none()
    
    async def get_pending_compensations(
        self,
        limit: int = 100,
        priority: Optional[int] = None,
    ) -> List[CompensationRecord]:
        query = select(CompensationRecord).where(
            or_(
                CompensationRecord.status == CompensationStatus.PENDING,
                CompensationRecord.status == CompensationStatus.FAILED,
            )
        )
        
        if priority is not None:
            query = query.where(CompensationRecord.priority == priority)
        
        query = query.order_by(
            CompensationRecord.priority.desc(),
            CompensationRecord.created_at.asc(),
        ).limit(limit)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def process_compensation(
        self,
        compensation_uid: str,
        handler_override: Optional[Callable[..., Awaitable[bool]]] = None,
    ) -> bool:
        record = await self.get_compensation_by_uid(compensation_uid)
        if not record:
            logger.error("compensation_record_not_found", uid=compensation_uid)
            return False
        
        if record.status in [CompensationStatus.SUCCESS, CompensationStatus.SKIPPED, CompensationStatus.MANUALLY_RESOLVED]:
            logger.warning(
                "compensation_already_resolved",
                uid=compensation_uid,
                status=record.status.value,
            )
            return record.status == CompensationStatus.SUCCESS
        
        if not record.can_retry():
            logger.warning(
                "compensation_max_retries_exceeded",
                uid=compensation_uid,
                retry_count=record.retry_count,
                max_retries=record.max_retries,
            )
            record.status = CompensationStatus.FAILED
            await self.session.flush()
            return False
        
        record.status = CompensationStatus.IN_PROGRESS
        record.last_retry_time = datetime.utcnow()
        await self.session.flush()
        
        handler = handler_override or self._handlers.get(record.operation_type)
        
        try:
            if handler:
                success = await handler(record)
            else:
                logger.warning(
                    "no_compensation_handler",
                    uid=compensation_uid,
                    operation_type=record.operation_type.value,
                )
                success = await self._default_compensation(record)
            
            if success:
                record.status = CompensationStatus.SUCCESS
                record.resolved_at = datetime.utcnow()
                record.success_message = "补偿处理成功"
                logger.info(
                    "compensation_success",
                    uid=compensation_uid,
                    operation_type=record.operation_type.value,
                )
            else:
                record.increment_retry()
                if record.status == CompensationStatus.FAILED:
                    logger.error(
                        "compensation_final_failure",
                        uid=compensation_uid,
                        retry_count=record.retry_count,
                    )
                else:
                    record.next_retry_time = datetime.utcnow() + timedelta(
                        seconds=record.get_backoff_seconds()
                    )
                    logger.warning(
                        "compensation_retry_scheduled",
                        uid=compensation_uid,
                        retry_count=record.retry_count,
                        next_retry=record.next_retry_time,
                    )
            
            await self.session.flush()
            return success
            
        except Exception as e:
            logger.error(
                "compensation_processing_error",
                uid=compensation_uid,
                error=str(e),
                traceback=traceback.format_exc(),
            )
            record.increment_retry()
            record.error_message = str(e)
            await self.session.flush()
            return False
    
    async def _default_compensation(self, record: CompensationRecord) -> bool:
        logger.info(
            "using_default_compensation",
            uid=record.uid,
            operation_type=record.operation_type.value,
        )
        return True
    
    async def skip_compensation(
        self,
        compensation_uid: str,
        reason: str,
    ) -> Optional[CompensationRecord]:
        record = await self.get_compensation_by_uid(compensation_uid)
        if not record:
            return None
        
        record.status = CompensationStatus.SKIPPED
        record.resolved_at = datetime.utcnow()
        record.resolution_notes = f"跳过原因: {reason}"
        
        await self.session.flush()
        
        logger.info(
            "compensation_skipped",
            uid=compensation_uid,
            reason=reason,
        )
        
        return record
    
    async def manually_resolve(
        self,
        compensation_uid: str,
        resolved_by_uid: str,
        resolved_by_name: Optional[str] = None,
        resolution_notes: Optional[str] = None,
    ) -> Optional[CompensationRecord]:
        record = await self.get_compensation_by_uid(compensation_uid)
        if not record:
            return None
        
        record.status = CompensationStatus.MANUALLY_RESOLVED
        record.resolved_at = datetime.utcnow()
        record.resolved_by_uid = resolved_by_uid
        record.resolved_by_name = resolved_by_name
        record.resolution_notes = resolution_notes
        
        await self.session.flush()
        
        logger.info(
            "compensation_manually_resolved",
            uid=compensation_uid,
            resolved_by_uid=resolved_by_uid,
        )
        
        return record
    
    async def get_compensation_statistics(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        query = select(CompensationRecord)
        
        if start_time:
            query = query.where(CompensationRecord.created_at >= start_time)
        
        if end_time:
            query = query.where(CompensationRecord.created_at <= end_time)
        
        result = await self.session.execute(query)
        records = list(result.scalars().all())
        
        status_counts: Dict[str, int] = {}
        type_counts: Dict[str, int] = {}
        
        for record in records:
            status = record.status.value
            status_counts[status] = status_counts.get(status, 0) + 1
            
            op_type = record.operation_type.value
            type_counts[op_type] = type_counts.get(op_type, 0) + 1
        
        total_retries = sum(r.retry_count for r in records)
        
        return {
            "total_records": len(records),
            "status_counts": status_counts,
            "type_counts": type_counts,
            "total_retries": total_retries,
            "pending_count": status_counts.get(CompensationStatus.PENDING.value, 0),
            "success_count": status_counts.get(CompensationStatus.SUCCESS.value, 0),
            "failed_count": status_counts.get(CompensationStatus.FAILED.value, 0),
            "manually_resolved_count": status_counts.get(CompensationStatus.MANUALLY_RESOLVED.value, 0),
        }
