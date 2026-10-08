"""
provenance.py — shared library for the MESH-SYNC fix.

Root cause (STUDY-fleet-sync-communication-failures, 2026-07-07):
  1. The fleet never had a heartbeat — dead agents looked identical to busy ones.
  2. Status was never tied to evidence — "done" meant "an agent said so," which
     is exactly how 593 fake revenue.sale events and the false-done pattern
     across 5 task families happened.

Fix: every status write must carry a provenance tag. agent-claim is NEVER
sufficient on its own to close a task — it must be corroborated by a human
or a chain/API check within the reopen window, or it auto-reopens.

This module has no network calls. It's deliberately dependency-free so it
can be dropped into nimbus-agent, brain-poller, Staci, Kip, or Erica without
adding a package to any of their environments.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum


class Provenance(str, Enum):
    CHAIN = "chain"          # verified against Base RPC / on-chain state
    HUMAN = "human"          # Bryant (or a designated human) confirmed directly
    AGENT_CLAIM = "agent-claim"  # an agent said so — unverified until corroborated


TERMINAL_STATUSES = {"done", "live", "closed", "earning"}
REOPEN_WINDOW_HOURS = 24


@dataclass
class StatusWrite:
    record_id: str
    status: str
    provenance: Provenance
    written_at: datetime
    verification_url: str | None = None

    def is_load_bearing(self) -> bool:
        """
        An agent-claim status write is not load-bearing on its own for any
        terminal status. It's fine for in-progress states (queued, scanning,
        building, deploying) — those are expected to be agent-reported.
        """
        if self.status.lower() not in TERMINAL_STATUSES:
            return True
        if self.provenance in (Provenance.CHAIN, Provenance.HUMAN):
            return True
        return False

    def hours_since_write(self, now: datetime | None = None) -> float:
        now = now or datetime.now(timezone.utc)
        return (now - self.written_at).total_seconds() / 3600.0

    def should_auto_reopen(self, now: datetime | None = None) -> bool:
        """
        True if this is an unverified agent-claim of a terminal status that
        has sat past the reopen window without corroboration.
        """
        if self.is_load_bearing():
            return False
        return self.hours_since_write(now) >= REOPEN_WINDOW_HOURS


def validate_status_write(status: str, provenance: str, verification_url: str | None) -> list[str]:
    """
    Call this before any script writes a 'done'/'live' status anywhere
    (Airtable, Drive doc, chat summary). Returns a list of problems;
    empty list means the write is clean.
    """
    problems = []
    try:
        prov = Provenance(provenance)
    except ValueError:
        problems.append(f"unknown provenance value: {provenance!r} (must be chain/human/agent-claim)")
        return problems

    if status.lower() in TERMINAL_STATUSES:
        if prov == Provenance.AGENT_CLAIM and not verification_url:
            problems.append(
                "agent-claim + terminal status with no verification_url — "
                "this is exactly the false-done pattern. Either attach a "
                "public verification URL, get human/chain corroboration, "
                "or use a non-terminal status."
            )
    return problems
