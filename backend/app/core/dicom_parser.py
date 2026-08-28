"""
DICOM Parser — CardioRetina AI
Uses pydicom to extract patient metadata and convert pixel arrays to 8-bit RGB.
Supports: MONOCHROME1, MONOCHROME2, RGB, YBR_FULL, YBR_FULL_422 transfer syntaxes.
Normalizes output to H×W×3 uint8 RGB numpy array for ingestion into ML pipeline.
"""
import io
import numpy as np
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field


@dataclass
class DicomMetadata:
    """Structured metadata extracted from a DICOM file header."""
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    patient_birth_date: Optional[str] = None
    patient_sex: Optional[str] = None
    study_date: Optional[str] = None
    study_description: Optional[str] = None
    modality: Optional[str] = None
    manufacturer: Optional[str] = None
    rows: Optional[int] = None
    columns: Optional[int] = None
    photometric_interpretation: Optional[str] = None
    bits_allocated: Optional[int] = None
    raw_tags: dict = field(default_factory=dict)


def parse_dicom_file(dicom_path: str | Path) -> tuple[np.ndarray, DicomMetadata]:
    """
    Parse a DICOM file and return:
    - pixel_array: H×W×3 uint8 RGB numpy array
    - metadata: DicomMetadata with extracted header fields

    Raises:
        ImportError: if pydicom is not installed
        ValueError: if the file cannot be decoded or the photometric type is unsupported
    """
    try:
        import pydicom
        from pydicom.pixel_data_handlers.util import convert_color_space
    except ImportError:
        raise ImportError(
            "pydicom is required for DICOM parsing. Install with: pip install pydicom"
        )

    ds = pydicom.dcmread(str(dicom_path), force=True)

    # ─── Extract metadata ─────────────────────────────────────────────────────
    def _safe(tag, default=None):
        try:
            val = getattr(ds, tag, None)
            return str(val).strip() if val is not None else default
        except Exception:
            return default

    metadata = DicomMetadata(
        patient_id=_safe("PatientID"),
        patient_name=_safe("PatientName"),
        patient_birth_date=_safe("PatientBirthDate"),
        patient_sex=_safe("PatientSex"),
        study_date=_safe("StudyDate"),
        study_description=_safe("StudyDescription"),
        modality=_safe("Modality"),
        manufacturer=_safe("Manufacturer"),
        rows=getattr(ds, "Rows", None),
        columns=getattr(ds, "Columns", None),
        photometric_interpretation=_safe("PhotometricInterpretation"),
        bits_allocated=getattr(ds, "BitsAllocated", None),
    )

    # ─── Extract and normalize pixel array ────────────────────────────────────
    try:
        pixel_array = ds.pixel_array
    except Exception as e:
        raise ValueError(f"Cannot decode pixel data from DICOM file: {e}")

    photo_interp = metadata.photometric_interpretation or ""

    # Grayscale → replicate to 3-channel RGB
    if photo_interp in ("MONOCHROME1", "MONOCHROME2") or pixel_array.ndim == 2:
        gray = _normalize_to_uint8(pixel_array, invert=(photo_interp == "MONOCHROME1"))
        rgb = np.stack([gray, gray, gray], axis=-1)

    # YBR color spaces → convert to RGB
    elif photo_interp in ("YBR_FULL", "YBR_FULL_422"):
        rgb_raw = convert_color_space(pixel_array, photo_interp, "RGB")
        rgb = _normalize_to_uint8(rgb_raw)

    # Already RGB
    elif photo_interp == "RGB" or pixel_array.ndim == 3:
        rgb = _normalize_to_uint8(pixel_array)
    else:
        raise ValueError(
            f"Unsupported DICOM PhotometricInterpretation: '{photo_interp}'"
        )

    # Ensure H×W×3
    if rgb.ndim == 2:
        rgb = np.stack([rgb, rgb, rgb], axis=-1)
    if rgb.shape[-1] != 3:
        rgb = rgb[:, :, :3]

    return rgb, metadata


def parse_dicom_bytes(dicom_bytes: bytes) -> tuple[np.ndarray, DicomMetadata]:
    """Parse a DICOM file from an in-memory bytes object."""
    try:
        import pydicom
    except ImportError:
        raise ImportError("pydicom is required. Install with: pip install pydicom")

    import tempfile, os
    with tempfile.NamedTemporaryFile(suffix=".dcm", delete=False) as tmp:
        tmp.write(dicom_bytes)
        tmp_path = tmp.name

    try:
        return parse_dicom_file(tmp_path)
    finally:
        os.unlink(tmp_path)


def _normalize_to_uint8(array: np.ndarray, invert: bool = False) -> np.ndarray:
    """Normalize any numeric array to uint8 [0, 255]."""
    arr = array.astype(np.float32)
    arr_min, arr_max = arr.min(), arr.max()
    if arr_max > arr_min:
        arr = (arr - arr_min) / (arr_max - arr_min) * 255.0
    else:
        arr = np.zeros_like(arr)
    if invert:
        arr = 255.0 - arr
    return arr.astype(np.uint8)


def save_rgb_as_png(rgb_array: np.ndarray, output_path: str | Path) -> str:
    """Save an H×W×3 uint8 RGB numpy array as a PNG file."""
    from PIL import Image
    img = Image.fromarray(rgb_array, mode="RGB")
    img.save(str(output_path), format="PNG")
    return str(output_path)
