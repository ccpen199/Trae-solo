from app.engines.service_standard import ServiceStandardEngine
from app.engines.doc_ocr import DocOCREngine
from app.engines.time_slot import TimeSlotEngine
from app.engines.satisfaction_index import SatisfactionIndexEngine

service_standard_engine = ServiceStandardEngine()
doc_ocr_engine = DocOCREngine()
time_slot_engine = TimeSlotEngine()
satisfaction_index_engine = SatisfactionIndexEngine()

__all__ = [
    "ServiceStandardEngine",
    "DocOCREngine",
    "TimeSlotEngine",
    "SatisfactionIndexEngine",
    "service_standard_engine",
    "doc_ocr_engine",
    "time_slot_engine",
    "satisfaction_index_engine",
]
