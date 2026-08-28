"""
DICOM C-STORE SCP Server — CardioRetina AI
Listens for DICOM C-STORE requests from legacy modalities (scanners, PACS).
Saves the incoming dataset to a temporary file and triggers ingestion.
"""
import os
import tempfile
import logging
from pynetdicom import AE, evt, AllStoragePresentationContexts
from pynetdicom.sop_class import VerificationSOPClass

from app.database import SessionLocal
from app.services.ingestion_service import process_dicom_ingestion_sync

logger = logging.getLogger(__name__)

# Configured globally for simplicity. In production, mapping AE titles to org_ids is best.
DEFAULT_ORG_ID = 1

def handle_store(event):
    """Handle a C-STORE request event."""
    ds = event.dataset
    ds.file_meta = event.file_meta

    # Create a temporary file to store the DICOM
    fd, filepath = tempfile.mkstemp(suffix=".dcm")
    os.close(fd)
    
    try:
        # Save the dataset to the file
        ds.save_as(filepath, write_like_original=False)
        logger.info(f"Received DICOM C-STORE, saved to {filepath}")
        
        # Process the DICOM synchronously in this handler
        db = SessionLocal()
        try:
            result = process_dicom_ingestion_sync(
                db=db,
                dicom_path=filepath,
                org_id=DEFAULT_ORG_ID,
                source="dicom_scp"
            )
            logger.info(f"Successfully ingested DICOM via SCP: {result['job_id']}")
        except Exception as e:
            logger.error(f"Failed to ingest DICOM from SCP: {e}")
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error handling C-STORE request: {e}")
    finally:
        # Clean up temp file
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception:
                pass

    return 0x0000  # Success status


def start_dicom_scp(port: int = 11112, ae_title: str = b"CARDIORETINA"):
    """Start the DICOM SCP server (blocking call)."""
    ae = AE(ae_title=ae_title)

    # Support Verification (C-ECHO) and all Storage contexts (C-STORE)
    ae.add_supported_context(VerificationSOPClass)
    for context in AllStoragePresentationContexts:
        ae.add_supported_context(context.abstract_syntax)

    handlers = [(evt.EVT_C_STORE, handle_store)]

    logger.info(f"Starting DICOM SCP Server on port {port} with AE Title {ae_title.decode('utf-8')}")
    
    # Start listening (blocking)
    ae.start_server(("", port), evt_handlers=handlers)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    start_dicom_scp()
