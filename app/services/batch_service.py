from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.models.batch import Batch, BatchStatus
from app.models.user import User
from app.services.state_machine import batch_state_machine

logger = structlog.get_logger()


class BatchService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _generate_batch_code(
        self,
        farm_name: str,
        product_name: str,
        planting_year: int,
    ) -> str:
        farm_code = farm_name[:2].upper() if len(farm_name) >= 2 else "FA"
        product_code = product_name[:2].upper() if len(product_name) >= 2 else "PR"
        year_suffix = str(planting_year)[-2:]
        random_suffix = uuid.uuid4().hex[:6].upper()
        
        return f"{farm_code}-{product_code}-{year_suffix}-{random_suffix}"
    
    async def create_batch(
        self,
        product_name: str,
        farm_name: str,
        farmer_uid: str,
        product_category: Optional[str] = None,
        farm_location: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        planting_date: Optional[datetime] = None,
        estimated_quantity: Optional[float] = None,
        unit: str = "kg",
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> Batch:
        year = planting_date.year if planting_date else datetime.utcnow().year
        batch_code = self._generate_batch_code(farm_name, product_name, year)
        
        batch = Batch(
            uid=str(uuid.uuid4()),
            batch_code=batch_code,
            product_name=product_name,
            product_category=product_category,
            farm_name=farm_name,
            farm_location=farm_location,
            latitude=latitude,
            longitude=longitude,
            farmer_uid=farmer_uid,
            planting_date=planting_date,
            estimated_quantity=estimated_quantity,
            unit=unit,
            status=BatchStatus.DRAFT,
            tags_enabled=False,
            tags_count=0,
            metadata=metadata,
        )
        
        self.session.add(batch)
        await self.session.flush()
        
        logger.info(
            "batch_created",
            batch_uid=batch.uid,
            batch_code=batch_code,
            product_name=product_name,
            farmer_uid=farmer_uid,
        )
        
        return batch
    
    async def get_batch_by_uid(self, batch_uid: str) -> Optional[Batch]:
        result = await self.session.execute(
            select(Batch).where(Batch.uid == batch_uid)
        )
        return result.scalar_one_or_none()
    
    async def get_batch_by_code(self, batch_code: str) -> Optional[Batch]:
        result = await self.session.execute(
            select(Batch).where(Batch.batch_code == batch_code)
        )
        return result.scalar_one_or_none()
    
    async def get_batches_by_farmer(self, farmer_uid: str) -> List[Batch]:
        result = await self.session.execute(
            select(Batch)
            .where(Batch.farmer_uid == farmer_uid)
            .order_by(Batch.created_at.desc())
        )
        return list(result.scalars().all())
    
    async def get_batches_by_status(self, status: BatchStatus) -> List[Batch]:
        result = await self.session.execute(
            select(Batch)
            .where(Batch.status == status)
            .order_by(Batch.created_at.desc())
        )
        return list(result.scalars().all())
    
    async def transition_batch_status(
        self,
        batch_uid: str,
        event: str,
        context: Any = None,
    ) -> bool:
        batch = await self.get_batch_by_uid(batch_uid)
        if not batch:
            logger.warning("batch_not_found", batch_uid=batch_uid)
            return False
        
        result = batch_state_machine.transition(
            current_state=batch.status,
            event=event,
            context=context,
        )
        
        if result.success and result.to_state:
            batch.status = result.to_state
            await self.session.flush()
            logger.info(
                "batch_status_transitioned",
                batch_uid=batch_uid,
                from_status=result.from_state.value,
                to_status=result.to_state.value,
                event=event,
            )
            return True
        else:
            logger.warning(
                "batch_status_transition_failed",
                batch_uid=batch_uid,
                current_status=batch.status.value,
                event=event,
                message=result.message,
            )
            return False
    
    async def can_transition(self, batch_uid: str, event: str) -> bool:
        batch = await self.get_batch_by_uid(batch_uid)
        if not batch:
            return False
        return batch_state_machine.can_transition(batch.status, event)
    
    async def get_available_events(self, batch_uid: str) -> List[str]:
        batch = await self.get_batch_by_uid(batch_uid)
        if not batch:
            return []
        return batch_state_machine.get_available_events(batch.status)
    
    async def update_batch_quantity(
        self,
        batch_uid: str,
        actual_quantity: float,
    ) -> bool:
        batch = await self.get_batch_by_uid(batch_uid)
        if not batch:
            return False
        
        batch.actual_quantity = actual_quantity
        await self.session.flush()
        
        logger.info(
            "batch_quantity_updated",
            batch_uid=batch_uid,
            actual_quantity=actual_quantity,
        )
        return True
    
    async def enable_tags(
        self,
        batch_uid: str,
        tags_count: int,
    ) -> bool:
        batch = await self.get_batch_by_uid(batch_uid)
        if not batch:
            return False
        
        batch.tags_enabled = True
        batch.tags_count = tags_count
        await self.session.flush()
        
        logger.info(
            "tags_enabled",
            batch_uid=batch_uid,
            tags_count=tags_count,
        )
        return True
    
    async def search_batches(
        self,
        keyword: Optional[str] = None,
        status: Optional[BatchStatus] = None,
        farmer_uid: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Batch]:
        query = select(Batch)
        
        if keyword:
            query = query.where(
                (Batch.product_name.ilike(f"%{keyword}%"))
                | (Batch.batch_code.ilike(f"%{keyword}%"))
                | (Batch.farm_name.ilike(f"%{keyword}%"))
            )
        
        if status:
            query = query.where(Batch.status == status)
        
        if farmer_uid:
            query = query.where(Batch.farmer_uid == farmer_uid)
        
        query = query.order_by(Batch.created_at.desc()).offset(offset).limit(limit)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())
