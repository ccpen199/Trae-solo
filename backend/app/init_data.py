from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import bcrypt
from app.database import SessionLocal
from app.models import (
    User, Device, MeterData, Alarm, EnergyPrediction,
    EnergySuggestion, Bill, TodoTask, Inspection, EnergyReport,
    SystemConfig, OperationLog, AuditLog
)


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def initialize_data():
    db = SessionLocal()
    
    try:
        existing_users = db.query(User).count()
        if existing_users > 0:
            logger.info("数据已存在，跳过初始化")
            db.close()
            return
        
        admin_user = User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            real_name="系统管理员",
            role="admin",
            department="信息技术部",
            phone="13800138000",
            email="admin@energy.com",
            is_active=True,
        )
        db.add(admin_user)
        
        energy_admin = User(
            username="energy_admin",
            password_hash=get_password_hash("123456"),
            real_name="张能源",
            role="energy_admin",
            department="能源管理部",
            phone="13800138001",
            email="energy@company.com",
            is_active=True,
        )
        db.add(energy_admin)
        
        maintenance = User(
            username="maintenance",
            password_hash=get_password_hash("123456"),
            real_name="李运维",
            role="maintenance_operator",
            department="运维部",
            phone="13800138002",
            email="maintenance@company.com",
            is_active=True,
        )
        db.add(maintenance)
        
        finance = User(
            username="finance",
            password_hash=get_password_hash("123456"),
            real_name="王财务",
            role="finance_accountant",
            department="财务部",
            phone="13800138003",
            email="finance@company.com",
            is_active=True,
        )
        db.add(finance)
        
        regulator = User(
            username="regulator",
            password_hash=get_password_hash("123456"),
            real_name="赵监管",
            role="government_regulator",
            department="监管部门",
            phone="13800138004",
            email="regulator@government.com",
            is_active=True,
        )
        db.add(regulator)
        
        db.flush()
        
        devices_data = [
            {
                "device_code": "METER-001",
                "device_name": "生产车间A智能电表",
                "device_type": "智能电表",
                "location": "生产车间A - 1号配电房",
                "rated_power": 500.0,
                "protocol": "Modbus-TCP",
                "ip_address": "192.168.1.101",
                "status": "online",
                "last_online_at": datetime.utcnow()
            },
            {
                "device_code": "METER-002",
                "device_name": "生产车间B智能电表",
                "device_type": "智能电表",
                "location": "生产车间B - 2号配电房",
                "rated_power": 450.0,
                "protocol": "Modbus-TCP",
                "ip_address": "192.168.1.102",
                "status": "online",
                "last_online_at": datetime.utcnow()
            },
            {
                "device_code": "METER-003",
                "device_name": "办公楼智能电表",
                "device_type": "智能电表",
                "location": "办公楼 - 地下室配电房",
                "rated_power": 200.0,
                "protocol": "DL/T645",
                "ip_address": "192.168.1.103",
                "status": "online",
                "last_online_at": datetime.utcnow()
            },
            {
                "device_code": "TRANS-001",
                "device_name": "1号变压器",
                "device_type": "变压器",
                "location": "主配电房",
                "rated_power": 1250.0,
                "protocol": "Modbus-RTU",
                "ip_address": "192.168.1.201",
                "status": "online",
                "last_online_at": datetime.utcnow()
            },
            {
                "device_code": "UPS-001",
                "device_name": "数据中心UPS",
                "device_type": "UPS",
                "location": "数据中心机房",
                "rated_power": 300.0,
                "protocol": "MQTT",
                "ip_address": "192.168.1.301",
                "status": "online",
                "last_online_at": datetime.utcnow()
            },
            {
                "device_code": "PDG-001",
                "device_name": "高压配电柜",
                "device_type": "配电柜",
                "location": "主配电房",
                "rated_power": 2000.0,
                "protocol": "Modbus-TCP",
                "ip_address": "192.168.1.251",
                "status": "offline",
                "last_online_at": datetime.utcnow() - timedelta(hours=2)
            },
        ]
        
        created_devices = []
        for device_data in devices_data:
            device = Device(**device_data)
            db.add(device)
            created_devices.append(device)
        
        db.flush()
        
        now = datetime.utcnow()
        for device in created_devices[:5]:
            for i in range(60):
                timestamp = now - timedelta(minutes=(60 - i))
                base_power = device.rated_power or 100.0
                fluctuation = random.uniform(-0.25, 0.25)
                active_power = base_power * (0.7 + fluctuation)
                
                meter_data = MeterData(
                    device_id=device.id,
                    timestamp=timestamp,
                    active_power=round(active_power, 2),
                    reactive_power=round(active_power * random.uniform(0.2, 0.35), 2),
                    voltage=round(220 + random.uniform(-8, 8), 1),
                    current=round(active_power / 220 * (1 + random.uniform(-0.1, 0.1)), 3),
                    power_factor=round(random.uniform(0.85, 0.98), 3),
                    frequency=round(50 + random.uniform(-0.2, 0.2), 2),
                    total_energy=round(1000 + i * random.uniform(0.5, 2.0), 2),
                    data_source="IoT-Stream",
                    is_valid=True,
                )
                db.add(meter_data)
        
        alarm_data = [
            {
                "device_id": created_devices[0].id,
                "alarm_type": "over_load",
                "alarm_level": "high",
                "title": "生产车间A负荷超标",
                "description": "实时功率 580kW 超过额定功率 500kW 的 116%",
                "status": "active",
                "triggered_at": now - timedelta(hours=1),
                "trigger_reason": "功率超标: 580 > 500",
            },
            {
                "device_id": created_devices[5].id,
                "alarm_type": "device_offline",
                "alarm_level": "critical",
                "title": "高压配电柜离线",
                "description": "设备已离线超过 2 小时",
                "status": "active",
                "triggered_at": now - timedelta(hours=2),
                "trigger_reason": "设备心跳超时",
            },
        ]
        
        for alarm_info in alarm_data:
            alarm = Alarm(**alarm_info)
            db.add(alarm)
            db.flush()
            
            todo = TodoTask(
                task_type="alarm",
                title=f"处理告警: {alarm_info['title']}",
                description=f"告警级别: {alarm_info['alarm_level']}, 告警类型: {alarm_info['alarm_type']}\n{alarm_info['description']}",
                priority="high" if alarm_info['alarm_level'] in ['critical', 'high'] else "medium",
                status="pending",
                related_alarm_id=alarm.id,
            )
            db.add(todo)
        
        suggestion = EnergySuggestion(
            suggestion_no=f"ES-{now.strftime('%Y%m%d%H%M%S')}-0001",
            source_type="Power-Load Prediction",
            title="功率因数补偿优化建议",
            content="""检测到生产车间A存在功率因数波动情况：
- 当前平均功率因数: 0.88
- 建议目标功率因数: 0.92 以上

建议措施：
1. 检查无功补偿装置运行状态
2. 验证功率因数控制器参数设置
3. 分析谐波含量是否超标
4. 考虑增加电容器组容量

预估节能效益：如及时优化，预计可提升功率因数 0.04，降低线损 3-5%。
""",
            category="功率补偿",
            estimated_saving=120.0,
            priority="high",
            status="pending",
        )
        db.add(suggestion)
        
        tariff_config = SystemConfig(
            config_key="tariff_config",
            config_value="""{
                "peak_rate": 1.2,
                "valley_rate": 0.4,
                "normal_rate": 0.8,
                "peak_hours": [9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21],
                "valley_hours": [0, 1, 2, 3, 4, 5, 6],
                "tax_rate": 0.13,
                "阶梯费率": [
                    {"threshold": 1000, "rate": 0.8},
                    {"threshold": 3000, "rate": 0.9},
                    {"threshold": 9999999, "rate": 1.0}
                ]
            }""",
            config_type="json",
            description="费率配置",
            module="Tariff-Model",
        )
        db.add(tariff_config)
        
        db.commit()
        
        print("初始化数据完成！")
        print("默认账号: admin / admin123")
        
    except Exception as e:
        db.rollback()
        print(f"初始化数据失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


import logging
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    initialize_data()
