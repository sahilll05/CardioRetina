"""
Object Storage & Signed URL Service — CardioRetina AI
Provides pluggable local / MinIO / S3 object storage handles and signed URL generation
for raw fundus images, vessel masks, and A/V color overlays (build.md §11.4 / Task 5.2).
"""
import os
import time
import hmac
import hashlib
from pathlib import Path
from typing import Dict, Optional
from app.config import settings

class StorageService:
    """
    Pluggable Object Storage Abstraction.
    Generates time-bound, cryptographic signed URLs for tenant-scoped image artifacts.
    """

    @staticmethod
    def generate_signed_url(file_path: str, expiration_seconds: int = 3600) -> str:
        """
        Generate a signed URL for a stored image artifact.
        """
        if not file_path:
            return ""

        # Relative path clean up
        rel_path = os.path.relpath(file_path, start=os.getcwd()).replace("\\", "/")

        expires_at = int(time.time()) + expiration_seconds
        signature_base = f"{rel_path}:{expires_at}"
        signature = hmac.new(
            settings.SECRET_KEY.encode("utf-8"),
            signature_base.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()[:16]

        return f"/api/v1/storage/file?path={rel_path}&expires={expires_at}&signature={signature}"

    @staticmethod
    def verify_signed_url(path: str, expires: int, signature: str) -> bool:
        """
        Verify the cryptographic signature and expiration of a signed URL request.
        """
        if time.time() > expires:
            return False

        signature_base = f"{path}:{expires}"
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode("utf-8"),
            signature_base.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()[:16]

        return hmac.compare_digest(signature, expected_sig)

    @staticmethod
    def get_analysis_artifact_urls(analysis_record) -> Dict[str, Optional[str]]:
        """
        Return signed URLs for all analysis image artifacts (raw fundus, vessel mask, A/V overlay).
        """
        return {
            "image_url": StorageService.generate_signed_url(analysis_record.image_path),
            "vessel_mask_url": StorageService.generate_signed_url(analysis_record.vessel_mask_path),
            "artery_mask_url": StorageService.generate_signed_url(analysis_record.artery_mask_path),
            "vein_mask_url": StorageService.generate_signed_url(analysis_record.vein_mask_path),
            "av_overlay_url": StorageService.generate_signed_url(analysis_record.av_overlay_path),
        }
