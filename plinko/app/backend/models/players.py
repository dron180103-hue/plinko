from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class Players(Base):
    __tablename__ = "players"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    nickname = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=True)