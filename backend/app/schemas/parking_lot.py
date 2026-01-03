from pydantic import BaseModel
from typing import Optional


class ParkingLotListItem(BaseModel):
    id: int
    name: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    legal_capacity: int
    current_occupancy: int
    is_active: bool

    class Config:
        from_attributes = True
