import logging
import json
from typing import List, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("websocket_manager")


class ConnectionManager:
    def __init__(self):
        # Store active connections: List of (WebSocket, client_type, user_id)
        self.active_connections: List[Dict[str, Any]] = []

    async def connect(self, websocket: WebSocket, client_type: str = "user", user_id: str = "anonymous"):
        await websocket.accept()
        conn_info = {"websocket": websocket, "client_type": client_type, "user_id": user_id}
        self.active_connections.append(conn_info)
        logger.info(f"WebSocket client connected: type={client_type}, user_id={user_id}. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections = [c for c in self.active_connections if c["websocket"] != websocket]
        logger.info(f"WebSocket client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast_to_all(self, event_type: str, data: Dict[str, Any]):
        payload = json.dumps({"event": event_type, "data": data})
        disconnected = []
        for conn in self.active_connections:
            try:
                await conn["websocket"].send_text(payload)
            except Exception as e:
                disconnected.append(conn["websocket"])
        for ws in disconnected:
            self.disconnect(ws)

    async def broadcast_to_admins(self, event_type: str, data: Dict[str, Any]):
        payload = json.dumps({"event": event_type, "data": data})
        disconnected = []
        for conn in self.active_connections:
            if conn["client_type"] == "admin":
                try:
                    await conn["websocket"].send_text(payload)
                except Exception:
                    disconnected.append(conn["websocket"])
        for ws in disconnected:
            self.disconnect(ws)

    async def broadcast_to_users(self, event_type: str, data: Dict[str, Any]):
        payload = json.dumps({"event": event_type, "data": data})
        disconnected = []
        for conn in self.active_connections:
            if conn["client_type"] == "user":
                try:
                    await conn["websocket"].send_text(payload)
                except Exception:
                    disconnected.append(conn["websocket"])
        for ws in disconnected:
            self.disconnect(ws)

    async def send_to_user(self, user_id: str, event_type: str, data: Dict[str, Any]):
        payload = json.dumps({"event": event_type, "data": data})
        for conn in self.active_connections:
            if conn["user_id"] == user_id or conn["user_id"] == "all":
                try:
                    await conn["websocket"].send_text(payload)
                except Exception:
                    pass


ws_manager = ConnectionManager()
