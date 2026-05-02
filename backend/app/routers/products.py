from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Product, ProductCategory, Supplier, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/products", tags=["商品管理"])


class ProductCategoryResponse(BaseModel):
    id: int
    code: str
    name: str
    parent_id: Optional[int]
    description: Optional[str]
    is_active: bool
    
    class Config:
        from_attributes = True


class SupplierResponse(BaseModel):
    id: int
    code: str
    name: str
    contact_person: Optional[str]
    phone: Optional[str]
    is_active: bool
    
    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: int
    code: str
    name: str
    category_id: Optional[int]
    category_name: Optional[str]
    supplier_id: Optional[int]
    supplier_name: Optional[str]
    specification: Optional[str]
    unit: Optional[str]
    unit_price: float
    tax_rate: float
    description: Optional[str]
    stock_quantity: float
    is_active: bool
    
    class Config:
        from_attributes = True


class ProductCreateRequest(BaseModel):
    code: str
    name: str
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    specification: Optional[str] = None
    unit: str = "个"
    unit_price: float = 0.0
    tax_rate: float = 0.13
    description: Optional[str] = None
    stock_quantity: float = 0.0


@router.get("/categories", response_model=List[ProductCategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    categories = db.query(ProductCategory).filter(
        ProductCategory.is_active == True
    ).all()
    return [ProductCategoryResponse.from_orm(c) for c in categories]


@router.get("/suppliers", response_model=List[SupplierResponse])
def get_suppliers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    suppliers = db.query(Supplier).filter(
        Supplier.is_active == True
    ).all()
    return [SupplierResponse.from_orm(s) for s in suppliers]


@router.get("/", response_model=List[ProductResponse])
def get_products(
    category_id: Optional[int] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product).filter(Product.is_active == True)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if keyword:
        query = query.filter(
            (Product.name.like(f"%{keyword}%")) |
            (Product.code.like(f"%{keyword}%"))
        )
    
    products = query.all()
    
    result = []
    for product in products:
        category_name = None
        if product.category:
            category_name = product.category.name
        
        supplier_name = None
        if product.supplier:
            supplier_name = product.supplier.name
        
        result.append(ProductResponse(
            id=product.id,
            code=product.code,
            name=product.name,
            category_id=product.category_id,
            category_name=category_name,
            supplier_id=product.supplier_id,
            supplier_name=supplier_name,
            specification=product.specification,
            unit=product.unit,
            unit_price=product.unit_price,
            tax_rate=product.tax_rate,
            description=product.description,
            stock_quantity=product.stock_quantity,
            is_active=product.is_active
        ))
    
    return result


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    
    category_name = None
    if product.category:
        category_name = product.category.name
    
    supplier_name = None
    if product.supplier:
        supplier_name = product.supplier.name
    
    return ProductResponse(
        id=product.id,
        code=product.code,
        name=product.name,
        category_id=product.category_id,
        category_name=category_name,
        supplier_id=product.supplier_id,
        supplier_name=supplier_name,
        specification=product.specification,
        unit=product.unit,
        unit_price=product.unit_price,
        tax_rate=product.tax_rate,
        description=product.description,
        stock_quantity=product.stock_quantity,
        is_active=product.is_active
    )


@router.post("/", response_model=ProductResponse)
def create_product(
    request: ProductCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Product).filter(Product.code == request.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="商品编码已存在")
    
    product = Product(
        code=request.code,
        name=request.name,
        category_id=request.category_id,
        supplier_id=request.supplier_id,
        specification=request.specification,
        unit=request.unit,
        unit_price=request.unit_price,
        tax_rate=request.tax_rate,
        description=request.description,
        stock_quantity=request.stock_quantity,
        is_active=True
    )
    
    db.add(product)
    db.commit()
    db.refresh(product)
    
    category_name = None
    if product.category:
        category_name = product.category.name
    
    supplier_name = None
    if product.supplier:
        supplier_name = product.supplier.name
    
    return ProductResponse(
        id=product.id,
        code=product.code,
        name=product.name,
        category_id=product.category_id,
        category_name=category_name,
        supplier_id=product.supplier_id,
        supplier_name=supplier_name,
        specification=product.specification,
        unit=product.unit,
        unit_price=product.unit_price,
        tax_rate=product.tax_rate,
        description=product.description,
        stock_quantity=product.stock_quantity,
        is_active=product.is_active
    )


@router.post("/init-data")
def init_test_products(db: Session = Depends(get_db)):
    existing_category = db.query(ProductCategory).first()
    if existing_category:
        return {"message": "商品数据已初始化"}
    
    category1 = ProductCategory(
        code="CAT001",
        name="办公设备",
        description="办公设备类商品"
    )
    category2 = ProductCategory(
        code="CAT002",
        name="办公用品",
        description="办公用品类商品"
    )
    category3 = ProductCategory(
        code="CAT003",
        name="IT设备",
        description="IT设备类商品"
    )
    
    db.add_all([category1, category2, category3])
    db.flush()
    
    supplier1 = Supplier(
        code="SUP001",
        name="办公设备供应商A",
        contact_person="张三",
        phone="13800138001",
        email="supplier1@example.com",
        address="北京市朝阳区办公设备街1号"
    )
    supplier2 = Supplier(
        code="SUP002",
        name="IT设备供应商B",
        contact_person="李四",
        phone="13800138002",
        email="supplier2@example.com",
        address="上海市浦东新区科技路2号"
    )
    
    db.add_all([supplier1, supplier2])
    db.flush()
    
    products = [
        Product(
            code="PRD001",
            name="联想笔记本电脑 ThinkPad X1",
            category_id=category3.id,
            supplier_id=supplier2.id,
            specification="14英寸, i7处理器, 16GB内存, 512GB SSD",
            unit="台",
            unit_price=12000.00,
            tax_rate=0.13,
            stock_quantity=50
        ),
        Product(
            code="PRD002",
            name="惠普激光打印机 M404dn",
            category_id=category1.id,
            supplier_id=supplier1.id,
            specification="黑白激光, 双面打印, 网络连接",
            unit="台",
            unit_price=3500.00,
            tax_rate=0.13,
            stock_quantity=30
        ),
        Product(
            code="PRD003",
            name="A4复印纸 70g",
            category_id=category2.id,
            supplier_id=supplier1.id,
            specification="500张/包, 5包/箱",
            unit="箱",
            unit_price=120.00,
            tax_rate=0.13,
            stock_quantity=500
        ),
        Product(
            code="PRD004",
            name="戴尔显示器 27英寸 4K",
            category_id=category3.id,
            supplier_id=supplier2.id,
            specification="27英寸, 4K分辨率, IPS面板",
            unit="台",
            unit_price=4500.00,
            tax_rate=0.13,
            stock_quantity=25
        ),
        Product(
            code="PRD005",
            name="办公椅 人体工学",
            category_id=category1.id,
            supplier_id=supplier1.id,
            specification="可调节高度, 靠背支撑, 滚轮底座",
            unit="把",
            unit_price=800.00,
            tax_rate=0.13,
            stock_quantity=100
        )
    ]
    
    db.add_all(products)
    db.commit()
    
    return {"message": "商品测试数据初始化完成", "products_count": len(products)}
