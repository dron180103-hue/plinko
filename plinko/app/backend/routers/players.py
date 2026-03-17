import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.players import PlayersService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/players", tags=["players"])


# ---------- Pydantic Schemas ----------
class PlayersData(BaseModel):
    """Entity data schema (for create/update)"""
    user_id: str
    nickname: str
    password_hash: str
    is_admin: bool = None
    created_at: Optional[datetime] = None


class PlayersUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    user_id: Optional[str] = None
    nickname: Optional[str] = None
    password_hash: Optional[str] = None
    is_admin: Optional[bool] = None
    created_at: Optional[datetime] = None


class PlayersResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    nickname: str
    password_hash: str
    is_admin: Optional[bool] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PlayersListResponse(BaseModel):
    """List response schema"""
    items: List[PlayersResponse]
    total: int
    skip: int
    limit: int


class PlayersBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[PlayersData]


class PlayersBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: PlayersUpdateData


class PlayersBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[PlayersBatchUpdateItem]


class PlayersBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=PlayersListResponse)
async def query_playerss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query playerss with filtering, sorting, and pagination"""
    logger.debug(f"Querying playerss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = PlayersService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
        )
        logger.debug(f"Found {result['total']} playerss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying playerss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=PlayersListResponse)
async def query_playerss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query playerss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying playerss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = PlayersService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} playerss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying playerss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=PlayersResponse)
async def get_players(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single players by ID"""
    logger.debug(f"Fetching players with id: {id}, fields={fields}")
    
    service = PlayersService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Players with id {id} not found")
            raise HTTPException(status_code=404, detail="Players not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching players {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=PlayersResponse, status_code=201)
async def create_players(
    data: PlayersData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new players"""
    logger.debug(f"Creating new players with data: {data}")
    
    service = PlayersService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create players")
        
        logger.info(f"Players created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating players: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating players: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[PlayersResponse], status_code=201)
async def create_playerss_batch(
    request: PlayersBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple playerss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} playerss")
    
    service = PlayersService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} playerss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[PlayersResponse])
async def update_playerss_batch(
    request: PlayersBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple playerss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} playerss")
    
    service = PlayersService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} playerss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=PlayersResponse)
async def update_players(
    id: int,
    data: PlayersUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing players"""
    logger.debug(f"Updating players {id} with data: {data}")

    service = PlayersService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Players with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Players not found")
        
        logger.info(f"Players {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating players {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating players {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_playerss_batch(
    request: PlayersBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple playerss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} playerss")
    
    service = PlayersService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} playerss successfully")
        return {"message": f"Successfully deleted {deleted_count} playerss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_players(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single players by ID"""
    logger.debug(f"Deleting players with id: {id}")
    
    service = PlayersService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Players with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Players not found")
        
        logger.info(f"Players {id} deleted successfully")
        return {"message": "Players deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting players {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")