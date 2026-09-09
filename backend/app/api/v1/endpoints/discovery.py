from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.signal import BuyingSignal, SignalScanRequest
from app.schemas.lead import Lead
from app.services.discovery_service import discovery_service
from app.services.lead_service import lead_service

router = APIRouter()


@router.get("/signals", response_model=List[BuyingSignal])
def get_signals(
    signal_type: Optional[str] = None,
    min_urgency: Optional[int] = Query(None, ge=0, le=100),
    processed: Optional[bool] = None
):
    """Retrieve detected buying signals with optional filters."""
    return discovery_service.get_signals(
        signal_type=signal_type,
        min_urgency=min_urgency,
        processed=processed
    )


@router.post("/scan", response_model=List[BuyingSignal])
def trigger_signal_scan(request: Optional[SignalScanRequest] = None):
    """Trigger real-time simulated AI scan across public web and news signals."""
    return discovery_service.scan_new_signals(request)


@router.post("/convert-to-lead/{signal_id}", response_model=Lead)
def convert_signal_to_lead(signal_id: str):
    """Convert a detected signal into an enriched, matched, and intent-scored lead."""
    signal = discovery_service.get_signal_by_id(signal_id)
    if not signal:
        raise HTTPException(status_code=404, detail="Buying signal not found")
    
    return lead_service.create_lead_from_signal(signal)
