from app.config import settings
from app.database import Base, engine, get_db
from app.models import *

Base.metadata.create_all(bind=engine)
