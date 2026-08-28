"""
WebSockets — CardioRetina AI
Real-time progress updates for the ML pipeline.
Celery workers publish progress to Redis, and this router broadcasts to connected clients.
"""
import json
import asyncio
import logging
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps job_id to list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        self.pubsub = self.redis.pubsub()
        self._listener_task = None

    async def connect(self, websocket: WebSocket, job_id: str):
        await websocket.accept()
        if job_id not in self.active_connections:
            self.active_connections[job_id] = []
        self.active_connections[job_id].append(websocket)
        
        # Start Redis listener if not already running
        if not self._listener_task or self._listener_task.done():
            self._listener_task = asyncio.create_task(self._listen_to_redis())

    def disconnect(self, websocket: WebSocket, job_id: str):
        if job_id in self.active_connections:
            self.active_connections[job_id].remove(websocket)
            if not self.active_connections[job_id]:
                del self.active_connections[job_id]

    async def _listen_to_redis(self):
        """Listen to Redis Pub/Sub for progress updates from Celery workers."""
        try:
            await self.pubsub.subscribe("job_progress")
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    job_id = data.get("job_id")
                    if job_id and job_id in self.active_connections:
                        await self.broadcast(data, job_id)
        except Exception as e:
            logger.error(f"Redis Pub/Sub error: {e}")

    async def broadcast(self, message: dict, job_id: str):
        """Send message to all websockets listening to this job_id."""
        if job_id in self.active_connections:
            # We iterate over a copy in case it changes during iteration
            for connection in self.active_connections[job_id][:]:
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(connection, job_id)


manager = ConnectionManager()

@router.websocket("/progress/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    await manager.connect(websocket, job_id)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, job_id)
