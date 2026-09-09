"""Discovery and Buying Signal Scanner Service"""

from typing import List, Optional
import uuid
import datetime
from app.schemas.signal import BuyingSignal, SignalScanRequest
from app.services.mock_data_generator import get_default_signals


class DiscoveryService:
    def __init__(self):
        self._signals: List[BuyingSignal] = get_default_signals()

    def get_signals(
        self,
        signal_type: Optional[str] = None,
        min_urgency: Optional[int] = None,
        processed: Optional[bool] = None
    ) -> List[BuyingSignal]:
        results = self._signals
        if signal_type:
            results = [s for s in results if s.signal_type.lower() == signal_type.lower()]
        if min_urgency is not None:
            results = [s for s in results if s.urgency_score >= min_urgency]
        if processed is not None:
            results = [s for s in results if s.processed == processed]
        return results

    def get_signal_by_id(self, signal_id: str) -> Optional[BuyingSignal]:
        for s in self._signals:
            if s.id == signal_id:
                return s
        return None

    def add_signal(self, signal: BuyingSignal) -> BuyingSignal:
        self._signals.insert(0, signal)
        return signal

    def scan_new_signals(self, request: Optional[SignalScanRequest] = None) -> List[BuyingSignal]:
        """Simulate real-time AI signal scanning across web/press/social sources."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        new_signal = BuyingSignal(
            id=f"sig-{uuid.uuid4().hex[:6]}",
            company_name="Acuity Robotics",
            domain="acuityrobotics.ai",
            signal_type="funding",
            title="Secured $42M Series B for Industrial Autonomous Drones",
            summary="Rapidly building out cloud-connected drone telemetry fleet; requires immediate SOC 2 Type II compliance for defense & energy sector clients.",
            source="VentureBeat & Press Release",
            detected_at=now_iso,
            confidence_score=0.94,
            urgency_level="High",
            urgency_score=93,
            raw_data={"round": "Series B", "amount": "$42M", "focus": "Enterprise & Defense"},
            processed=False,
            lead_id=None
        )
        self._signals.insert(0, new_signal)
        return [new_signal]

    def mark_processed(self, signal_id: str, lead_id: str) -> Optional[BuyingSignal]:
        for s in self._signals:
            if s.id == signal_id:
                s.processed = True
                s.lead_id = lead_id
                return s
        return None


discovery_service = DiscoveryService()
