from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models import ServiceItem


class ServiceStandardEngine:
    """
    Service-Standard 事项引擎
    负责管理政务服务事项的标准化配置，包括：
    - 事项基本信息管理
    - 所需材料清单管理
    - 样表模板管理
    - 办理时限和窗口配置
    """

    DEFAULT_SERVICE_ITEMS = [
        {
            "item_code": "GRXX-001",
            "item_name": "个人信息查询",
            "item_type": "查询类",
            "department": "政务服务中心",
            "description": "查询个人基本信息、社保信息等",
            "required_materials": [
                {
                    "name": "居民身份证",
                    "type": "IDENTITY",
                    "required": True,
                    "sample_available": True,
                }
            ],
            "sample_forms": [
                {
                    "name": "个人信息查询申请表",
                    "type": "APPLICATION_FORM",
                    "template_url": "/templates/info_query_form.pdf",
                }
            ],
            "handling_time_limit": 5,
            "window_count": 2,
            "daily_quota": 100,
        },
        {
            "item_code": "HUKOU-001",
            "item_name": "户口迁移登记",
            "item_type": "登记类",
            "department": "公安局户政科",
            "description": "办理户口迁入、迁出、迁移登记等业务",
            "required_materials": [
                {
                    "name": "居民身份证",
                    "type": "IDENTITY",
                    "required": True,
                    "sample_available": True,
                },
                {
                    "name": "户口本",
                    "type": "HOUSEHOLD_REGISTER",
                    "required": True,
                    "sample_available": False,
                },
                {
                    "name": "迁移证明材料",
                    "type": "MIGRATION_PROOF",
                    "required": True,
                    "sample_available": True,
                },
            ],
            "sample_forms": [
                {
                    "name": "户口迁移申请表",
                    "type": "APPLICATION_FORM",
                    "template_url": "/templates/hukou_migration_form.pdf",
                }
            ],
            "handling_time_limit": 10,
            "window_count": 3,
            "daily_quota": 60,
        },
        {
            "item_code": "SHEBAO-001",
            "item_name": "社保缴费证明开具",
            "item_type": "证明类",
            "department": "社会保障局",
            "description": "开具社会保险缴费证明、参保证明等",
            "required_materials": [
                {
                    "name": "居民身份证",
                    "type": "IDENTITY",
                    "required": True,
                    "sample_available": True,
                }
            ],
            "sample_forms": [],
            "handling_time_limit": 3,
            "window_count": 2,
            "daily_quota": 150,
        },
        {
            "item_code": "GONGJIJIN-001",
            "item_name": "公积金提取申请",
            "item_type": "申请类",
            "department": "住房公积金管理中心",
            "description": "申请提取住房公积金",
            "required_materials": [
                {
                    "name": "居民身份证",
                    "type": "IDENTITY",
                    "required": True,
                    "sample_available": True,
                },
                {
                    "name": "公积金提取申请表",
                    "type": "APPLICATION_FORM",
                    "required": True,
                    "sample_available": True,
                },
                {
                    "name": "相关证明材料",
                    "type": "SUPPORTING_DOC",
                    "required": True,
                    "sample_available": False,
                },
            ],
            "sample_forms": [
                {
                    "name": "住房公积金提取申请表",
                    "type": "APPLICATION_FORM",
                    "template_url": "/templates/housing_fund_form.pdf",
                }
            ],
            "handling_time_limit": 15,
            "window_count": 2,
            "daily_quota": 40,
        },
        {
            "item_code": "YILIAO-001",
            "item_name": "医保报销申请",
            "item_type": "申请类",
            "department": "医疗保障局",
            "description": "申请医疗保险费用报销",
            "required_materials": [
                {
                    "name": "居民身份证",
                    "type": "IDENTITY",
                    "required": True,
                    "sample_available": True,
                },
                {
                    "name": "医保卡",
                    "type": "MEDICAL_CARD",
                    "required": True,
                    "sample_available": False,
                },
                {
                    "name": "医疗费用发票",
                    "type": "INVOICE",
                    "required": True,
                    "sample_available": True,
                },
                {
                    "name": "诊断证明",
                    "type": "DIAGNOSIS",
                    "required": True,
                    "sample_available": True,
                },
            ],
            "sample_forms": [
                {
                    "name": "医疗保险报销申请表",
                    "type": "APPLICATION_FORM",
                    "template_url": "/templates/medical_reimbursement_form.pdf",
                }
            ],
            "handling_time_limit": 20,
            "window_count": 3,
            "daily_quota": 50,
        },
    ]

    async def init_default_items(self, db: AsyncSession) -> None:
        """初始化默认服务事项"""
        result = await db.execute(select(ServiceItem).limit(1))
        existing = result.scalar_one_or_none()
        if existing:
            return

        for item_data in self.DEFAULT_SERVICE_ITEMS:
            item = ServiceItem(
                item_code=item_data["item_code"],
                item_name=item_data["item_name"],
                item_type=item_data["item_type"],
                department=item_data["department"],
                description=item_data["description"],
                required_materials=item_data["required_materials"],
                sample_forms=item_data["sample_forms"],
                handling_time_limit=item_data["handling_time_limit"],
                window_count=item_data["window_count"],
                daily_quota=item_data["daily_quota"],
            )
            db.add(item)
        await db.commit()

    async def get_all_items(
        self,
        db: AsyncSession,
        is_active: bool = True,
        is_online: Optional[bool] = None,
    ) -> List[ServiceItem]:
        """获取所有服务事项"""
        query = select(ServiceItem).where(ServiceItem.is_active == is_active)
        if is_online is not None:
            query = query.where(ServiceItem.is_online == is_online)
        query = query.order_by(ServiceItem.item_code)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_item_by_code(
        self, db: AsyncSession, item_code: str
    ) -> Optional[ServiceItem]:
        """根据事项代码获取事项详情"""
        query = select(ServiceItem).where(ServiceItem.item_code == item_code)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_required_materials(
        self, db: AsyncSession, item_code: str
    ) -> List[Dict[str, Any]]:
        """获取事项所需材料清单"""
        item = await self.get_item_by_code(db, item_code)
        if not item:
            return []
        return item.required_materials or []

    async def get_sample_forms(
        self, db: AsyncSession, item_code: str
    ) -> List[Dict[str, Any]]:
        """获取事项样表清单"""
        item = await self.get_item_by_code(db, item_code)
        if not item:
            return []
        return item.sample_forms or []

    def validate_material_submission(
        self,
        required_materials: List[Dict[str, Any]],
        submitted_materials: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        验证材料提交是否完整
        返回：{
            "is_valid": bool,
            "missing_materials": list,
            "message": str
        }
        """
        submitted_types = {m.get("material_type") for m in submitted_materials}
        missing = []

        for req in required_materials:
            if req.get("required", True):
                req_type = req.get("type")
                if req_type not in submitted_types:
                    missing.append(
                        {
                            "name": req.get("name"),
                            "type": req_type,
                            "reason": "必填材料未提交",
                        }
                    )

        return {
            "is_valid": len(missing) == 0,
            "missing_materials": missing,
            "message": "材料完整" if len(missing) == 0 else f"缺少 {len(missing)} 项必填材料",
        }
