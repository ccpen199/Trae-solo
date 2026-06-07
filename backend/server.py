from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
import os
from contextlib import asynccontextmanager

SQLITE_PATH = os.getenv("SQLITE_PATH", "./data/app.sqlite")
DATABASE_URL = f"sqlite+aiosqlite:///{SQLITE_PATH}"

Base = declarative_base()

class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    user_type = Column(String)  # resident, enterprise, ev_owner, pv_owner
    name = Column(String)
    phone = Column(String)
    address = Column(String)
    id_number = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    meter_points = relationship("MeterPoint", back_populates="user")

class MeterPoint(Base):
    __tablename__ = "meter_points"
    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(String, unique=True, index=True)
    user_id = Column(String, ForeignKey("user_profiles.user_id"))
    address = Column(String)
    capacity = Column(Float)
    voltage_level = Column(String)
    topology_path = Column(String)
    user = relationship("UserProfile", back_populates="meter_points")
    bills = relationship("ElectricityBill", back_populates="meter")
    outage_orders = relationship("OutageOrder", back_populates="meter")

class ElectricityBill(Base):
    __tablename__ = "electricity_bills"
    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(String, unique=True, index=True)
    meter_id = Column(String, ForeignKey("meter_points.meter_id"))
    period = Column(String)  # YYYY-MM
    peak_usage = Column(Float)  # 峰时用电量
    valley_usage = Column(Float)  # 谷时用电量
    total_usage = Column(Float)
    amount = Column(Float)
    status = Column(String)  # pending, paid, overdue
    due_date = Column(Date)
    paid_at = Column(DateTime, nullable=True)
    meter = relationship("MeterPoint", back_populates="bills")

class OutageOrder(Base):
    __tablename__ = "outage_orders"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, index=True)
    meter_id = Column(String, ForeignKey("meter_points.meter_id"))
    outage_type = Column(String)  # planned, emergency
    reason = Column(Text)
    start_time = Column(DateTime)
    expected_end_time = Column(DateTime)
    actual_end_time = Column(DateTime, nullable=True)
    status = Column(String)  # reported, processing, resolved
    priority = Column(String)  # low, medium, high, urgent
    meter = relationship("MeterPoint", back_populates="outage_orders")
    warnings = relationship("OutageWarning", back_populates="order")

class ChargingStation(Base):
    __tablename__ = "charging_stations"
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String, unique=True, index=True)
    name = Column(String)
    address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    operator = Column(String)
    total_ports = Column(Integer)
    available_ports = Column(Integer)
    power_rating = Column(Float)  # kW
    price_per_kwh = Column(Float)
    station_type = Column(String)  # public, private

class PVContract(Base):
    __tablename__ = "pv_contracts"
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(String, unique=True, index=True)
    user_id = Column(String)
    capacity = Column(Float)  # kW
    installation_date = Column(Date)
    grid_connection_date = Column(Date, nullable=True)
    status = Column(String)  # applying, approved, connected, suspended
    monthly_generation = Column(Float)  # kWh
    monthly_feed_in = Column(Float)  # kWh
    subsidy_amount = Column(Float)
    subsidy_status = Column(String)  # pending, processing, paid
    document_path = Column(String, nullable=True)

class ServiceSatisfaction(Base):
    __tablename__ = "service_satisfaction"
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(String, unique=True, index=True)
    order_id = Column(String, nullable=True)
    user_id = Column(String)
    service_type = Column(String)
    score = Column(Integer)  # 1-5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

class PolicyDocument(Base):
    __tablename__ = "policy_documents"
    id = Column(Integer, primary_key=True, index=True)
    doc_id = Column(String, unique=True, index=True)
    title = Column(String)
    category = Column(String)
    summary = Column(Text)
    keywords = Column(String)  # comma-separated
    content = Column(Text)
    published_date = Column(Date)
    effective_date = Column(Date)
    created_at = Column(DateTime, default=datetime.now)

class OutageWarning(Base):
    __tablename__ = "outage_warnings"
    id = Column(Integer, primary_key=True, index=True)
    warning_id = Column(String, unique=True, index=True)
    order_id = Column(String, ForeignKey("outage_orders.order_id"))
    user_id = Column(String)
    message = Column(Text)
    sent_at = Column(DateTime, default=datetime.now)
    read_status = Column(String, default="unread")
    order = relationship("OutageOrder", back_populates="warnings")

