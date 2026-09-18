import io
import hashlib
from pathlib import Path
from typing import Union, Dict, Any, Tuple
from PIL import Image
import torch
from torchvision import transforms

from backend.model import get_resnet18_classifier
from backend.config import CANDIDATE_CHECKPOINT_PATHS

_model = None
_device = None
_transform = None
_active_checkpoint_path = None

def get_transform(img_size: int = 224) -> transforms.Compose:
    return transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

def resolve_checkpoint_path(explicit_path: Union[str, Path, None] = None) -> Path:
    """Finds first existing checkpoint from candidates or given path."""
    if explicit_path:
        p = Path(explicit_path)
        if p.exists():
            return p
            
    for candidate in CANDIDATE_CHECKPOINT_PATHS:
        if candidate.exists():
            return candidate
            
    # Default to first candidate even if missing (will log warning)
    return CANDIDATE_CHECKPOINT_PATHS[0]

def load_inference_model(checkpoint_path: Union[str, Path, None] = None) -> Tuple[torch.nn.Module, torch.device, transforms.Compose]:
    """Loads and caches the PyTorch model on CUDA or CPU."""
    global _model, _device, _transform, _active_checkpoint_path
    if _model is not None:
        return _model, _device, _transform

    resolved_path = resolve_checkpoint_path(checkpoint_path)
    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    _model = get_resnet18_classifier(pretrained=False)

    if resolved_path.exists():
        try:
            checkpoint = torch.load(resolved_path, map_location=_device)
            state_dict = checkpoint.get('model_state_dict', checkpoint)
            _model.load_state_dict(state_dict)
            _active_checkpoint_path = str(resolved_path)
            print(f"[Backend Inference] Successfully loaded checkpoint from {resolved_path} on {_device}")
        except Exception as err:
            print(f"[Backend Inference] Error loading state_dict from {resolved_path}: {err}. Using deterministic SAR fallback.")
            _active_checkpoint_path = None
    else:
        print(f"[Backend Inference] Checkpoint not found at {resolved_path}. Using deterministic SAR fallback.")
        _active_checkpoint_path = None

    _model = _model.to(_device)
    _model.eval()
    _transform = get_transform()
    return _model, _device, _transform

def _deterministic_sar_analysis(img: Image.Image) -> Tuple[bool, float, float]:
    """
    Deterministic SAR backscatter analysis fallback when weights file is not loaded.
    Uses radar physics: oil slicks damp ocean capillary waves, producing dark patches (<50 intensity).
    Never produces random values; strictly deterministic based on SAR pixel statistics.
    """
    gray = img.convert('L')
    pixels = list(gray.getdata())
    total_pixels = len(pixels)
    if total_pixels == 0:
        return False, 0.5, 0.5

    mean_val = sum(pixels) / total_pixels
    # Oil slicks in SAR have low backscatter (dark pixels)
    dark_pixels = sum(1 for p in pixels if p < 60)
    dark_ratio = dark_pixels / total_pixels

    # Variance calculation for texture
    variance = sum((p - mean_val) ** 2 for p in pixels) / total_pixels
    std_dev = variance ** 0.5

    if dark_ratio >= 0.15 or (mean_val < 75 and dark_ratio >= 0.08):
        # High confidence oil spill
        prob = min(0.9995, 0.65 + (dark_ratio * 0.35))
        oil_detected = True
        confidence = prob
    else:
        # Clean ocean water with normal roughness
        prob = max(0.0005, 0.40 - ((mean_val / 255.0) * 0.35))
        oil_detected = False
        confidence = 1.0 - prob

    return oil_detected, confidence, prob

def predict(image_input: Union[str, Path, bytes, Image.Image], checkpoint_path: Union[str, Path, None] = None) -> Dict[str, Any]:
    """
    Runs model inference on SAR satellite image.
    Uses trained PyTorch ResNet-18 model when weights are loaded,
    otherwise falls back to deterministic SAR backscatter analysis (never random).
    """
    model, device, transform = load_inference_model(checkpoint_path)

    raw_bytes = b""
    if isinstance(image_input, (str, Path)):
        p = Path(image_input)
        raw_bytes = p.read_bytes()
        img = Image.open(io.BytesIO(raw_bytes)).convert('RGB')
    elif isinstance(image_input, bytes):
        raw_bytes = image_input
        img = Image.open(io.BytesIO(raw_bytes)).convert('RGB')
    elif isinstance(image_input, Image.Image):
        img = image_input.convert('RGB')
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        raw_bytes = buf.getvalue()
    else:
        raise ValueError(f"Unsupported image input type: {type(image_input)}")

    file_size_bytes = len(raw_bytes)
    sha256_hash = hashlib.sha256(raw_bytes).hexdigest() if raw_bytes else None

    # Check if we have trained weights loaded
    if _active_checkpoint_path is not None:
        img_tensor = transform(img).unsqueeze(0).to(device)
        with torch.no_grad():
            output = model(img_tensor).squeeze(1)
            prob = torch.sigmoid(output).item()
        oil_detected = prob >= 0.5
        confidence = prob if oil_detected else (1.0 - prob)
        model_name = "PyTorch ResNet / ConvNet"
        is_demo = False
    else:
        oil_detected, confidence, prob = _deterministic_sar_analysis(img)
        model_name = "DEMO Inference (Deterministic SAR Analysis)"
        is_demo = True

    return {
        'oil_detected': bool(oil_detected),
        'is_oil_spill': bool(oil_detected),
        'classification': "OIL SPILL" if oil_detected else "CLEAN OCEAN",
        'confidence': float(confidence),
        'raw_score': float(prob),
        'raw_probability': float(prob),
        'threshold': 0.50,
        'model': model_name,
        'is_demo': is_demo,
        'file_size_bytes': file_size_bytes,
        'image_sha256': sha256_hash
    }

def get_model_info() -> Dict[str, Any]:
    """Returns diagnostic telemetry about the loaded model."""
    global _model, _device, _active_checkpoint_path
    has_weights = _active_checkpoint_path is not None
    return {
        "model_loaded": _model is not None,
        "checkpoint_loaded": has_weights,
        "architecture": "PyTorch ResNet / ConvNet" if has_weights else "DEMO Inference (Deterministic SAR Analysis)",
        "device": str(_device) if _device else "cpu",
        "checkpoint_path": _active_checkpoint_path or "none",
        "decision_threshold": 0.50,
        "cuda_available": torch.cuda.is_available()
    }

