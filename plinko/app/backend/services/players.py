import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.players import Players

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class PlayersService:
    """Service layer for Players operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Optional[Players]:
        """Create a new players"""
        try:
            obj = Players(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created players with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating players: {str(e)}")
            raise

    async def get_by_id(self, obj_id: int) -> Optional[Players]:
        """Get players by ID"""
        try:
            query = select(Players).where(Players.id == obj_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching players {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of playerss"""
        try:
            query = select(Players)
            count_query = select(func.count(Players.id))
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Players, field):
                        query = query.where(getattr(Players, field) == value)
                        count_query = count_query.where(getattr(Players, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Players, field_name):
                        query = query.order_by(getattr(Players, field_name).desc())
                else:
                    if hasattr(Players, sort):
                        query = query.order_by(getattr(Players, sort))
            else:
                query = query.order_by(Players.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching players list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any]) -> Optional[Players]:
        """Update players"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Players {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated players {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating players {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int) -> bool:
        """Delete players"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Players {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted players {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting players {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Players]:
        """Get players by any field"""
        try:
            if not hasattr(Players, field_name):
                raise ValueError(f"Field {field_name} does not exist on Players")
            result = await self.db.execute(
                select(Players).where(getattr(Players, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching players by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Players]:
        """Get list of playerss filtered by field"""
        try:
            if not hasattr(Players, field_name):
                raise ValueError(f"Field {field_name} does not exist on Players")
            result = await self.db.execute(
                select(Players)
                .where(getattr(Players, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Players.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching playerss by {field_name}: {str(e)}")
            raise