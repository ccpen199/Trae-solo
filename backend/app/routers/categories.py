from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import schemas, crud, models
from app.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=List[schemas.CategoryResponse])
def read_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    categories = crud.get_categories(db, skip=skip, limit=limit)
    return categories


@router.get("/{slug}", response_model=schemas.CategoryResponse)
def read_category(slug: str, db: Session = Depends(get_db)):
    db_category = crud.get_category_by_slug(db, slug=slug)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category


@router.post("/", response_model=schemas.CategoryResponse)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.UserRole.ADMIN, models.UserRole.EDITOR))
):
    return crud.create_category(db=db, category=category)
