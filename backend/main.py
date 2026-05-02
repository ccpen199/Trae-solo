import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app import init_db, get_db_context
from app.routers import auth_router, orders_router, users_router, reports_router
from app.routers.auth import get_password_hash
from app.models import Organization, User, RoleType
from app.engines import TaxEngine


def init_sample_data():
    with get_db_context() as db:
        existing_org = db.query(Organization).first()
        if existing_org:
            return
        
        supplier_org = Organization(
            id="org-supplier-001",
            name="供应商有限公司",
            org_type=RoleType.SUPPLIER,
            credit_code="91110000MA0012345A",
            legal_person="张三",
            address="北京市朝阳区供应商路100号",
            contact_person="李四",
            contact_phone="13800001111",
            is_active=True
        )
        db.add(supplier_org)
        
        core_org = Organization(
            id="org-core-001",
            name="核心企业集团",
            org_type=RoleType.CORE_ENTERPRISE,
            credit_code="91110000MA0067890B",
            legal_person="王五",
            address="北京市海淀区核心路200号",
            contact_person="赵六",
            contact_phone="13800002222",
            is_active=True
        )
        db.add(core_org)
        
        fin_org = Organization(
            id="org-fin-001",
            name="金融机构银行",
            org_type=RoleType.FINANCIAL_INSTITUTION,
            credit_code="91110000MA0098765C",
            legal_person="钱七",
            address="北京市西城区金融街300号",
            contact_person="孙八",
            contact_phone="13800003333",
            is_active=True
        )
        db.add(fin_org)
        
        supplier_user = User(
            id="user-supplier-001",
            username="supplier",
            name="供应商用户",
            password_hash=get_password_hash("123456"),
            role=RoleType.SUPPLIER,
            org_id=supplier_org.id,
            email="supplier@example.com",
            phone="13800001111",
            is_active=True
        )
        db.add(supplier_user)
        
        core_user = User(
            id="user-core-001",
            username="core",
            name="核心企业用户",
            password_hash=get_password_hash("123456"),
            role=RoleType.CORE_ENTERPRISE,
            org_id=core_org.id,
            email="core@example.com",
            phone="13800002222",
            is_active=True
        )
        db.add(core_user)
        
        risk_user = User(
            id="user-risk-001",
            username="risk",
            name="风控用户",
            password_hash=get_password_hash("123456"),
            role=RoleType.RISK_CONTROL,
            org_id=fin_org.id,
            email="risk@example.com",
            phone="13800003333",
            is_active=True
        )
        db.add(risk_user)
        
        finance_user = User(
            id="user-finance-001",
            username="finance",
            name="财务用户",
            password_hash=get_password_hash("123456"),
            role=RoleType.FINANCE,
            org_id=fin_org.id,
            email="finance@example.com",
            phone="13800004444",
            is_active=True
        )
        db.add(finance_user)
        
        admin_user = User(
            id="user-admin-001",
            username="admin",
            name="管理员",
            password_hash=get_password_hash("admin123"),
            role=RoleType.ADMIN,
            org_id=fin_org.id,
            email="admin@example.com",
            phone="13800009999",
            is_active=True
        )
        db.add(admin_user)
        
        db.commit()
        
        tax_engine = TaxEngine(db)
        tax_engine.create_default_rules()
        
        print("示例数据初始化完成")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    init_sample_data()
    yield


app = FastAPI(
    title="供应链金融平台 API",
    description="供应链金融平台后端API服务",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(reports_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "供应链金融平台 API 服务运行中",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=51120,
    )
