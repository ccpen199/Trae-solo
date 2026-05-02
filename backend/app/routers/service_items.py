from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import ServiceItem, User
from app.auth import get_current_user, require_role
from app.engines import service_standard_engine

router = APIRouter(prefix="/service-items", tags=["服务事项"])


class ServiceItemResponse(BaseModel):
    id: int
    item_code: str
    item_name: str
    item_type: Optional[str]
    department: str
    description: Optional[str]
    required_materials: List[dict]
    sample_forms: List[dict]
    handling_time_limit: int
    window_count: int
    daily_quota: int
    is_online: bool

    class Config:
        from_attributes = True


@router.get("", response_model=List[ServiceItemResponse])
async def get_service_items(
    is_online: Optional[bool] = Query(True, description="是否仅显示可在线办理事项"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(require_role(["CITIZEN", "AUDITOR", "WINDOW_STAFF", "ADMIN"])),
):
    items = await service_standard_engine.get_all_items(db, is_online=is_online)
    return [ServiceItemResponse.model_validate(item) for item in items]


@router.get("/{item_code}", response_model=ServiceItemResponse)
async def get_service_item_detail(
    item_code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = await service_standard_engine.get_item_by_code(db, item_code)
    if not item:
        raise HTTPException(status_code=404, detail="事项不存在")
    return ServiceItemResponse.model_validate(item)


@router.get("/{item_code}/materials")
async def get_item_materials(
    item_code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    materials = await service_standard_engine.get_required_materials(db, item_code)
    return {"materials": materials}


@router.get("/{item_code}/sample-forms")
async def get_item_sample_forms(
    item_code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sample_forms = await service_standard_engine.get_sample_forms(db, item_code)
    return {"sample_forms": sample_forms}
