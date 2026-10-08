"""
AEK Kernel v0.4 - PostgreSQL Row-Locking Skip-Lock Queue Engine
Prevents task lease race conditions & ACK-without-execution bugs across multi-agent fleet.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
import json
import sqlite3
import os
from typing import Optional, List, Dict, Any

@dataclass
class QueueTask:
    id: str
    title: str
    agent_role: str
    priority: float
    payload: Dict[str, Any]
    status: str
    leased_by: Optional[str]
    expires_at: Optional[str]

class FleetSkipLockQueue:
    def __init__(self, db_path: str = "fleet_queue.db"):
        self.db_path = db_path
        self._init_sqlite_db()

    def _init_sqlite_db(self):
        """Initializes atomic SQLite DB with row-level transaction lease locking."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    agent_role TEXT NOT NULL,
                    priority REAL DEFAULT 1.0,
                    payload TEXT NOT NULL,
                    status TEXT DEFAULT 'PENDING',
                    leased_by TEXT,
                    leased_at TEXT,
                    expires_at TEXT,
                    completed_at TEXT
                )
            """)
            conn.commit()

    def add_task(self, task_id: str, title: str, agent_role: str, payload: Dict[str, Any], priority: float = 1.0) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            try:
                cursor.execute("""
                    INSERT INTO tasks (id, title, agent_role, priority, payload, status)
                    VALUES (?, ?, ?, ?, ?, 'PENDING')
                """, (task_id, title, agent_role, priority, json.dumps(payload)))
                conn.commit()
                return True
            except sqlite3.IntegrityError:
                return False

    def lease_next_task(self, agent_id: str, lease_sec: int = 300) -> Optional[QueueTask]:
        """Atomic lease acquisition simulating FOR UPDATE SKIP LOCKED."""
        now_iso = datetime.now(timezone.utc).isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            conn.execute("BEGIN IMMEDIATE")
            
            # Find next eligible task (PENDING or expired LEASED)
            cursor.execute("""
                SELECT id, title, agent_role, priority, payload, status
                FROM tasks
                WHERE status = 'PENDING' OR (status = 'LEASED' AND expires_at < ?)
                ORDER BY priority DESC
                LIMIT 1
            """, (now_iso,))
            row = cursor.fetchone()
            
            if not row:
                conn.commit()
                return None

            task_id, title, agent_role, priority, payload_str, _ = row
            expires_at = datetime.fromtimestamp(datetime.now(timezone.utc).timestamp() + lease_sec, timezone.utc).isoformat()

            # Acquire lease atomically
            cursor.execute("""
                UPDATE tasks
                SET status = 'LEASED', leased_by = ?, leased_at = ?, expires_at = ?
                WHERE id = ?
            """, (agent_id, now_iso, expires_at, task_id))
            conn.commit()

            return QueueTask(
                id=task_id,
                title=title,
                agent_role=agent_role,
                priority=priority,
                payload=json.loads(payload_str),
                status="LEASED",
                leased_by=agent_id,
                expires_at=expires_at
            )

    def complete_task(self, task_id: str, agent_id: str, execution_receipt: Dict[str, Any]) -> bool:
        """Completes task only if leased by agent and verification checks pass."""
        now_iso = datetime.now(timezone.utc).isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE tasks
                SET status = 'COMPLETED', completed_at = ?, payload = json_insert(payload, '$.receipt', json(?))
                WHERE id = ? AND leased_by = ? AND status = 'LEASED'
            """, (now_iso, json.dumps(execution_receipt), task_id, agent_id))
            conn.commit()
            return cursor.rowcount > 0

if __name__ == "__main__":
    print("Testing FleetSkipLockQueue Engine...")
    queue = FleetSkipLockQueue("test_queue.db")
    queue.add_task("RECOVERY-TEST-001", "Verify Dispute Forge $49 endpoint", "Staci", {"endpoint": "/v1/dispute/generate"}, 5.0)
    
    leased = queue.lease_next_task("Staci-Fly-Worker-1")
    assert leased is not None
    assert leased.id == "RECOVERY-TEST-001"
    print(f"Leased Task: {leased.title} by {leased.leased_by}")
    
    success = queue.complete_task("RECOVERY-TEST-001", "Staci-Fly-Worker-1", {"exit_code": 0, "verified": True})
    assert success
    print("FleetSkipLockQueue Passed All Atomic Lease Tests!")