engine = create_engine(f"sqlite:///{SQLITE_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    
    if db.query(UserProfile).count() == 0:
        sample_data(db)
    
    db.close()
    yield

app = FastAPI(title="国家电网省级统一电力服务中台", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:48819"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def sample_data(db: Session):
    import random
    from datetime import timedelta
    
    user_types = ["resident", "enterprise", "ev_owner", "pv_owner"]
    for i in range(1, 21):
        user = UserProfile(
            user_id=f"USER{str(i).zfill(6)}",
            user_type=random.choice(user_types),
            name=f"用户{i}",
            phone=f"138{str(i).zfill(8)}",
            address=f"XX省XX市XX区XX路{i}号",
            id_number=f"330101199001{str(i).zfill(4)}"
        )
        db.add(user)
    
    db.commit()
    
    for i in range(1, 31):
        meter = MeterPoint(
            meter_id=f"METER{str(i).zfill(8)}",
            user_id=f"USER{str(random.randint(1, 20)).zfill(6)}",
            address=f"XX省XX市XX区XX路{random.randint(1, 100)}号",
            capacity=round(random.uniform(5, 200), 2),
            voltage_level=random.choice(["220V", "380V", "10kV"]),
            topology_path=f"/变电站{random.randint(1,5)}/馈线{random.randint(1,10)}/表箱{random.randint(1,100)}"
        )
        db.add(meter)
    
    db.commit()
    
    for i in range(1, 26):
        bill = ElectricityBill(
            bill_id=f"BILL{str(i).zfill(10)}",
            meter_id=f"METER{str(random.randint(1, 30)).zfill(8)}",
            period=f"2024-{str(random.randint(1, 12)).zfill(2)}",
            peak_usage=round(random.uniform(100, 500), 2),
            valley_usage=round(random.uniform(200, 800), 2),
            total_usage=0,
            amount=round(random.uniform(200, 2000), 2),
            status=random.choice(["paid", "pending", "overdue"]),
            due_date=date.today() + timedelta(days=random.randint(-30, 30))
        )
        bill.total_usage = bill.peak_usage + bill.valley_usage
        db.add(bill)
    
    db.commit()
    
    for i in range(1, 16):
        start = datetime.now() - timedelta(days=random.randint(1, 30))
        outage = OutageOrder(
            order_id=f"OUTAGE{str(i).zfill(8)}",
            meter_id=f"METER{str(random.randint(1, 30)).zfill(8)}",
            outage_type=random.choice(["planned", "emergency"]),
            reason=random.choice(["设备检修", "故障抢修", "计划停电", "突发故障"]),
            start_time=start,
            expected_end_time=start + timedelta(hours=random.randint(2, 12)),
            status=random.choice(["reported", "processing", "resolved"]),
            priority=random.choice(["low", "medium", "high", "urgent"])
        )
        db.add(outage)
    
    db.commit()
    
    for i in range(1, 21):
        station = ChargingStation(
            station_id=f"STATION{str(i).zfill(6)}",
            name=f"充电站{i}",
            address=f"XX市XX区XX路{random.randint(1, 50)}号",
            latitude=round(random.uniform(29.5, 31.0), 6),
            longitude=round(random.uniform(120.0, 122.0), 6),
            operator=random.choice(["国家电网", "特来电", "星星充电", "云快充"]),
            total_ports=random.randint(5, 20),
            available_ports=random.randint(1, 10),
            power_rating=random.choice([7, 14, 30, 60, 120]),
            price_per_kwh=round(random.uniform(0.5, 1.5), 2),
            station_type="public"
        )
        db.add(station)
    
    db.commit()
    
    for i in range(1, 11):
        pv = PVContract(
            contract_id=f"PV{str(i).zfill(8)}",
            user_id=f"USER{str(random.randint(1, 20)).zfill(6)}",
            capacity=round(random.uniform(10, 100), 2),
            installation_date=date.today() - timedelta(days=random.randint(180, 730)),
            grid_connection_date=date.today() - timedelta(days=random.randint(90, 180)),
            status=random.choice(["applying", "approved", "connected"]),
            monthly_generation=round(random.uniform(500, 3000), 2),
            monthly_feed_in=round(random.uniform(300, 2000), 2),
            subsidy_amount=round(random.uniform(1000, 5000), 2),
            subsidy_status=random.choice(["pending", "processing", "paid"])
        )
        db.add(pv)
    
    db.commit()
    
    for i in range(1, 16):
        satisfaction = ServiceSatisfaction(
            evaluation_id=f"EVAL{str(i).zfill(8)}",
            order_id=f"ORDER{str(i).zfill(8)}" if random.random() > 0.3 else None,
            user_id=f"USER{str(random.randint(1, 20)).zfill(6)}",
            service_type=random.choice(["报装", "维修", "查询", "缴费", "投诉"]),
            score=random.randint(1, 5),
            comment=random.choice(["服务很好", "处理及时", "满意", "一般", None])
        )
        db.add(satisfaction)
    
    db.commit()
    
    for i in range(1, 11):
        doc = PolicyDocument(
            doc_id=f"DOC{str(i).zfill(6)}",
            title=random.choice([
                "分布式光伏发电项目管理办法",
                "电动汽车充电基础设施建设运营管理暂行办法",
                "电力用户用电信息采集系统建设规范",
                "居民阶梯电价执行细则",
                "电力客户服务规范",
                "智能电网发展规划纲要",
                "节能减排奖励办法",
                "电力市场交易规则",
                "供电服务质量标准",
                "网络安全防护指南"
            ]),
            category=random.choice(["政策", "法规", "标准", "规范"]),
            summary=f"关于{random.choice(['光伏', '充电桩', '电价', '服务', '电网'])}的相关政策文件",
            keywords="电力,政策,规范,标准",
            content="详细内容...",
            published_date=date.today() - timedelta(days=random.randint(30, 365)),
            effective_date=date.today() + timedelta(days=random.randint(-30, 180))
        )
        db.add(doc)
    
    db.commit()

class UserProfileSchema(BaseModel):
    user_id: str
    user_type: str
    name: str
    phone: str
    address: str
    id_number: Optional[str] = None

class MeterPointSchema(BaseModel):
    meter_id: str
    user_id: str
    address: str
    capacity: float
    voltage_level: str
    topology_path: str

class ElectricityBillSchema(BaseModel):
    bill_id: str
    meter_id: str
    period: str
    peak_usage: float
    valley_usage: float
    total_usage: float
    amount: float
    status: str
    due_date: date
    paid_at: Optional[datetime] = None

class OutageOrderSchema(BaseModel):
    order_id: str
    meter_id: str
    outage_type: str
    reason: str
    start_time: datetime
    expected_end_time: datetime
    actual_end_time: Optional[datetime] = None
    status: str
    priority: str

class ChargingStationSchema(BaseModel):
    station_id: str
    name: str
    address: str
    latitude: float
    longitude: float
    operator: str
    total_ports: int
    available_ports: int
    power_rating: float
    price_per_kwh: float
    station_type: str

class PVContractSchema(BaseModel):
    contract_id: str
    user_id: str
    capacity: float
    installation_date: date
    grid_connection_date: Optional[date] = None
    status: str
    monthly_generation: float
    monthly_feed_in: float
    subsidy_amount: float
    subsidy_status: str

class SatisfactionSchema(BaseModel):
    evaluation_id: str
    order_id: Optional[str] = None
    user_id: str
    service_type: str
    score: int
    comment: Optional[str] = None

class PolicyDocumentSchema(BaseModel):
    doc_id: str
    title: str
    category: str
    summary: str
    keywords: str
    published_date: date
    effective_date: date

class OutageWarningSchema(BaseModel):
    warning_id: str
    order_id: str
    user_id: str
    message: str
    sent_at: datetime
    read_status: str

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/users")
async def get_users(db: Session = next(get_db())):
    users = db.query(UserProfile).all()
    return [UserProfileSchema.model_validate(u).model_dump() for u in users]

@app.get("/api/users/{user_id}")
async def get_user(user_id: str, db: Session = next(get_db())):
    user = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return UserProfileSchema.model_validate(user).model_dump()

@app.get("/api/meters")
async def get_meters(db: Session = next(get_db())):
    meters = db.query(MeterPoint).all()
    return [MeterPointSchema.model_validate(m).model_dump() for m in meters]

@app.get("/api/meters/{meter_id}")
async def get_meter(meter_id: str, db: Session = next(get_db())):
    meter = db.query(MeterPoint).filter(MeterPoint.meter_id == meter_id).first()
    if not meter:
        raise HTTPException(status_code=404, detail="计量点不存在")
    return MeterPointSchema.model_validate(meter).model_dump()

@app.get("/api/bills")
async def get_bills(meter_id: Optional[str] = None, status: Optional[str] = None, db: Session = next(get_db())):
    query = db.query(ElectricityBill)
    if meter_id:
        query = query.filter(ElectricityBill.meter_id == meter_id)
    if status:
        query = query.filter(ElectricityBill.status == status)
    bills = query.all()
    return [ElectricityBillSchema.model_validate(b).model_dump() for b in bills]

@app.post("/api/bills/{bill_id}/pay")
async def pay_bill(bill_id: str, db: Session = next(get_db())):
    bill = db.query(ElectricityBill).filter(ElectricityBill.bill_id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="账单不存在")
    bill.status = "paid"
    bill.paid_at = datetime.now()
    db.commit()
    return {"message": "支付成功", "bill_id": bill_id}

@app.get("/api/outages")
async def get_outages(status: Optional[str] = None, db: Session = next(get_db())):
    query = db.query(OutageOrder)
    if status:
        query = query.filter(OutageOrder.status == status)
    outages = query.all()
    return [OutageOrderSchema.model_validate(o).model_dump() for o in outages]

@app.post("/api/outages")
async def create_outage_order(order: OutageOrderSchema, db: Session = next(get_db())):
    db_order = OutageOrder(**order.model_dump())
    db.add(db_order)
    db.commit()
    return {"message": "工单创建成功", "order_id": order.order_id}

@app.get("/api/stations")
async def get_stations(lat: Optional[float] = None, lon: Optional[float] = None, db: Session = next(get_db())):
    stations = db.query(ChargingStation).all()
    result = [ChargingStationSchema.model_validate(s).model_dump() for s in stations]
    
    if lat is not None and lon is not None:
        for station in result:
            distance = ((station['latitude'] - lat) ** 2 + (station['longitude'] - lon) ** 2) ** 0.5 * 111
            station['distance_km'] = round(distance, 2)
        result.sort(key=lambda x: x['distance_km'])
    
    return result

@app.get("/api/stations/{station_id}")
async def get_station(station_id: str, db: Session = next(get_db())):
    station = db.query(ChargingStation).filter(ChargingStation.station_id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="充电站不存在")
    return ChargingStationSchema.model_validate(station).model_dump()

@app.post("/api/pv/contracts")
async def create_pv_contract(contract: PVContractSchema, db: Session = next(get_db())):
    db_contract = PVContract(**contract.model_dump())
    db.add(db_contract)
    db.commit()
    return {"message": "并网申请提交成功", "contract_id": contract.contract_id}

@app.get("/api/pv/contracts")
async def get_pv_contracts(user_id: Optional[str] = None, db: Session = next(get_db())):
    query = db.query(PVContract)
    if user_id:
        query = query.filter(PVContract.user_id == user_id)
    contracts = query.all()
    return [PVContractSchema.model_validate(c).model_dump() for c in contracts]

@app.get("/api/analysis/resident/{user_id}")
async def get_resident_analysis(user_id: str, db: Session = next(get_db())):
    meters = db.query(MeterPoint).filter(MeterPoint.user_id == user_id).all()
    
    analysis = {
        "user_id": user_id,
        "total_bills": 0,
        "peak_ratio": 0,
        "valley_ratio": 0,
        "average_monthly": 0,
        "tips": []
    }
    
    total_peak = 0
    total_valley = 0
    total_amount = 0
    
    for meter in meters:
        bills = db.query(ElectricityBill).filter(ElectricityBill.meter_id == meter.meter_id).all()
        analysis["total_bills"] += len(bills)
        for bill in bills:
            total_peak += bill.peak_usage
            total_valley += bill.valley_usage
            total_amount += bill.amount
    
    if total_peak + total_valley > 0:
        analysis["peak_ratio"] = round(total_peak / (total_peak + total_valley) * 100, 1)
        analysis["valley_ratio"] = round(total_valley / (total_peak + total_valley) * 100, 1)
    
    if analysis["total_bills"] > 0:
        analysis["average_monthly"] = round(total_amount / analysis["total_bills"], 2)
    
    if analysis["peak_ratio"] > 50:
        analysis["tips"].append("建议将大功率电器使用时间调整至谷时段，可节省电费")
    if analysis["average_monthly"] > 500:
        analysis["tips"].append("您的月均电费较高，建议检查是否存在待机功耗")
    if analysis["average_monthly"] < 200:
        analysis["tips"].append("您的用电效率很高，继续保持")
    
    return analysis

@app.get("/api/analysis/enterprise/{user_id}")
async def get_enterprise_analysis(user_id: str, db: Session = next(get_db())):
    meters = db.query(MeterPoint).filter(MeterPoint.user_id == user_id).all()
    
    total_load = sum(m.capacity for m in meters)
    
    bills = []
    for meter in meters:
        meter_bills = db.query(ElectricityBill).filter(ElectricityBill.meter_id == meter.meter_id).all()
        bills.extend(meter_bills)
    
    total_usage = sum(b.total_usage for b in bills)
    total_amount = sum(b.amount for b in bills)
    
    efficiency = 0
    if total_usage > 0:
        efficiency = round((total_usage / (len(meters) * 730 * 24)) * 100, 2)
    
    return {
        "user_id": user_id,
        "total_meters": len(meters),
        "total_capacity": total_load,
        "total_usage_ytd": total_usage,
        "total_amount_ytd": total_amount,
        "load_utilization": efficiency,
        "average_price_per_kwh": round(total_amount / total_usage, 4) if total_usage > 0 else 0,
        "diagnosis": {
            "load_level": "high" if efficiency > 70 else "medium" if efficiency > 40 else "low",
            "recommendations": [
                "建议安装功率因数补偿装置" if efficiency < 50 else "负载利用率良好",
                "考虑错峰生产以降低峰值电费",
                "建议进行能源审计"
            ]
        }
    }

@app.post("/api/satisfaction")
async def create_satisfaction(evaluation: SatisfactionSchema, db: Session = next(get_db())):
    db_eval = ServiceSatisfaction(**evaluation.model_dump())
    db.add(db_eval)
    db.commit()
    return {"message": "评价提交成功", "evaluation_id": evaluation.evaluation_id}

@app.get("/api/satisfaction")
async def get_satisfactions(db: Session = next(get_db())):
    evals = db.query(ServiceSatisfaction).order_by(ServiceSatisfaction.created_at.desc()).all()
    return [SatisfactionSchema.model_validate(e).model_dump() for e in evals]

@app.get("/api/policy")
async def get_policies(keyword: Optional[str] = None, category: Optional[str] = None, db: Session = next(get_db())):
    query = db.query(PolicyDocument)
    if keyword:
        query = query.filter(PolicyDocument.keywords.contains(keyword))
    if category:
        query = query.filter(PolicyDocument.category == category)
    policies = query.all()
    return [PolicyDocumentSchema.model_validate(p).model_dump() for p in policies]

@app.post("/api/warnings")
async def create_warning(warning: OutageWarningSchema, db: Session = next(get_db())):
    db_warning = OutageWarning(**warning.model_dump())
    db.add(db_warning)
    db.commit()
    return {"message": "预警发送成功", "warning_id": warning.warning_id}

@app.get("/api/warnings")
async def get_warnings(user_id: Optional[str] = None, db: Session = next(get_db())):
    query = db.query(OutageWarning)
    if user_id:
        query = query.filter(OutageWarning.user_id == user_id)
    warnings = query.order_by(OutageWarning.sent_at.desc()).all()
    return [OutageWarningSchema.model_validate(w).model_dump() for w in warnings]

@app.get("/api/statistics")
async def get_statistics(db: Session = next(get_db())):
    return {
        "total_users": db.query(UserProfile).count(),
        "total_meters": db.query(MeterPoint).count(),
        "total_bills": db.query(ElectricityBill).count(),
        "pending_bills": db.query(ElectricityBill).filter(ElectricityBill.status == "pending").count(),
        "active_outages": db.query(OutageOrder).filter(OutageOrder.status != "resolved").count(),
        "total_stations": db.query(ChargingStation).count(),
        "available_stations": db.query(ChargingStation).filter(ChargingStation.available_ports > 0).count(),
        "total_pv_contracts": db.query(PVContract).count(),
        "average_satisfaction": round(db.query(ServiceSatisfaction).all() and 
            sum(e.score for e in db.query(ServiceSatisfaction).all()) / db.query(ServiceSatisfaction).count(), 2) or 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=58819)
