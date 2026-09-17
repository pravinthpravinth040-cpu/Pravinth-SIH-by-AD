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
            print(f"[Backend Inference] Error loading state_dict from {resolved_path}: {err}. Using un-trained weights.")
    else:
        print(f"[Backend Inference] Warning: Checkpoint not found at {resolved_path}. Using un-trained weights.")

    _model = _model.to(_device)
    _model.eval()
    _transform = get_transform()
    return _model, _device, _transform

def predict(image_input: Union[str, Path, bytes, Image.Image], checkpoint_path: Union[str, Path, None] = None) -> Dict[str, Any]:
    """
    Runs model inference on SAR satellite image.
    
    Accepts:
      - File path (str or Path)
      - Raw image bytes
      - PIL.Image instance
      
    Returns:
      {
        'oil_detected': bool,
        'confidence': float,
        'raw_score': float,
        'file_size_bytes': int,
        'image_sha256': str
      }
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

    # Apply transformations and create batch of 1
    img_tensor = transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        output = model(img_tensor).squeeze(1)
        prob = torch.sigmoid(output).item()

    oil_detected = prob >= 0.5
    confidence = prob if oil_detected else (1.0 - prob)

    return {
        'oil_detected': bool(oil_detected),
        'confidence': float(confidence),
        'raw_score': float(prob),
        'file_size_bytes': file_size_bytes,
        'image_sha256': sha256_hash
    }

def get_model_info() -> Dict[str, Any]:
    """Returns diagnostic telemetry about the loaded model."""
    global _model, _device, _active_checkpoint_path
    return {
        "model_loaded": _model is not None,
        "device": str(_device) if _device else "uninitialized",
        "checkpoint_path": _active_checkpoint_path or "none",
        "cuda_available": torch.cuda.is_available()
    }
