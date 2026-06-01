from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..config import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=True)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    email = Column(String(100), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    avatar = Column(String(255), nullable=True)
    nickname = Column(String(50), nullable=True)
    
    qq_openid = Column(String(100), unique=True, nullable=True)
    wechat_openid = Column(String(100), unique=True, nullable=True)
    weibo_openid = Column(String(100), unique=True, nullable=True)
    
    phone_verified = Column(Boolean, default=False)
    real_name_verified = Column(Boolean, default=False)
    real_name = Column(String(50), nullable=True)
    id_card = Column(String(50), nullable=True)
    
    bank_account_opened = Column(Boolean, default=False)
    bank_name = Column(String(50), nullable=True)
    bank_account = Column(String(50), nullable=True)
    
    growth_value = Column(Integer, default=0)
    level = Column(Integer, default=1)
    balance = Column(Float, default=0.0)
    
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    credit_cards = relationship("CreditCard", back_populates="user", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    investments = relationship("Investment", back_populates="user", cascade="all, delete-orphan")
    loans = relationship("Loan", back_populates="user", cascade="all, delete-orphan")
    red_packets = relationship("RedPacket", back_populates="user", cascade="all, delete-orphan")
    coupons = relationship("Coupon", back_populates="user", cascade="all, delete-orphan")


class CreditCard(Base):
    __tablename__ = "credit_cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    bank_name = Column(String(50), nullable=False)
    card_number = Column(String(50), nullable=False)
    card_name = Column(String(50), nullable=True)
    credit_limit = Column(Float, default=0.0)
    used_limit = Column(Float, default=0.0)
    available_limit = Column(Float, default=0.0)
    bill_day = Column(Integer, nullable=True)
    repayment_day = Column(Integer, nullable=True)
    current_bill = Column(Float, default=0.0)
    min_repayment = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="credit_cards")
    bills = relationship("Bill", back_populates="credit_card", cascade="all, delete-orphan")


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    card_id = Column(Integer, ForeignKey("credit_cards.id"))
    bill_month = Column(String(10), nullable=False)
    total_amount = Column(Float, default=0.0)
    min_repayment = Column(Float, default=0.0)
    bill_date = Column(DateTime, nullable=True)
    repayment_date = Column(DateTime, nullable=True)
    is_paid = Column(Boolean, default=False)
    paid_amount = Column(Float, default=0.0)
    paid_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="unpaid")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bills")
    credit_card = relationship("CreditCard", back_populates="bills")
    bill_details = relationship("BillDetail", back_populates="bill", cascade="all, delete-orphan")


class BillDetail(Base):
    __tablename__ = "bill_details"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"))
    transaction_date = Column(DateTime, nullable=False)
    merchant_name = Column(String(100), nullable=False)
    amount = Column(Float, default=0.0)
    transaction_type = Column(String(20), default="consume")
    description = Column(Text, nullable=True)

    bill = relationship("Bill", back_populates="bill_details")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String(30), nullable=False)
    title = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="messages")


class WealthProduct(Base):
    __tablename__ = "wealth_products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(30), nullable=False)
    description = Column(Text, nullable=True)
    expected_annual_rate = Column(Float, default=0.0)
    min_investment = Column(Float, default=0.0)
    max_investment = Column(Float, nullable=True)
    term_days = Column(Integer, nullable=True)
    risk_level = Column(String(20), default="low")
    is_active = Column(Boolean, default=True)
    total_amount = Column(Float, default=0.0)
    sold_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("wealth_products.id"))
    product_name = Column(String(100), nullable=False)
    amount = Column(Float, default=0.0)
    expected_earnings = Column(Float, default=0.0)
    actual_earnings = Column(Float, nullable=True)
    status = Column(String(20), default="investing")
    purchase_date = Column(DateTime, default=datetime.utcnow)
    maturity_date = Column(DateTime, nullable=True)
    redeemed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="investments")


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    loan_amount = Column(Float, default=0.0)
    interest_rate = Column(Float, default=0.0)
    term_months = Column(Integer, default=12)
    monthly_payment = Column(Float, default=0.0)
    total_interest = Column(Float, default=0.0)
    total_repayment = Column(Float, default=0.0)
    status = Column(String(20), default="pending")
    purpose = Column(String(100), nullable=True)
    
    real_name_verified = Column(Boolean, default=False)
    operator_verified = Column(Boolean, default=False)
    
    applied_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    disbursed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="loans")


class RedPacket(Base):
    __tablename__ = "red_packets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100), nullable=False)
    amount = Column(Float, default=0.0)
    min_use_amount = Column(Float, default=0.0)
    status = Column(String(20), default="unused")
    valid_from = Column(DateTime, default=datetime.utcnow)
    valid_to = Column(DateTime, nullable=True)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="red_packets")


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String(30), nullable=False)
    name = Column(String(100), nullable=False)
    value = Column(Float, default=0.0)
    min_use_amount = Column(Float, default=0.0)
    status = Column(String(20), default="unused")
    valid_from = Column(DateTime, default=datetime.utcnow)
    valid_to = Column(DateTime, nullable=True)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="coupons")


class SmsCode(Base):
    __tablename__ = "sms_codes"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(20), index=True, nullable=False)
    code = Column(String(10), nullable=False)
    type = Column(String(30), nullable=False)
    used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class HousingFund(Base):
    __tablename__ = "housing_funds"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    city = Column(String(50), nullable=True)
    account_number = Column(String(50), nullable=True)
    balance = Column(Float, default=0.0)
    monthly_payment = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class VerificationCode(Base):
    __tablename__ = "verification_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String(30), nullable=False)
    code = Column(String(10), nullable=False)
    used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
