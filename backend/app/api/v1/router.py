from fastapi import APIRouter
from app.api.v1.endpoints import violations, parking_lots

api_router = APIRouter()

api_router.include_router(violations.router, prefix="/violations", tags=["violations"])
api_router.include_router(parking_lots.router, prefix="/parking-lots", tags=["parking-lots"])
