from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from ..config.database import get_db
from ..utils import success_response, error_response, get_password_hash
from ..models import User, CreditCard, Bill, Message, WealthProduct, Investment, RedPacket, Coupon

router = APIRouter(prefix="/admin", tags=["管理"])


@router.post("/init-sample-data")
async def init_sample_data(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).where(User.username == "test"))
        if result.scalar_one_or_none():
            return success_response(None, "示例数据已存在")
        
        user = User(
            username="test",
            password_hash=get_password_hash("123456"),
            phone="13800138000",
            phone_verified=True,
            nickname="测试用户",
            real_name_verified=True,
            real_name="张三",
            id_card="110101199001011234",
            growth_value=1000,
            level=5,
            balance=10000.0,
            bank_account_opened=True,
            bank_name="北京银行",
            bank_account="6214681234567890"
        )
        db.add(user)
        await db.flush()
        
        card1 = CreditCard(
            user_id=user.id,
            bank_name="招商银行",
            card_number="**** **** **** 1234",
            card_name="信用卡金卡",
            credit_limit=50000.0,
            used_limit=15000.0,
            available_limit=35000.0,
            bill_day=15,
            repayment_day=5,
            current_bill=15000.0,
            min_repayment=1500.0
        )
        card2 = CreditCard(
            user_id=user.id,
            bank_name="工商银行",
            card_number="**** **** **** 5678",
            card_name="牡丹卡",
            credit_limit=30000.0,
            used_limit=8000.0,
            available_limit=22000.0,
            bill_day=20,
            repayment_day=10,
            current_bill=8000.0,
            min_repayment=800.0
        )
        db.add(card1)
        db.add(card2)
        await db.flush()
        
        bill1 = Bill(
            user_id=user.id,
            card_id=card1.id,
            bill_month="2024-05",
            total_amount=15000.0,
            min_repayment=1500.0,
            bill_date=datetime(2024, 5, 15),
            repayment_date=datetime(2024, 6, 5),
            is_paid=False,
            status="unpaid"
        )
        bill2 = Bill(
            user_id=user.id,
            card_id=card2.id,
            bill_month="2024-05",
            total_amount=8000.0,
            min_repayment=800.0,
            bill_date=datetime(2024, 5, 20),
            repayment_date=datetime(2024, 6, 10),
            is_paid=False,
            status="unpaid"
        )
        db.add(bill1)
        db.add(bill2)
        
        messages_data = [
            ("system", "系统通知", "欢迎使用51信用卡管家，祝您使用愉快！"),
            ("fresh", "新鲜事", "51信用卡管家全新版本上线，快来体验新功能！"),
            ("announcement", "公告", "51信用卡管家将于今晚23:00-24:00进行系统维护，请提前做好相关安排。"),
            ("activity", "活动中心", "新用户专享：首次导入账单送100元还款金！"),
            ("interaction", "互动消息", "您的好友邀请您一起使用51信用卡管家，点击查看详情。")
        ]
        for category, title, content in messages_data:
            msg = Message(
                user_id=user.id,
                category=category,
                title=title,
                content=content,
                is_read=False
            )
            db.add(msg)
        
        products = [
            {
                "name": "51人品宝-新手专享",
                "type": "rp",
                "description": "新手专享，历史年化收益8%，期限30天",
                "expected_annual_rate": 0.08,
                "min_investment": 100.0,
                "max_investment": 10000.0,
                "term_days": 30,
                "risk_level": "low",
                "total_amount": 1000000.0,
                "sold_amount": 500000.0
            },
            {
                "name": "51人品宝-稳健型",
                "type": "rp",
                "description": "稳健型理财产品，历史年化收益6%，期限90天",
                "expected_annual_rate": 0.06,
                "min_investment": 1000.0,
                "term_days": 90,
                "risk_level": "low",
                "total_amount": 5000000.0,
                "sold_amount": 2000000.0
            },
            {
                "name": "51基金-混合成长",
                "type": "fund",
                "description": "混合型基金，追求长期资本增值",
                "expected_annual_rate": 0.12,
                "min_investment": 1000.0,
                "risk_level": "medium",
                "total_amount": 10000000.0,
                "sold_amount": 3000000.0
            }
        ]
        for p in products:
            product = WealthProduct(**p, is_active=True)
            db.add(product)
        
        red_packets = [
            {
                "name": "新用户红包",
                "amount": 50.0,
                "min_use_amount": 1000.0
            },
            {
                "name": "首单还款红包",
                "amount": 20.0,
                "min_use_amount": 500.0
            }
        ]
        for rp in red_packets:
            red_packet = RedPacket(
                user_id=user.id,
                **rp,
                status="unused",
                valid_from=datetime.utcnow(),
                valid_to=datetime.utcnow() + timedelta(days=30)
            )
            db.add(red_packet)
        
        coupons = [
            {
                "type": "repayment",
                "name": "还款券",
                "value": 10.0,
                "min_use_amount": 100.0
            },
            {
                "type": "investment",
                "name": "投资券",
                "value": 50.0,
                "min_use_amount": 5000.0
            },
            {
                "type": "loan",
                "name": "借款免息券",
                "value": 100.0,
                "min_use_amount": 10000.0
            }
        ]
        for c in coupons:
            coupon = Coupon(
                user_id=user.id,
                **c,
                status="unused",
                valid_from=datetime.utcnow(),
                valid_to=datetime.utcnow() + timedelta(days=30)
            )
            db.add(coupon)
        
        await db.commit()
        
        return success_response({
            "username": "test",
            "password": "123456"
        }, "示例数据初始化成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"初始化失败: {str(e)}")


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User))
        users_count = len(result.all())
        
        result = await db.execute(select(CreditCard))
        cards_count = len(result.all())
        
        result = await db.execute(select(WealthProduct))
        products_count = len(result.all())
        
        result = await db.execute(select(Investment))
        investments_count = len(result.all())
        
        return success_response({
            "users_count": users_count,
            "cards_count": cards_count,
            "products_count": products_count,
            "investments_count": investments_count
        })
    
    except Exception as e:
        return error_response(f"获取统计失败: {str(e)}")


@router.get("/users")
async def get_users(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(User).order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        users = result.scalars().all()
        
        return success_response([{
            "id": u.id,
            "username": u.username,
            "phone": u.phone,
            "nickname": u.nickname,
            "phone_verified": u.phone_verified,
            "real_name_verified": u.real_name_verified,
            "growth_value": u.growth_value,
            "level": u.level,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None
        } for u in users])
    
    except Exception as e:
        return error_response(f"获取用户列表失败: {str(e)}")
