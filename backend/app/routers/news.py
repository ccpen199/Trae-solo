from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import schemas, crud, models
from app.auth import get_current_active_user, require_roles

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/", response_model=schemas.NewsListResponse)
def read_news(
    page: int = 1,
    size: int = 10,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * size
    news = crud.get_news(db, skip=skip, limit=size, category_id=category_id)
    total = crud.get_news_count(db, category_id=category_id)
    return {
        "total": total,
        "items": news,
        "page": page,
        "size": size
    }


@router.get("/search", response_model=List[schemas.NewsResponse])
def search_news(
    q: str,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    return crud.search_news(db, query=q, skip=skip, limit=limit)


@router.get("/{slug}", response_model=schemas.NewsResponse)
def read_news_by_slug(slug: str, db: Session = Depends(get_db)):
    db_news = crud.get_news_by_slug(db, slug=slug)
    if db_news is None:
        raise HTTPException(status_code=404, detail="News not found")
    crud.increment_views(db, news_id=db_news.id)
    return db_news


@router.post("/", response_model=schemas.NewsResponse)
def create_news(
    news: schemas.NewsCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.UserRole.ADMIN, models.UserRole.EDITOR))
):
    return crud.create_news(db=db, news=news, author_id=current_user.id)
