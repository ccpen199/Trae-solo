# 独立站电商系统配置

# 数据库配置
DB_HOST = "localhost"
DB_PORT = 3306
DB_USER = "ecommerce"
DB_PASSWORD = "ECom2024!Db"
DB_NAME = "ecommerce"

# Redis配置
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_PASSWORD = "ECom2024!Redis"

# 服务端口配置
PORTS = {
    "gateway": 8000,
    "user": 8001,
    "product": 8002,
    "order": 8003,
    "payment": 8004,
    "marketing": 8005,
    "warehouse": 8006,
    "notify": 8007,
    "report": 8008,
    "cs": 8009
}

# 服务URL配置
SERVICE_URLS = {
    "user": f"http://localhost:{PORTS['user']}",
    "product": f"http://localhost:{PORTS['product']}",
    "order": f"http://localhost:{PORTS['order']}",
    "payment": f"http://localhost:{PORTS['payment']}",
    "marketing": f"http://localhost:{PORTS['marketing']}",
    "warehouse": f"http://localhost:{PORTS['warehouse']}",
    "notify": f"http://localhost:{PORTS['notify']}",
    "report": f"http://localhost:{PORTS['report']}",
    "cs": f"http://localhost:{PORTS['cs']}"
}

# JWT配置
JWT_SECRET = "ECom2024!JwtSecret"
JWT_EXPIRY = 3600

# 支付配置
PAYMENT_CONFIG = {
    "alipay": {
        "app_id": "2021000000000000",
        "private_key": "your_private_key",
        "public_key": "alipay_public_key"
    },
    "wechat": {
        "app_id": "wx1234567890123456",
        "mch_id": "1234567890",
        "api_key": "your_api_key"
    }
}

# 物流配置
LOGISTICS_CONFIG = {
    "SF": {
        "api_key": "sf_api_key",
        "secret": "sf_secret"
    },
    "YTO": {
        "api_key": "yto_api_key",
        "secret": "yto_secret"
    }
}

# 邮件配置
EMAIL_CONFIG = {
    "smtp_server": "smtp.qq.com",
    "smtp_port": 587,
    "smtp_user": "your_email@qq.com",
    "smtp_pass": "your_email_password",
    "from_email": "your_email@qq.com"
}

# 短信配置
SMS_CONFIG = {
    "aliyun": {
        "access_key_id": "your_access_key_id",
        "access_key_secret": "your_access_key_secret"
    }
}

# 系统配置
SYSTEM_CONFIG = {
    "upload_dir": "uploads",
    "max_upload_size": 10 * 1024 * 1024,  # 10MB
    "allowed_extensions": ["jpg", "jpeg", "png", "gif", "pdf"]
}
