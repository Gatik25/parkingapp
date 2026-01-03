from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class ViolationStatus(str, Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class ViolationBase(BaseModel):
    parking_lot_id: int
    occupancy_percentage: float
    occupancy_count: int
    legal_capacity: int


class ViolationCreate(ViolationBase):
    pass


class ViolationUpdate(BaseModel):
    status: Optional[ViolationStatus] = None
    notes: Optional[str] = None
    evidence_report_url: Optional[str] = None
    photo_evidence_url: Optional[str] = None
    acknowledged_by: Optional[str] = None
    resolved_by: Optional[str] = None


class ParkingLotBasic(BaseModel):
    id: int
    name: str
    location: str
    legal_capacity: int
    current_occupancy: int
    
    class Config:
        from_attributes = True


class ViolationResponse(BaseModel):
    id: int
    parking_lot_id: int
    parking_lot: Optional[ParkingLotBasic] = None
    occupancy_percentage: float
    occupancy_count: int
    legal_capacity: int
    status: ViolationStatus
    detected_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    notes: Optional[str] = None
    evidence_report_url: Optional[str] = None
    photo_evidence_url: Optional[str] = None
    acknowledged_by: Optional[str] = None
    resolved_by: Optional[str] = None
    is_critical: bool = False
    
    class Config:
        from_attributes = True


class ViolationListResponse(BaseModel):
    total: int
    violations: list[ViolationResponse]
