"""
Hot-Folder Ingestion Watcher — CardioRetina AI
Uses watchdog to monitor a directory for new DICOM files.
Useful for legacy hospital environments where scanners drop files into a network share.
"""
import os
import time
import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from app.database import SessionLocal
from app.services.ingestion_service import process_dicom_ingestion_sync
from app.config import settings

logger = logging.getLogger(__name__)

class DicomIngestionHandler(FileSystemEventHandler):
    def __init__(self, org_id: int):
        self.org_id = org_id
        super().__init__()

    def on_created(self, event):
        if event.is_directory:
            return
        
        filepath = event.src_path
        if not filepath.lower().endswith('.dcm'):
            return
            
        logger.info(f"New DICOM file detected: {filepath}")
        
        # Give the file system a moment to finish writing
        time.sleep(1)
        
        db = SessionLocal()
        try:
            result = process_dicom_ingestion_sync(
                db=db,
                dicom_path=filepath,
                org_id=self.org_id,
                source="hot_folder"
            )
            logger.info(f"Successfully ingested DICOM: {result['job_id']}")
            
            # Move or delete file after successful ingestion
            # For this MVP, we just leave it or rename it
            processed_path = filepath + ".processed"
            os.rename(filepath, processed_path)
            
        except Exception as e:
            logger.error(f"Failed to ingest DICOM {filepath}: {e}")
            error_path = filepath + ".error"
            os.rename(filepath, error_path)
        finally:
            db.close()


def start_watcher(watch_dir: str, org_id: int):
    """Start the watchdog observer (blocking call)."""
    os.makedirs(watch_dir, exist_ok=True)
    
    event_handler = DicomIngestionHandler(org_id=org_id)
    observer = Observer()
    observer.schedule(event_handler, watch_dir, recursive=False)
    
    logger.info(f"Starting hot-folder watcher on {watch_dir} for org {org_id}")
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    # Example usage when run directly
    logging.basicConfig(level=logging.INFO)
    
    watch_directory = os.path.join(settings.UPLOAD_DIR, "hot_folder")
    
    # We need a default org ID. In production, you might map folders to org IDs.
    default_org_id = 1 
    
    start_watcher(watch_directory, default_org_id)
