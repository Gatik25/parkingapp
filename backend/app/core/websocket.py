from fastapi import WebSocket
from typing import List, Dict
import json
from datetime import datetime


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.violation_subscribers: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, channel: str = "violations"):
        await websocket.accept()
        self.active_connections.append(websocket)
        if channel not in self.violation_subscribers:
            self.violation_subscribers[channel] = []
        self.violation_subscribers[channel].append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        for channel, subscribers in self.violation_subscribers.items():
            if websocket in subscribers:
                subscribers.remove(websocket)
    
    async def broadcast_violation(self, violation_data: dict):
        channel = "violations"
        if channel in self.violation_subscribers:
            disconnected = []
            for connection in self.violation_subscribers[channel]:
                try:
                    await connection.send_json({
                        "type": "violation_update",
                        "data": violation_data,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                except Exception:
                    disconnected.append(connection)
            
            for conn in disconnected:
                self.disconnect(conn)
    
    async def broadcast_violation_status_update(self, violation_id: int, status: str, violation_data: dict):
        channel = "violations"
        if channel in self.violation_subscribers:
            disconnected = []
            for connection in self.violation_subscribers[channel]:
                try:
                    await connection.send_json({
                        "type": "violation_status_update",
                        "violation_id": violation_id,
                        "status": status,
                        "data": violation_data,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                except Exception:
                    disconnected.append(connection)
            
            for conn in disconnected:
                self.disconnect(conn)


manager = ConnectionManager()
