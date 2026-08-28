"""
Pipeline Gateway — CardioRetina AI
The single stable, versioned entry point into backend/ml/.
Every call returns a result object carrying model/config versions and confidence/uncertainty.
This indirection is what makes drift monitoring and PCCP documentation possible.

Version bumps happen here — never by editing pipeline code directly while serving production.
"""
import os
import yaml
import numpy as np
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field


# ─── Versioned Result Object ──────────────────────────────────────────────────
@dataclass
class PipelineResult:
    """
    Versioned pipeline output. Every field that a clinician-facing view reads
    comes from here, along with the model/config versions that produced it.
    """
    status: str  # "completed" | "failed" | "rejected_quality"

    # ── Model versions ────────────────────────────────────────────────────────
    pipeline_version: str = "v1.0.0"
    quality_model_version: str = "QUALITY-v1.0.0"
    vessel_model_version: str = "VESSEL-v1.0.0"
    av_model_version: str = "AV-v1.0.0"
    disease_model_version: str = "DISEASE-v1.0.0"
    risk_module_version: str = "RISK-v1.0.0"
    biomarker_version: str = "BIOMARKERS-v1.0.0"
    config_version: str = "v1-baseline"

    # ── AI outputs ────────────────────────────────────────────────────────────
    quality: Optional[dict] = None
    vessel_segmentation: Optional[dict] = None
    av_classification: Optional[dict] = None
    biomarkers: Optional[dict] = None
    disease: Optional[dict] = None
    risk: Optional[dict] = None
    mask_paths: Optional[dict] = None     # vessel_mask, artery_mask, vein_mask, av_overlay
    error: Optional[str] = None

    # ── Monitoring data (fed to model_monitoring.py) ──────────────────────────
    input_metadata: dict = field(default_factory=dict)  # image shape, source, timestamp


class PipelineGateway:
    """
    Stable interface into the v1 ML pipeline.
    Wraps MainPipeline so the calling code (Celery tasks, API) never imports
    from backend/ml/ directly — version changes are isolated here.
    """

    # Config path relative to backend/
    CONFIG_PATH = Path(__file__).parent.parent.parent / "ml" / "config" / "pipeline_v1_baseline.yaml"

    def __init__(
        self,
        quality_model=None,
        vessel_model=None,
        av_model=None,
        disease_model=None,
    ):
        self.quality_model = quality_model
        self.vessel_model = vessel_model
        self.av_model = av_model
        self.disease_model = disease_model
        self._config = self._load_config()

    def _load_config(self) -> dict:
        """Load the versioned YAML config. Falls back to hard-coded defaults if missing."""
        if self.CONFIG_PATH.exists():
            with open(self.CONFIG_PATH, "r") as f:
                return yaml.safe_load(f)
        return {"config_version": "v1-baseline-fallback"}

    @property
    def config_version(self) -> str:
        return self._config.get("config_version", "unknown")

    def run(self, image_path: str, clinical_data: dict) -> PipelineResult:
        """
        Execute the full 7-step ML pipeline through the versioned interface.
        Returns a PipelineResult with all outputs and version metadata attached.
        """
        result = PipelineResult(
            status="processing",
            config_version=self.config_version,
            input_metadata={
                "image_path": image_path,
                "clinical_data_keys": list(clinical_data.keys()),
            },
        )

        try:
            from ml.pipeline.main_pipeline import MainPipeline

            pipeline = MainPipeline(
                quality_model=self.quality_model,
                vessel_model=self.vessel_model,
                av_model=self.av_model,
                disease_model=self.disease_model,
                config=self._config,
            )

            raw = pipeline.run(image_path, clinical_data)

            result.status = raw.get("status", "failed")
            result.quality = raw.get("quality")
            result.vessel_segmentation = raw.get("vessel_segmentation")
            result.av_classification = raw.get("av_classification")
            result.biomarkers = raw.get("biomarkers")
            result.disease = raw.get("disease")
            result.risk = raw.get("risk")
            result.mask_paths = raw.get("mask_paths")
            result.error = raw.get("error")

            # Generate A/V color overlay if masks are available
            if result.mask_paths and result.status == "completed":
                overlay_path = self._generate_av_overlay(image_path, result.mask_paths)
                if overlay_path:
                    result.mask_paths["av_overlay"] = overlay_path

        except Exception as e:
            result.status = "failed"
            result.error = str(e)

        return result

    def _generate_av_overlay(self, image_path: str, mask_paths: dict) -> Optional[str]:
        """
        Generate a color-coded A/V overlay image (build.md §11.4 / Task 5.1).
        Arteries: Red-tinted (BGR: [0, 0, 200])
        Veins:    Blue-tinted (BGR: [200, 0, 0])
        Overlaid on the original fundus image at original resolution.
        """
        try:
            import cv2
            import numpy as np

            original = cv2.imread(image_path)
            if original is None:
                return None

            h, w = original.shape[:2]

            artery_path = mask_paths.get("artery_mask")
            vein_path = mask_paths.get("vein_mask")

            overlay = original.copy().astype(np.float32)

            # Load and resize masks to match original image dimensions
            if artery_path and os.path.exists(artery_path):
                artery_mask = cv2.imread(artery_path, cv2.IMREAD_GRAYSCALE)
                artery_mask = cv2.resize(artery_mask, (w, h))
                artery_region = artery_mask > 127
                # Red channel boost for arteries
                overlay[artery_region, 2] = np.minimum(
                    overlay[artery_region, 2] * 0.5 + 200, 255
                )
                overlay[artery_region, 0] *= 0.3
                overlay[artery_region, 1] *= 0.3

            if vein_path and os.path.exists(vein_path):
                vein_mask = cv2.imread(vein_path, cv2.IMREAD_GRAYSCALE)
                vein_mask = cv2.resize(vein_mask, (w, h))
                vein_region = vein_mask > 127
                # Blue channel boost for veins
                overlay[vein_region, 0] = np.minimum(
                    overlay[vein_region, 0] * 0.5 + 200, 255
                )
                overlay[vein_region, 1] *= 0.3
                overlay[vein_region, 2] *= 0.3

            overlay = overlay.astype(np.uint8)

            # Save next to the other masks
            base = os.path.splitext(os.path.basename(image_path))[0]
            mask_dir = os.path.dirname(artery_path or image_path)
            overlay_path = os.path.join(mask_dir, f"{base}_av_overlay.png")
            cv2.imwrite(overlay_path, overlay)
            return overlay_path

        except Exception as e:
            print(f"[WARN] AV overlay generation failed: {e}")
            return None
