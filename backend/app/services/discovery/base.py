"""
Discovery Provider Interface
Enables clean abstraction so real authorized public feeds or customer-provided
integrations can be plugged in without scraper dependencies.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from app.schemas.discovery import DiscoveredOpportunity, DiscoveryFilters
from app.schemas.business import StructuredBusinessProfile


class DiscoveryProvider(ABC):
    @abstractmethod
    async def discover_requirements(
        self,
        filters: DiscoveryFilters,
        seller_profile: Optional[StructuredBusinessProfile] = None
    ) -> List[DiscoveredOpportunity]:
        """
        Discovers buyer requirements matching the given filters
        and evaluates relevance against the seller's business profile.
        """
        pass
