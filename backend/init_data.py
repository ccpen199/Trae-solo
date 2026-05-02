import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from models import User, Merchant, UserRole
import bcrypt

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def init_test_data():
    init_db()
    db: Session = SessionLocal()
    
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@payment.local",
                phone="13800000000",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin)
            print("Created admin user")
        
        finance_user = db.query(User).filter(User.username == "finance").first()
        if not finance_user:
            finance_user = User(
                username="finance",
                email="finance@payment.local",
                phone="13800000001",
                hashed_password=get_password_hash("finance123"),
                role=UserRole.FINANCE,
                is_active=True
            )
            db.add(finance_user)
            print("Created finance user")
        
        merchant = db.query(Merchant).filter(Merchant.merchant_code == "M001").first()
        if not merchant:
            merchant = Merchant(
                merchant_code="M001",
                merchant_name="演示商户",
                contact_person="张三",
                contact_phone="13900000001",
                contact_email="merchant@payment.local",
                settlement_account="6222021234567890123",
                settlement_bank="中国工商银行",
                fee_rate=0.006,
                profit_sharing_ratio=0.0,
                available_balance=10000.0,
                frozen_balance=0.0,
                pending_settlement=0.0,
                status="active"
            )
            db.add(merchant)
            db.flush()
            print("Created merchant M001")
        
        merchant_operator = db.query(User).filter(User.username == "merchant").first()
        if not merchant_operator:
            merchant_operator = User(
                username="merchant",
                email="merchant@payment.local",
                phone="13900000002",
                hashed_password=get_password_hash("merchant123"),
                role=UserRole.MERCHANT_ADMIN,
                merchant_id=merchant.id,
                is_active=True
            )
            db.add(merchant_operator)
            print("Created merchant user")
        
        customer = db.query(User).filter(User.username == "customer").first()
        if not customer:
            customer = User(
                username="customer",
                email="customer@payment.local",
                phone="13700000001",
                hashed_password=get_password_hash("customer123"),
                role=UserRole.CUSTOMER,
                is_active=True
            )
            db.add(customer)
            print("Created customer user")
        
        db.commit()
        print("")
        print("初始化数据完成")
        print("默认账号:")
        print("  admin / admin123 (管理员)")
        print("  finance / finance123 (财务)")
        print("  merchant / merchant123 (商户管理员)")
        print("  customer / customer123 (C端用户)")
    except Exception as e:
        print(f"初始化数据错误: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_test_data()
