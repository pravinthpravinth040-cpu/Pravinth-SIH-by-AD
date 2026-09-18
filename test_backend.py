import os
import sys
import io
from pathlib import Path
from fastapi.testclient import TestClient

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app import app
from backend.inference import predict, load_inference_model
from backend.database import init_db, get_recent_records, get_database_stats

def run_all_tests():
    print("=" * 70)
    print(" SENTINEL-1 SAR OIL SPILL BACKEND - COMPREHENSIVE VERIFICATION")
    print("=" * 70)

    sample_dir = root_dir / "sample_images"
    oil_sample = sample_dir / "oil_sample_1.jpg"
    clean_sample = sample_dir / "clean_sample_1.jpg"

    if not oil_sample.exists():
        oil_sample = root_dir / "model_service_handoff-20260911T055135Z-1-001" / "model_service_handoff" / "sample_images" / "sample_oil_1.jpg"
    if not clean_sample.exists():
        clean_sample = root_dir / "model_service_handoff-20260911T055135Z-1-001" / "model_service_handoff" / "sample_images" / "sample_no_oil_1.jpg"

    print(f"[*] Oil Sample:   {oil_sample.name} (exists: {oil_sample.exists()})")
    print(f"[*] Clean Sample: {clean_sample.name} (exists: {clean_sample.exists()})\n")

    # -------------------------------------------------------------
    # 1. Direct PyTorch Model Inference
    # -------------------------------------------------------------
    print("--- 1. Direct PyTorch Model Inference ---")
    model, device, _ = load_inference_model()
    print(f"  [+] Model active on device: {device}")

    oil_res = predict(oil_sample)
    print(f"  [+] Oil Image Result:   Oil Detected = {oil_res['oil_detected']} | Confidence = {oil_res['confidence']:.4f} | Raw = {oil_res['raw_score']:.4f}")
    assert oil_res["oil_detected"] is True, f"Expected Oil Detected True, got {oil_res['oil_detected']}"

    clean_res = predict(clean_sample)
    print(f"  [+] Clean Image Result: Oil Detected = {clean_res['oil_detected']} | Confidence = {clean_res['confidence']:.4f} | Raw = {clean_res['raw_score']:.4f}")
    assert clean_res["oil_detected"] is False, f"Expected Oil Detected False, got {clean_res['oil_detected']}"
    print("  --> PASS: Direct PyTorch Inference passed.\n")

    # -------------------------------------------------------------
    # 2. Database Connection Test
    # -------------------------------------------------------------
    print("--- 2. Database Connectivity ---")
    db_ok = init_db()
    print(f"  [+] Database initialization result: {db_ok}")
    assert db_ok, "Database initialization failed."
    print("  --> PASS: Database connection verified.\n")

    # -------------------------------------------------------------
    # 3. FastAPI REST Endpoints Integration
    # -------------------------------------------------------------
    print("--- 3. FastAPI REST Endpoints Integration ---")
    client = TestClient(app)

    # Test GET /
    res_root = client.get("/")
    assert res_root.status_code == 200, f"GET / failed: {res_root.status_code}"
    print(f"  [+] GET / -> {res_root.json().get('message')}")

    # Test GET /health
    res_health = client.get("/health")
    assert res_health.status_code == 200, f"GET /health failed: {res_health.status_code}"
    health_data = res_health.json()
    print(f"  [+] GET /health -> Status: {health_data.get('status')} | Service: {health_data.get('service')}")
    assert health_data.get("status") == "online", f"Expected online, got {health_data.get('status')}"
    assert health_data.get("service") == "Sentinel-1 SAR Oil Spill API"

    # Test GET /api-info
    res_info = client.get("/api-info")
    assert res_info.status_code == 200, f"GET /api-info failed: {res_info.status_code}"
    info_data = res_info.json()
    print(f"  [+] GET /api-info -> Service: {info_data.get('service')}, Model: {info_data.get('model', {}).get('architecture')}")
    assert info_data.get("status") == "online"

    # Test POST /predict with Oil Sample
    with open(oil_sample, "rb") as f:
        res_pred_oil = client.post("/predict", files={"file": (oil_sample.name, f, "image/jpeg")})
    assert res_pred_oil.status_code == 200, f"POST /predict oil failed: {res_pred_oil.text}"
    oil_data = res_pred_oil.json()
    print(f"  [+] POST /predict [{oil_data['filename']}] -> Classification: {oil_data.get('classification')}, Confidence: {oil_data.get('confidence')}")
    assert oil_data["is_oil_spill"] is True
    assert oil_data["classification"] == "OIL SPILL"
    assert "confidence" in oil_data and "raw_probability" in oil_data
    assert "threshold" in oil_data and "model" in oil_data and "timestamp" in oil_data

    # Test POST /predict with Clean Sample
    with open(clean_sample, "rb") as f:
        res_pred_clean = client.post("/predict", files={"file": (clean_sample.name, f, "image/jpeg")})
    assert res_pred_clean.status_code == 200, f"POST /predict clean failed: {res_pred_clean.text}"
    clean_data = res_pred_clean.json()
    print(f"  [+] POST /predict [{clean_data['filename']}] -> Classification: {clean_data.get('classification')}, Confidence: {clean_data.get('confidence')}")
    assert clean_data["is_oil_spill"] is False
    assert clean_data["classification"] == "CLEAN OCEAN"

    # Test POST /predict-synthetic for all presets
    print("--- 4. Quick Test Presets (POST /predict-synthetic) ---")
    res_synth_slick = client.post("/predict-synthetic?preset=slick")
    assert res_synth_slick.status_code == 200, f"Preset slick failed: {res_synth_slick.text}"
    slick_data = res_synth_slick.json()
    print(f"  [+] Sample Slick -> {slick_data['classification']} (is_oil_spill: {slick_data['is_oil_spill']}, conf: {slick_data['confidence']})")
    assert slick_data["is_oil_spill"] is True
    assert slick_data["confidence"] >= 0.50

    res_synth_calm = client.post("/predict-synthetic?preset=calm")
    assert res_synth_calm.status_code == 200
    calm_data = res_synth_calm.json()
    print(f"  [+] Sample Calm  -> {calm_data['classification']} (is_oil_spill: {calm_data['is_oil_spill']}, conf: {calm_data['confidence']})")
    assert calm_data["is_oil_spill"] is False

    res_synth_rough = client.post("/predict-synthetic?preset=rough")
    assert res_synth_rough.status_code == 200
    rough_data = res_synth_rough.json()
    print(f"  [+] Sample Rough -> {rough_data['classification']} (is_oil_spill: {rough_data['is_oil_spill']}, conf: {rough_data['confidence']})")
    assert rough_data["is_oil_spill"] is False

    # Test GET /history
    res_hist = client.get("/history?limit=10")
    assert res_hist.status_code == 200
    hist_data = res_hist.json()
    print(f"  [+] GET /history -> Stored records retrieved: {hist_data.get('count')}")
    assert hist_data.get("count", 0) >= 2

    # Test GET /stats
    res_stats = client.get("/stats")
    assert res_stats.status_code == 200
    stats_data = res_stats.json().get("statistics", {})
    print(f"  [+] GET /stats -> Total: {stats_data.get('total_scans')}, Oil: {stats_data.get('oil_spills')}, Clean: {stats_data.get('clean_oceans')}")

    # Test GET /samples
    res_samples = client.get("/samples")
    assert res_samples.status_code == 200
    print(f"  [+] GET /samples -> Found {len(res_samples.json().get('samples', []))} samples.")

    # Test DELETE /history
    res_del_hist = client.delete("/history")
    assert res_del_hist.status_code == 200
    assert res_del_hist.json().get("status") == "ok"
    print("  [+] DELETE /history -> Scan history cleared successfully.")

    print("  --> PASS: All FastAPI REST endpoints successfully tested.\n")

    print("=" * 70)
    print(" ALL BACKEND TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_all_tests()
