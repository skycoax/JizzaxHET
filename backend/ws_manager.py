"""
WebSocket ulanishlarni boshqarish
===================================
Barcha ulangan dashboardlarga yangilanish yuboradi.
"""
import json
import logging
from fastapi import WebSocket

log = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._clients: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._clients.append(ws)
        log.info(f"WS: ulandi ({len(self._clients)} ta aktiv)")

    def disconnect(self, ws: WebSocket) -> None:
        self._clients.remove(ws)
        log.info(f"WS: uzildi ({len(self._clients)} ta aktiv)")

    async def broadcast(self, msg: dict) -> None:
        """Barcha ulangan clientlarga xabar yuborish."""
        if not self._clients:
            return
        text = json.dumps(msg, ensure_ascii=False)
        dead = []
        for ws in self._clients:
            try:
                await ws.send_text(text)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._clients.remove(ws)

    async def send_to(self, ws: WebSocket, msg: dict) -> None:
        await ws.send_text(json.dumps(msg, ensure_ascii=False))

    @property
    def count(self) -> int:
        return len(self._clients)


manager = ConnectionManager()
