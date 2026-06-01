import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, init_db
from models import ProductionLine, Shift, Device, Product, WorkOrder, OperationRecord, ProductionRecord
from datetime import datetime, timedelta

def init_sample_data():
    db = SessionLocal()
    
    try:
        init_db()
        
        if db.query(ProductionLine).count() == 0:
            lines = [
                ProductionLine(name="A线", description="一号生产线"),
                ProductionLine(name="B线", description="二号生产线"),
                ProductionLine(name="C线", description="三号生产线"),
            ]
            db.add_all(lines)
            db.commit()
        
        if db.query(Shift).count() == 0:
            shifts = [
                Shift(name="早班", start_time="08:00", end_time="16:00"),
                Shift(name="中班", start_time="16:00", end_time="00:00"),
                Shift(name="晚班", start_time="00:00", end_time="08:00"),
            ]
            db.add_all(shifts)
            db.commit()
        
        lines = db.query(ProductionLine).all()
        if db.query(Device).count() == 0:
            devices = [
                Device(code="CNC-001", name="CNC加工中心1", production_line_id=lines[0].id, standard_cycle_time=60, responsible_person="张工", maintenance_status="正常", is_active=True),
                Device(code="CNC-002", name="CNC加工中心2", production_line_id=lines[0].id, standard_cycle_time=55, responsible_person="李工", maintenance_status="正常", is_active=True),
                Device(code="LATHE-001", name="数控车床1", production_line_id=lines[1].id, standard_cycle_time=45, responsible_person="王工", maintenance_status="正常", is_active=True),
                Device(code="MILL-001", name="铣床1", production_line_id=lines[2].id, standard_cycle_time=90, responsible_person="赵工", maintenance_status="保养中", is_active=True),
                Device(code="OLD-001", name="旧设备", production_line_id=lines[0].id, standard_cycle_time=120, responsible_person="陈工", maintenance_status="已报废", is_active=False),
            ]
            db.add_all(devices)
            db.commit()
        
        if db.query(Product).count() == 0:
            products = [
                Product(code="P-001", name="零件A", standard_output=100),
                Product(code="P-002", name="零件B", standard_output=80),
                Product(code="P-003", name="零件C", standard_output=120),
            ]
            db.add_all(products)
            db.commit()
        
        products = db.query(Product).all()
        if db.query(WorkOrder).count() == 0:
            work_orders = [
                WorkOrder(code="WO-2024-001", product_id=products[0].id, planned_quantity=500, status="已完成"),
                WorkOrder(code="WO-2024-002", product_id=products[1].id, planned_quantity=300, status="进行中"),
                WorkOrder(code="WO-2024-003", product_id=products[2].id, planned_quantity=400, status="进行中"),
            ]
            db.add_all(work_orders)
            db.commit()
        
        devices = db.query(Device).filter(Device.is_active == True).all()
        shifts = db.query(Shift).all()
        work_orders = db.query(WorkOrder).all()
        
        if db.query(OperationRecord).count() == 0:
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            records = []
            
            for i in range(8):
                records.append(OperationRecord(
                    device_id=devices[0].id,
                    shift_id=shifts[0].id,
                    record_type="运行",
                    start_time=today + timedelta(hours=8+i),
                    end_time=today + timedelta(hours=9+i),
                    duration_minutes=60,
                    operator="张师傅"
                ))
            
            records.append(OperationRecord(
                device_id=devices[0].id,
                shift_id=shifts[0].id,
                record_type="故障停机",
                start_time=today + timedelta(hours=12),
                end_time=today + timedelta(hours=12, minutes=30),
                duration_minutes=30,
                downtime_reason="主轴故障",
                operator="张师傅",
                notes="已通知维修"
            ))
            
            records.append(OperationRecord(
                device_id=devices[0].id,
                shift_id=shifts[0].id,
                record_type="换线",
                start_time=today + timedelta(hours=14),
                end_time=today + timedelta(hours=14, minutes=20),
                duration_minutes=20,
                downtime_reason="产品切换",
                operator="张师傅"
            ))
            
            for i in range(7):
                records.append(OperationRecord(
                    device_id=devices[1].id,
                    shift_id=shifts[0].id,
                    record_type="运行",
                    start_time=today + timedelta(hours=8+i),
                    end_time=today + timedelta(hours=9+i),
                    duration_minutes=60,
                    operator="李师傅"
                ))
            
            records.append(OperationRecord(
                device_id=devices[1].id,
                shift_id=shifts[0].id,
                record_type="待料",
                start_time=today + timedelta(hours=11),
                end_time=today + timedelta(hours=11, minutes=45),
                duration_minutes=45,
                downtime_reason="原料短缺",
                operator="李师傅"
            ))
            
            db.add_all(records)
            db.commit()
        
        if db.query(ProductionRecord).count() == 0:
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            prod_records = [
                ProductionRecord(
                    device_id=devices[0].id,
                    work_order_id=work_orders[0].id,
                    product_id=products[0].id,
                    shift_id=shifts[0].id,
                    production_date=today,
                    total_output=450,
                    good_quantity=432,
                    rework_quantity=12,
                    scrap_quantity=6,
                    trial_production=False,
                    operator="张师傅",
                    inspector="质检员A",
                    quality_result="合格"
                ),
                ProductionRecord(
                    device_id=devices[1].id,
                    work_order_id=work_orders[1].id,
                    product_id=products[1].id,
                    shift_id=shifts[0].id,
                    production_date=today,
                    total_output=380,
                    good_quantity=361,
                    rework_quantity=15,
                    scrap_quantity=4,
                    trial_production=False,
                    operator="李师傅",
                    inspector="质检员B",
                    quality_result="合格"
                ),
                ProductionRecord(
                    device_id=devices[2].id,
                    work_order_id=work_orders[2].id,
                    product_id=products[2].id,
                    shift_id=shifts[0].id,
                    production_date=today,
                    total_output=200,
                    good_quantity=195,
                    rework_quantity=3,
                    scrap_quantity=2,
                    trial_production=False,
                    operator="王师傅",
                    inspector="质检员A",
                    quality_result="合格"
                ),
            ]
            db.add_all(prod_records)
            db.commit()
        
        print("样本数据初始化完成！")
        
    except Exception as e:
        print(f"初始化数据时出错: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_sample_data()
