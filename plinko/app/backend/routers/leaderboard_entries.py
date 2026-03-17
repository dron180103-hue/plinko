import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.leaderboard_entries import Leaderboard_entriesService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/leaderboard_entries", tags=["leaderboard_entries"])


# ---------- Pydantic Schemas ----------
class Leaderboard_entriesData(BaseModel):
    """Entity data schema (for create/update)"""
    user_id: str
    player_id: int
    nickname: str
    total_won: float = None
    level: int = None
    prestige_level: int = None
    updated_at: Optional[datetime] = None


class Leaderboard_entriesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    user_id: Optional[str] = None
    player_id: Optional[int] = None
    nickname: Optional[str] = None
    total_won: Optional[float] = None
    level: Optional[int] = None
    prestige_level: Optional[int] = None
    updated_at: Optional[datetime] = None


class Leaderboard_entriesResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    player_id: int
    nickname: str
    total_won: Optional[float] = None
    level: Optional[int] = None
    prestige_level: Optional[int] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Leaderboard_entriesListResponse(BaseModel):
    """List response schema"""
    items: List[Leaderboard_entriesResponse]
    total: int
    skip: int
    limit: int


class Leaderboard_entriesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Leaderboard_entriesData]


class Leaderboard_entriesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Leaderboard_entriesUpdateData


class Leaderboard_entriesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Leaderboard_entriesBatchUpdateItem]


class Leaderboard_entriesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Leaderboard_entriesListResponse)
async def query_leaderboard_entriess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query leaderboard_entriess with filtering, sorting, and pagination"""
    logger.debug(f"Querying leaderboard_entriess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Leaderboard_entriesService(db)
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
        logger.debug(f"Found {result['total']} leaderboard_entriess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying leaderboard_entriess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Leaderboard_entriesListResponse)
async def query_leaderboard_entriess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query leaderboard_entriess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying leaderboard_entriess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Leaderboard_entriesService(db)
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
        logger.debug(f"Found {result['total']} leaderboard_entriess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying leaderboard_entriess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Leaderboard_entriesResponse)
async def get_leaderboard_entries(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single leaderboard_entries by ID"""
    logger.debug(f"Fetching leaderboard_entries with id: {id}, fields={fields}")
    
    service = Leaderboard_entriesService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Leaderboard_entries with id {id} not found")
            raise HTTPException(status_code=404, detail="Leaderboard_entries not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching leaderboard_entries {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Leaderboard_entriesResponse, status_code=201)
async def create_leaderboard_entries(
    data: Leaderboard_entriesData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new leaderboard_entries"""
    logger.debug(f"Creating new leaderboard_entries with data: {data}")
    
    service = Leaderboard_entriesService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create leaderboard_entries")
        
        logger.info(f"Leaderboard_entries created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating leaderboard_entries: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating leaderboard_entries: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Leaderboard_entriesResponse], status_code=201)
async def create_leaderboard_entriess_batch(
    request: Leaderboard_entriesBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple leaderboard_entriess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} leaderboard_entriess")
    
    service = Leaderboard_entriesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} leaderboard_entriess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Leaderboard_entriesResponse])
async def update_leaderboard_entriess_batch(
    request: Leaderboard_entriesBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple leaderboard_entriess in a single request"""
    logger.debug(f"Batch updating {len(request.items)} leaderboard_entriess")
    
    service = Leaderboard_entriesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} leaderboard_entriess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Leaderboard_entriesResponse)
async def update_leaderboard_entries(
    id: int,
    data: Leaderboard_entriesUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing leaderboard_entries"""
    logger.debug(f"Updating leaderboard_entries {id} with data: {data}")

    service = Leaderboard_entriesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Leaderboard_entries with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Leaderboard_entries not found")
        
        logger.info(f"Leaderboard_entries {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating leaderboard_entries {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating leaderboard_entries {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_leaderboard_entriess_batch(
    request: Leaderboard_entriesBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple leaderboard_entriess by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} leaderboard_entriess")
    
    service = Leaderboard_entriesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} leaderboard_entriess successfully")
        return {"message": f"Successfully deleted {deleted_count} leaderboard_entriess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_leaderboard_entries(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single leaderboard_entries by ID"""
    logger.debug(f"Deleting leaderboard_entries with id: {id}")
    
    service = Leaderboard_entriesService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Leaderboard_entries with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Leaderboard_entries not found")
        
        logger.info(f"Leaderboard_entries {id} deleted successfully")
        return {"message": "Leaderboard_entries deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting leaderboard_entries {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")